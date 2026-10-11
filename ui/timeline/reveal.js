/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Bringing a part of the sheet into view: days of the axis across, a row
 * down. A part already in view is left where it is. One that is not is
 * scrolled to by as little as it takes, or - `centre` - to the middle of the
 * sheet on the axis it is off, as the graph brings a node (`focusId`). The
 * track's room is what the gutter leaves; the axis stands over the rows at the
 * top. A sheet with no size (hidden, or a test DOM without layout) scrolls
 * nothing.
 */
import { clamp } from '../dom.js';
import { widthNow } from './gutter.js';
import { TL, barOf, widthOf } from './model.js';
import { groupSpan } from './rows.js';

/** Half a milestone's width (px): the diamond stands this far either side of its day. */
const POINT = 7;

/** The farthest the sheet scrolls across: the axis and the gutter, less what it shows. */
export function maxScrollLeft(tl) {
  return Math.max(0, widthNow(tl) + widthOf(tl.domain, tl.state.scale) - (tl.sheet.clientWidth || 0));
}

/** Where to scroll from `from` so `[start, end]` stands within `room`: the middle, or the nearer edge. */
function aim(from, room, [start, end], centre) {
  if (centre && end - start <= room) return (start + end) / 2 - room / 2;
  return start < from || (centre && end - start > room) ? start : end - room;
}

/** Scroll the sheet across so px `left` to `right` of the axis are in view; whether it scrolled. */
export function revealDays(tl, left, right, { centre = false } = {}) {
  const { sheet } = tl;
  const room = (sheet.clientWidth || 0) - widthNow(tl);
  const from = sheet.scrollLeft;
  if (!(room > 0) || !tl.domain || (left >= from && right <= from + room)) return false;
  sheet.scrollLeft = clamp(aim(from, room, [left, right], centre), 0, maxScrollLeft(tl));
  tl.windowMoved();
  return sheet.scrollLeft !== from;
}

/** Scroll the sheet down or up so `row` is in view below the axis. */
export function revealRow(tl, row, { centre = false } = {}) {
  const { sheet } = tl;
  const height = sheet.clientHeight || 0;
  const box = row?.getBoundingClientRect();
  if (!(height > 0) || !box || !(box.height > 0)) return;
  const axis = sheet.querySelector(`.${TL}-axis`)?.getBoundingClientRect().height || 0;
  const from = sheet.scrollTop;
  const top = box.top - sheet.getBoundingClientRect().top + from;
  const room = height - axis;
  if (top >= from + axis && top + box.height <= from + height) return;
  sheet.scrollTop = Math.max(0, aim(from, room, [top - axis, top + box.height - axis], centre));
}

/** The face drawn for `id`, of `kind` (a bar, or a heading's button), or null. */
function faceOf(tl, kind, id) {
  return Array.from(tl.sheet.querySelectorAll(`.${TL}-${kind}`)).find((node) => node.getAttribute('data-ui-id') === id) ?? null;
}

/**
 * Bring item `id` into view, to the middle of the sheet on an axis it is off: its bar; or, when it has none - it is folded
 * away, or `id` is a group's - its group's heading, across the days the group covers.
 */
export function revealItem(tl, id) {
  const item = tl.byId.get(id) ?? null;
  const bar = item && faceOf(tl, 'bar', id);
  if (bar) {
    const { left, width, point } = barOf(item, tl.domain, tl.state.scale);
    revealDays(tl, point ? left - POINT : left, point ? left + POINT : left + width, { centre: true });
    revealRow(tl, bar.closest(`.${TL}-row`), { centre: true });
    return;
  }
  const groupId = item ? item.groupId : id;
  const member = tl.state.items.find((one) => one.groupId === groupId);
  const heading = groupId !== null && member ? faceOf(tl, 'group-label', groupId)?.closest(`.${TL}-group`) : null;
  if (!heading) return;
  const { left, width } = groupSpan(tl, member);
  revealDays(tl, left, left + width, { centre: true });
  revealRow(tl, heading, { centre: true });
}
