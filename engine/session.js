/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * CloudCanvasSession: the legacy runtime, as a compatibility facade over a core
 * root (`../core/frame.js`, `./frame.js`) - its camera the viewport, its id index
 * the Pin registry (`../pins/manager.js`), its view root the promoted Pin - plus
 * the root add-ons it installs on the container (pan, keyboard, menu, announce),
 * the Pin hooks, and the public API it has always had.
 *
 * The session is the state and the public surface; the transitions live beside
 * it, as free functions taking the session as their first argument:
 *
 *   ./host.js       - the four layers, and the root add-ons installed on the host
 *   ./navigation.js - focus, promotion, and the back/forward history
 *   ./pointer.js    - the pan add-on, with Pin drags claimed for their traits
 *   ./context-menu.js - the menu add-on over the shared command registry
 *   ./keyboard.js   - the keyboard add-on, roving over Pins
 *   ./announcer.js  - the layers' ARIA, and the announce add-on's live region
 *   ./cursors.js    - the cursor Pin's lifecycle and its target wiring
 *   ./frame.js      - the frame loop, its context, and the graph-wide re-render
 *   ./placement.js  - a free canvas spot for a new Pin
 *   ./framing.js    - which box a `zoomToFit` should frame
 *   ./renderer.js   - the per-frame conjugate render pass
 *   ./session-options.js - the open option surface: what is read, what is reported
 */
import { Viewport } from './viewport.js';
import { ParticleEngine } from '../particles/engine.js';
import { PinManager } from '../pins/manager.js';
import { ConjugateRenderer } from './renderer.js';
import {
  DEFAULT_HOST_RECT, canGoForward, focus, focusParent, goForward, popFocus, promoteToRoot, pushFocus, unfocus
} from './navigation.js';
import { cancelDrag, initPointerState } from './pointer.js';
import {
  destroyCursors, getCursorTarget, handlePinSignal, mountCursors, remountCursors, setCursorTarget
} from './cursors.js';
import { createSessionFrame, frameContext, regraph, sessionPasses, start, stop, tick } from './frame.js';
import { bindSessionEvents, mountLayers, unbindSessionEvents, unmountLayers } from './host.js';
import { announceEdit, announceFocus } from './announcer.js';
import { place } from './placement.js';
import { adopt, hydrate } from './hydrate.js';
import { zoomToFit } from './framing.js';
import { assertValidContainer, checkOptions } from './session-options.js';
import { injectCanvasStyles, injectSessionStyles } from '../graphics/styles.js';

/**
 * The session's client-side runtime.
 *
 * Beyond the API below it publishes one DOM-native event stream, `session.events`
 * (an `EventTarget`): `focus:changed` fires on every focus transition - `focus`,
 * `pushFocus`, `promoteToRoot`, `popFocus`, `goForward`, `unfocus`, `focusParent`
 * - carrying `{focusedPin, renderRoot, breadcrumb}` in `detail`. It is the observation
 * point for chrome that lives outside the canvas (a breadcrumb bar, a title),
 * which would otherwise have to poll `session.focusedPin` every frame.
 */
export class CloudCanvasSession {
  constructor(options = {}) {
    checkOptions(options);
    this.options = options;
    /** The session's DOM-native event stream (`focus:changed`). @type {EventTarget} */
    this.events = new EventTarget();
    this.viewport = new Viewport(options.viewport || {});
    this.particleEngine = new ParticleEngine();
    // The core root the session runs on: born stopped, so an unmounted session renders only by hand.
    this._frame = createSessionFrame(this);
    // Its id index is the registry; `defaultReload` and `loadChildren` are session policy applied per Pin.
    this.pinManager = new PinManager({
      root: this._frame,
      particleEngine: this.particleEngine,
      defaultReload: options.defaultReload,
      loadChildren: options.loadChildren
    });
    this._wireFrame(options);

    this.hostElement = null;
    this.svgLayerElement = null;
    this.planeElement = null;
    this.overlayElement = null;
    this.focusVeilElement = null;
    // What this session adds to the host is recorded by the module that adds it
    // (`_hostClassAdded`, `_hostAriaAttributes`), so `destroy()` takes back only that.

    // Navigation history: `focusStack` is Back, `_forwardStack` Forward (`./navigation.js`).
    this.focusedPin = null;
    this.focusStack = [];
    this._forwardStack = [];

    // The null Pin carrying the cursors, built at mount: it draws into the overlay.
    this.cursorPin = null;
    this._unsubscribeSignals = null;
    this._onPinSignal = this._onPinSignal.bind(this);

    // Gesture state is the pan add-on's, kept on the session (`./pointer.js`).
    initPointerState(this);
    this._onResize = this._onResize.bind(this);

    if (options.autoInjectStyles !== false) injectCanvasStyles();
    // Per-session author CSS, in its own element so `destroy()` can take it away.
    this._sessionStyleEl = options.customCSS ? injectSessionStyles(options.customCSS) : null;

    // `container` is optional; supplied, it is validated - `{container: null}` is an error, not a no-op.
    if ('container' in options) this.mount(options.container);
  }

  /**
   * The renderer registered on the root (`./frame.js`); `offloadMargin` is
   * session-level offload policy a per-Pin one overrides. Any camera move wakes
   * the loop, and the per-frame closures are bound once so `getContext()` allocates none.
   */
  _wireFrame(options) {
    const passes = sessionPasses(this);
    this.renderer = new ConjugateRenderer({
      session: this,
      root: this._frame,
      context: passes.context,
      passes,
      offloadMargin: options.offloadMargin
    });
    this.pinManager.setRenderer(this.renderer);
    this.viewport.onWake = () => this.renderer.wake();
    this._participates = (pin) => this.renderer.participates(pin);
    this._cursorDirty = (pin) => this.renderer.isGlobalDirty(pin);
  }

  /**
   * Mount the session into a target DOM container
   */
  mount(container) {
    assertValidContainer(container);
    if (typeof document === 'undefined') return this;

    const host = typeof container === 'string' ? document.querySelector(container) : container;
    if (!host) {
      throw new Error(`CloudCanvasSession: Target container "${container}" not found`);
    }

    this.hostElement = host;
    this._frame.host = host;

    // The four layers in paint order and the cursor Pin drawing into the overlay,
    // then the root add-ons - ARIA and live region, pan, menu, keyboard (`./host.js`).
    mountLayers(this);
    mountCursors(this);
    this._refreshHostRect();
    bindSessionEvents(this);
    this.start();
    return this;
  }

  /* ------------------ CURSORS (see `./cursors.js`) ------------------ */

  /** Point a cursor at a Pin, or clear it with `null`. */
  setCursorTarget(name, pin) {
    return setCursorTarget(this, name, pin);
  }

  /** The Pin a cursor currently points at, or null. */
  getCursorTarget(name) {
    return getCursorTarget(this, name);
  }

  /**
   * Rebuild the cursor Pin from the registry, keeping its current targets.
   * This is how a cursor re-registered after mount takes effect.
   */
  remountCursors() {
    return remountCursors(this);
  }

  /**
   * The session's one sink for the manager's Pin signals (`mountCursors`): the
   * edit lock is announced, everything else moves a cursor.
   */
  _onPinSignal(event) {
    if (event && event.type === 'edit') {
      return announceEdit(this, event.detail ? event.detail.source : null, event.payload);
    }
    return handlePinSignal(this, event);
  }

  /* ------------------ HOST GEOMETRY ------------------ */

  /**
   * The cached host rectangle every screen-space calculation frames against. It
   * lives on the frame root, which re-reads it on the frames the camera moved.
   */
  getHostRect() {
    return this._frame.hostRect;
  }

  /** Re-read the host box now: at mount and on a resize. */
  _refreshHostRect() {
    this._frame.hostRect = this.hostElement
      ? this.hostElement.getBoundingClientRect()
      : DEFAULT_HOST_RECT;
    return this._frame.hostRect;
  }

  /**
   * A resized host invalidates both the cached rect and every screen-space SVG
   * group, so the viewport version is bumped along with it.
   */
  _onResize() {
    this._refreshHostRect();
    this.renderer.bumpViewportVersion();
  }

  /* ------------------ FOCUS & NAVIGATION API ------------------ */

  /**
   * Zoom into a Pin: promote it to render root and focus it (`./navigation.js`);
   * `{promote: false}` is the plain camera move. Every focus wrapper announces
   * and publishes its transition: every route to a focus change - pointer,
   * keyboard, API - passes through this layer.
   */
  focus(pinOrId, options = {}) { return this._moved(focus(this, pinOrId, options)); }

  /** Push the current view state and focus a Pin; `promote` also promotes it. */
  pushFocus(pinOrId, options = {}) { return this._moved(pushFocus(this, pinOrId, options)); }

  /** Promote a Pin to render root and focus it, stacking the outgoing state. */
  promoteToRoot(pinOrId, options = {}) { return this._moved(promoteToRoot(this, pinOrId, options)); }

  /** Restore the previous focus, camera, and render root. */
  popFocus(options = {}) { return this._moved(popFocus(this, options), true); }

  /** Re-apply the state the last `popFocus` left behind; with nothing to go forward to, a silent no-op. */
  goForward(options = {}) { return canGoForward(this) ? this._moved(goForward(this, options), true) : null; }

  /** Drop all focus and promotion state, returning to the whole canvas. */
  unfocus(options = {}) { return this._moved(unfocus(this, options), true); }

  /** Focus the parent scope of the focused Pin; the step out to the canvas is announced too. */
  focusParent(options = {}) { return this._moved(focusParent(this, options), true); }

  /** Publish a transition: always for the moves that may land on nothing, else only when a Pin was reached. */
  _moved(pin, always = false) {
    if (pin || always) this._focusChanged(pin);
    return pin;
  }

  /**
   * Say a focus transition twice: to assistive technology, and to the page as
   * `focus:changed` carrying the whole navigational state (the Pin, the render
   * root, the trail), so chrome never reads a second source of truth back.
   * @returns {boolean} true when the event was dispatched
   */
  _focusChanged(pin) {
    announceFocus(this, pin);
    return this.events.dispatchEvent(new CustomEvent('focus:changed', {
      detail: {
        focusedPin: pin || null,
        renderRoot: this.renderer.renderRoot,
        breadcrumb: this.breadcrumb()
      }
    }));
  }

  /** Root-first trail to the current render root, or [] at the canvas root. */
  breadcrumb() {
    return this.renderer.rootScope.breadcrumb();
  }

  /** End the active drag without a pointer event (the renderer calls this). */
  cancelDrag() {
    return cancelDrag(this);
  }

  /* ------------------ SIMULATION & RENDERING (see `./frame.js`) ------------------ */

  /** Begin driving frames from `requestAnimationFrame`; the loop idles when settled. */
  start() { return start(this); }

  /** Stop the frame loop, cancelling the frame already asked for. */
  stop() { return stop(this); }

  /** Whether the loop is running (it may be idle: running and settled). */
  get running() { return this._frame.running; }

  /** The per-frame context traits and render passes are handed. */
  getContext() { return frameContext(this); }

  /**
   * Execute one simulation & render frame by hand.
   * `dt` is expressed in reference frames (1 = one 60Hz frame).
   */
  tick(dt = 1) { return tick(this, dt); }

  /**
   * Re-run a trait across the graph: apply `fn` to every Pin carrying
   * `traitName`, then re-render it.
   *
   * @returns {Pin[]} the Pins that were regraphed
   */
  regraph(traitName, fn) { return regraph(this, traitName, fn); }

  /* ------------------ PINS (the manager, over the root's index) ------------------ */

  createPin(options) { return this.pinManager.createPin(options); }

  removePin(id) { return this.pinManager.removePin(id); }

  getPin(id) { return this.pinManager.getPin(id); }

  queryRadius(x, y, radius) { return this.pinManager.queryRadius(x, y, radius); }

  queryBox(minX, minY, maxX, maxY) { return this.pinManager.queryBox(minX, minY, maxX, maxY); }

  /**
   * A free canvas-space top-left corner for a box of the given size
   * (see `./placement.js`). Deterministic: same canvas, same answer.
   */
  place(options = {}) {
    return place(this, options);
  }

  /**
   * Turn an element that already exists into a Pin, keeping its markup exactly
   * as it was written (see `./hydrate.js`).
   */
  adopt(element, options = {}) {
    return adopt(this, element, options);
  }

  /**
   * Adopt every `[data-cc-pin]` element inside `container`, nesting the Pins the
   * way the DOM nests them (see `./hydrate.js`).
   */
  hydrate(container, selector) {
    return hydrate(this, container, selector);
  }

  /**
   * Frame Pins in the host: a list of them, a bounding box, or - given nothing -
   * every content Pin on the canvas (see `./framing.js`).
   *
   * @param {Iterable<Pin>|object} [pinsOrBounds]
   * @param {object} [options] passed through to `viewport.zoomToFit`
   * @returns {object|null} the framed bounds, or null when there was nothing to frame
   */
  zoomToFit(pinsOrBounds, options = {}) {
    return zoomToFit(this, pinsOrBounds, options);
  }

  /** @deprecated since 0.3.0 - use {@link CloudCanvasSession#unfocus}. Removed in 0.4.0. */
  resetView(options) {
    this.unfocus(options);
  }

  /**
   * Take the session apart and hand the host element back as it was found:
   * each module below reverses what *it* added, and only when this session was
   * what added it - the mount path's no-clobber rule, read from the other end.
   */
  destroy() {
    this.stop();
    unbindSessionEvents(this);
    destroyCursors(this);
    this.pinManager.clear();
    this.renderer.clear();
    unmountLayers(this);
    if (this._sessionStyleEl && this._sessionStyleEl.parentNode) {
      this._sessionStyleEl.parentNode.removeChild(this._sessionStyleEl);
    }
    this._sessionStyleEl = null;
  }
}
