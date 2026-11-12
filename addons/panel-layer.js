/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The panels layer (`./panel.js`): one per host, a `[data-cc-panels]` child mounted as a root of its own with no
 * pan, so the camera of any board underneath never moves what is on it; the passes that place its panels and
 * write the host's inset variables; and the handle `panels(host)` returns.
 *
 * The layer costs nothing idle. Its passes join its root's frame, and that root runs a frame only when a panel
 * changed, a gesture moved one, or the host was resized (the root's own ResizeObserver, the one per layer): the
 * structure pass places every panel from the root's fresh host box, the read pass measures where a tab strip must
 * scroll to show a newly selected tab, and the write pass writes the insets (`--cc-panels-top`, `-right`,
 * `-bottom`, `-left` on the host, only those that changed, then `panels:inset`), the snap preview and those
 * scrolls, and shows a new panel once it has been placed.
 */
import { blit } from '../core/blit.js';
import { schedule } from '../core/frame.js';
import { ROOT_ATTR, stateOf } from '../core/state.js';
import { MENU_CSS } from '../graphics/css/menu.js';
import { PANEL_CSS } from '../graphics/css/panel.js';
import { RESIZING_CLASS } from './resize.js';
import { injectAddonCss, listen } from './trait.js';
import { closeWindows } from './panel-door.js';
import { mergePanel, normalisePanel, placeNormalised } from './panel-place.js';
import { MODAL_LAYER_CLASS, syncCover } from './panel-modal.js';
import { currentInsets, destroyRecord, optionsOf, ordered, recordOf, slotFor, syncShown, write } from './panel-record.js';
import { revealTab } from './panel-frame.js';
import { writePreview } from './panel-snap.js';

/** The marker of a layer element. */
export const LAYER_ATTR = 'data-cc-panels';

/** The inset variables, in the order they are written. */
const INSET_EDGES = /* @__PURE__ */ Object.freeze(['top', 'right', 'bottom', 'left']);

/** @type {WeakMap<Element, object>} host -> its layer, and layer element -> its layer */
const LAYERS = /* @__PURE__ */ new WeakMap();
const BY_ELEMENT = /* @__PURE__ */ new WeakMap();

/** The layer whose root `root` is, or null; a panel's trait finds its layer this way. */
export function layerOfRoot(root) {
  const layer = root ? BY_ELEMENT.get(root.host) : null;
  if (!layer) return null;
  layer.root ??= root;
  return layer;
}

/** The layer already made on `host`, or null. */
export function layerOfHost(host) {
  return (host && LAYERS.get(host)) || null;
}

/** A host must be a positioned element that is not a CloudCanvas root and not inside one. */
export function requireHost(host) {
  if (!host || host.nodeType !== 1) throw new TypeError('panels: expected a host element');
  if (host.closest(`[${ROOT_ATTR}]`)) {
    throw new TypeError("panels: the host is a CloudCanvas root or inside one; wrap the board's host in an element and pass the wrapper");
  }
  const position = getComputedStyle(host).position;
  if (!position || position === 'static') {
    throw new TypeError('panels: the host must be a positioned element (position: relative, absolute, fixed or sticky)');
  }
}

/** The layer on `host`: the one made before, else a new one over an adopted or fresh `[data-cc-panels]` child. */
export function createLayer(host) {
  const known = layerOfHost(host);
  if (known) return known.api;
  requireHost(host);
  injectAddonCss('panel', PANEL_CSS);
  injectAddonCss('menu', MENU_CSS);
  const el = host.querySelector(`:scope > [${LAYER_ATTR}]`) ?? host.appendChild(layerElement(host.ownerDocument));
  const layer = {
    host, el, app: null, root: null, size: null, dirty: true, written: {}, pendingInsets: null,
    byUid: new Map(), fresh: new Set(), shown: new Map(), members: new Map(), queue: [], settling: false,
    announcing: false, adopting: false, closing: false, preview: { el: null, box: null, due: false }, origins: new Map(),
    windows: new Map(), reveal: new Set(), revealing: [], refocus: null,
    offPresses: listen(el, ['pointerdown', 'mousedown'], (event) => heldByModal(el, event))
  };
  LAYERS.set(host, layer);
  BY_ELEMENT.set(el, layer);
  // Mounting adopts the `[data-blit][data-panel]` markup already there; each finds this layer by its element.
  layer.adopting = true;
  try {
    layer.app = blit(el);
  } finally {
    layer.adopting = false;
  }
  layer.root = stateOf(el).root;
  layer.passes = { structure: (ctx) => placePass(layer, ctx), read: () => readPass(layer), write: () => writePass(layer) };
  for (const phase of ['structure', 'read', 'write']) layer.root.hooks[phase].add(layer.passes[phase]);
  schedule(layer.root);
  layer.api = apiOf(layer);
  return layer.api;
}

/** While a modal is shown, a press outside it lands on the layer and does nothing - not even move the focus. */
function heldByModal(el, event) {
  if (el.classList.contains(MODAL_LAYER_CLASS) && !event.target.closest?.('.cc-at-modal')) event.preventDefault();
}

function layerElement(doc) {
  const el = doc.createElement('div');
  el.setAttribute(LAYER_ATTR, '');
  return el;
}

/* ------------------ PASSES ------------------ */

/** Structure: every panel placed from the host box the root just read; state only, painted this frame. */
function placePass(layer, ctx) {
  const size = { w: ctx.hostRect.width, h: ctx.hostRect.height };
  const resized = !layer.size || layer.size.w !== size.w || layer.size.h !== size.h;
  if (!layer.dirty && !resized) return;
  layer.size = size;
  layer.dirty = false;
  const insets = currentInsets(layer);
  for (const rec of ordered(layer)) placeRecord(layer, rec, size, insets);
  layer.pendingInsets = insets;
}

/** A panel in a gesture is the gesture's; every member of a slot takes the place of the member it shows. */
function placeRecord(layer, rec, size, insets) {
  if (rec.gesture || rec.el.classList.contains(RESIZING_CLASS)) return;
  const holder = layer.shown.get(slotFor(rec)) ?? rec;
  const box = placeNormalised(holder.options, size, insets);
  if (!box) return;
  const last = rec.box;
  if (last && last.x === box.x && last.y === box.y && last.w === box.w && last.h === box.h) return;
  rec.box = box;
  rec.b.set(box);
}

/** Read: where each strip whose selected tab changed must scroll to show it (`revealTab`); a new panel, once shown. */
function readPass(layer) {
  if (layer.reveal.size === 0) return;
  const later = Array.from(layer.reveal).filter((rec) => rec.fresh && !rec.destroyed);
  layer.revealing = Array.from(layer.reveal).filter((rec) => !later.includes(rec))
    .map((rec) => [rec, rec.destroyed || rec.el.hidden ? null : revealTab(rec)]);
  layer.reveal = new Set(later);
  if (later.length > 0) schedule(layer.root);
}

/** Write: the insets that changed, the preview, the strips scrolled, the panels placed for the first time shown. */
function writePass(layer) {
  writeInsets(layer);
  writePreview(layer);
  for (const [rec, left] of layer.revealing) if (left !== null) rec.parts.strip.scrollLeft = left;
  layer.revealing = [];
  for (const rec of layer.fresh) {
    if (!rec.box && rec.active && rec.options.at !== 'window') continue;
    layer.fresh.delete(rec);
    rec.fresh = false;
    syncShown(rec);
  }
  syncCover(layer, ordered(layer));
}

function writeInsets(layer) {
  const next = layer.pendingInsets;
  layer.pendingInsets = null;
  const changed = next ? INSET_EDGES.filter((edge) => layer.written[edge] !== next[edge]) : [];
  if (changed.length === 0) return;
  for (const edge of changed) layer.host.style.setProperty(`--cc-panels-${edge}`, `${next[edge]}px`);
  layer.written = next;
  layer.host.dispatchEvent(new CustomEvent('panels:inset', {
    bubbles: true, cancelable: true, detail: { payload: { ...next }, source: layer.app }
  }));
}

/* ------------------ THE HANDLE ------------------ */

function apiOf(layer) {
  return Object.freeze({
    el: layer.el,
    root: layer.app,
    add: (content, options) => addPanel(layer, content, options),
    list: () => ordered(layer).map((rec) => rec.b),
    snapshot: () => Object.fromEntries(ordered(layer).filter((rec) => rec.el.id).map((rec) => [rec.el.id, optionsOf(rec)])),
    apply: (patches) => applyPatches(layer, patches),
    get insets() { return currentInsets(layer); },
    off: () => offLayer(layer)
  });
}

function requireOn(layer, method) {
  if (layer.closing) throw new TypeError(`layer.${method}: this layer is off`);
}

/** A new frame on the layer, `content` (an element, or nothing) moved into its body, where it came from kept. */
function addPanel(layer, content, options) {
  requireOn(layer, 'add');
  if (content !== undefined && content !== null && content.nodeType !== 1) {
    throw new TypeError('layer.add: content must be an element, or nothing for an empty panel');
  }
  const { id, ...given } = options ?? {};
  normalisePanel(given);
  const frame = layer.el.ownerDocument.createElement('section');
  if (content) {
    const anchor = content.parentNode ? layer.el.ownerDocument.createComment('panel content') : null;
    if (anchor) content.parentNode.insertBefore(anchor, content);
    layer.origins.set(content, anchor);
    frame.appendChild(content);
  }
  layer.root.plane.appendChild(frame);
  const b = blit(frame);
  b.set(id === undefined || id === null || id === '' ? { panel: given } : { id, panel: given });
  return b;
}

/** Patches by id, every one checked before any is written; ids the layer does not hold are ignored. */
function applyPatches(layer, patches) {
  requireOn(layer, 'apply');
  if (!patches || typeof patches !== 'object') throw new TypeError('layer.apply: expected {id: patch}');
  const planned = [];
  for (const [id, patch] of Object.entries(patches)) {
    const rec = recordOf(layer.app.find(id));
    if (!rec || rec.layer !== layer) continue;
    normalisePanel(mergePanel(rec.raw, patch));
    planned.push([rec, patch]);
  }
  for (const [rec, patch] of planned) write(rec, patch);
}

/** Every panel down, every content element back where it came from, the variables and the layer gone. */
function offLayer(layer) {
  if (layer.closing) return;
  layer.closing = true;
  closeWindows(layer);
  for (const rec of ordered(layer)) destroyRecord(rec);
  layer.offPresses();
  for (const [content, anchor] of layer.origins) {
    if (anchor?.parentNode) anchor.parentNode.replaceChild(content, anchor);
    else content.remove();
  }
  layer.origins.clear();
  for (const phase of ['structure', 'read', 'write']) layer.root.hooks[phase].delete(layer.passes[phase]);
  for (const edge of INSET_EDGES) layer.host.style.removeProperty(`--cc-panels-${edge}`);
  layer.el.remove();
  LAYERS.delete(layer.host);
  BY_ELEMENT.delete(layer.el);
}
