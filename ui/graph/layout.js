/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The relationship graph's geometry, pure: a layered auto-layout for nodes the
 * caller did not place, the point where an edge meets a node's box, the bounds
 * a fit frames, and the nearest node in an arrow's direction.
 */

/** Node box size in world units, and the spacing of the auto-layout grid. */
export const NODE_WIDTH = 144;
export const NODE_HEIGHT = 40;
export const LAYER_GAP = 220;
export const ROW_GAP = 72;

/** Every node and edge checked: unique string ids; edges between known nodes. */
export function normalizeGraph(nodes, edges) {
  if (!Array.isArray(nodes) || !Array.isArray(edges)) throw new TypeError('Graph nodes and edges must be arrays');
  const ids = new Set();
  const clean = nodes.map((node) => {
    const id = node?.id;
    if (typeof id !== 'string' || id.trim() === '' || ids.has(id)) throw new TypeError(`Invalid or duplicate graph node id: ${String(id)}`);
    ids.add(id);
    const placed = Number.isFinite(node.x) && Number.isFinite(node.y);
    return { id, label: String(node.label ?? id), tone: node.tone ? String(node.tone) : '', detail: node.detail ? String(node.detail) : '',
      x: placed ? node.x : null, y: placed ? node.y : null };
  });
  const links = edges.map((edge, index) => {
    if (!ids.has(edge?.from) || !ids.has(edge?.to)) throw new TypeError(`Graph edge ${index} names an unknown node`);
    return { id: String(edge.id ?? `${edge.from}->${edge.to}#${index}`), from: edge.from, to: edge.to, label: edge.label ? String(edge.label) : '' };
  });
  return { nodes: clean, edges: links };
}

/** Depth of each node from the roots (no incoming edge), breadth first; cycles start at their first node. */
function depths(nodes, edges) {
  const incoming = new Map(nodes.map((node) => [node.id, 0]));
  const out = new Map(nodes.map((node) => [node.id, []]));
  for (const edge of edges) {
    if (edge.from === edge.to) continue;
    incoming.set(edge.to, incoming.get(edge.to) + 1);
    out.get(edge.from).push(edge.to);
  }
  const depth = new Map();
  const walk = (roots) => {
    const queue = roots.filter((id) => !depth.has(id));
    for (const id of queue) depth.set(id, 0);
    for (let head = 0; head < queue.length; head += 1) {
      const level = depth.get(queue[head]);
      const fresh = out.get(queue[head]).filter((next) => !depth.has(next));
      for (const next of fresh) { depth.set(next, level + 1); queue.push(next); }
    }
  };
  walk(nodes.filter((node) => incoming.get(node.id) === 0).map((node) => node.id));
  for (const node of nodes) if (!depth.has(node.id)) walk([node.id]);
  return depth;
}

/** Positions for every node: the caller's where given, a layered grid otherwise. */
export function layoutGraph(nodes, edges) {
  const depth = depths(nodes, edges);
  const rows = new Map();
  return new Map(nodes.map((node) => {
    if (node.x !== null) return [node.id, { x: node.x, y: node.y }];
    const layer = depth.get(node.id);
    const row = rows.get(layer) ?? 0;
    rows.set(layer, row + 1);
    return [node.id, { x: layer * LAYER_GAP, y: row * ROW_GAP }];
  }));
}

/** Where the segment from `a`'s centre towards `b`'s centre leaves `b`'s box (for an arrowhead on its border). */
export function edgeEnd(from, to) {
  const cx = to.x + NODE_WIDTH / 2;
  const cy = to.y + NODE_HEIGHT / 2;
  const dx = from.x + NODE_WIDTH / 2 - cx;
  const dy = from.y + NODE_HEIGHT / 2 - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };
  const scale = Math.min(Math.abs((NODE_WIDTH / 2) / (dx || 1e-9)), Math.abs((NODE_HEIGHT / 2) / (dy || 1e-9)));
  return { x: cx + dx * Math.min(1, scale), y: cy + dy * Math.min(1, scale) };
}

/** The box around every position, or null for an empty graph. */
export function boundsOf(positions) {
  const all = [...positions.values()];
  if (all.length === 0) return null;
  const xs = all.map((point) => point.x);
  const ys = all.map((point) => point.y);
  return { left: Math.min(...xs), top: Math.min(...ys), right: Math.max(...xs) + NODE_WIDTH, bottom: Math.max(...ys) + NODE_HEIGHT };
}

/** The node an arrow key reaches from `id`: the nearest one in that direction, favouring the straight line. */
export function nearestInDirection(positions, id, key) {
  const from = positions.get(id);
  const axis = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[key];
  if (!from || !axis) return null;
  let best = null;
  for (const [other, point] of positions) {
    const dx = point.x - from.x;
    const dy = point.y - from.y;
    const along = dx * axis[0] + dy * axis[1];
    if (other === id || along <= 0) continue;
    const score = along + 2 * Math.abs(dx * axis[1] - dy * axis[0]);
    if (!best || score < best.score) best = { id: other, score };
  }
  return best?.id ?? null;
}
