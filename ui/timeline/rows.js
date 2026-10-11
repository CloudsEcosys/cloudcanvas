/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * What the timeline draws: the axis, the rows and, in each row, the bar or the
 * milestone with its title. The rows are a `treegrid`: a group's heading is a
 * row of level 1, an item's row is a row of level 2 under it (level 1 when it
 * has no group), the bar a button in the row's track cell, named by its title,
 * its dates, its status and its progress. The row's label in the gutter and a
 * title drawn beside a bar are the bar's name again, for the eye alone.
 *
 * A TITLE IS ALWAYS DRAWN. Inside the bar when the bar is wide enough to hold
 * some of it (it then ends in an ellipsis), else beside it, as a milestone's
 * is. Either way the full title is in the bar's name and its tooltip.
 */
import { el } from '../dom.js';
import { gutterHandle } from './gutter.js';
import { TL, barOf, tickDates, xOf } from './model.js';

/** A bar narrower than this (px) draws its title beside it: inside, nothing of it would read. */
export const INSIDE_MIN_PX = 56;

/** How a bar reads to a screen reader, and what its tooltip says: title, dates, status, progress. */
export function describeItem(tl, item) {
  const date = (value) => tl.format.format(value);
  const when = item.end ? `${date(item.start)} to ${date(item.end)}` : `${date(item.start)}, ${tl.labels.milestone}`;
  const status = item.status ? `, ${item.status}` : '';
  const done = item.progress === null ? '' : `, ${Math.round(item.progress * 100)}% ${tl.labels.done}`;
  return `${item.title}, ${when}${status}${done}`;
}

function writeGeometry(node, geometry) {
  node.style.setProperty('--timeline-x', `${geometry.left}px`);
  node.style.setProperty('--timeline-w', `${geometry.width}px`);
}

function barNode(tl, item, geometry, inside) {
  const { doc } = tl;
  const name = describeItem(tl, item);
  const node = el(doc, 'button', { className: `${TL}-bar`, attrs: { type: 'button', tabindex: '-1', 'data-ui-id': item.id, title: name,
    'aria-label': name, 'data-tone': item.tone || null, 'data-status-tone': item.statusTone || null, 'data-movable': item.movable ? 'true' : null } });
  node.classList.toggle('is-point', geometry.point);
  node.classList.toggle('is-grabbed', tl.state.pending?.id === item.id);
  writeGeometry(node, geometry);
  if (item.progress !== null) node.style.setProperty('--timeline-progress', String(item.progress));
  if (inside) node.append(el(doc, 'span', { className: `${TL}-bar-title`, text: item.title }));
  if (item.movable && !geometry.point) node.append(el(doc, 'span', { className: `${TL}-handle`, attrs: { 'aria-hidden': 'true' } }));
  return node;
}

/** The title of a milestone or of a bar too short to hold it: drawn beside it, a part that stands for the item. */
function outsideTitle(tl, item, geometry) {
  const node = el(tl.doc, 'span', { className: `${TL}-outside`, text: item.title, attrs: { 'aria-hidden': 'true', 'data-ui-for': item.id } });
  node.classList.toggle('is-point', geometry.point);
  writeGeometry(node, geometry);
  return node;
}

function trackNode(tl, item) {
  const track = el(tl.doc, 'div', { className: `${TL}-track`, attrs: { role: 'gridcell', 'data-group-id': item.groupId } });
  const geometry = barOf(item, tl.domain, tl.state.scale);
  const inside = !geometry.point && geometry.width >= INSIDE_MIN_PX;
  track.append(barNode(tl, item, geometry, inside));
  if (!inside) track.append(outsideTitle(tl, item, geometry));
  return track;
}

/** A row: the item's title in the gutter, and its bar on the track. */
function rowNode(tl, item) {
  const level = item.group ? 2 : 1;
  const row = el(tl.doc, 'div', { className: `${TL}-row`, attrs: { role: 'row', 'aria-level': level, 'data-row-id': item.id } });
  row.append(el(tl.doc, 'div', { className: `${TL}-label`, text: item.title, attrs: { 'aria-hidden': 'true', 'data-ui-for': item.id, title: item.title } }),
    trackNode(tl, item));
  return row;
}

/** The heading row of `item`'s group: its name, or - for a group that stands for an item - a button that is that item's face. */
function groupNode(tl, item) {
  const row = el(tl.doc, 'div', { className: `${TL}-group`, attrs: { role: 'row', 'aria-level': 1 } });
  const cell = el(tl.doc, 'div', { className: `${TL}-group-cell`, attrs: { role: 'gridcell' } });
  row.append(cell);
  if (item.groupId === null) {
    cell.textContent = item.group;
    return row;
  }
  const face = el(tl.doc, 'button', { className: `${TL}-group-label`, text: item.group, attrs: { type: 'button', 'data-ui-id': item.groupId } });
  cell.append(face);
  return row;
}

/** Whether `item` stands under another heading than `last`'s: its name or the item it stands for differs. */
const startsGroup = (item, last) => !last || item.group !== last.group || item.groupId !== last.groupId;

/** The rows, each run of items under one heading headed once: a group met again is headed again. */
export function rowsNode(tl, items) {
  const rows = el(tl.doc, 'div', { className: `${TL}-rows`, attrs: { role: 'treegrid', 'aria-label': tl.root.getAttribute('aria-label') } });
  let last = null;
  for (const item of items) {
    if (startsGroup(item, last) && item.group) rows.append(groupNode(tl, item));
    last = item;
    if (!item.collapsed) rows.append(rowNode(tl, item));
  }
  return rows;
}

/** The date axis. Its ticks are for the eye alone; the corner holds the gutter's separator. */
export function axisNode(tl) {
  const axis = el(tl.doc, 'div', { className: `${TL}-axis` });
  const corner = el(tl.doc, 'div', { className: `${TL}-corner` });
  corner.append(gutterHandle(tl));
  const ticks = el(tl.doc, 'div', { className: `${TL}-ticks`, attrs: { 'aria-hidden': 'true' } });
  const format = tl.tickFormats[tl.state.scale];
  for (const date of tickDates(tl.domain, tl.state.scale)) {
    const tick = el(tl.doc, 'div', { className: `${TL}-tick`, text: format.format(date) });
    tick.style.setProperty('--timeline-x', `${xOf(date, tl.domain, tl.state.scale)}px`);
    ticks.append(tick);
  }
  axis.append(corner, ticks);
  return axis;
}
