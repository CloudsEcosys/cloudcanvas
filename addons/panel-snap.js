/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The panel's bar as a handle (`./panel.js`): a press on it past the threshold moves a floating panel, lifts one
 * off an edge (or out of a modal or full place) to float under the pointer at its floating size, and within `snap`
 * px of an allowed layer edge shows the strip it would take in the layer's one preview element; releasing there
 * attaches it, `pinned` as it was. A press that never moves unfolds a collapsed edge tab.
 *
 * The gesture is the drag add-on's own (`pressDrag`, `moveDrag`, `releaseDrag`, `endDrag`), so `drag:start` and
 * `drag:end` are announced exactly as drag announces them. It lives on the record, not the trait, so a write of
 * the options in mid-gesture never interrupts it. Only the bar takes the press: the body is the content's.
 */
import { schedule } from '../core/frame.js';
import { formatTransform3D } from '../core/port.js';
import { h } from '../graphics/primitives/element.js';
import { endDrag, moveDrag, pressDrag, releaseDrag } from './drag.js';
import { isPrimaryPress, listen, passedThreshold, rootEnv } from './trait.js';
import { setVisible } from './widget.js';
import { PANEL_EDGES, PANEL_TAB_PX, isEdge, placeNormalised } from './panel-place.js';

/** The class of the layer's one snap preview, drawn in its overlay. */
export const PANEL_PREVIEW_CLASS = 'cloudcanvas-panel-preview';

/** A projection read once per event: the drag add-on and the snap both ask where the pointer is. */
function pointOnce(env) {
  let seen = null;
  let at = null;
  return {
    root: env.root,
    point(event) {
      if (event !== seen) [seen, at] = [event, env.point(event)];
      return at;
    }
  };
}

/** Arm the bar's gesture; a press on a button, a tab or a menu stands down (`pressDrag`). */
export function pressBar(rec, event) {
  // In its own window a panel does not move: the window does.
  if (rec.gesture || !isPrimaryPress(event) || rec.options.at === 'window') return;
  const env = pointOnce(rootEnv(rec.layer.root));
  const s = { dragging: false, dragOffset: { x: 0, y: 0 }, _downX: null, _downY: null, _translating: false };
  if (!pressDrag(s, rec.b, event, env)) return;
  const offMove = listen(window, ['pointermove'], (move) => moved(rec, move));
  const offUp = listen(window, ['pointerup', 'pointercancel'], (up) => released(rec, up));
  rec.gesture = { s, env, edge: null, off: () => { offMove(); offUp(); } };
}

function moved(rec, event) {
  const g = rec.gesture;
  if (!g || (!g.s._translating && !passedThreshold(g.s, event))) return;
  if (rec.options.at !== 'float' && !liftOff(rec, event)) return;
  moveDrag(g.s, rec.b, event, g.env);
  snapNear(rec, g.env.point(event));
}

/**
 * Off an edge, a modal or full: float at the floating box's size, the pointer as far across the bar as the press
 * was across the place it left, and within the bar. @returns {boolean} whether the panel floats now
 */
function liftOff(rec, event) {
  const o = rec.options;
  const g = rec.gesture;
  if (g.s._translating || !o.places.includes('float')) return false;
  const from = rec.box ?? { x: rec.b.x, y: rec.b.y, ...rec.b.size };
  const w = Math.max(o.box.w, o.min.w);
  const h = o.collapsed ? PANEL_TAB_PX : Math.max(o.box.h, o.min.h);
  const across = from.w > 0 ? Math.min(Math.max(g.s.dragOffset.x / from.w, 0), 1) : 0.5;
  g.s.dragOffset = { x: across * w, y: Math.min(Math.max(g.s.dragOffset.y, 0), PANEL_TAB_PX / 2) };
  const at = g.env.point(event);
  rec.b.set({ w, h });
  rec.actions.write({ at: 'float', box: { ...o.box, x: at.x - g.s.dragOffset.x, y: at.y - g.s.dragOffset.y } });
  return true;
}

/** The allowed edge the pointer is within `snap` px of, nearest first; null when there is none. */
export function nearestEdge(o, size, point) {
  if (!(o.snap > 0) || !size) return null;
  const distance = { left: point.x, right: size.w - point.x, top: point.y, bottom: size.h - point.y };
  let best = null;
  for (const edge of PANEL_EDGES) {
    if (!o.places.includes(edge) || distance[edge] > o.snap) continue;
    if (best === null || distance[edge] < distance[best]) best = edge;
  }
  return best;
}

/** The strip the panel would take at the edge it is near: as joining that edge's slot would make it, among the rest. */
function snapNear(rec, point) {
  const g = rec.gesture;
  const edge = nearestEdge(rec.options, rec.layer.size, point);
  if (edge === g.edge) return;
  g.edge = edge;
  const there = edge ? rec.actions.joining(edge) : null;
  showPreview(rec.layer, there ? placeNormalised(there, rec.layer.size, rec.actions.insetsAs(there)) : null);
}

function released(rec, event) {
  const g = rec.gesture;
  if (!g) return;
  g.off();
  rec.gesture = null;
  showPreview(rec.layer, null);
  rec.box = null;
  if (!releaseDrag(g.s, rec.b)) {
    if (rec.options.collapsed && isEdge(rec.options.at)) rec.actions.write({ collapsed: false });
  } else {
    endDrag(rec.b, event);
    if (g.edge) rec.actions.write({ at: g.edge });
    else if (rec.options.at === 'float') rec.actions.write({ box: { ...rec.options.box, x: rec.b.x, y: rec.b.y } });
  }
  rec.actions.invalidate();
}

/** End a gesture the panel is taken out of under: `drag:end` with `cancelled`, as drag announces one. */
export function cancelGesture(rec) {
  const g = rec.gesture;
  if (!g) return;
  g.off();
  rec.gesture = null;
  showPreview(rec.layer, null);
  if (releaseDrag(g.s, rec.b)) endDrag(rec.b);
}

/* ------------------ THE PREVIEW ------------------ */

/** Show `box` (null hides it) in the layer's preview, next frame. */
export function showPreview(layer, box) {
  const preview = layer.preview;
  if (!box && !preview.box) return;
  preview.box = box;
  preview.due = true;
  if (layer.root) schedule(layer.root);
}

/** The layer's write pass: the preview as it was last asked for, made the first time it is needed. */
export function writePreview(layer) {
  const preview = layer.preview;
  if (!preview.due) return;
  preview.due = false;
  preview.el ??= layer.root.overlay.appendChild(h('div', { class: PANEL_PREVIEW_CLASS, 'aria-hidden': 'true', hidden: true }));
  const { box, el } = preview;
  if (box) {
    el.style.transform = formatTransform3D(box.x, box.y);
    el.style.width = `${box.w}px`;
    el.style.height = `${box.h}px`;
  }
  setVisible(el, Boolean(box));
}
