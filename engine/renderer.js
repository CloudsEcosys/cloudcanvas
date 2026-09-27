/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * ConjugateRenderer: the facade over the Pin engine's frame passes.
 *
 * The frame itself is the core's (`../core/frame.js`): one loop, one idle rule,
 * and a structure -> read -> write phase order. The passes that do the Pin work
 * live in `./passes.js` and are registered on a frame root here; this class
 * keeps the sets they work over - membership, invalidation, the render root -
 * and the public surface a session and its Pins call.
 *
 * `activeSet` is *ownership* (which Pins this renderer is responsible for);
 * `liveSet` is *participation* (which of them get per-frame work). A dormant Pin
 * leaves `liveSet` but keeps its renderer, so it can be invalidated and woken.
 * Only dirty Pins are touched: `dirtyContent`, `dirtyStructure`,
 * `dirtyPlacement` and `measureQueue` are the whole of a frame's work.
 *
 * A *render root* narrows participation further: with one set, only the promoted
 * Pin's subtree and its full ancestor chain (the navigable breadcrumb) resolve to
 * their own reload mode; everything else demotes exactly as if it had gone
 * inactive. That is the whole of root promotion - no bespoke DOM path.
 *
 * Standalone (no session) the renderer owns a stopped root and is driven by
 * `frame(context)`; a session hands over its own root and drives the loop.
 */
import { createRoot, runFrame, schedule } from '../core/frame.js';
import { forgetPlacement } from '../core/port.js';
import { SvgGroupLayer } from './svg-groups.js';
import { MotionHintSet } from './motion-hint.js';
import { ScopeWellPass } from './scope-well.js';
import { OffloadPass, DEFAULT_OFFLOAD_MARGIN } from './offload.js';
import { MAX_DEPTH, RenderRootScope } from './mounting.js';
import { registerPasses } from './passes.js';

export { MOVING_CLASS, MOVING_IDLE_FRAMES } from './motion-hint.js';

/** The three kinds of work a Pin can ask for. */
const INVALIDATION_KINDS = /* @__PURE__ */ new Set(['content', 'structure', 'placement']);

/** The camera a standalone renderer starts with, until a frame brings its own. */
const STILL_CAMERA = /* @__PURE__ */ Object.freeze({ x: 0, y: 0, scale: 1 });

/** The sets a frame's work is drawn from: ownership, participation, and the dirt. */
function initQueues(renderer) {
  /** @type {Set<Pin>} every Pin this renderer owns */
  renderer.activeSet = new Set();
  /** @type {Set<Pin>} owned Pins that take part in per-frame work */
  renderer.liveSet = new Set();
  /** @type {Set<Pin>} Pins whose contents changed since the last frame */
  renderer.dirtyContent = new Set();
  /** @type {Set<Pin>} Pins needing (re)mounting or a structural rebuild */
  renderer.dirtyStructure = new Set();
  /** @type {Set<Pin>} Pins whose placement moved since the last frame */
  renderer.dirtyPlacement = new Set();
  /** @type {Set<Pin>} Pins to measure in the next read phase */
  renderer.measureQueue = new Set();
  /**
   * Pins whose geometry or contents changed during the current frame. Rebuilt
   * every frame; the global SVG pass and the cursors gate on it.
   */
  renderer._frameDirty = new Set();
  /** Bumped when the camera moved or the host resized; screen-space gating. */
  renderer.viewportVersion = 0;
  renderer._appliedViewportVersion = -1;
}

/** The state the write passes keep between frames, and their stable closures. */
function initPassState(renderer, options) {
  /** Measured `min-height` + `cc-populated` for every scope container. */
  renderer.scopeWells = new ScopeWellPass();
  /** `cc-moving`: the compositor hint, granted while a Pin is in motion. */
  renderer.motionHints = new MotionHintSet();

  /** Viewport-driven DOM virtualization for `offload` Pins (`./offload.js`). */
  renderer.offloadPass = new OffloadPass();
  /** @type {Set<Pin>} owned Pins that opted into offload; the sweep's whole input. */
  renderer._offloadPins = new Set();
  renderer._offloadMargin = typeof options.offloadMargin === 'number'
    ? options.offloadMargin
    : DEFAULT_OFFLOAD_MARGIN;
  /** A newly adopted offload Pin forces one sweep even under a still camera. */
  renderer._offloadPending = false;

  /** Stable per-frame closures, so the write phase allocates no functions. */
  renderer._isLive = (pin) => renderer.liveSet.has(pin);
  renderer._isGlobalDirty = (pin) => renderer.isGlobalDirty(pin);
  renderer._onWellWritten = (parent) => {
    // A rewritten well changed its parent's box: measure it again next frame.
    renderer.measureQueue.add(parent);
    renderer._frameDirty.add(parent);
  };
}

export class ConjugateRenderer {
  constructor(options = {}) {
    this.session = options.session || null;
    this.planeElement = options.planeElement || null;

    /** Trait index source for the global SVG pass; falls back to the session's. */
    this.pinManager = options.pinManager || null;

    /** Persistent `<g data-trait>` groups in the session's SVG layer. */
    this.svgLayer = new SvgGroupLayer({ element: options.svgLayerElement || null });

    /** Promoted render root (empty = the whole canvas). */
    this.rootScope = new RenderRootScope();

    initQueues(this);
    initPassState(this, options);

    /** The frame context the passes hand to traits, rebuilt at the top of each frame. */
    this.context = {};
    this._callerContext = {};
    this._contextFor = options.context || (() => this._callerContext);

    /** The core frame root the passes are registered on (not the render root Pin). */
    this.frameRoot = options.root
      || createRoot({ plane: this.planeElement, camera: STILL_CAMERA, running: false });
    registerPasses(this, this.frameRoot, options.passes);
  }

  /* ------------------ MEMBERSHIP ------------------ */

  /**
   * Adopt a Pin: it is mounted, measured, placed and rendered on the next frame,
   * and any invalidation it recorded before the renderer existed is replayed.
   */
  attach(pin) {
    if (!pin || this.activeSet.has(pin)) return false;

    this.activeSet.add(pin);
    pin._renderer = this;

    // An offload Pin joins the sweep and forces one evaluation next frame, so a
    // Pin created off-screen is torn down without waiting for the first pan.
    if (pin.offload) {
      this._offloadPins.add(pin);
      this._offloadPending = true;
    }

    this.dirtyStructure.add(pin);
    this.dirtyContent.add(pin);
    this.dirtyPlacement.add(pin);
    if (pin.element) this.measureQueue.add(pin);

    if (typeof pin.takePendingInvalidations === 'function') {
      for (const kind of pin.takePendingInvalidations()) {
        this.invalidate(pin, kind);
      }
    }
    this.wake();
    return true;
  }

  /** Drop a Pin from every set. Idempotent; leaves the DOM untouched. */
  forget(pin) {
    if (!pin) return false;

    const owned = this.activeSet.delete(pin);
    this.liveSet.delete(pin);
    this.dirtyContent.delete(pin);
    this.dirtyStructure.delete(pin);
    this.dirtyPlacement.delete(pin);
    this.measureQueue.delete(pin);
    this._offloadPins.delete(pin);
    this.motionHints.delete(pin);
    if (pin.element) forgetPlacement(pin.element);
    // A vanished child still changes the well it was sitting in.
    this.scopeWells.invalidate(pin.parent);
    if (pin._renderer === this) pin._renderer = null;

    return owned;
  }

  isAttached(pin) {
    return this.activeSet.has(pin);
  }

  /** True when a Pin takes part in per-frame work (mounted and awake). */
  isLive(pin) {
    return this.liveSet.has(pin);
  }

  /**
   * Point the renderer at the canvas plane. Every owned Pin is re-mounted on the
   * next frame and the plane transform is rewritten.
   */
  setPlaneElement(element) {
    this.planeElement = element || null;
    this.frameRoot.plane = this.planeElement;
    this._appliedViewportVersion = -1;
    this._reconcileAll();
    return this.planeElement;
  }

  /** Point the global SVG pass at the session's `.cloudcanvas-svg-layer`. */
  setSvgLayerElement(element) {
    // A fresh layer has no camera transform on it yet.
    this._appliedViewportVersion = -1;
    this.wake();
    return this.svgLayer.setElement(element);
  }

  /* ------------------ RENDER ROOT ------------------ */

  /** The promoted render root, or null when the whole canvas renders. */
  get renderRoot() {
    return this.rootScope.pin;
  }

  /**
   * Promote a Pin to render root, or restore the whole canvas with `null`.
   * Everything outside the promoted subtree and its breadcrumb demotes per its
   * own reload strategy on the next structure flush.
   *
   * @returns {Pin|null} the new render root
   */
  setRenderRoot(pin = null) {
    if (this.rootScope.set(pin)) this._reconcileAll();
    return this.rootScope.pin;
  }

  /** Whether the current render root lets a Pin take part at all. */
  participates(pin) {
    return this.rootScope.allows(pin);
  }

  /** Queue every owned Pin for re-evaluation by the next structure flush. */
  _reconcileAll() {
    for (const pin of this.activeSet) {
      this.dirtyStructure.add(pin);
    }
    this.wake();
    return this.dirtyStructure.size;
  }

  /* ------------------ INVALIDATION ------------------ */

  /**
   * Queue work for an owned Pin, and wake the loop for it.
   * @param {'content'|'structure'|'placement'} kind
   */
  invalidate(pin, kind = 'content') {
    if (!INVALIDATION_KINDS.has(kind)) {
      throw new TypeError(`ConjugateRenderer.invalidate: unknown kind "${kind}"`);
    }
    if (!pin || !this.activeSet.has(pin)) return false;

    if (kind === 'content') this.dirtyContent.add(pin);
    else if (kind === 'structure') this.dirtyStructure.add(pin);
    else this.dirtyPlacement.add(pin);

    this.wake();
    return true;
  }

  /**
   * Queue a Pin whose reload state changed (activation, deactivation, focus,
   * re-parenting). The strategy is executed by the next structure flush, so a
   * burst of activations costs exactly one DOM pass.
   */
  reconcile(pin) {
    return this.invalidate(pin, 'structure');
  }

  /** Queue a Pin for the next batched read phase. */
  enqueueMeasure(pin) {
    if (!pin || !pin.element) return false;
    this.measureQueue.add(pin);
    this.wake();
    return true;
  }

  /**
   * Forget a Pin's last-written placement, so the next frame writes it in full.
   * Called by `syncFlowChild` (`../pins/pin-element.js`) on every crossing of
   * the flow-child boundary: leaving flow, the transform the Pin now needs must
   * not be skipped as unchanged against a stale cache entry.
   *
   * @returns {boolean} whether a cached placement was actually dropped
   */
  clearAppliedPosition(pin) {
    if (!pin || !pin.element) return false;
    this.invalidate(pin, 'placement');
    return forgetPlacement(pin.element);
  }

  /**
   * Signal that screen space moved without the camera (a host resize): the
   * plane transform, the screen-space SVG groups and the cursors redraw next frame.
   */
  bumpViewportVersion() {
    this.viewportVersion += 1;
    this.wake();
    return this.viewportVersion;
  }

  /** Ask the frame loop for a frame; a stopped or hand-driven root ignores it. */
  wake() {
    return schedule(this.frameRoot);
  }

  /* ------------------ FRAME ------------------ */

  /**
   * Execute one frame by hand, with `context` as the frame context the passes
   * hand to traits; its `viewport` becomes the root's camera.
   * @returns {number} the number of frames rendered so far
   */
  frame(context = {}) {
    this._callerContext = context;
    if (context.viewport) this.frameRoot.camera = context.viewport;
    runFrame(this.frameRoot, context.dt);
    return this.frameRoot.frameCount;
  }

  /**
   * Whether a Pin's *global* geometry or contents changed this frame.
   *
   * Global bounds are cumulative over the scope chain, so an ancestor that moved
   * drags every descendant with it even though no descendant particle changed.
   * The frame's dirt outlives the frame, so a caller can ask this afterwards.
   */
  isGlobalDirty(pin) {
    let node = pin;
    for (let depth = 0; node && depth < MAX_DEPTH; depth += 1) {
      if (this._frameDirty.has(node)) return true;
      node = node.parent;
    }
    return false;
  }

  /* ------------------ HELPERS ------------------ */

  /** Release every Pin. The DOM is left as-is; callers own teardown. */
  clear() {
    for (const pin of Array.from(this.activeSet)) {
      this.forget(pin);
    }
    this.dirtyContent.clear();
    this.dirtyStructure.clear();
    this.dirtyPlacement.clear();
    this.measureQueue.clear();
    this.liveSet.clear();
    this._frameDirty.clear();
    this._offloadPins.clear();
    this._offloadPending = false;
    this.offloadPass.reset();
    this.scopeWells.clear();
    this.motionHints.clear();
    this.rootScope.clear();
    this.svgLayer.clear();
  }
}
