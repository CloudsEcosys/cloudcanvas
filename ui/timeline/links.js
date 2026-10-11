/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Dependencies, drawn and made. An item that `depends` on others has a
 * connector from each dependency's end to its own start: an elbow with an
 * arrowhead at the dependent, in a layer of SVG over the rows (the pair is
 * where the bars stand, measured). A host that takes `onUnlink` gets
 * connectors a press selects and Delete removes - `onUnlink(fromId, toId)`,
 * from the dependency to the dependent - and one that does not, a picture.
 *
 * A link is made from the handle beside a bar's right edge (`onLink`, given):
 * dragged to another bar - or its title - it reports `onLink(fromId, toId)`,
 * a line following the pointer and the bar it would link to lit. The pair is
 * the one `onUnlink` reports for the connector that link draws; what a link
 * means (which depends on which) is the host's.
 */
import { itemIdOf, svg } from '../dom.js';
import { trackDrag } from '../drag.js';
import { TL } from './model.js';
import { bars } from './move.js';

const LINKS = `${TL}-links`;
const CONNECTOR = `.${TL}-connector`;
/** The room a connector leaves a bar before it turns. */
const GAP = 12;

/** The elbow from `a` (a dependency's end) to `b` (the dependent's start): by the middle, or round the back between the rows. */
export function elbowPath(a, b) {
  if (b.x - a.x >= 2 * GAP) return `M${a.x} ${a.y} H${Math.round((a.x + b.x) / 2)} V${b.y} H${b.x}`;
  const between = Math.round((a.y + b.y) / 2);
  return `M${a.x} ${a.y} H${a.x + GAP} V${between} H${b.x - GAP} V${b.y} H${b.x}`;
}

/** Where a bar's end and start are, in the layer's own coordinates: the right and left edges, at the middle of the bar. */
function placeOf(layerBox, bar) {
  const box = bar.getBoundingClientRect();
  const y = Math.round(box.top - layerBox.top + box.height / 2);
  return { end: { x: Math.round(box.right - layerBox.left), y }, start: { x: Math.round(box.left - layerBox.left), y } };
}

/** The pairs `[dependencyId, dependentId]` the sheet draws both ends of, in the order the items are drawn. */
function pairsOf(tl, places) {
  return tl.state.items.flatMap((item) => item.depends.filter((id) => places.has(id) && places.has(item.id)).map((id) => [id, item.id]));
}

function connectorNode(tl, [from, to], places) {
  const interactive = typeof tl.callbacks.onUnlink === 'function';
  const group = svg(tl.doc, 'g', { class: `${TL}-connector`, 'data-from': from, 'data-to': to });
  if (interactive) {
    const name = `${tl.byId.get(to).title} ${tl.labels.dependsOn} ${tl.byId.get(from).title}`;
    for (const [attribute, value] of [['role', 'button'], ['tabindex', '-1'], ['aria-label', name]]) group.setAttribute(attribute, value);
  }
  const d = elbowPath(places.get(from).end, places.get(to).start);
  group.append(svg(tl.doc, 'path', { class: `${TL}-connector-hit`, d }),
    svg(tl.doc, 'path', { class: `${TL}-connector-line`, d, 'marker-end': `url(#${tl.id}-arrow)` }));
  return group;
}

function arrowDefs(tl) {
  const marker = svg(tl.doc, 'marker', { id: `${tl.id}-arrow`, viewBox: '0 0 10 10', refX: 10, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto' });
  marker.append(svg(tl.doc, 'path', { d: 'M0,0 L10,5 L0,10 z', class: `${TL}-arrow` }));
  const defs = svg(tl.doc, 'defs', {});
  defs.append(marker);
  return defs;
}

/** The layer the connectors are drawn in, empty: `drawLinks` fills it once the sheet is on the page and its bars can be measured. */
export function linksLayer(tl) {
  const interactive = typeof tl.callbacks.onUnlink === 'function';
  tl.links = svg(tl.doc, 'svg', { class: LINKS, width: 1, height: 1, ...(interactive ? {} : { 'aria-hidden': 'true' }) });
  return tl.links;
}

/** Draw a connector for every dependency whose two bars are drawn. A selected link that is no longer one is let go. */
export function drawLinks(tl) {
  const layerBox = tl.links.getBoundingClientRect();
  const places = new Map(bars(tl).map((bar) => [bar.getAttribute('data-ui-id'), placeOf(layerBox, bar)]));
  const pairs = pairsOf(tl, places);
  tl.links.replaceChildren(arrowDefs(tl), ...pairs.map((pair) => connectorNode(tl, pair, places)));
  const chosen = tl.state.selectedLink;
  if (chosen && !pairs.some(([from, to]) => from === chosen.from && to === chosen.to)) tl.state.selectedLink = null;
  tl.paintLinks();
}

/** Mark the selected connector, and only it. */
export function paintLinks(tl) {
  const chosen = tl.state.selectedLink;
  for (const node of tl.links?.querySelectorAll(CONNECTOR) ?? []) {
    const selected = Boolean(chosen) && node.getAttribute('data-from') === chosen.from && node.getAttribute('data-to') === chosen.to;
    node.classList.toggle('is-selected', selected);
    if (selected) node.setAttribute('aria-current', 'true');
    else node.removeAttribute('aria-current');
  }
}

function selectLink(tl, node) {
  tl.state.selectedId = null;
  tl.state.selectedLink = { from: node.getAttribute('data-from'), to: node.getAttribute('data-to') };
  tl.paint();
  node.focus?.({ preventScroll: true });
}

function onLinkKey(tl, node, event) {
  const { from, to } = { from: node.getAttribute('data-from'), to: node.getAttribute('data-to') };
  if ((event.key === 'Delete' || event.key === 'Backspace') && tl.callbacks.onUnlink) {
    event.preventDefault();
    tl.callbacks.onUnlink(from, to);
  } else if (event.key === 'Escape' && tl.state.selectedLink) {
    event.preventDefault();
    tl.state.selectedLink = null;
    tl.paint();
  }
}

/** The bar a point is over - its face or its title - other than `fromId`, or null. */
function targetUnder(tl, point, fromId) {
  const id = itemIdOf(tl.doc.elementFromPoint?.(point.x, point.y));
  return id !== null && id !== fromId && bars(tl).some((bar) => bar.getAttribute('data-ui-id') === id) ? id : null;
}

function light(tl, id) {
  for (const bar of bars(tl)) bar.classList.toggle('is-drop-target', bar.getAttribute('data-ui-id') === id);
}

function drawDraft(tl, linking, point) {
  const box = tl.links.getBoundingClientRect();
  linking.draft.setAttribute('d', `M${linking.from.x} ${linking.from.y} L${Math.round(point.x - box.left)} ${Math.round(point.y - box.top)}`);
}

function startLink(tl, handle) {
  const fromId = handle.getAttribute('data-link-from');
  const bar = bars(tl).find((node) => node.getAttribute('data-ui-id') === fromId);
  const from = placeOf(tl.links.getBoundingClientRect(), bar).end;
  const draft = svg(tl.doc, 'path', { class: `${TL}-draft-link`, d: `M${from.x} ${from.y}` });
  tl.links.append(draft);
  tl.state.linking = { fromId, from, draft, target: null };
}

function endLink(tl, point) {
  const { fromId, draft, target } = tl.state.linking;
  tl.state.linking = null;
  draft.remove();
  light(tl, null);
  if (point !== null && target) tl.callbacks.onLink(fromId, target);
  tl.render();
}

/** Wire the pointer's drag from a handle and the keys and presses on connectors. */
export function bindLinks(tl) {
  tl.paintLinks = () => paintLinks(tl);
  tl.life.on(tl.sheet, 'click', (event) => {
    const node = event.target.closest?.(CONNECTOR);
    if (node && typeof tl.callbacks.onUnlink === 'function') selectLink(tl, node);
  });
  tl.life.on(tl.sheet, 'keydown', (event) => {
    const node = event.target.closest?.(CONNECTOR);
    if (node) onLinkKey(tl, node, event);
  });
  trackDrag(tl.life, tl.sheet, {
    selector: `.${TL}-link`,
    canStart: () => typeof tl.callbacks.onLink === 'function' && !tl.state.pending && !tl.state.creating,
    onStart(handle) { startLink(tl, handle); },
    onMove(point) {
      const linking = tl.state.linking;
      if (!linking) return;
      drawDraft(tl, linking, point);
      linking.target = targetUnder(tl, point, linking.fromId);
      light(tl, linking.target);
    },
    onEnd(point) { if (tl.state.linking) endLink(tl, point); }
  });
}
