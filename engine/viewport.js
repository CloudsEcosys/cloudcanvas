/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 * 
 * Viewport manages canvas coordinate transformations, zoom levels, pan offsets,
 * smooth camera animations, and focus framing.
 */
import { formatTransform3D } from '../graphics/styles.js';
import { createLogger } from '../log.js';

const logger = createLogger('viewport');

/**
 * Named easing curves usable as `options.easing` on animated camera moves.
 * Each entry maps normalised time `t` (0..1) to an eased progress `e` (0..1).
 * @type {Readonly<Record<string, (t: number) => number>>}
 */
export const EASINGS = Object.freeze({
  linear: (t) => t,
  'ease-out-cubic': (t) => 1 - Math.pow(1 - t, 3),
  'ease-in-out': (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
});

/** Curve applied when no easing is supplied, or when an unknown name is given. */
export const DEFAULT_EASING = 'ease-out-cubic';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Resolve an easing option to a callable curve.
 * A function is used as-is; a string is looked up in {@link EASINGS}.
 * Unknown names never throw -- they fall back to {@link DEFAULT_EASING}.
 * @param {((t: number) => number)|string|undefined} easing
 * @returns {(t: number) => number}
 */
function resolveEasing(easing) {
  if (typeof easing === 'function') return easing;
  if (typeof easing === 'string' && Object.prototype.hasOwnProperty.call(EASINGS, easing)) {
    return EASINGS[easing];
  }
  return EASINGS[DEFAULT_EASING];
}

/**
 * Interpolate zoom in log space, so equal slices of eased progress are equal
 * *ratios* of magnification -- 1 -> 4 passes through 2 at the midpoint, not 2.5.
 * Falls back to linear interpolation for non-positive scales, where the
 * logarithm is undefined (clamped viewports always keep scale > 0).
 * @param {number} startScale
 * @param {number} targetScale
 * @param {number} ease Eased progress, 0..1.
 * @returns {number}
 */
function interpolateScale(startScale, targetScale, ease) {
  if (startScale === targetScale) return targetScale;
  if (startScale <= 0 || targetScale <= 0) {
    return startScale + (targetScale - startScale) * ease;
  }
  return startScale * Math.pow(targetScale / startScale, ease);
}

/**
 * The camera that frames `bounds` inside `hostRect`.
 *
 * Pure: it reads the viewport's scale limits and writes nothing, so both the
 * animated path and the caller who only wants the numbers share one
 * implementation of the fit.
 *
 * @param {Viewport} viewport
 * @param {object} bounds
 * @param {{width?: number, height?: number}} hostRect
 * @param {{padding?: number, maxZoom?: number}} options
 * @returns {{x: number, y: number, scale: number}}
 */
function fitTarget(viewport, bounds, hostRect, options) {
  const padding = options.padding !== undefined ? Number(options.padding) : 60;
  const hostW = hostRect.width || 800;
  const hostH = hostRect.height || 600;

  const bWidth = Math.max(bounds.width || (bounds.maxX - bounds.minX) || 100, 40);
  const bHeight = Math.max(bounds.height || (bounds.maxY - bounds.minY) || 80, 40);
  const bCenterX = bounds.centerX !== undefined ? bounds.centerX : (bounds.minX + bWidth / 2);
  const bCenterY = bounds.centerY !== undefined ? bounds.centerY : (bounds.minY + bHeight / 2);

  // Scale that fits the box inside the host, with padding on every side.
  const availW = Math.max(hostW - padding * 2, 100);
  const availH = Math.max(hostH - padding * 2, 100);
  const scale = Math.min(
    viewport.maxScale,
    Math.max(viewport.minScale, Math.min(availW / bWidth, availH / bHeight, options.maxZoom || 2.5))
  );

  // Offsets that put the box's centre on the host's centre.
  return {
    x: hostW / 2 - bCenterX * scale,
    y: hostH / 2 - bCenterY * scale,
    scale
  };
}

/** Jump to a resolved camera, or animate to it through the one choke point. */
function applyCameraTarget(viewport, target, options) {
  if (options.immediate) {
    viewport.x = target.x;
    viewport.y = target.y;
    viewport.scale = target.scale;
    viewport.stopAnimation();
    return;
  }

  const duration = options.duration !== undefined ? Number(options.duration) : 400;
  viewport.animateTo(target.x, target.y, target.scale, { duration, easing: options.easing });
}

/**
 * Read any of the three box shapes into the one `fitTarget` expects.
 *
 * A box that describes nothing throws rather than framing the origin: silently
 * flying the camera to (0, 0) is the failure mode that takes an afternoon to
 * find.
 */
function normalizeBox(bounds) {
  if (!bounds || typeof bounds !== 'object') {
    throw new TypeError('zoomToFit: bounds must be a box object');
  }

  const minX = firstFinite(bounds.minX, bounds.x, bounds.left);
  const minY = firstFinite(bounds.minY, bounds.y, bounds.top);
  const width = firstFinite(bounds.width, difference(bounds.maxX, minX), difference(bounds.right, minX));
  const height = firstFinite(bounds.height, difference(bounds.maxY, minY), difference(bounds.bottom, minY));

  if (minX === null || minY === null || width === null || height === null) {
    throw new TypeError('zoomToFit: bounds needs {minX,minY,maxX,maxY}, {x,y,width,height} or a DOMRect');
  }

  return {
    minX,
    minY,
    maxX: minX + width,
    maxY: minY + height,
    width,
    height,
    centerX: minX + width / 2,
    centerY: minY + height / 2
  };
}

/** The first argument that is a finite number, or null. */
function firstFinite(...values) {
  for (const value of values) {
    const parsed = Number(value);
    if (value !== null && value !== undefined && Number.isFinite(parsed)) return parsed;
  }
  return null;
}

/** `far - near`, or undefined when either end is missing. */
function difference(far, near) {
  if (far === undefined || far === null || near === null) return undefined;
  return Number(far) - near;
}

/**
 * Lazily-built cache of the reduced-motion media query.
 * @type {{matches: boolean, query: MediaQueryList|null, onChange: ((event: any) => void)|null}|null}
 */
let reducedMotionState = null;

function reducedMotionCache() {
  if (reducedMotionState) return reducedMotionState;

  const state = { matches: false, query: null, onChange: null };
  reducedMotionState = state;

  if (typeof globalThis.matchMedia !== 'function') return state;

  let query = null;
  try {
    query = globalThis.matchMedia(REDUCED_MOTION_QUERY);
  } catch (error) {
    // Environment exposes matchMedia but cannot parse the query.
    logger.debug(`matchMedia rejected "${REDUCED_MOTION_QUERY}"`, error);
    return state;
  }
  if (!query) return state;

  state.query = query;
  state.matches = Boolean(query.matches);
  state.onChange = (event) => {
    state.matches = Boolean(event && 'matches' in event ? event.matches : query.matches);
  };

  if (typeof query.addEventListener === 'function') {
    query.addEventListener('change', state.onChange);
  } else if (typeof query.addListener === 'function') {
    query.addListener(state.onChange); // Legacy Safari.
  }
  return state;
}

/**
 * Whether the user asked the platform to reduce motion.
 * Resolved once on first call and kept live by a `change` listener; safe in
 * non-browser environments (no `matchMedia` -> always `false`).
 * @returns {boolean}
 */
export function prefersReducedMotion() {
  return reducedMotionCache().matches;
}

/**
 * Drop the cached media query (and its listener) so the next
 * {@link prefersReducedMotion} call re-reads `globalThis.matchMedia`.
 * Test seam only.
 */
export function _resetReducedMotionForTests() {
  const state = reducedMotionState;
  reducedMotionState = null;
  if (!state || !state.query || !state.onChange) return;
  if (typeof state.query.removeEventListener === 'function') {
    state.query.removeEventListener('change', state.onChange);
  } else if (typeof state.query.removeListener === 'function') {
    state.query.removeListener(state.onChange);
  }
}

export class Viewport {
  constructor(options = {}) {
    this.x = Number(options.x) || 0;
    this.y = Number(options.y) || 0;
    this.scale = Number(options.scale) || 1;

    this.minScale = Number(options.minScale) || 0.1;
    this.maxScale = Number(options.maxScale) || 8.0;

    // Camera animation state
    this.animation = null;
  }

  /**
   * Pan the viewport by a delta (dx, dy) in screen pixels
   */
  panBy(dx, dy) {
    this.stopAnimation();
    this.x += Number(dx);
    this.y += Number(dy);
  }

  /**
   * Pan directly to a specific offset
   */
  panTo(x, y) {
    this.stopAnimation();
    this.x = Number(x);
    this.y = Number(y);
  }

  /**
   * Set absolute zoom level clamped between minScale and maxScale
   */
  setZoom(scale) {
    this.stopAnimation();
    this.scale = Math.min(this.maxScale, Math.max(this.minScale, Number(scale)));
  }

  /**
   * Zoom centered at a specific focal point (e.g. cursor or pinch center)
   */
  zoomAt(factor, focalX = 0, focalY = 0) {
    this.stopAnimation();
    const oldScale = this.scale;
    const newScale = Math.min(this.maxScale, Math.max(this.minScale, oldScale * factor));
    if (newScale === oldScale) return;

    // Adjust pan so focal point remains invariant
    this.x = focalX - ((focalX - this.x) / oldScale) * newScale;
    this.y = focalY - ((focalY - this.y) / oldScale) * newScale;
    this.scale = newScale;
  }

  /**
   * Frame a box: the one camera fit, under the name that says what it does.
   *
   * Two things it gives a caller beyond the raw fit:
   *
   *   - the box may be written any of the three ways a box is written in this
   *     codebase (`{minX,minY,maxX,maxY}`, `{x,y,width,height}`, a DOMRect-like
   *     `{left,top,right,bottom}`), because the caller computing a union of Pin
   *     bounds should not have to know which one the camera prefers
   *   - it returns the camera it resolved, so a caller can frame a box without
   *     waiting for the animation to tell them where it went
   *
   * The session-level ergonomics (`session.zoomToFit()` over a set of Pins, or
   * over everything) live at the session layer and call through to here.
   *
   * @param {{minX?: number, minY?: number, maxX?: number, maxY?: number,
   *          x?: number, y?: number, width?: number, height?: number,
   *          left?: number, top?: number, right?: number, bottom?: number}} bounds
   * @param {{width: number, height: number}} [hostRect]
   * @param {object} [options]
   * @param {number} [options.padding=60] screen-pixel clearance on every side
   * @param {number} [options.maxZoom=2.5] ceiling on the resolved scale, so
   *        framing one small Pin does not fill the host with it
   * @param {boolean} [options.immediate] jump instead of animating
   * @param {number} [options.duration=400] animation length in milliseconds
   * @param {((t: number) => number)|string} [options.easing]
   * @returns {{x: number, y: number, scale: number}} the resolved camera
   * @throws {TypeError} when `bounds` describes no box at all
   */
  zoomToFit(bounds, hostRect = { width: 800, height: 600 }, options = {}) {
    const target = fitTarget(this, normalizeBox(bounds), hostRect, options);
    applyCameraTarget(this, target, options);
    return target;
  }

  /**
   * @deprecated since 0.3.0 - use {@link Viewport#zoomToFit}. Removed in 0.4.0.
   *
   * Identical maths through the identical choke point, with the same arguments;
   * `zoomToFit` additionally reads all three box shapes and returns the camera
   * it resolved. One behavioural difference comes with the alias: a box that
   * describes no box at all now throws a `TypeError` instead of quietly flying
   * the camera to the origin.
   *
   * @param {object} bounds
   * @param {{width: number, height: number}} [hostRect]
   * @param {object} [options]
   * @returns {{x: number, y: number, scale: number}} the resolved camera
   */
  focusOn(bounds, hostRect = { width: 800, height: 600 }, options = {}) {
    return this.zoomToFit(bounds, hostRect, options);
  }

  /**
   * Animate viewport parameters smoothly.
   *
   * Single choke point for every animated camera move (zoomToFit, reset, ...),
   * so reduced-motion handling applies uniformly: when the user prefers
   * reduced motion the viewport jumps to the targets and `onComplete` fires
   * synchronously, leaving no active animation.
   *
   * @param {number} targetX
   * @param {number} targetY
   * @param {number} targetScale
   * @param {object} [options]
   * @param {number} [options.duration=400] Animation length in milliseconds.
   * @param {((t: number) => number)|string} [options.easing='ease-out-cubic']
   *        Easing function, or a name from {@link EASINGS}. Unknown names fall
   *        back to {@link DEFAULT_EASING} rather than throwing.
   * @param {Function} [options.onComplete]
   */
  animateTo(targetX, targetY, targetScale, options = {}) {
    const onComplete = typeof options.onComplete === 'function' ? options.onComplete : null;

    if (prefersReducedMotion()) {
      this.animation = null;
      this.x = Number(targetX);
      this.y = Number(targetY);
      this.scale = Number(targetScale);
      if (onComplete) onComplete();
      return;
    }

    this.animation = {
      startX: this.x,
      startY: this.y,
      startScale: this.scale,
      targetX,
      targetY,
      targetScale,
      duration: options.duration || 400,
      easing: resolveEasing(options.easing),
      elapsed: 0,
      onComplete
    };
  }

  /**
   * Stop active camera animation
   */
  stopAnimation() {
    this.animation = null;
  }

  get isAnimating() {
    return Boolean(this.animation);
  }

  /**
   * Advance animation frame
   */
  update(dtMs = 16) {
    const animation = this.animation;
    if (!animation) return;

    animation.elapsed += dtMs;
    const t = Math.min(1, animation.elapsed / animation.duration);

    if (t >= 1) {
      // Snap exactly on the final frame: eased interpolation is only
      // approximately equal to the target under floating point.
      this.x = animation.targetX;
      this.y = animation.targetY;
      this.scale = animation.targetScale;
      this.animation = null;
      if (animation.onComplete) animation.onComplete();
      return;
    }

    const ease = animation.easing(t);
    this.x = animation.startX + (animation.targetX - animation.startX) * ease;
    this.y = animation.startY + (animation.targetY - animation.startY) * ease;
    this.scale = interpolateScale(animation.startScale, animation.targetScale, ease);
  }

  /**
   * Transform screen coordinates (e.g. MouseEvent clientX, clientY) to Canvas coordinates
   */
  screenToCanvas(screenX, screenY, hostRect = { left: 0, top: 0 }) {
    const relX = screenX - (hostRect.left || 0);
    const relY = screenY - (hostRect.top || 0);
    return {
      x: (relX - this.x) / this.scale,
      y: (relY - this.y) / this.scale
    };
  }

  /**
   * Transform Canvas coordinates to Screen coordinates
   */
  canvasToScreen(canvasX, canvasY, hostRect = { left: 0, top: 0 }) {
    return {
      x: canvasX * this.scale + this.x + (hostRect.left || 0),
      y: canvasY * this.scale + this.y + (hostRect.top || 0)
    };
  }

  /**
   * Produce the CSS transform string for the viewport plane
   */
  getTransformString() {
    return formatTransform3D(this.x, this.y, 0, this.scale);
  }

  /**
   * Reset viewport to default origin and scale
   */
  reset(options = {}) {
    if (options.animate || (options.duration && !options.immediate)) {
      this.animateTo(0, 0, 1, { duration: options.duration || 350, easing: options.easing });
    } else {
      this.stopAnimation();
      this.x = 0;
      this.y = 0;
      this.scale = 1;
    }
  }
}
