/*!
 * CloudCanvas v0.7.1 - CloudCanvas core: blits, thin handles over DOM elements on an infinite canvas
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 * MIT License. https://github.com/CloudsEcosys/cloudcanvas#readme
 */

// core/state.js
var BLIT_ATTR = "data-blit";
var ROOT_ATTR = "data-blit-root";
var SCOPE_ATTR = "data-scope";
var SLOT_ATTR = "data-slot";
var SLOT_HTML_ATTR = "data-slot-html";
var PLACEMENT_KEYS = /* @__PURE__ */ Object.freeze(["x", "y", "z", "w", "h"]);
var MAX_DEPTH = 4096;
var STATES = /* @__PURE__ */ new WeakMap();
var ANCHORS = /* @__PURE__ */ new WeakMap();
function childBlitsOf(node, out = []) {
  for (const child of node.childNodes) {
    const parked = child.nodeType === 8 ? ANCHORS.get(child) : null;
    if (parked) out.push(parked.el);
    else if (child.nodeType === 1) {
      if (child.hasAttribute(BLIT_ATTR)) out.push(child);
      else childBlitsOf(child, out);
    }
  }
  return out;
}
function stateOf(element) {
  return STATES.get(element);
}
function createState(element) {
  const state = {
    el: element,
    handle: null,
    x: 0,
    y: 0,
    z: 0,
    w: null,
    h: null,
    mw: 0,
    mh: 0,
    sx: 0,
    sy: 0,
    changed: /* @__PURE__ */ new Set(),
    painted: false,
    port: null,
    root: null,
    anchor: null,
    with: null,
    cleanups: null,
    traits: null,
    id: null
  };
  STATES.set(element, state);
  element.setAttribute(BLIT_ATTR, "");
  return state;
}
function rootOf(state) {
  const host = state.el.closest(`[${ROOT_ATTR}]`);
  return host && STATES.get(host)?.root || null;
}
function parentNodeOf(element) {
  return STATES.get(element)?.anchor?.parentNode || element.parentNode;
}
function parentElementOf(element) {
  const parent = parentNodeOf(element);
  return parent && typeof parent.closest === "function" ? parent.closest(`[${BLIT_ATTR}]`) : null;
}
function isWithin(ancestor, element) {
  let node = parentElementOf(element);
  for (let depth = 0; node && node !== ancestor && depth < MAX_DEPTH; depth += 1) node = parentElementOf(node);
  return Boolean(node) && node === ancestor;
}
function sizeOf(state) {
  return { w: state.mw > 0 ? state.mw : state.w ?? 0, h: state.mh > 0 ? state.mh : state.h ?? 0 };
}
function boundsOf(state) {
  let x = state.fx ?? state.x;
  let y = state.fy ?? state.y;
  let node = parentElementOf(state.el);
  for (let depth = 0; node && depth < MAX_DEPTH; depth += 1) {
    const above = STATES.get(node);
    if (!above || above.root) break;
    x += (above.fx ?? above.x) + above.sx;
    y += (above.fy ?? above.y) + above.sy;
    node = parentElementOf(node);
  }
  return { x, y, ...sizeOf(state) };
}
function scopeContainerOf(element) {
  const scope = element.querySelector(`[${SCOPE_ATTR}]`);
  if (scope && scope.closest(`[${BLIT_ATTR}]`) === element) return scope;
  return element;
}

// log.js
var LOG_LEVELS = /* @__PURE__ */ Object.freeze({ debug: 10, info: 20, warn: 30, error: 40 });
function consoleLogSink({ level, message, args }) {
  if (typeof console === "undefined") return;
  const method = typeof console[level] === "function" ? console[level] : console.log;
  if (typeof method === "function") method.call(console, `[CloudCanvas] ${message}`, ...args);
}
var sink = consoleLogSink;
var threshold = LOG_LEVELS.error;
function emit(level, scope, message, args) {
  if (sink === null || LOG_LEVELS[level] < threshold) return;
  try {
    sink({ level, scope, message, args });
  } catch {
  }
}
function createLogger(scope) {
  const name = typeof scope === "string" && scope !== "" ? scope : "cloudcanvas";
  return Object.freeze(Object.fromEntries(Object.keys(LOG_LEVELS).map((level) => [level, (message, ...args) => emit(level, name, String(message), args)])));
}

// core/spec.js
var logger = /* @__PURE__ */ createLogger("blit");
var SPEC_KINDS = /* @__PURE__ */ Object.freeze({
  numeric: /* @__PURE__ */ new Set(PLACEMENT_KEYS),
  boolean: /* @__PURE__ */ new Set(),
  label: "blit"
});
var SPEC_PREFIX = "data-";
var SPEC_SKIP = /* @__PURE__ */ new Set([BLIT_ATTR, ROOT_ATTR]);
function camelCase(name) {
  return name.replace(/-([a-z])/g, (_, character) => character.toUpperCase());
}
function kebabCase(name) {
  return name.replace(/[A-Z]/g, (character) => `-${character.toLowerCase()}`);
}
function coerce(key, value, attributeName, kinds) {
  if (kinds.numeric.has(key)) {
    const number = value.trim() === "" ? NaN : Number(value);
    if (Number.isFinite(number)) return number;
    throw new TypeError(`${kinds.label}: ${attributeName}="${value}" is not a number`);
  }
  return kinds.boolean.has(key) && (value === "true" || value === "false") ? value === "true" : value;
}
function readAttributes(element, prefix, skip, kinds) {
  const spec = {};
  for (const attribute of element.attributes) {
    if (!attribute.name.startsWith(prefix) || skip.has(attribute.name)) continue;
    const key = camelCase(attribute.name.slice(prefix.length));
    spec[key] = coerce(key, attribute.value, attribute.name, kinds);
  }
  return spec;
}
function readSpec(element) {
  return readAttributes(element, SPEC_PREFIX, SPEC_SKIP, SPEC_KINDS);
}
var UNSAFE_KEYS = /* @__PURE__ */ new Set(["__proto__", "constructor", "prototype"]);
function decodeAttribute(value, name = "data-*") {
  if (value === "" || value === "true") return true;
  if (value === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  if (!/^[[{]/.test(value)) return value;
  try {
    return JSON.parse(value, (key, each) => {
      if (!UNSAFE_KEYS.has(key)) return each;
      logger.warn(`blit: ${name} drops the key "${key}"`);
      return void 0;
    });
  } catch (error) {
    logger.warn(`blit: ${name} is not valid JSON and is ignored (${error.name})`);
    return void 0;
  }
}
function writeAttribute(element, key, value) {
  const name = `${SPEC_PREFIX}${kebabCase(key)}`;
  if (value === null || value === void 0) element.removeAttribute(name);
  else element.setAttribute(name, typeof value === "object" ? JSON.stringify(value) : String(value));
}

// core/port.js
var APPLIED = /* @__PURE__ */ new WeakMap();
function formatTransform3D(x, y, z = 0, scale = 1) {
  const translate = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(2)}px)`;
  return scale === 1 ? translate : `${translate} scale(${scale.toFixed(4)})`;
}
function defaultPort(b) {
  const element = b.el;
  if (!element.style) return false;
  const { x, y, z } = b;
  if (!APPLIED.has(element)) APPLIED.set(element, new Float64Array(5).fill(NaN));
  const applied = APPLIED.get(element);
  let written = false;
  if (applied[0] !== x || applied[1] !== y || applied[2] !== z) {
    element.style.transform = formatTransform3D(x, y, z);
    applied.set([x, y, z]);
    written = true;
  }
  return writeSize(element, stateOf(element), applied) || written;
}
function writeSize(element, state, applied) {
  const { w, h } = state;
  let written = false;
  if (w !== null && applied[3] !== w) {
    element.style.width = `${w}px`;
    applied[3] = w;
    written = true;
  }
  if (h !== null && applied[4] !== h) {
    element.style.height = `${h}px`;
    applied[4] = h;
    written = true;
  }
  return written;
}

// core/frame.js
var logger2 = /* @__PURE__ */ createLogger("frame");
var FRAME_MS = 16.67;
var MAX_FRAME_DELTA_MS = 50;
var PHASES = /* @__PURE__ */ Object.freeze(["read", "write"]);
var DEFAULT_HOST_RECT = /* @__PURE__ */ Object.freeze({ width: 800, height: 600, left: 0, top: 0 });
function createRoot(options = {}) {
  const root = {
    host: options.host || null,
    plane: options.plane || null,
    overlay: options.overlay || null,
    camera: options.camera,
    hostRect: DEFAULT_HOST_RECT,
    running: options.running !== false,
    rafId: null,
    _lastTs: null,
    loop: null,
    frameCount: 0,
    applied: null,
    /** States queued for the next write (`dirty`) and read (`measure`) phases. */
    dirty: /* @__PURE__ */ new Set(),
    measure: /* @__PURE__ */ new Set(),
    hooks: { structure: /* @__PURE__ */ new Set(), read: /* @__PURE__ */ new Set(), write: /* @__PURE__ */ new Set(), busy: /* @__PURE__ */ new Set() },
    /** The promoted view root (null: the host), the blit elements above it, and the id index (`./root.js`). */
    view: null,
    chain: null,
    ids: /* @__PURE__ */ new Map()
  };
  root.loop = (timestamp) => loopStep(root, timestamp);
  return root;
}
function frameDelta(clock, timestamp) {
  const previous = clock._lastTs;
  clock._lastTs = Number.isFinite(timestamp) ? timestamp : null;
  if (previous === null || clock._lastTs === null) return 1;
  return Math.min(Math.max(timestamp - previous, 0), MAX_FRAME_DELTA_MS) / FRAME_MS;
}
function needsFrame(root) {
  if (root.dirty.size > 0 || root.measure.size > 0 || root.camera.isAnimating === true) return true;
  for (const busy of root.hooks.busy) if (busy()) return true;
  return false;
}
function schedule(root) {
  if (!root.running || root.rafId !== null || typeof requestAnimationFrame === "undefined") return false;
  root.rafId = requestAnimationFrame(root.loop);
  return true;
}
function loopStep(root, timestamp) {
  if (!root.running) return;
  root.rafId = null;
  runFrame(root, frameDelta(root, timestamp));
  if (needsFrame(root)) schedule(root);
  if (root.rafId === null) root._lastTs = null;
}
function runFrame(root, dt = 1) {
  root.camera.update?.(dt * FRAME_MS);
  const cameraMoved = syncCamera(root);
  if (cameraMoved && root.host) root.hostRect = root.host.getBoundingClientRect();
  const ctx = { dt, camera: root.camera, hostRect: root.hostRect, cameraMoved };
  for (const pass of root.hooks.structure) pass(ctx);
  for (const pass of root.hooks.read) pass(ctx);
  for (const pass of root.hooks.write) pass(ctx);
  root.frameCount += 1;
}
function syncCamera(root) {
  const { x, y, scale, perspective, rotateX, rotateY } = root.camera;
  const a = root.applied;
  if (a && a.x === x && a.y === y && a.scale === scale && a.perspective === perspective && a.rotateX === rotateX && a.rotateY === rotateY) return false;
  root.applied = { x, y, scale, perspective, rotateX, rotateY };
  return true;
}
function drain(queue, fn) {
  if (queue.size === 0) return;
  const states = Array.from(queue);
  queue.clear();
  for (const state of states) if (state.el.isConnected) fn(state);
}
function measureBlits(root) {
  drain(root.measure, measure);
}
function paintBlits(root) {
  drain(root.dirty, (state) => paint(root, state));
}
function measure(state) {
  const element = state.el;
  const width = element.offsetWidth;
  const height = element.offsetHeight;
  if (width > 0 && height > 0) {
    state.mw = width;
    state.mh = height;
  }
  const scope = scopeContainerOf(element);
  if (scope !== element) {
    state.sx = Number(scope.offsetLeft) || 0;
    state.sy = Number(scope.offsetTop) || 0;
  }
}
function paint(root, state) {
  const port = state.port || defaultPort;
  const resized = state.changed.has("w") || state.changed.has("h");
  try {
    port(state.handle, { changed: state.changed, first: !state.painted, camera: root ? root.camera : null });
  } catch (error) {
    logger2.error("a port threw; the blit falls back to the default port", error);
    state.port = null;
    defaultPort(state.handle);
  }
  state.painted = true;
  state.changed.clear();
  if (root && resized) root.measure.add(state);
}

// core/camera.js
function firstFinite(...values) {
  for (const value of values) if (value !== null && Number.isFinite(Number(value))) return Number(value);
  return null;
}
function span(far, near) {
  return far === null ? NaN : Number(far) - near;
}
function readBox(bounds) {
  if (!bounds || typeof bounds !== "object") throw new TypeError("zoomToFit: bounds must be a box object");
  const x = firstFinite(bounds.minX, bounds.x, bounds.left);
  const y = firstFinite(bounds.minY, bounds.y, bounds.top);
  const w = firstFinite(bounds.width, span(bounds.maxX, x), span(bounds.right, x));
  const h = firstFinite(bounds.height, span(bounds.maxY, y), span(bounds.bottom, y));
  if ([x, y, w, h].includes(null)) {
    throw new TypeError("zoomToFit: bounds needs {minX,minY,maxX,maxY}, {x,y,width,height} or a DOMRect");
  }
  return { x, y, w, h };
}
var NEAR_W = 1e-6;
function multiply(a, b) {
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
var translation = (x, y, z = 0) => Float64Array.of(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1);
function rotation(rx, ry) {
  const [a, b] = [rx * Math.PI / 180, ry * Math.PI / 180];
  const x = Float64Array.of(1, 0, 0, 0, 0, Math.cos(a), Math.sin(a), 0, 0, -Math.sin(a), Math.cos(a), 0, 0, 0, 0, 1);
  const y = Float64Array.of(Math.cos(b), 0, -Math.sin(b), 0, 0, 1, 0, 0, Math.sin(b), 0, Math.cos(b), 0, 0, 0, 0, 1);
  return multiply(x, y);
}
var Camera = class {
  constructor(options = {}) {
    this.x = Number(options.x) || 0;
    this.y = Number(options.y) || 0;
    this.scale = Number(options.scale) || 1;
    this.minScale = Number(options.minScale) || 0.1;
    this.maxScale = Number(options.maxScale) || 8;
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
  /** Zoom by a factor about a host-pixel focal point, which stays put; a 3D camera given `hostRect` keeps the canvas
   * point there under it (one above the horizon zooms nothing). */
  zoomAt(factor, focalX = 0, focalY = 0, hostRect = null) {
    const oldScale = this.scale;
    const scale = this.clamp(oldScale * factor);
    if (scale === oldScale) return;
    if (hostRect && this.is3d) {
      const grabbed = this.unproject(focalX, focalY, hostRect);
      if (!grabbed) return;
      this.scale = scale;
      const under = this.unproject(focalX, focalY, hostRect) ?? grabbed;
      this.x += scale * (under.x - grabbed.x);
      this.y += scale * (under.y - grabbed.y);
      return;
    }
    this.x = focalX - (focalX - this.x) / oldScale * scale;
    this.y = focalY - (focalY - this.y) / oldScale * scale;
    this.scale = scale;
  }
  /**
   * The camera that frames a box inside the host (800x600 by default), centred, with `padding` (60) clearance
   * and a `maxZoom` (2.5) ceiling. Moves nothing. @returns {{x: number, y: number, scale: number}}
   * @throws {TypeError} when `bounds` describes no box at all
   */
  fitTarget(bounds, hostRect = {}, options = {}) {
    const { x, y, w, h } = readBox(bounds);
    const padding = options.padding !== void 0 ? Number(options.padding) : 60;
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
};

// core/css.js
var CORE_STYLE_ID = "blit-css";
var PLANE_ATTR = "data-blit-plane";
var OVERLAY_ATTR = "data-blit-overlay";
function coreSheet(plane, overlay) {
  return `
[data-blit-root] { position: relative; overflow: hidden; }
[${plane}] { position: absolute; inset: 0; transform-origin: 0 0; }
[${overlay}] { position: absolute; inset: 0; pointer-events: none; }
[data-blit-root] [data-blit] { position: absolute; left: 0; top: 0; transform-origin: 0 0; }
[data-blit] [data-scope] { position: relative; }
[data-blit-root] [data-blit][hidden] { display: none; }
`;
}
var CORE_CSS = /* @__PURE__ */ coreSheet(PLANE_ATTR, OVERLAY_ATTR);
function injectStyle(id, css) {
  if (typeof document === "undefined") return null;
  let element = document.getElementById(id);
  if (!element) {
    element = document.createElement("style");
    element.id = id;
    element.textContent = css;
    document.head.appendChild(element);
  }
  return element;
}

// core/type.js
var TYPE_ATTR = "data-type";
var TYPES = /* @__PURE__ */ new Map();
var TRAITS = /* @__PURE__ */ new Map();
function defineType(name, definition = null) {
  if (typeof name !== "string" || !name) throw new TypeError("type: name must be a non-empty string");
  const existing = findType(name);
  if (!definition) return existing;
  const traits = definition.with;
  if (traits !== void 0 && !(Array.isArray(traits) && traits.every((fn) => typeof fn === "function"))) {
    throw new TypeError("type: with must be an array of functions");
  }
  const template = templateOf(definition);
  if (existing && existing !== template && existing.innerHTML !== template.innerHTML) {
    throw new TypeError(`type: "${name}" is already defined with different markup`);
  }
  if (traits) TRAITS.set(name, traits);
  if (existing) return existing;
  template.setAttribute(TYPE_ATTR, name);
  TYPES.set(name, template);
  return template;
}
function templateOf({ html, template }) {
  if (template !== void 0) {
    if (!template || !isTemplate(template)) throw new TypeError("type: template must be a <template>");
    return template;
  }
  const parsed = document.createElement("template");
  parsed.innerHTML = typeof html === "string" ? html : "";
  return parsed;
}
function findType(name) {
  const registered = TYPES.get(name);
  if (registered) return registered;
  if (typeof document === "undefined") return null;
  const declared = Array.from(document.querySelectorAll(`template[${TYPE_ATTR}]`)).find((template) => template.getAttribute(TYPE_ATTR) === name);
  if (declared) TYPES.set(name, declared);
  return declared || null;
}
function typeTraits(name) {
  return name && TRAITS.get(name) || [];
}
function isTemplate(element) {
  return element.tagName === "TEMPLATE" && Boolean(element.content);
}
function instantiate(template) {
  const element = document.createElement("div");
  if (template) element.appendChild(template.content.cloneNode(true));
  return element;
}

// core/use.js
var logger3 = /* @__PURE__ */ createLogger("blit");
var NAME = /^[a-z][a-zA-Z0-9]*$/;
var TAKEN = /* @__PURE__ */ new Set(["blit", "blitRoot", "id", "port", "with", "fill", "type", "slot", ...PLACEMENT_KEYS]);
var NAMED = /* @__PURE__ */ new Map();
function use(entries) {
  if (entries === void 0) return Object.freeze(Array.from(NAMED.keys()));
  if (!entries || typeof entries !== "object") throw new TypeError("blit.use: expected {name: fn}");
  for (const [name, fn] of Object.entries(entries)) {
    if (!NAME.test(name) || TAKEN.has(name)) throw new TypeError(`blit.use: "${name}" cannot be a name`);
    if (typeof fn !== "function") throw new TypeError(`blit.use: "${name}" is not a function`);
    if (NAMED.get(name) === fn) continue;
    if (NAMED.has(name)) throw new TypeError(`blit.use: "${name}" is already in use by another function`);
    NAMED.set(name, fn);
    upgrade(name);
  }
}
function writeTraitKey(state, key, value) {
  if (key === "port") state.port = portOf(value);
  else if (key === "with") setWith(state, value);
  else if (!NAMED.has(key)) return false;
  else {
    stopTraits(state, key);
    writeAttribute(state.el, key, value === true ? "" : value === false ? null : value);
  }
  return true;
}
function portOf(value) {
  if (value === null || value === void 0 || typeof value === "function") return value ?? null;
  if (!NAMED.has(value)) throw new TypeError(`blit.set: no port named "${String(value)}"`);
  return NAMED.get(value);
}
function setWith(state, value) {
  const next = value ?? [];
  const valid = Array.isArray(next) && next.every((fn) => typeof fn === "function");
  if (!valid) throw new TypeError("blit.set: with must be an array of functions");
  for (const fn of (state.with ?? []).filter((each) => !next.includes(each))) stopTraits(state, fn);
  state.with = next;
}
function specTraits(state, spec) {
  for (const key of Object.keys(spec)) {
    if (NAMED.has(key)) spec[key] = decodeAttribute(spec[key], `data-${kebabCase(key)}`);
    if (spec[key] === void 0) delete spec[key];
  }
  const port = state.heldPort ?? state.port;
  for (const fn of [...state.with ?? [], ...port ? [port] : []]) {
    const kind = fn === port ? "port" : "trait";
    const name = Array.from(NAMED.keys()).find((each) => NAMED.get(each) === fn);
    if (!name) logger3.warn(`blit.spec: an anonymous ${kind} is not serialised; name it with blit.use()`);
    else if (kind === "port") spec.port = name;
    else spec[name] ??= true;
  }
}
function runTraits(state) {
  const root = rootOf(state);
  if (!root || !state.handle) return;
  state.traits = toggleTraits;
  state.retryTraits = false;
  const anonymous = [...typeTraits(state.el.getAttribute(TYPE_ATTR)), ...state.with ?? []];
  for (const fn of anonymous) start(state, root, fn, fn, true);
  for (const { name, value } of Array.from(state.el.attributes)) {
    const key = name.startsWith("data-") ? camelCase(name.slice(5)) : "";
    const opts = NAMED.has(key) ? decodeAttribute(value, name) : void 0;
    if (opts !== void 0 && opts !== false) start(state, root, key, NAMED.get(key), opts);
  }
}
function start(state, root, key, fn, opts) {
  if (state.cleanups?.has(key)) return;
  (state.cleanups ??= /* @__PURE__ */ new Map()).set(key, null);
  try {
    const cleanup = fn(state.handle, opts, root);
    if (typeof cleanup === "function") state.cleanups.set(key, cleanup);
  } catch (error) {
    state.cleanups.delete(key);
    if (typeof key === "string") writeAttribute(state.el, key, null);
    else state.retryTraits = true;
    throw error;
  }
}
function stopTraits(state, key) {
  for (const each of key === void 0 ? Array.from(state.cleanups?.keys() ?? []) : [key]) {
    const cleanup = state.cleanups?.get(each);
    if (!state.cleanups?.delete(each) || !cleanup) continue;
    try {
      cleanup();
    } catch (error) {
      logger3.error(`blit: the cleanup of ${typeof each === "string" ? `"${each}"` : "a trait"} threw`, error);
    }
  }
}
function toggleTraits(state, run) {
  for (const element of [state.el, ...state.el.querySelectorAll(`[${BLIT_ATTR}]`)]) {
    const each = stateOf(element);
    if (each && run) runTraits(each);
    else if (each) stopTraits(each);
  }
}
function upgrade(name) {
  if (typeof document === "undefined") return;
  const attribute = `data-${kebabCase(name)}`;
  for (const element of document.querySelectorAll(`[${ROOT_ATTR}][${attribute}], [${ROOT_ATTR}] [${attribute}]`)) {
    const state = stateOf(element);
    if (state) runTraits(state);
  }
}

// core/root.js
function adoptOrCreate(host, attribute) {
  const existing = host.querySelector(`:scope > [${attribute}]`);
  if (existing) return existing;
  const element = document.createElement("div");
  element.setAttribute(attribute, "");
  host.appendChild(element);
  return element;
}
function mountRoot(state) {
  const host = state.el;
  injectStyle(CORE_STYLE_ID, CORE_CSS);
  host.setAttribute(ROOT_ATTR, "");
  const plane = adoptOrCreate(host, PLANE_ATTR);
  const root = createRoot({ host, plane, overlay: adoptOrCreate(host, OVERLAY_ATTR), camera: new Camera() });
  root.hostRect = hostRectOf(host);
  root.demoted = /* @__PURE__ */ new Set();
  root.hooks.read.add(() => measureBlits(root));
  root.hooks.write.add(() => paintBlits(root));
  root.hooks.write.add((ctx) => planePass(root, ctx));
  if (typeof ResizeObserver === "function") new ResizeObserver(() => {
    root.applied = null;
    schedule(root);
  }).observe(host);
  state.root = root;
  return root;
}
var REFOCUS_MS = 150;
function planePass(root, ctx) {
  if (!ctx.cameraMoved) {
    if (root.refocusDue) {
      root.refocusDue = false;
      root.plane.style.willChange = "";
    }
    return;
  }
  const camera = root.camera;
  const { x, y, scale } = camera;
  const flat = !camera.is3d;
  if (!flat || root.wrote3d) {
    root.host.style.perspective = camera.perspective ? `${camera.perspective}px` : "";
    root.plane.style.transformStyle = flat ? "" : "preserve-3d";
    root.wrote3d = !flat;
  }
  if (root.plane.style.willChange !== "transform") root.plane.style.willChange = "transform";
  root.plane.style.transform = flat ? formatTransform3D(x, y, 0, scale) : `matrix3d(${Array.from(camera.view(ctx.hostRect), (n) => +n.toFixed(6)).join(",")})`;
  armRefocus(root);
}
function armRefocus(root) {
  if (typeof setTimeout !== "function") return;
  clearTimeout(root.refocusTimer);
  root.refocusTimer = setTimeout(() => {
    root.refocusTimer = null;
    root.refocusDue = true;
    schedule(root);
  }, REFOCUS_MS);
}
function hostRectOf(host) {
  const rect = host.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 ? rect : DEFAULT_HOST_RECT;
}
function attachBlit(state) {
  const root = rootOf(state);
  if (parentElementOf(state.el) === root.host && state.el.parentElement !== root.plane) root.plane.appendChild(state.el);
  root.dirty.add(state);
  root.measure.add(state);
  indexBlit(root, state.el);
  if (root.view) demoteOne(root, state.el);
  schedule(root);
  runTraits(state);
}
function heldRootOf(element) {
  let node = element;
  for (let depth = 0; node && !stateOf(node)?.root && depth < MAX_DEPTH; depth += 1) node = parentElementOf(node);
  return node ? stateOf(node)?.root ?? null : null;
}
function releaseBlits(root, element) {
  for (const each of [element, ...element.querySelectorAll(`[${BLIT_ATTR}]`)]) {
    const state = stateOf(each);
    root.demoted?.delete(each);
    unindexBlit(root, each);
    root.dirty.delete(state);
    root.measure.delete(state);
    if (state) stopTraits(state);
  }
  if (!element.ownerDocument.createTreeWalker(element, NodeFilter.SHOW_COMMENT).nextNode()) return;
  const parked = Array.from(root.ids.values()).filter((indexed) => !indexed.isConnected && isWithin(element, indexed));
  for (const indexed of parked) unindexBlit(root, indexed);
}
function indexBlit(root, element, id = element.id) {
  unindexBlit(root, element);
  const state = stateOf(element);
  if (!id || !state) return;
  root.ids.set(String(id), element);
  state.id = String(id);
}
function unindexBlit(root, element) {
  const id = stateOf(element)?.id;
  if (id && root.ids.get(id) === element) root.ids.delete(id);
}
function findBlit(root, id) {
  const key = String(id);
  return root.ids.get(key) ?? root.host?.querySelector(`[${BLIT_ATTR}][id="${key.replace(/["\\]/g, "\\$&")}"]`) ?? null;
}
function setViewRoot(root, element) {
  const next = element && element !== root.host ? element : null;
  if (next === root.view) return false;
  root.view = next;
  root.chain = next ? /* @__PURE__ */ new Set() : null;
  for (let node = next, depth = 0; node && depth < MAX_DEPTH; depth += 1, node = parentElementOf(node)) root.chain.add(node);
  return true;
}
function allows(root, element) {
  return !root.view || root.chain.has(element) || isWithin(root.view, element);
}
function demoteOthers(root) {
  for (const element of root.demoted) element.hidden = false;
  root.demoted.clear();
  if (!root.view) return;
  for (const element of root.host.querySelectorAll(`[${BLIT_ATTR}]`)) demoteOne(root, element);
}
function demoteOne(root, element) {
  if (element.hidden || allows(root, element) || !allows(root, parentElementOf(element))) return;
  element.hidden = true;
  root.demoted.add(element);
}

// core/blit.js
var PLACEMENT = /* @__PURE__ */ new Set(PLACEMENT_KEYS);
var logger4 = /* @__PURE__ */ createLogger("blit");
var Blit = class _Blit {
  #s;
  /** @param {import('./state.js').BlitState} state */
  constructor(state) {
    this.#s = state;
    state.handle = this;
  }
  /** The element this handle addresses. */
  get el() {
    return this.#s.el;
  }
  get x() {
    return this.#s.x;
  }
  get y() {
    return this.#s.y;
  }
  get z() {
    return this.#s.z;
  }
  /** The size the last read phase measured, or the declared one until then. */
  get size() {
    return sizeOf(this.#s);
  }
  /** The global box: local placement summed over every ancestor blit. */
  get bounds() {
    return boundsOf(this.#s);
  }
  /** The nearest blit above this one, or null. */
  get parent() {
    const element = parentElementOf(this.#s.el);
    return element ? blit(element) : null;
  }
  /** The blits directly inside this one, in document order, parked ones included. */
  get blits() {
    return childBlitsOf(this.#s.el).map(blit);
  }
  /** `data-*` keys, placement, slot text, named traits and port: `parent.blit(b.spec)` reproduces it. */
  get spec() {
    const s = this.#s;
    const spec = readSpec(s.el);
    for (const key of PLACEMENT_KEYS) delete spec[key];
    specTraits(s, spec);
    if (s.el.id) spec.id = s.el.id;
    spec.x = s.x;
    spec.y = s.y;
    if (s.z !== 0) spec.z = s.z;
    if (s.w !== null) spec.w = s.w;
    if (s.h !== null) spec.h = s.h;
    const fill = ownSlots(s.el).map((slot) => [slot.getAttribute(SLOT_ATTR), slotValue(slot)]);
    if (fill.length > 0) spec.fill = Object.fromEntries(fill);
    return spec;
  }
  /** Write keys: placement is queued to the port when attached, at once when potential; the rest lands now. */
  set(patch) {
    if (!patch || typeof patch !== "object") throw new TypeError("blit.set: expected an object");
    const s = this.#s;
    if (s.root && PLACEMENT_KEYS.some((key) => key in patch)) {
      throw new TypeError("blit.set: a root has no placement; move its camera with view()");
    }
    let measure2 = false;
    let traits = false;
    for (const [key, value] of Object.entries(patch)) {
      if (PLACEMENT.has(key)) writePlacement(s, key, value);
      else if (key === "id") writeId(s, value);
      else if (key === "fill") {
        writeFill(s.el, value);
        measure2 = true;
      } else if (writeTraitKey(s, key, value)) traits = true;
      else {
        writeAttribute(s.el, key, value);
        measure2 = true;
        traits ||= key === "type";
      }
      s.changed.add(key);
    }
    if (traits || s.retryTraits) runTraits(s);
    if (s.root || isTemplate(s.el)) {
      s.changed.clear();
      return this;
    }
    const root = rootOf(s);
    if (!root) {
      paint(null, s);
      return this;
    }
    root.dirty.add(s);
    if (measure2) root.measure.add(s);
    schedule(root);
    return this;
  }
  /** A child blit: its type's content and defaults, `spec` over them; into `[data-scope]`, or a root's plane. */
  blit(spec = {}) {
    const s = this.#s;
    const template = spec.type === void 0 ? null : findType(spec.type);
    if (spec.type !== void 0 && !template) throw new TypeError(`blit: unknown type "${spec.type}"`);
    const element = instantiate(template);
    const child = new _Blit(createState(element));
    const defaults = template ? blit(template).spec : {};
    const patch = { ...defaults, ...spec };
    if (defaults.fill && spec.fill) patch.fill = { ...defaults.fill, ...spec.fill };
    child.set(patch);
    (s.root ? s.root.plane : scopeContainerOf(s.el)).appendChild(element);
    attachBlit(child.#s);
    return child;
  }
  /** Listen for a native event on the element. @returns {() => void} off */
  on(type2, listener, options) {
    this.#s.el.addEventListener(type2, listener, options);
    return () => this.#s.el.removeEventListener(type2, listener, options);
  }
  /** Dispatch a bubbling, cancelable `CustomEvent`, `detail = {payload, source}`; returned for `defaultPrevented`. */
  emit(type2, payload = null) {
    const event = new CustomEvent(type2, { bubbles: true, cancelable: true, detail: { payload, source: this } });
    this.#s.el.dispatchEvent(event);
    return event;
  }
  /** Announce `remove` (it bubbles), then take the element and every blit inside it out of the document, the
   * frame and the id index. */
  remove() {
    const s = this.#s;
    this.emit("remove");
    const root = heldRootOf(s.el);
    if (root) releaseBlits(root, s.el);
    if (root?.view && (root.view === s.el || s.el.contains(root.view)) && setViewRoot(root, null)) demoteOthers(root);
    s.anchor?.remove();
    s.anchor = null;
    s.el.remove();
  }
  /** On a root collection, the blit it renders as its world: the host until another is promoted; else null. */
  get root() {
    return this.#s.root ? blit(this.#s.root.view || this.#s.el) : null;
  }
  /** Promote a blit of this root (null: the host again); every blit off its branch is hidden until it changes. */
  set root(target) {
    const root = this.#s.root;
    if (!root) throw new TypeError("blit.root: only a root collection has a root to set");
    const element = blit(target ?? root.host).el;
    if (element !== root.host && !isWithin(root.host, element)) throw new TypeError("blit.root: not a blit of this root");
    if (setViewRoot(root, element)) {
      demoteOthers(root);
      schedule(root);
    }
  }
  /** The blit this blit's root indexes under `id`, a parked one included, or null. */
  find(id) {
    const element = findBlit(requireRoot(this.#s, "find"), id);
    return element ? blit(element) : null;
  }
  /**
   * Frame a blit in this blit's root - by default its current root; the host is the identity camera.
   * The camera snaps to fit the global bounds (the motion add-on makes it fly).
   * @param {Blit|Element|string} [target] a blit on the current root's branch
   * @param {object} [options] `padding`, `maxZoom`; with motion also `immediate`, `duration`, `easing`
   * @returns {{x: number, y: number, scale: number}} the resolved camera
   */
  view(target, options) {
    const root = requireRoot(this.#s, "view");
    const handle = blit(target === void 0 ? root.view || root.host : target);
    if (!allows(root, handle.el)) throw new TypeError("blit.view: the target is hidden by the current root");
    const atHost = handle.el === root.host;
    const { x, y, w, h } = atHost ? { x: 0, y: 0, w: root.hostRect.width, h: root.hostRect.height } : handle.bounds;
    const resolved = root.camera.fit(
      { x, y, width: w, height: h },
      root.hostRect,
      atHost ? { ...options, padding: 0, maxZoom: 1 } : options
    );
    schedule(root);
    return resolved;
  }
  /** The extension hook: `fn(ctx)` every frame in the `read` or `write` phase of this blit's root. @returns off */
  tick(fn, phase = "write") {
    const root = requireRoot(this.#s, "tick");
    if (typeof fn !== "function") throw new TypeError("blit.tick: expected a function");
    if (!PHASES.includes(phase)) throw new TypeError(`blit.tick: unknown phase "${phase}"`);
    root.hooks[phase].add(fn);
    schedule(root);
    return () => {
      root.hooks[phase].delete(fn);
    };
  }
};
function blit(target) {
  const element = typeof target === "string" ? document.querySelector(target) : target instanceof Blit ? target.el : target;
  if (!element || element.nodeType !== 1) throw new TypeError(`blit: no element for ${String(target)}`);
  const existing = stateOf(element);
  if (existing) return existing.handle;
  const state = createState(element);
  const handle = new Blit(state);
  const potential = isTemplate(element) || !element.isConnected;
  const hostElement = element.parentElement?.closest(`[${ROOT_ATTR}]`);
  if (potential || hostElement && stateOf(hostElement)) {
    adoptType(state);
    adoptPlacement(state);
    if (!potential) attachBlit(state);
    return handle;
  }
  const root = mountRoot(state);
  runTraits(state);
  for (const found of root.host.querySelectorAll(`[${BLIT_ATTR}]`)) {
    try {
      blit(found);
    } catch (error) {
      logger4.error(`blit: #${found.id || "?"} could not be adopted`, error);
    }
  }
  return handle;
}
function type(name, definition) {
  const template = defineType(name, definition);
  if (!template) return null;
  const handle = blit(template);
  if (definition?.defaults) handle.set(definition.defaults);
  return handle;
}
blit.use = use;
function writePlacement(state, key, value) {
  const unset = (key === "w" || key === "h") && (value === null || value === void 0);
  if (!unset && !Number.isFinite(Number(value))) throw new TypeError(`blit.set: ${key}=${String(value)} is not a number`);
  state[key] = unset ? null : Number(value);
}
function writeId(state, value) {
  if (value === null || value === void 0 || value === "") state.el.removeAttribute("id");
  else state.el.id = String(value);
  const root = heldRootOf(state.el);
  if (root && root.host !== state.el) indexBlit(root, state.el);
}
function writeFill(element, fill) {
  if (!fill || typeof fill !== "object") throw new TypeError("blit.set: fill must be an object");
  const slots = ownSlots(element);
  for (const [name, text] of Object.entries(fill)) {
    const slot = slots.find((candidate) => candidate.getAttribute(SLOT_ATTR) === name);
    if (!slot) throw new TypeError(`blit.set: no slot "${name}"`);
    if (slot.hasAttribute(SLOT_HTML_ATTR)) slot.innerHTML = String(text ?? "");
    else slot.textContent = String(text ?? "");
  }
}
function slotValue(slot) {
  return slot.hasAttribute(SLOT_HTML_ATTR) ? slot.innerHTML : slot.textContent;
}
function ownSlots(element) {
  const scope = isTemplate(element) ? element.content : element;
  return Array.from(scope.querySelectorAll(`[${SLOT_ATTR}]`)).filter((slot) => {
    const outer = slot.parentElement?.closest(`[${SLOT_ATTR}]`);
    const nested = Boolean(outer) && outer !== element && scope.contains(outer);
    return !nested && (scope !== element || slot.closest(`[${BLIT_ATTR}]`) === element);
  });
}
function requireRoot(state, method) {
  const root = rootOf(state);
  if (!root) throw new TypeError(`blit.${method}: a potential blit has no root`);
  return root;
}
function adoptType(state) {
  const template = isTemplate(state.el) ? null : findType(state.el.getAttribute(TYPE_ATTR) ?? "");
  if (!template) return;
  if (state.el.children.length === 0) state.el.appendChild(template.content.cloneNode(true));
  const declared = readSpec(state.el);
  for (const [key, value] of Object.entries(blit(template).spec)) {
    if (!(key in declared) && !PLACEMENT.has(key) && key !== "fill") writeAttribute(state.el, key, value === true ? "" : value);
  }
}
function adoptPlacement(state) {
  const declared = readSpec(state.el);
  for (const key of PLACEMENT_KEYS) {
    if (declared[key] === void 0) continue;
    state[key] = declared[key];
    writeAttribute(state.el, key, null);
    state.changed.add(key);
  }
}
export {
  blit,
  type
};
