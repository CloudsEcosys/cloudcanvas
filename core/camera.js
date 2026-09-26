/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The camera: pan, zoom and the fit behind `view()`. Every move snaps.
 *
 * The view is a 4x4 column-major matrix (`matrix`), the shape the Phase 12
 * perspective camera fills; the plane's CSS transform reads the same numbers.
 * Eased moves and the screen <-> canvas projection are the motion add-on's
 * (`../addons/motion.js`), which the legacy `Viewport` extends.
 */

/** The host box assumed when a caller has none. */
const HOST = /* @__PURE__ */ Object.freeze({ width: 800, height: 600 });

/** The first value that reads as a finite number (null never does), or null. */
function firstFinite(...values) {
  for (const value of values) {
    if (value !== null && Number.isFinite(Number(value))) return Number(value);
  }
  return null;
}

/** `far - near`, where a null `far` is no edge at all. */
function span(far, near) {
  return far === null ? NaN : Number(far) - near;
}

/**
 * Read `{minX,minY,maxX,maxY}`, `{x,y,width,height}` or a DOMRect-like
 * `{left,top,right,bottom}`. A box that describes nothing throws rather than
 * framing the origin.
 */
function readBox(bounds) {
  if (!bounds || typeof bounds !== 'object') {
    throw new TypeError('zoomToFit: bounds must be a box object');
  }
  const x = firstFinite(bounds.minX, bounds.x, bounds.left);
  const y = firstFinite(bounds.minY, bounds.y, bounds.top);
  const w = firstFinite(bounds.width, span(bounds.maxX, x), span(bounds.right, x));
  const h = firstFinite(bounds.height, span(bounds.maxY, y), span(bounds.bottom, y));

  if (x === null || y === null || w === null || h === null) {
    throw new TypeError('zoomToFit: bounds needs {minX,minY,maxX,maxY}, {x,y,width,height} or a DOMRect');
  }
  return { x, y, w, h };
}

export class Camera {
  constructor(options = {}) {
    this.x = Number(options.x) || 0;
    this.y = Number(options.y) || 0;
    this.scale = Number(options.scale) || 1;
    this.minScale = Number(options.minScale) || 0.1;
    this.maxScale = Number(options.maxScale) || 8;
  }

  /** A scale held inside `[minScale, maxScale]`. */
  clamp(scale) {
    return Math.min(this.maxScale, Math.max(this.minScale, Number(scale)));
  }

  /** Pan by a delta in screen pixels. */
  panBy(dx, dy) {
    this.x += Number(dx);
    this.y += Number(dy);
  }

  /** Pan to a screen offset. */
  panTo(x, y) {
    this.x = Number(x);
    this.y = Number(y);
  }

  setZoom(scale) {
    this.scale = this.clamp(scale);
  }

  /** Zoom by a factor about a screen-space focal point, which stays put. */
  zoomAt(factor, focalX = 0, focalY = 0) {
    const oldScale = this.scale;
    const scale = this.clamp(oldScale * factor);
    if (scale === oldScale) return;

    this.x = focalX - ((focalX - this.x) / oldScale) * scale;
    this.y = focalY - ((focalY - this.y) / oldScale) * scale;
    this.scale = scale;
  }

  /**
   * The camera that frames a box inside the host, centred, with `padding`
   * (60) clearance and a `maxZoom` (2.5) ceiling. Moves nothing.
   * @returns {{x: number, y: number, scale: number}}
   * @throws {TypeError} when `bounds` describes no box at all
   */
  fitTarget(bounds, hostRect = HOST, options = {}) {
    const { x, y, w, h } = readBox(bounds);
    const padding = options.padding !== undefined ? Number(options.padding) : 60;
    const hostW = hostRect.width || 800;
    const hostH = hostRect.height || 600;
    const scale = this.clamp(Math.min(
      Math.max(hostW - padding * 2, 100) / Math.max(w || 100, 40),
      Math.max(hostH - padding * 2, 100) / Math.max(h || 80, 40),
      options.maxZoom || 2.5
    ));
    return { x: hostW / 2 - (x + w / 2) * scale, y: hostH / 2 - (y + h / 2) * scale, scale };
  }

  /** Snap to `fitTarget(...)` and return it. */
  fit(bounds, hostRect, options) {
    const target = this.fitTarget(bounds, hostRect, options);
    Object.assign(this, target);
    return target;
  }

  /**
   * The view as a 4x4 column-major matrix (the WebGL / DOMMatrix layout),
   * fresh per read so a caller may mutate it.
   * @returns {Float64Array}
   */
  get matrix() {
    const s = this.scale;
    return Float64Array.of(s, 0, 0, 0, 0, s, 0, 0, 0, 0, 1, 0, this.x, this.y, 0, 1);
  }
}
