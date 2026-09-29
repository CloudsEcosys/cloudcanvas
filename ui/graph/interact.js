/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * What the graph does with a click, a key, a wheel or a drag. A node being
 * moved is `state.pending` (`{id, origin, at, keyboard}`), drawn in place of
 * its laid-out position until it is dropped (`onMove`) or put back.
 */
import { PINCH_ZOOM_K, WHEEL_ZOOM_K, isDiscreteWheel, normalizeWheelDeltas, wheelZoomFactor } from '../../addons/pan.js';
import { trackDrag } from '../drag.js';
import { nearestInDirection } from './layout.js';

const NODE = '.cloudcanvas-ui-graph-node';

/** World units a keyboard step moves a node, and with Shift. */
const KEY_STEP = 16;
const KEY_STEP_LARGE = 64;

function labelOf(g, id) {
  return g.state.nodes.find((node) => node.id === id)?.label ?? id;
}

function focusNode(g, id) {
  g.state.focusId = id;
  for (const node of g.nodeLayer.children) node.setAttribute('tabindex', node.getAttribute('data-ui-id') === id ? '0' : '-1');
  const target = Array.from(g.nodeLayer.children).find((node) => node.getAttribute('data-ui-id') === id);
  target?.focus({ preventScroll: true });
  ensureVisible(g, id);
}

/** Pan just enough that node `id` is inside the viewport. */
function ensureVisible(g, id) {
  const point = g.positions?.get(id);
  const rect = g.viewport.getBoundingClientRect();
  if (!point || !(rect.width > 0)) return;
  const x = point.x * g.view.k + g.view.x;
  const y = point.y * g.view.k + g.view.y;
  const margin = 24;
  if (x < margin || x > rect.width - margin * 4) g.view.x += rect.width / 2 - x;
  if (y < margin || y > rect.height - margin * 2) g.view.y += rect.height / 2 - y;
  g.applyView();
}

function finish(g, drop) {
  const pending = g.state.pending;
  g.state.pending = null;
  const moved = pending.at.x !== pending.origin.x || pending.at.y !== pending.origin.y;
  if (drop && moved) {
    g.callbacks.onMove?.(pending.id, { x: Math.round(pending.at.x), y: Math.round(pending.at.y) });
    if (pending.keyboard) g.say(`Moved ${labelOf(g, pending.id)}.`);
  } else if (pending.keyboard) {
    g.say(drop ? 'Not moved.' : 'Move cancelled.');
  }
  g.render();
  if (pending.keyboard) focusNode(g, pending.id);
}

function grabKey(g, event) {
  const step = event.shiftKey ? KEY_STEP_LARGE : KEY_STEP;
  const deltas = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
  const pending = g.state.pending;
  if (Object.hasOwn(deltas, event.key)) {
    const [dx, dy] = deltas[event.key];
    pending.at = { x: pending.at.x + dx, y: pending.at.y + dy };
    g.render();
    focusNode(g, pending.id);
  } else if (event.key === ' ' || event.key === 'Enter') {
    if (!event.repeat) finish(g, true);
  } else if (event.key === 'Escape' || event.key === 'Tab') {
    finish(g, false);
  } else return;
  if (event.key !== 'Tab') event.preventDefault();
}

function onKeyDown(g, event) {
  if (g.state.pending?.keyboard) { grabKey(g, event); return; }
  const zoom = { '+': 1.25, '=': 1.25, '-': 0.8, _: 0.8 }[event.key];
  if (zoom) { event.preventDefault(); g.zoomAt(zoom); return; }
  if (event.key === '0') { event.preventDefault(); g.fit(); return; }
  const node = event.target.closest?.(NODE);
  if (!node) return;
  const id = node.getAttribute('data-ui-id');
  if (event.key === ' ') {
    event.preventDefault();
    if (event.repeat) return;
    const at = { ...g.positions.get(id) };
    g.state.pending = { id, origin: at, at, keyboard: true };
    g.say(`Picked up ${labelOf(g, id)}. Arrow keys move it, Shift for larger steps, Space drops it, Escape cancels.`);
    g.render();
    focusNode(g, id);
    return;
  }
  const next = nearestInDirection(g.positions, id, event.key);
  if (next === null) return;
  event.preventDefault();
  focusNode(g, next);
}

function bindPan(g) {
  let pan = null;
  g.life.on(g.viewport, 'pointerdown', (event) => {
    if (event.button !== 0 || event.target.closest?.(NODE) || g.state.pending) return;
    pan = { id: event.pointerId, x: event.clientX, y: event.clientY, view: { ...g.view } };
    g.viewport.setPointerCapture?.(event.pointerId);
    g.viewport.classList.add('is-panning');
  });
  g.life.on(g.viewport, 'pointermove', (event) => {
    if (pan?.id !== event.pointerId) return;
    g.view = { ...pan.view, x: pan.view.x + event.clientX - pan.x, y: pan.view.y + event.clientY - pan.y };
    g.applyView();
  });
  const end = (event) => {
    if (pan?.id !== event.pointerId) return;
    pan = null;
    g.viewport.classList.remove('is-panning');
  };
  g.life.on(g.viewport, 'pointerup', end);
  g.life.on(g.viewport, 'pointercancel', end);
  g.life.on(g.viewport, 'wheel', (event) => {
    event.preventDefault();
    const rect = g.viewport.getBoundingClientRect();
    const { dx, dy } = normalizeWheelDeltas(event, rect.height);
    const pinch = event.ctrlKey || event.metaKey;
    if (pinch || isDiscreteWheel(event)) { g.zoomAt(wheelZoomFactor(dy, pinch ? PINCH_ZOOM_K : WHEEL_ZOOM_K), { x: event.clientX, y: event.clientY }); return; }
    g.view = { ...g.view, x: g.view.x - dx, y: g.view.y - dy };
    g.applyView();
  }, { passive: false });
}

function bindNodeDrag(g) {
  trackDrag(g.life, g.viewport, {
    selector: NODE,
    canStart: () => !g.state.pending,
    onStart(node, point) {
      const id = node.getAttribute('data-ui-id');
      const at = { ...g.positions.get(id) };
      g.state.pending = { id, origin: at, at, keyboard: false, pointer: point };
    },
    onMove(point) {
      const pending = g.state.pending;
      if (!pending) return;
      pending.at = { x: pending.origin.x + (point.x - pending.pointer.x) / g.view.k, y: pending.origin.y + (point.y - pending.pointer.y) / g.view.k };
      g.render();
    },
    onEnd(point) {
      if (g.state.pending) finish(g, point !== null);
    }
  });
}

/** Wire the graph's clicks, keys, wheel, pan and node drags. */
export function bindGraph(g) {
  g.life.on(g.viewport, 'click', (event) => {
    const node = event.target.closest?.(NODE);
    if (node && !g.state.pending) g.callbacks.onActivate?.(node.getAttribute('data-ui-id'));
  });
  g.life.on(g.viewport, 'keydown', (event) => onKeyDown(g, event));
  g.life.on(g.viewport, 'keyup', (event) => { if (event.key === ' ' && event.target.closest?.(NODE)) event.preventDefault(); });
  g.life.on(g.viewport, 'focusin', (event) => {
    const node = event.target.closest?.(NODE);
    if (node && !g.state.pending) g.state.focusId = node.getAttribute('data-ui-id');
  });
  bindPan(g);
  bindNodeDrag(g);
}
