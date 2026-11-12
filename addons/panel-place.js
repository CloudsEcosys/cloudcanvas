/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The panel add-on's settings and geometry (`./panel.js`): its options normalised or refused, and the pure
 * arithmetic of where a panel sits, which slot it shares, and the room pinned panels take from each edge.
 *
 * Nothing here touches the DOM. A layer size is `{w, h}` in layer px, a box `{x, y, w, h}`, insets
 * `{top, right, bottom, left}`. The public `placeOf`, `slotOf` and `insetsOf` normalise what they are given;
 * the `*Normalised` forms are the layer's own, over options it has already normalised.
 */

/** Every place a panel can be, and the four edges among them. */
export const PANEL_PLACES = /* @__PURE__ */ Object.freeze(['float', 'left', 'right', 'top', 'bottom', 'modal', 'full', 'window']);
export const PANEL_EDGES = /* @__PURE__ */ Object.freeze(['left', 'right', 'top', 'bottom']);

/** The bar's buttons, in their default order. */
export const PANEL_CONTROLS = /* @__PURE__ */ Object.freeze(['collapse', 'pin', 'place', 'full', 'close']);

/** The thickness of a collapsed edge panel (its tab) and of every bar, so a folded float is its bar. */
export const PANEL_TAB_PX = 28;

/** What an edge strip leaves of the layer, and what a modal keeps clear of it, in px. */
const EDGE_MARGIN_PX = 80;
const MODAL_MARGIN_PX = 48;

const DEFAULT_PLACES = /* @__PURE__ */ Object.freeze(['float', 'left', 'right', 'top', 'bottom', 'modal', 'full']);
const DEFAULT_SIZE = 360;
const DEFAULT_BOX = /* @__PURE__ */ Object.freeze({ w: 480, h: 360 });
const DEFAULT_MIN = /* @__PURE__ */ Object.freeze({ w: 200, h: 120 });
const NO_INSETS = /* @__PURE__ */ Object.freeze({ top: 0, right: 0, bottom: 0, left: 0 });

/* ------------------ NORMALISATION ------------------ */

/** One of `allowed`, or `fallback` when absent; anything else names the allowed values. */
function oneOf(value, allowed, key, fallback) {
  if (value === undefined || value === null) return fallback;
  if (allowed.includes(value)) return value;
  throw new TypeError(`panel: ${key} must be one of ${allowed.join(', ')} (got ${JSON.stringify(value)})`);
}

/** A list drawn from `allowed`, duplicates dropped, order kept. */
function listOf(value, allowed, key, fallback) {
  if (value === undefined || value === null) return [...fallback];
  if (!Array.isArray(value)) throw new TypeError(`panel: ${key} must be a list of ${allowed.join(', ')}`);
  const chosen = [];
  for (const each of value) {
    if (!allowed.includes(each)) throw new TypeError(`panel: ${key} must be a list of ${allowed.join(', ')} (got ${JSON.stringify(each)})`);
    if (!chosen.includes(each)) chosen.push(each);
  }
  return chosen;
}

function flag(value, key, fallback) {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'boolean') return value;
  throw new TypeError(`panel: ${key} must be true or false (got ${JSON.stringify(value)})`);
}

function finite(value, key, fallback) {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  throw new TypeError(`panel: ${key} must be a finite number (got ${JSON.stringify(value)})`);
}

function text(value, key) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  throw new TypeError(`panel: ${key} must be a string`);
}

/** `size` per axis, `{x, y}`: `x` on the left and right, `y` on the top and bottom; a number is both. */
function axes(value) {
  if (typeof value === 'number' || value === undefined || value === null) {
    const both = finite(value, 'size', DEFAULT_SIZE);
    return { x: both, y: both };
  }
  if (typeof value !== 'object' || Array.isArray(value)) throw new TypeError('panel: size must be a number or {x, y}');
  return { x: finite(value.x, 'size.x', DEFAULT_SIZE), y: finite(value.y, 'size.y', DEFAULT_SIZE) };
}

/** The axis an edge's thickness runs along: `x` on the left and right, `y` on the top and bottom; null elsewhere. */
export function axisOf(at) {
  if (at === 'left' || at === 'right') return 'x';
  return at === 'top' || at === 'bottom' ? 'y' : null;
}

/** An object of finite numbers over `defaults`; `x` and `y` may be absent (null: centred). */
function measures(value, key, defaults) {
  if (value === undefined || value === null) return { ...defaults };
  if (typeof value !== 'object' || Array.isArray(value)) throw new TypeError(`panel: ${key} must be an object`);
  const out = { ...defaults };
  for (const name of Object.keys(defaults)) out[name] = finite(value[name], `${key}.${name}`, defaults[name]);
  return out;
}

/**
 * The options whole: every key of the options table with its default, unknown keys kept. `box.x`/`box.y` null is
 * centred and `active` null is derived by the layer. @throws {TypeError} on an unknown place or control, a number
 * that is not finite, or a value of the wrong type
 */
export function normalisePanel(options) {
  const given = options === true || options === undefined || options === null ? {} : options;
  if (typeof given !== 'object' || Array.isArray(given)) throw new TypeError('panel: options must be an object');
  return {
    ...given,
    at: oneOf(given.at, PANEL_PLACES, 'at', 'float'),
    pinned: flag(given.pinned, 'pinned', true),
    collapsed: flag(given.collapsed, 'collapsed', false),
    open: flag(given.open, 'open', true),
    size: axes(given.size),
    box: measures(given.box, 'box', { x: null, y: null, ...DEFAULT_BOX }),
    title: text(given.title, 'title'),
    places: listOf(given.places, PANEL_PLACES, 'places', DEFAULT_PLACES),
    controls: listOf(given.controls, PANEL_CONTROLS, 'controls', PANEL_CONTROLS),
    snap: finite(given.snap, 'snap', 24),
    min: measures(given.min, 'min', DEFAULT_MIN),
    group: text(given.group, 'group'),
    active: flag(given.active, 'active', null)
  };
}

/**
 * `patch` over `stored`, one level deep for the measure objects, so `{box: {w: 600}}` keeps the rest and
 * `{size: {x: 400}}` keeps the other axis (of a number too).
 */
export function mergePanel(stored, patch) {
  const merged = { ...stored, ...patch };
  for (const key of ['box', 'min', 'size']) {
    const was = key === 'size' && typeof stored?.size === 'number' ? { x: stored.size, y: stored.size } : stored?.[key];
    const next = patch?.[key];
    if (was && next && typeof was === 'object' && typeof next === 'object') merged[key] = { ...was, ...next };
  }
  return merged;
}

/** Whether `at` is one of the four edges. */
export function isEdge(at) {
  return PANEL_EDGES.includes(at);
}

/* ------------------ GEOMETRY ------------------ */

const clamp = (value, low, high) => Math.min(Math.max(value, low), Math.max(low, high));

/** The least an edge strip may be: the tab when collapsed, else `min` on its axis. */
function floorOf(o) {
  if (o.collapsed) return PANEL_TAB_PX;
  return axisOf(o.at) === 'x' ? o.min.w : o.min.h;
}

/** An edge strip's own thickness: the tab when collapsed, else `size` on its axis held at `min` and the layer less 80. */
function thicknessOf(o, layerSize) {
  if (o.collapsed) return PANEL_TAB_PX;
  const across = axisOf(o.at) === 'x';
  const extent = layerSize ? (across ? layerSize.w : layerSize.h) - EDGE_MARGIN_PX : Infinity;
  return Math.max(floorOf(o), Math.min(o.size[axisOf(o.at)], extent));
}

/** A strip's thickness: a pinned one takes what the insets give its edge (the 80 rule), never more than its own. */
function stripOf(o, s, i) {
  const own = thicknessOf(o, s);
  return o.pinned && i[o.at] > 0 ? Math.min(i[o.at], own) : own;
}

/** The floating box: at least `min` and no larger than the layer, centred where it has no position, its bar inside. */
function floatBox(o, s) {
  const w = Math.min(Math.max(o.box.w, o.min.w), s.w);
  const h = o.collapsed ? PANEL_TAB_PX : Math.min(Math.max(o.box.h, o.min.h), s.h);
  const x = o.box.x ?? Math.round((s.w - w) / 2);
  const y = o.box.y ?? Math.round((s.h - h) / 2);
  return { x: clamp(x, 0, s.w - w), y: clamp(y, 0, s.h - PANEL_TAB_PX), w, h };
}

/** A strip down the left or right: pinned, the full height; a drawer, between the pinned top and bottom strips. */
function sideStrip(o, s, i, x) {
  const t = stripOf(o, s, i);
  const [top, bottom] = o.pinned ? [0, 0] : [i.top, i.bottom];
  return { x: x(t), y: top, w: t, h: Math.max(0, s.h - top - bottom) };
}

/** A strip across the top or bottom, pinned or a drawer, between the pinned left and right strips. */
function crossStrip(o, s, i, y) {
  const t = stripOf(o, s, i);
  return { x: i.left, y: y(t), w: Math.max(0, s.w - i.left - i.right), h: t };
}

function modalBox(o, s) {
  const w = Math.max(0, Math.min(o.box.w, s.w - MODAL_MARGIN_PX));
  const h = Math.max(0, Math.min(o.box.h, s.h - MODAL_MARGIN_PX));
  return { x: Math.round((s.w - w) / 2), y: Math.round((s.h - h) / 2), w, h };
}

/**
 * One placer per place, `(options, layerSize, insets) => box | null`. The insets are the pinned strips': a drawer
 * lies over the content only, never over another panel's bar.
 */
const PLACERS = /* @__PURE__ */ Object.freeze({
  float: floatBox,
  left: (o, s, i) => sideStrip(o, s, i, () => 0),
  right: (o, s, i) => sideStrip(o, s, i, (t) => s.w - t),
  top: (o, s, i) => crossStrip(o, s, i, () => 0),
  bottom: (o, s, i) => crossStrip(o, s, i, (t) => s.h - t),
  modal: modalBox,
  full: (o, s) => ({ x: 0, y: 0, w: s.w, h: s.h }),
  window: () => null
});

/** `placeOf` over options already normalised. */
export function placeNormalised(o, layerSize, insets = NO_INSETS) {
  return PLACERS[o.at](o, layerSize, insets ?? NO_INSETS);
}

/** A layer size must be `{w, h}` in finite px; anything else is refused by name. */
function requireLayerSize(layerSize, name) {
  const valid = layerSize && typeof layerSize === 'object' && Number.isFinite(layerSize.w) && Number.isFinite(layerSize.h);
  if (!valid) throw new TypeError(`${name}: layerSize must be {w, h} in finite px (got ${String(JSON.stringify(layerSize))})`);
}

/** Where a panel sits, `{x, y, w, h}` in layer px; null in a window of its own. Pure. */
export function placeOf(options, layerSize, insets) {
  requireLayerSize(layerSize, 'placeOf');
  return placeNormalised(normalisePanel(options), layerSize, insets);
}

/** `slotOf` over options already normalised. */
export function slotNormalised(o, id) {
  if (o.at !== 'float' && o.at !== 'window') return o.at;
  return `${o.at}:${o.group || String(id ?? '')}`;
}

/** The place a panel occupies: an edge, `modal` or `full`; `float:` / `window:` its group or id. Pure. */
export function slotOf(options, id) {
  return slotNormalised(normalisePanel(options), id);
}

/**
 * `insetsOf` over options already normalised: per edge, the shown panel there (the first that says `active`,
 * else the first) takes its thickness when it is open and pinned.
 */
export function insetsNormalised(panels, layerSize) {
  const shown = new Map();
  for (const o of panels) {
    if (!o.open || !isEdge(o.at)) continue;
    const held = shown.get(o.at);
    if (!held || (o.active === true && held.active !== true)) shown.set(o.at, o);
  }
  const insets = { ...NO_INSETS };
  const floors = { ...NO_INSETS };
  for (const [edge, o] of shown) {
    if (!o.pinned) continue;
    insets[edge] = thicknessOf(o, layerSize);
    floors[edge] = floorOf(o);
  }
  if (layerSize) {
    share(insets, floors, ['left', 'right'], layerSize.w);
    share(insets, floors, ['top', 'bottom'], layerSize.h);
  }
  return insets;
}

/**
 * Opposite pinned strips leave the content at least 80: past that each gives way in proportion, never below its
 * floor, and where even the floors do not fit, the floors win.
 */
function share(insets, floors, [a, b], extent) {
  const room = extent - EDGE_MARGIN_PX;
  const total = insets[a] + insets[b];
  if (insets[a] === 0 || insets[b] === 0 || total <= room) return;
  const first = Math.max(floors[a], Math.floor((insets[a] * room) / total));
  const second = Math.max(floors[b], room - first);
  insets[a] = second > room - first ? Math.max(floors[a], room - second) : first;
  insets[b] = second;
}

/**
 * The room open, pinned edge panels take, `{top, right, bottom, left}`; clamped as placement clamps it when
 * `layerSize` is given. Pure.
 */
export function insetsOf(panels, layerSize) {
  if (layerSize !== undefined && layerSize !== null) requireLayerSize(layerSize, 'insetsOf');
  return insetsNormalised(Array.from(panels ?? [], normalisePanel), layerSize);
}
