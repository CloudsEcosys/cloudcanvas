/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 * 
 * CloudCanvasSession: the client-side runtime - host mounting, scoping, focus
 * navigation, the four render layers, and the trait-driven frame loop.
 *
 * The session is the state and the public surface; the transitions live beside
 * it, as free functions taking the session as their first argument:
 *
 *   ./host.js       - the host's four layers and the listeners bound to them
 *   ./navigation.js - focus, promotion, and the back/forward history
 *   ./context-menu.js - the right-click command registry and its overlay
 *   ./pointer.js    - pointer gestures routed to traits or to the camera
 *   ./keyboard.js   - the single tab stop and the roving order inside it
 *   ./announcer.js  - the host's ARIA identity and its polite live region
 *   ./cursors.js    - the cursor Pin's lifecycle and its target wiring
 *   ./frame.js      - the frame loop, its context, and the graph-wide re-render
 *   ./placement.js  - a free canvas spot for a new Pin
 *   ./framing.js    - which box a `zoomToFit` should frame
 *   ./renderer.js   - the per-frame conjugate render pass
 *   ./session-options.js - the closed list of options, and its enforcement
 */
import { Viewport } from './viewport.js';
import { ParticleEngine } from '../particles/engine.js';
import { PinManager } from '../pins/manager.js';
import { ConjugateRenderer } from './renderer.js';
import {
  DEFAULT_HOST_RECT,
  canGoForward,
  focus,
  focusParent,
  goForward,
  popFocus,
  promoteToRoot,
  pushFocus,
  unfocus
} from './navigation.js';
import { mountContextMenu, unmountContextMenu } from './context-menu.js';
import {
  cancelDrag,
  initPointerState,
  onContextMenu,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onWheel
} from './pointer.js';
import {
  destroyCursors,
  getCursorTarget,
  handlePinSignal,
  mountCursors,
  remountCursors,
  setCursorTarget
} from './cursors.js';
import {
  createSessionFrame,
  frameContext,
  regraph,
  sessionPasses,
  start,
  stop,
  tick
} from './frame.js';
import {
  bindSessionEvents,
  mountLayers,
  unbindSessionEvents,
  unmountLayers
} from './host.js';
import {
  announceEdit,
  announceFocus,
  applyHostAria,
  mountAnnouncer,
  removeHostAria,
  unmountAnnouncer
} from './announcer.js';
import { place } from './placement.js';
import { adopt, hydrate } from './hydrate.js';
import { zoomToFit } from './framing.js';
import { assertKnownOptions, assertValidContainer } from './session-options.js';
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
    assertKnownOptions(options);
    this.options = options;

    /**
     * Session-level event stream. Native `EventTarget` rather than a bespoke
     * emitter: `addEventListener` / `removeEventListener` are what a consumer
     * already knows, and `AbortSignal` unsubscribes a whole page's worth at once.
     * @type {EventTarget}
     */
    this.events = new EventTarget();
    this.viewport = new Viewport(options.viewport || {});
    this.particleEngine = new ParticleEngine();
    // `defaultReload` and `loadChildren` are session-level policy; the manager
    // owns their per-Pin application.
    this.pinManager = new PinManager({
      particleEngine: this.particleEngine,
      defaultReload: options.defaultReload,
      loadChildren: options.loadChildren
    });

    // The core frame root this session runs on (`./frame.js`): the viewport is
    // its camera, the host box lives on it, and the renderer's passes plus the
    // session's own are registered on it. `offloadMargin` is session-level
    // offload policy; a per-Pin `offloadMargin` overrides it (see `./offload.js`).
    this._frame = createSessionFrame(this);
    const passes = sessionPasses(this);
    this.renderer = new ConjugateRenderer({
      session: this,
      root: this._frame,
      context: passes.context,
      passes,
      offloadMargin: options.offloadMargin
    });
    this.pinManager.setRenderer(this.renderer);
    // Any programmatic camera move - a fit or flight started on `session.viewport`
    // directly included - wakes the loop through the one scheduler.
    this.viewport.onWake = () => this.renderer.wake();

    this.hostElement = null;
    this.svgLayerElement = null;
    this.planeElement = null;
    this.overlayElement = null;
    // Dimming layer inside the plane, raised by the focus transitions.
    this.focusVeilElement = null;

    // What this session added *to the host* - and so all `destroy()` may take
    // back off it - is recorded at mount by the modules that own the additions:
    // `_hostClassAdded` (./host.js), `_hostAriaAttributes` (./announcer.js).

    // Focus & Scope navigation history. `focusStack` is Back, `_forwardStack`
    // is Forward: every new navigation empties the latter (see `./navigation.js`).
    this.focusedPin = null;
    this.focusStack = [];
    this._forwardStack = [];

    // The null Pin carrying the focus / selection / activation cursors, built at
    // mount time because it draws into the overlay layer (see `../pins/cursor.js`).
    this.cursorPin = null;
    this._unsubscribeSignals = null;
    this._onPinSignal = this._onPinSignal.bind(this);

    // Stable per-frame closures. Both are read once per frame, so binding them
    // here keeps `getContext()` allocation-free of function objects.
    this._participates = (pin) => this.renderer.participates(pin);
    this._cursorDirty = (pin) => this.renderer.isGlobalDirty(pin);

    // Gesture state - the live pointers, the drag, the pinch, the armed capture -
    // is the pointer router's (see `./pointer.js`).
    initPointerState(this);

    // Bound event handlers
    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);
    this._onContextMenu = this._onContextMenu.bind(this);
    this._onWheel = this._onWheel.bind(this);
    this._onResize = this._onResize.bind(this);

    if (options.autoInjectStyles !== false) {
      injectCanvasStyles();
    }

    // Per-session author CSS, kept in its own element so `destroy()` can take
    // it away again without touching the shared canvas stylesheet.
    this._sessionStyleEl = options.customCSS
      ? injectSessionStyles(options.customCSS)
      : null;

    // `container` is optional - omit it to mount later. Supplied, it is validated
    // now rather than skipped when falsy: `{container: null}` was a silent no-op,
    // a session that mounted, rendered, and reported nothing (see
    // `./session-options.js`).
    if ('container' in options) {
      assertValidContainer(options.container);
      this.mount(options.container);
    }
  }

  /**
   * Mount the session into a target DOM container
   */
  mount(container) {
    if (typeof document === 'undefined') return this;

    assertValidContainer(container);
    const host = typeof container === 'string' ? document.querySelector(container) : container;
    if (!host) {
      throw new Error(`CloudCanvasSession: Target container "${container}" not found`);
    }

    this.hostElement = host;
    this._frame.host = host;

    // 1. The four layers, in paint order (see `./host.js`).
    mountLayers(this);

    // 2. The cursor Pin and the context menu, both of which draw into the
    //    overlay layer (see `./cursors.js`, `./context-menu.js`).
    mountCursors(this);
    mountContextMenu(this);

    // 3. Accessibility: the host's role and name, the decorative layers taken
    //    out of the tree (the cursor layer exists only after `mountCursors`),
    //    and the polite live region every transition is announced through.
    applyHostAria(this);
    mountAnnouncer(this);

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
   * The session's sink for the manager's Pin signals.
   *
   * Two consumers, one subscription (`mountCursors` in `./cursors.js`): the edit
   * lock is announced, everything else moves a cursor. Kept here rather than in
   * either module because the split is the session's, and a second subscription
   * would be a second place a signal type has to be remembered.
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
   * Zoom into a Pin: promote it to render root and focus it (see
   * `./navigation.js`).
   *
   * Promotion is the default outcome since 0.4.0 - "focus this Pin" and "make
   * this Pin the view" were always the same gesture, and having them be two
   * calls meant the interesting one was the one nobody reached for. Pass
   * `{promote: false}` for the plain camera move.
   *
   * Every wrapper that changes focus announces it *and* publishes it: a camera
   * move is silent to anyone not watching it, and this layer is the one place
   * every route to a focus change - pointer, keyboard, or API - passes through.
   */
  focus(pinOrId, options = {}) {
    const pin = focus(this, pinOrId, options);
    if (pin) this._focusChanged(pin);
    return pin;
  }

  /** Push the current view state and focus a Pin; `promote` also promotes it. */
  pushFocus(pinOrId, options = {}) {
    const pin = pushFocus(this, pinOrId, options);
    if (pin) this._focusChanged(pin);
    return pin;
  }

  /** Promote a Pin to render root and focus it, stacking the outgoing state. */
  promoteToRoot(pinOrId, options = {}) {
    const pin = promoteToRoot(this, pinOrId, options);
    if (pin) this._focusChanged(pin);
    return pin;
  }

  /** Restore the previous focus, camera, and render root. */
  popFocus(options = {}) {
    const pin = popFocus(this, options);
    this._focusChanged(pin);
    return pin;
  }

  /**
   * Re-apply the state the last `popFocus` left behind - Forward to its Back.
   *
   * A no-op with nothing to go forward to, rather than a reset: an empty forward
   * stack means the history ends here, and ending it *again* is not a transition
   * worth announcing.
   */
  goForward(options = {}) {
    if (!canGoForward(this)) return null;

    const pin = goForward(this, options);
    this._focusChanged(pin);
    return pin;
  }

  /** Drop all focus and promotion state, returning to the whole canvas. */
  unfocus(options = {}) {
    const cleared = unfocus(this, options);
    this._focusChanged(cleared);
    return cleared;
  }

  /**
   * Focus the parent scope of the focused Pin.
   * Announced like every other wrapper, including the step out to the canvas,
   * which resolves to no focused Pin at all.
   */
  focusParent(options = {}) {
    const pin = focusParent(this, options);
    this._focusChanged(pin);
    return pin;
  }

  /**
   * Say a focus transition out loud, twice: once to assistive technology and
   * once to the page.
   *
   * `focus:changed` carries the whole navigational state rather than the Pin
   * alone, because a breadcrumb bar needs the trail and a title needs the render
   * root, and reading them back off the session afterwards is a second source of
   * truth that can disagree with the event that woke it.
   *
   * @param {Pin|null} pin the newly focused Pin, or null at the canvas root
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

  /* ------------------ POINTER EVENT ROUTING (see `./pointer.js`) ------------------ */

  _onPointerDown(event) {
    return onPointerDown(this, event);
  }

  _onPointerMove(event) {
    return onPointerMove(this, event);
  }

  _onPointerUp(event) {
    return onPointerUp(this, event);
  }

  _onWheel(event) {
    return onWheel(this, event);
  }

  /** Raise the canvas menu, or leave the platform's alone (see `./pointer.js`). */
  _onContextMenu(event) {
    return onContextMenu(this, event);
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

  createPin(options) {
    return this.pinManager.createPin(options);
  }

  removePin(id) {
    return this.pinManager.removePin(id);
  }

  getPin(id) {
    return this.pinManager.getPin(id);
  }

  queryRadius(x, y, radius) {
    return this.pinManager.queryRadius(x, y, radius);
  }

  queryBox(minX, minY, maxX, maxY) {
    return this.pinManager.queryBox(minX, minY, maxX, maxY);
  }

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
    unmountContextMenu(this);
    destroyCursors(this);
    unmountAnnouncer(this);
    removeHostAria(this);
    this.pinManager.clear();
    this.renderer.clear();
    unmountLayers(this);
    if (this._sessionStyleEl && this._sessionStyleEl.parentNode) {
      this._sessionStyleEl.parentNode.removeChild(this._sessionStyleEl);
    }
    this._sessionStyleEl = null;
  }
}
