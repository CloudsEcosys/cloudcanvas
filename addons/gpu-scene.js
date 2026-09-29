/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The GPU scene: what a `gpu` root draws, packed for a backend. One record per drawn blit (its global box,
 * depth, rotation, tint, texture and uv rect) becomes STRIDE floats in one instance array, in draw order (by
 * `z`, then first seen), cut into batches of one texture each. A move rewrites that one record and reports the
 * range it touched; only an insert, a removal or a new `z` or texture re-sorts. This module is the contract
 * both backends (`./gpu-webgl2.js`, `./gpu-webgpu.js`) draw from; `./gpu.js` fills it from blits.
 */
import { multiply } from '../core/camera.js';

/** Floats per instance. */
export const STRIDE = 16;

/** Where each field sits in an instance; 6 and 7 are reserved (zero). */
export const FIELD = /* @__PURE__ */ Object.freeze({
  x: 0, y: 1, w: 2, h: 3, z: 4, rotation: 5, r: 8, g: 9, b: 10, a: 11, u0: 12, v0: 13, u1: 14, v1: 15
});

/**
 * One frame for a backend.
 * @typedef {object} GpuFrame
 * @property {Float32Array} clip column-major 4x4: a canvas point (x, y, z, 1) in CSS px to clip space, depth in
 *   the backend's `depthRange`
 * @property {Float32Array} instances STRIDE floats per instance, draw order; `count` are live, the rest capacity
 * @property {number} count
 * @property {[number, number]|null} dirty the instance range [first, end) changed since the last frame, or null.
 *   A backend whose buffer is smaller than `instances` reallocates and uploads all of it.
 * @property {Array<{texture: number|null, first: number, count: number}>} batches consecutive runs, drawn in
 *   order, alpha-blended over the ones before; `texture` null samples white
 * @property {[number, number, number, number]} clear premultiplied RGBA the frame starts from
 */

/**
 * What `createBackend(canvas, options)` resolves to (it rejects when the API, an adapter or a context is missing).
 * Every frame covers the whole canvas (`canvas.width` x `canvas.height`, set by the caller) and clears first.
 * The shader: the unit quad's corner `c` maps to `(x, y) + (w, h) * c`, turned by `rotation` (radians,
 * clockwise on screen) about the box centre, at depth `z`, through `clip`; uv is `mix((u0, v0), (u1, v1), c)`
 * (v = 0 is the top row); colour is `texture(uv) * (r, g, b, a)`, straight alpha, written premultiplied and
 * blended ONE, ONE_MINUS_SRC_ALPHA; no depth test, no face culling.
 * @typedef {object} GpuBackend
 * @property {'webgl2'|'webgpu'} kind
 * @property {'minus-one-to-one'|'zero-to-one'} depthRange for `clipMatrix`
 * @property {(id: number, source: object) => void} texture upload texture `id` from an image, canvas, video,
 *   ImageBitmap or OffscreenCanvas (size: `videoWidth || naturalWidth || width`); again re-uploads it, in place
 *   when the size is unchanged. Straight alpha, no flip, linear filtering, clamp to edge.
 * @property {(id: number) => void} dropTexture
 * @property {(frame: GpuFrame) => void} draw
 * @property {() => Promise<{width: number, height: number, data: Uint8Array}>} read the last frame's pixels,
 *   RGBA8 premultiplied, rows top to bottom; called in the same task as `draw`
 * @property {() => void} destroy
 */

/** Canvas to clip space: `camera.projected`, then the host box to [-1, 1] (y up), depth scaled into `depthRange`
 * (WebGPU's `zero-to-one`, else WebGL's `-1..1`) far enough out that a tilted board is never clipped. */
export function clipMatrix(camera, hostRect = {}, depthRange = 'minus-one-to-one') {
  const w = hostRect.width || 800;
  const h = hostRect.height || 600;
  const depth = 1 / (4 * (camera.perspective ?? 2000));
  const ndc = Float64Array.of(2 / w, 0, 0, 0, 0, -2 / h, 0, 0, 0, 0, depth, 0, -1, 1, 0, 1);
  if (depthRange === 'zero-to-one') {
    ndc[10] = depth / 2;
    ndc[14] = 0.5;
  }
  return Float32Array.from(multiply(ndc, camera.projected(hostRect)));
}

const WHITE = /* @__PURE__ */ Object.freeze([1, 1, 1, 1]);
const WHOLE = /* @__PURE__ */ Object.freeze([0, 0, 1, 1]);

/**
 * Records keyed by any object (a blit's state), packed on demand. `set(key, record)` takes
 * `{x, y, w, h, z?, rotation?, color?: [r, g, b, a] (0..1), texture?: source|null, uv?: [u0, v0, u1, v1],
 * version?}`; a new `version` on the same texture source re-uploads it (a video frame, a redrawn canvas).
 */
export class Scene {
  #records = new Map();
  #textures = new Map();
  #order = [];
  #data = new Float32Array(STRIDE * 64);
  #batches = [];
  #changed = new Set();
  #uploads = new Map();
  #drops = [];
  #resort = false;
  #seq = 0;
  #nextTexture = 1;

  get size() { return this.#records.size; }

  has(key) { return this.#records.has(key); }

  keys() { return this.#records.keys(); }

  /** Whether `pack()` has anything new to hand over. */
  get dirty() {
    return this.#resort || this.#changed.size > 0 || this.#uploads.size > 0 || this.#drops.length > 0;
  }

  set(key, record) {
    const entry = this.#records.get(key);
    const texture = record.texture ?? null;
    if (!entry) {
      this.#records.set(key, { record, seq: this.#seq++, slot: -1, texture: this.#retain(texture, record.version) });
      this.#resort = true;
      return;
    }
    const was = entry.record;
    if ((was.z ?? 0) !== (record.z ?? 0) || (was.texture ?? null) !== texture) this.#resort = true;
    if ((was.texture ?? null) !== texture) {
      this.#release(was.texture ?? null);
      entry.texture = this.#retain(texture, record.version);
    } else if (texture && record.version !== was.version) {
      this.#uploads.set(entry.texture, texture);
    }
    entry.record = record;
    this.#changed.add(entry);
  }

  delete(key) {
    const entry = this.#records.get(key);
    if (!entry) return false;
    this.#records.delete(key);
    this.#release(entry.record.texture ?? null);
    this.#changed.delete(entry);
    this.#resort = true;
    return true;
  }

  /**
   * Hand over what changed: the instance array and its dirty range, the batches, and the texture uploads and
   * drops a backend must apply first. @returns {{instances: Float32Array, count: number,
   * dirty: [number, number]|null, batches: Array, uploads: Array<[number, object]>, drops: number[]}}
   */
  pack() {
    let dirty = null;
    if (this.#resort) {
      this.#sort();
      dirty = [0, this.#order.length];
    } else if (this.#changed.size > 0) {
      let first = Infinity;
      let end = 0;
      for (const entry of this.#changed) {
        this.#write(entry);
        first = Math.min(first, entry.slot);
        end = Math.max(end, entry.slot + 1);
      }
      dirty = [first, end];
    }
    this.#changed.clear();
    const uploads = Array.from(this.#uploads);
    const drops = this.#drops.splice(0);
    this.#uploads.clear();
    return { instances: this.#data, count: this.#order.length, dirty, batches: this.#batches, uploads, drops };
  }

  /** Re-sort by z then first seen, rewrite every slot and re-cut the batches. */
  #sort() {
    this.#order = Array.from(this.#records.values()).sort((a, b) => ((a.record.z ?? 0) - (b.record.z ?? 0)) || a.seq - b.seq);
    if (this.#data.length < this.#order.length * STRIDE) {
      this.#data = new Float32Array(Math.max(this.#order.length, this.#data.length / STRIDE * 2) * STRIDE);
    }
    const batches = [];
    this.#order.forEach((entry, slot) => {
      entry.slot = slot;
      this.#write(entry);
      const last = batches[batches.length - 1];
      if (last && last.texture === entry.texture) last.count += 1;
      else batches.push({ texture: entry.texture, first: slot, count: 1 });
    });
    this.#batches = batches;
    this.#resort = false;
  }

  #write(entry) {
    const { record } = entry;
    const at = entry.slot * STRIDE;
    const color = record.color ?? WHITE;
    const uv = record.uv ?? WHOLE;
    this.#data.set([record.x, record.y, record.w, record.h, record.z ?? 0, record.rotation ?? 0, 0, 0], at);
    this.#data.set(color, at + FIELD.r);
    this.#data.set(uv, at + FIELD.u0);
  }

  /** The texture id for a source, counted; a new source is queued to upload. */
  #retain(source, version) {
    if (!source) return null;
    let texture = this.#textures.get(source);
    if (!texture) {
      texture = { id: this.#nextTexture++, refs: 0, version };
      this.#textures.set(source, texture);
      this.#uploads.set(texture.id, source);
    }
    texture.refs += 1;
    return texture.id;
  }

  #release(source) {
    const texture = source && this.#textures.get(source);
    if (!texture) return;
    texture.refs -= 1;
    if (texture.refs > 0) return;
    this.#textures.delete(source);
    this.#uploads.delete(texture.id);
    this.#drops.push(texture.id);
  }
}
