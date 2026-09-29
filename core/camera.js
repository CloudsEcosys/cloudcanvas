/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The camera: pan, zoom and the fit behind `view()`. Every move snaps. Flat by default; `perspective` (px) and
 * `rotateX` / `rotateY` (degrees, about the host's centre) make it 3D, with CSS's own definitions, so the one
 * `view()` matrix is both the plane's `matrix3d` and - through `projected()` - what a GPU pass draws with, so
 * a DOM blit and a GPU blit at the same depth land on the same pixels. `unproject` takes a host point back to the
 * canvas plane through the tilt. Eased moves are the motion add-on's (`../addons/motion.js`).
 */

/** The first value that reads as a finite number (null never does), or null. */
function firstFinite(...values) {
  for (const value of values) if (value !== null && Number.isFinite(Number(value))) return Number(value);
  return null;
}

/** `far - near`, where a null `far` is no edge at all. */
function span(far, near) {
  return far === null ? NaN : Number(far) - near;
}

/** Read `{minX,minY,maxX,maxY}`, `{x,y,width,height}` or a DOMRect-like box; one describing nothing throws. */
function readBox(bounds) {
  if (!bounds || typeof bounds !== 'object') throw new TypeError('zoomToFit: bounds must be a box object');
  const x = firstFinite(bounds.minX, bounds.x, bounds.left);
  const y = firstFinite(bounds.minY, bounds.y, bounds.top);
  const w = firstFinite(bounds.width, span(bounds.maxX, x), span(bounds.right, x));
  const h = firstFinite(bounds.height, span(bounds.maxY, y), span(bounds.bottom, y));
  if ([x, y, w, h].includes(null)) {
    throw new TypeError('zoomToFit: bounds needs {minX,minY,maxX,maxY}, {x,y,width,height} or a DOMRect');
  }
  return { x, y, w, h };
}

/** The smallest homogeneous `w` a point may have and still be in front of the viewer. */
const NEAR_W = 1e-6;

/** `a · b` for 4x4 column-major matrices. */
export function multiply(a, b) {
  const out = new Float64Array(16);
  for (let col = 0; col < 4; col += 1) {
    for (let row = 0; row < 4; row += 1) {
      let sum = 0;
      for (let k = 0; k < 4; k += 1) sum += a[k * 4 + row] * b[col * 4 + k];
      out[col * 4 + row] = sum;
    }
  }
  return out;
}

/** A translation, column-major. */
const translation = (x, y, z = 0) => Float64Array.of(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1);

/** CSS `rotateX(deg)` then `rotateY(deg)`, column-major. */
function rotation(rx, ry) {
  const [a, b] = [rx * Math.PI / 180, ry * Math.PI / 180];
  const x = Float64Array.of(1, 0, 0, 0, 0, Math.cos(a), Math.sin(a), 0, 0, -Math.sin(a), Math.cos(a), 0, 0, 0, 0, 1);
  const y = Float64Array.of(Math.cos(b), 0, -Math.sin(b), 0, 0, 1, 0, 0, Math.sin(b), 0, Math.cos(b), 0, 0, 0, 0, 1);
  return multiply(x, y);
}

export class Camera {
  constructor(options = {}) {
    this.x = Number(options.x) || 0;
    this.y = Number(options.y) || 0;
    this.scale = Number(options.scale) || 1;
    this.minScale = Number(options.minScale) || 0.1;
    this.maxScale = Number(options.maxScale) || 8;
    /** Viewer distance in px (CSS `perspective`), or null for none. */
    this.perspective = Number(options.perspective) > 0 ? Number(options.perspective) : null;
    this.rotateX = Number(options.rotateX) || 0;
    this.rotateY = Number(options.rotateY) || 0;
  }

  /** Whether the view is 3D: seen through a perspective, or tilted. */
  get is3d() {
    return this.perspective !== null || this.rotateX !== 0 || this.rotateY !== 0;
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
   * The camera that frames a box inside the host (800x600 by default), centred, with `padding` (60) clearance
   * and a `maxZoom` (2.5) ceiling. Moves nothing. @returns {{x: number, y: number, scale: number}}
   * @throws {TypeError} when `bounds` describes no box at all
   */
  fitTarget(bounds, hostRect = {}, options = {}) {
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

  /** The flat view (pan and zoom), column-major, fresh per read. @returns {Float64Array} */
  get matrix() {
    const s = this.scale;
    return Float64Array.of(s, 0, 0, 0, 0, s, 0, 0, 0, 0, 1, 0, this.x, this.y, 0, 1);
  }

  /** Canvas to host pixels (z toward the viewer): the tilt about the host's centre over the flat view. */
  view(hostRect = {}) {
    if (this.rotateX === 0 && this.rotateY === 0) return this.matrix;
    const cx = (hostRect.width || 800) / 2;
    const cy = (hostRect.height || 600) / 2;
    return multiply(multiply(translation(cx, cy), multiply(rotation(this.rotateX, this.rotateY), translation(-cx, -cy))), this.matrix);
  }

  /** `view` through the perspective about the host's centre: host pixels in homogeneous form. */
  projected(hostRect = {}) {
    const view = this.view(hostRect);
    const p = this.perspective;
    if (p === null) return view;
    const cx = (hostRect.width || 800) / 2;
    const cy = (hostRect.height || 600) / 2;
    // The lens about the centre, T(c) · P · T(-c), multiplied out.
    return multiply(Float64Array.of(1, 0, 0, 0, 0, 1, 0, 0, -cx / p, -cy / p, 1, -1 / p, 0, 0, 0, 1), view);
  }

  /** A canvas point (on z) to host pixels, or null when it is behind the viewer. @returns {{x, y}|null} */
  project(x, y, hostRect = {}, z = 0) {
    const m = this.projected(hostRect);
    const w = m[3] * x + m[7] * y + m[11] * z + m[15];
    if (w <= NEAR_W) return null;
    return { x: (m[0] * x + m[4] * y + m[8] * z + m[12]) / w, y: (m[1] * x + m[5] * y + m[9] * z + m[13]) / w };
  }

  /** A host-pixel point back to the canvas plane (z = 0) through the tilt and perspective; null when the ray misses
   * it (edge-on, or the plane is behind the viewer there: above the horizon). */
  unproject(sx, sy, hostRect = {}) {
    const m = this.projected(hostRect);
    const a = m[0] - sx * m[3];
    const b = m[4] - sx * m[7];
    const c = m[1] - sy * m[3];
    const d = m[5] - sy * m[7];
    const det = a * d - b * c;
    if (Math.abs(det) < 1e-12) return null;
    const e = sx * m[15] - m[12];
    const f = sy * m[15] - m[13];
    const x = (e * d - b * f) / det;
    const y = (a * f - e * c) / det;
    return m[3] * x + m[7] * y + m[15] > NEAR_W ? { x, y } : null;
  }
}
