/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Relationship graph: labelled nodes and directed edges on a pannable,
 * zoomable surface.
 *
 *   const graph = createGraph(host, {
 *     onActivate: (id) => open(id),
 *     onMove: (id, { x, y }) => savePosition(id, x, y)
 *   });
 *   graph.update({ nodes: [{ id: 'a', label: 'Plan' }, { id: 'b', label: 'Launch' }], edges: [{ from: 'a', to: 'b' }] });
 *
 * Nodes without `x`/`y` are laid out in layers from the roots; placed nodes keep
 * their place. Dragging a node reports `onMove` (the graph shows what the next
 * update says, so an unsaved position springs back). Dragging the background
 * pans; the wheel pans, and a mouse notch or a pinch zooms; the toolbar and
 * `+`, `-`, `0` zoom and fit. Keyboard: arrows go to the nearest node in that
 * direction, Enter opens it, Space picks it up so arrows move it (Shift for
 * bigger steps), Space or Enter drops it, Escape puts it back. Each node's
 * name says what it links to, so the relationships are readable without sight.
 */
import { createLiveRegion, say } from '../../addons/announce.js';
import { reconcileKeyedList } from '../../addons/keyed-list.js';
import { CONTROL_ATTR } from '../../addons/trait.js';
import { button, clamp, createLife, documentOf, el, uniqueId } from '../dom.js';
import { injectUiStyles } from '../styles.js';
import { NODE_HEIGHT, NODE_WIDTH, boundsOf, edgeEnd, layoutGraph, normalizeGraph } from './layout.js';
import { bindGraph } from './interact.js';

export const GRAPH = 'cloudcanvas-ui-graph';
const SVG_NS = 'http://www.w3.org/2000/svg';

/** The graph's default words. */
export const GRAPH_LABELS = /* @__PURE__ */ Object.freeze({
  zoomIn: 'Zoom in', zoomOut: 'Zoom out', fit: 'Fit', linksTo: 'links to', linkedFrom: 'linked from'
});

function svg(doc, tag, attrs) {
  const node = doc.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, String(value));
  return node;
}

function drawEdges(g, positions) {
  const markerId = g.markerId;
  const marker = svg(g.doc, 'marker', { id: markerId, viewBox: '0 0 10 10', refX: 10, refY: 5, markerWidth: 8, markerHeight: 8, orient: 'auto-start-reverse' });
  marker.append(svg(g.doc, 'path', { d: 'M0,0 L10,5 L0,10 z', class: `${GRAPH}-arrow` }));
  const defs = svg(g.doc, 'defs', {});
  defs.append(marker);
  const shapes = [defs];
  for (const edge of g.state.edges) {
    const from = positions.get(edge.from);
    const to = positions.get(edge.to);
    const start = { x: from.x + NODE_WIDTH / 2, y: from.y + NODE_HEIGHT / 2 };
    const end = edgeEnd(from, to);
    shapes.push(svg(g.doc, 'line', { x1: start.x, y1: start.y, x2: end.x, y2: end.y, class: `${GRAPH}-edge`, 'marker-end': `url(#${markerId})` }));
    if (edge.label) {
      const text = svg(g.doc, 'text', { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 - 4, class: `${GRAPH}-edge-label`, 'text-anchor': 'middle' });
      text.textContent = edge.label;
      shapes.push(text);
    }
  }
  g.svg.replaceChildren(...shapes);
}

function describeNode(g, node) {
  const name = (id) => g.state.nodes.find((entry) => entry.id === id)?.label ?? id;
  const out = g.state.edges.filter((edge) => edge.from === node.id && edge.to !== node.id).map((edge) => name(edge.to));
  const into = g.state.edges.filter((edge) => edge.to === node.id && edge.from !== node.id).map((edge) => name(edge.from));
  const parts = [node.label, node.detail];
  if (out.length) parts.push(`${g.labels.linksTo} ${out.join(', ')}`);
  if (into.length) parts.push(`${g.labels.linkedFrom} ${into.join(', ')}`);
  return parts.filter(Boolean).join('; ');
}

function writeNode(g, element, node, point) {
  element.setAttribute('data-ui-id', node.id);
  element.setAttribute('aria-label', describeNode(g, node));
  element.textContent = node.label;
  element.classList.toggle('is-selected', node.id === g.state.selectedId);
  element.classList.toggle('is-grabbed', node.id === g.state.pending?.id);
  if (node.id === g.state.selectedId) element.setAttribute('aria-current', 'true');
  else element.removeAttribute('aria-current');
  if (node.tone) element.setAttribute('data-tone', node.tone);
  else element.removeAttribute('data-tone');
  element.style.setProperty('--graph-x', `${point.x}px`);
  element.style.setProperty('--graph-y', `${point.y}px`);
  element.style.setProperty('width', `${NODE_WIDTH}px`);
  element.style.setProperty('height', `${NODE_HEIGHT}px`);
}

function applyView(g) {
  g.world.style.setProperty('transform', `translate(${g.view.x}px, ${g.view.y}px) scale(${g.view.k})`);
}

function render(g) {
  const positions = layoutGraph(g.state.nodes, g.state.edges);
  if (g.state.pending) positions.set(g.state.pending.id, g.state.pending.at);
  g.positions = positions;
  drawEdges(g, positions);
  reconcileKeyedList(g.nodeLayer, g.state.nodes, {
    key: (node) => node.id,
    create: () => el(g.doc, 'button', { className: `${GRAPH}-node`, attrs: { type: 'button', tabindex: '-1' } }),
    update: (node, entry) => writeNode(g, node, entry, positions.get(entry.id))
  });
  const nodes = Array.from(g.nodeLayer.children);
  if (!g.state.nodes.some((node) => node.id === g.state.focusId)) g.state.focusId = g.state.selectedId ?? g.state.nodes[0]?.id ?? null;
  for (const node of nodes) node.setAttribute('tabindex', node.getAttribute('data-ui-id') === g.state.focusId ? '0' : '-1');
  if (!g.fitted) g.fit();
  applyView(g);
}

function fit(g) {
  const box = boundsOf(g.positions ?? new Map());
  const rect = g.viewport.getBoundingClientRect();
  if (!box || !(rect.width > 0) || !(rect.height > 0)) return false;
  const pad = 24;
  const k = clamp(Math.min((rect.width - pad * 2) / (box.right - box.left), (rect.height - pad * 2) / (box.bottom - box.top)), 0.25, 1.5);
  g.view = { k, x: (rect.width - (box.right - box.left) * k) / 2 - box.left * k, y: (rect.height - (box.bottom - box.top) * k) / 2 - box.top * k };
  g.fitted = true;
  applyView(g);
  return true;
}

function zoomAt(g, factor, point) {
  const rect = g.viewport.getBoundingClientRect();
  const px = point ? point.x - rect.left : rect.width / 2;
  const py = point ? point.y - rect.top : rect.height / 2;
  const k = clamp(g.view.k * factor, 0.2, 3);
  g.view = { k, x: px - (px - g.view.x) * (k / g.view.k), y: py - (py - g.view.y) * (k / g.view.k) };
  applyView(g);
}

function toolbar(g) {
  const bar = el(g.doc, 'div', { className: `${GRAPH}-toolbar` });
  bar.append(
    button(g.doc, { className: `${GRAPH}-zoom-in`, label: '+', ariaLabel: g.labels.zoomIn, signal: g.life.signal, onClick: () => zoomAt(g, 1.25) }),
    button(g.doc, { className: `${GRAPH}-zoom-out`, label: '−', ariaLabel: g.labels.zoomOut, signal: g.life.signal, onClick: () => zoomAt(g, 0.8) }),
    button(g.doc, { className: `${GRAPH}-fit`, label: g.labels.fit, signal: g.life.signal, onClick: () => fit(g) }));
  return bar;
}

/**
 * @param {HTMLElement} host
 * @param {{onActivate?: (id: string) => void, onMove?: (id: string, point: {x: number, y: number}) => void,
 *   labels?: Partial<typeof GRAPH_LABELS>}} [callbacks]
 * @returns {{update(model: object): void, fit(): boolean, destroy(): void}}
 */
export function createGraph(host, callbacks = {}) {
  const doc = documentOf(host);
  injectUiStyles(doc);
  const life = createLife();
  const root = el(doc, 'div', { className: GRAPH, attrs: { role: 'region' } });
  const g = { doc, life, root, callbacks, labels: { ...GRAPH_LABELS, ...callbacks.labels }, markerId: uniqueId(`${GRAPH}-arrow`),
    view: { x: 0, y: 0, k: 1 }, fitted: false, positions: null, state: { nodes: [], edges: [], selectedId: null, focusId: null, pending: null } };
  // The viewport pans and zooms by itself, so inside a canvas it says it is a control: its gestures are not the canvas's.
  g.viewport = el(doc, 'div', { className: `${GRAPH}-viewport`, attrs: { [CONTROL_ATTR]: true } });
  g.world = el(doc, 'div', { className: `${GRAPH}-world` });
  g.svg = svg(doc, 'svg', { class: `${GRAPH}-edges`, 'aria-hidden': 'true', width: 1, height: 1 });
  g.nodeLayer = el(doc, 'div', { className: `${GRAPH}-nodes` });
  g.world.append(g.svg, g.nodeLayer);
  g.viewport.append(g.world);
  root.append(toolbar(g), g.viewport);
  g.region = createLiveRegion(root);
  g.say = (text) => say(g.region, text);
  g.render = () => render(g);
  g.fit = () => fit(g);
  g.zoomAt = (factor, point) => zoomAt(g, factor, point);
  g.applyView = () => applyView(g);
  bindGraph(g);
  host.append(root);
  return {
    update(model = {}) {
      if (life.dead) return;
      const { nodes, edges } = normalizeGraph(model.nodes ?? [], model.edges ?? []);
      Object.assign(g.state, { nodes, edges, selectedId: model.selectedId ?? null });
      root.setAttribute('aria-label', String(model.label ?? 'Relationships'));
      if (!g.state.pending) render(g);
    },
    fit: () => (life.dead ? false : fit(g)),
    destroy() {
      if (life.destroy()) root.remove();
    }
  };
}
