/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The graph's edges, drawn as SVG under the nodes: a `parent` edge a solid
 * curve from the parent's right edge to the child's left, a `related` edge a
 * dashed curve, a `depends-on` edge an accent curve with an arrowhead at what
 * it depends on; a label at the middle of its curve. Under a selection the
 * edges off its path dim. While a link is being drawn, a dashed line runs
 * from the node's right edge to the pointer (`drawDraft`), over the nodes,
 * in a layer of its own.
 */
import { svg } from '../dom.js';
import { NODE_HEIGHT, NODE_WIDTH, edgeLit, edgePath } from './layout.js';
import { matchesQuery } from './marks.js';

const PART = 'cloudcanvas-ui-graph';

function arrowDefs(g) {
  const marker = svg(g.doc, 'marker', { id: g.markerId, viewBox: '0 0 10 10', refX: 10, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' });
  marker.append(svg(g.doc, 'path', { d: 'M0,0 L10,5 L0,10 z', class: `${PART}-arrow` }));
  const defs = svg(g.doc, 'defs', {});
  defs.append(marker);
  return defs;
}

/** Whether an edge dims: off the selection's path, or with neither end matching the search. */
function dimmed(g, edge, emphasis) {
  if (emphasis && !edgeLit(edge, g.state.selectedId, emphasis)) return true;
  const label = (id) => g.byId.get(id)?.label ?? '';
  return !matchesQuery(label(edge.from), g.state.query) && !matchesQuery(label(edge.to), g.state.query);
}

function edgeShapes(g, edge, emphasis) {
  const from = g.positions.get(edge.from);
  const to = g.positions.get(edge.to);
  if (!from || !to) return [];
  const { d, mid } = edgePath(from, to);
  const dim = dimmed(g, edge, emphasis) ? ' is-dim' : '';
  const path = svg(g.doc, 'path', { d, class: `${PART}-edge is-${edge.kind}${dim}`, 'data-kind': edge.kind });
  if (edge.kind === 'depends-on') path.setAttribute('marker-end', `url(#${g.markerId})`);
  if (!edge.label) return [path];
  const text = svg(g.doc, 'text', { x: mid.x, y: mid.y - 4, class: `${PART}-edge-label${dim}`, 'text-anchor': 'middle' });
  text.textContent = edge.label;
  return [path, text];
}

/** Draw every edge whose ends are placed, its label over the lines. */
export function drawEdges(g, emphasis) {
  const shapes = g.state.edges.map((edge) => edgeShapes(g, edge, emphasis));
  const lines = shapes.map((pair) => pair[0]).filter(Boolean);
  const labels = shapes.map((pair) => pair[1]).filter(Boolean);
  g.svg.replaceChildren(arrowDefs(g), ...lines, ...labels);
}

/** The link in progress from node `fromId` to the world point `to`, or none when `to` is null. */
export function drawDraft(g, fromId, to) {
  if (to === null) {
    g.draft?.remove();
    g.draft = null;
    return;
  }
  const start = g.positions.get(fromId);
  const sx = start.x + NODE_WIDTH;
  const sy = start.y + NODE_HEIGHT / 2;
  const bend = Math.round(Math.max(24, Math.abs(to.x - sx) / 2));
  if (!g.draft) {
    g.draft = svg(g.doc, 'path', { class: `${PART}-draft` });
    g.overlay.append(g.draft);
  }
  g.draft.setAttribute('d', `M${sx} ${sy} C${sx + bend} ${sy} ${Math.round(to.x - bend)} ${Math.round(to.y)} ${Math.round(to.x)} ${Math.round(to.y)}`);
}
