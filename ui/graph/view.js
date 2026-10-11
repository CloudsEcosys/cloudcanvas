/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Where the graph's world is drawn and how near: `g.view`, `{x, y, k}`, the
 * world's offset in the viewport and its scale. It is the reader's: every
 * change they make is reported once it rests (`onViewport({x, y, scale})`),
 * and a `viewport` in the model is taken only when the model changes it.
 *
 * The first view of a graph that has none is the whole of it when that is
 * still readable, else its first root (or the selection) at a readable scale:
 * Fit and `0` show the whole at any scale. Nothing here moves by itself over
 * time, so there is no motion to reduce.
 */
import { clamp } from '../dom.js';
import { NODE_HEIGHT, NODE_WIDTH, boundsOf } from './layout.js';

/** The nearest and farthest a reader may zoom, the nearest a fit goes, and the farthest a first view goes before it gives up showing the whole. */
const MIN_SCALE = 0.2;
const MAX_SCALE = 3;
const FIT_MAX = 1;
const READABLE = 0.75;

/** Screen room (px) a fit leaves around the graph, and a revealed node from the edge. */
const PAD = 24;
const MARGIN = 16;

/** How long (ms) the view rests before it is reported. */
const REPORT_MS = 300;

function scheduleReport(g) {
  g.cancelReport?.();
  g.cancelReport = g.life.later(() => {
    g.cancelReport = null;
    const view = { x: Math.round(g.view.x), y: Math.round(g.view.y), scale: Math.round(g.view.k * 1000) / 1000 };
    g.seen.viewport = `${view.x},${view.y},${view.scale}`;
    g.callbacks.onViewport?.(view);
  }, REPORT_MS);
}

/** Draw the world where the view has it and say how far it is zoomed: the sheet sizes what must stay a fixed size on the screen by it. */
function applyView(g, report) {
  const { x, y, k } = g.view;
  g.world.style.setProperty('transform', `translate(${x}px, ${y}px) scale(${k})`);
  g.world.style.setProperty('--graph-k', String(k));
  g.minimap.drawView();
  if (report) scheduleReport(g);
}

/** The box to frame and the viewport's, or null while either is empty. */
function frameOf(g) {
  const box = boundsOf(g.positions);
  const rect = g.viewport.getBoundingClientRect();
  return box && rect.width > 0 && rect.height > 0 ? { box, rect } : null;
}

function fitScale({ box, rect }) {
  return Math.min((rect.width - PAD * 2) / (box.right - box.left), (rect.height - PAD * 2) / (box.bottom - box.top));
}

function fit(g, report) {
  const frame = frameOf(g);
  if (!frame) return false;
  const { box, rect } = frame;
  const k = clamp(fitScale(frame), MIN_SCALE, FIT_MAX);
  g.view = { k, x: (rect.width - (box.right - box.left) * k) / 2 - box.left * k, y: (rect.height - (box.bottom - box.top) * k) / 2 - box.top * k };
  g.fitted = true;
  applyView(g, report);
  return true;
}

/** The first view: the whole graph if it is readable so, else the selection (or the first root) at a readable scale. */
function start(g) {
  const frame = frameOf(g);
  if (!frame) return;
  if (fitScale(frame) >= READABLE) { fit(g, false); return; }
  const anchor = g.positions.get(g.state.selectedId) ?? g.positions.get(g.forest.roots[0]);
  const k = READABLE;
  const x = g.state.selectedId === null ? PAD - frame.box.left * k : frame.rect.width / 2 - (anchor.x + NODE_WIDTH / 2) * k;
  g.view = { k, x, y: frame.rect.height / 2 - (anchor.y + NODE_HEIGHT / 2) * k };
  g.fitted = true;
}

function zoomAt(g, factor, point) {
  const rect = g.viewport.getBoundingClientRect();
  const at = Number.isFinite(point?.x) && Number.isFinite(point?.y);
  const px = at ? point.x - rect.left : rect.width / 2;
  const py = at ? point.y - rect.top : rect.height / 2;
  const k = clamp(g.view.k * factor, MIN_SCALE, MAX_SCALE);
  g.view = { k, x: px - (px - g.view.x) * (k / g.view.k), y: py - (py - g.view.y) * (k / g.view.k) };
  g.fitted = true;
  applyView(g, true);
}

/** Pan just enough that node `id` is inside the viewport: an axis it is off is centred on it. */
function reveal(g, id, { report }) {
  const point = g.positions.get(id);
  const rect = g.viewport.getBoundingClientRect();
  if (!point || !(rect.width > 0) || !(rect.height > 0)) return;
  const { k } = g.view;
  let { x, y } = g.view;
  const left = point.x * k + x;
  const top = point.y * k + y;
  if (left < MARGIN || left + NODE_WIDTH * k > rect.width - MARGIN) x = rect.width / 2 - (point.x + NODE_WIDTH / 2) * k;
  if (top < MARGIN || top + NODE_HEIGHT * k > rect.height - MARGIN) y = rect.height / 2 - (point.y + NODE_HEIGHT / 2) * k;
  if (x === g.view.x && y === g.view.y) return;
  g.view = { k, x, y };
  g.fitted = true;
  applyView(g, report);
}

/** Take the model's `viewport` when it changed: a view restored is not news to the host, so it is not reported. */
function adopt(g, viewport) {
  if (!viewport || ![viewport.x, viewport.y, viewport.scale].every(Number.isFinite)) return;
  const key = `${viewport.x},${viewport.y},${viewport.scale}`;
  if (key === g.seen.viewport) return;
  g.seen.viewport = key;
  g.view = { x: viewport.x, y: viewport.y, k: clamp(viewport.scale, MIN_SCALE, MAX_SCALE) };
  g.fitted = true;
}

/** A graph mounted before it had a size takes its first view when it gets one; the minimap follows the size. */
function observeSize(g) {
  const Observer = g.doc.defaultView?.ResizeObserver;
  if (typeof Observer !== 'function') return;
  const observer = new Observer(() => {
    if (g.life.dead || g.drag) return;
    if (!g.fitted) start(g);
    applyView(g, false);
  });
  observer.observe(g.viewport);
  g.life.add(() => observer.disconnect());
}

/**
 * Give graph `g` its view: `g.applyView`, `g.fit`, `g.zoomAt` and `g.clampScale`, and what the control asks of it.
 * @returns {{start(): void, reveal(id: string, options: {report: boolean}): void, adopt(viewport: object|undefined): void}}
 */
export function createViewModel(g) {
  g.clampScale = (k) => clamp(k, MIN_SCALE, MAX_SCALE);
  g.applyView = ({ report = false } = {}) => applyView(g, report);
  g.fit = ({ report = false } = {}) => fit(g, report);
  g.zoomAt = (factor, point) => zoomAt(g, factor, point);
  observeSize(g);
  return { start: () => start(g), reveal: (id, options) => reveal(g, id, options), adopt: (viewport) => adopt(g, viewport) };
}
