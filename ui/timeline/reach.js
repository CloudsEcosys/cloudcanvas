/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * How far the date axis reaches. It begins where the items and today need it
 * (`domainFor`) and is then made to reach wherever a reader can look: a sheet's
 * width of days beyond it on each side, and a sheet's width more each time the
 * reader scrolls near either end. A track is drawn along all of it, so a span
 * can be dragged across any row on any day the axis shows, not only near a
 * bar - and a reader can scroll to a day nothing is scheduled on.
 *
 * A redraw that moves the axis' start (the margin changed with the sheet's
 * width, or an item before it arrived) scrolls the sheet by as much, so the
 * dates under the reader stay under the reader; the first draw is scrolled to
 * where the items begin. The axis is left alone while a bar, a band or a link
 * is in hand, and takes up the scroll when the hand is let go.
 *
 * A sheet with no width (hidden, or a test DOM without layout) has no margin.
 */
import { addDays } from '../calendar/dates.js';
import { GUTTER_MIN, widthNow } from './gutter.js';
import { TIMELINE_SCALES, dateAt, domainFor, widthOf, xOf } from './model.js';

/** The most days the axis may be extended by scrolling, at each end: about ten years. */
export const MAX_REACH_DAYS = 3660;

/** The fewest days of margin or of one extension, when the sheet has a width. */
const MIN_GROWTH_DAYS = 14;

/** The track's width (px) the sheet shows at its narrowest gutter. */
const roomOf = (tl) => Math.max(0, tl.sheet.clientWidth - GUTTER_MIN);

/** The days a sheet's width holds at the scale: the margin on each side, and the step one extension adds. */
function stepOf(tl) {
  const room = roomOf(tl);
  return room === 0 ? 0 : Math.max(MIN_GROWTH_DAYS, Math.ceil(room / TIMELINE_SCALES[tl.state.scale].perDay));
}

/** The days the axis covers: the items' and today's, and the margin or what scrolling added, whichever is more, each side. `home` is where the items begin. */
export function domainOf(tl) {
  const { reach, state } = tl;
  const base = domainFor(state.items, state.scale, state.now);
  const step = stepOf(tl);
  return { start: addDays(base.start, -Math.max(reach.before, step)), end: addDays(base.end, Math.max(reach.after, step)), home: base.start };
}

/** The date at the sheet's left edge before a redraw, to be put back after it. */
export function viewBefore(tl) {
  if (!tl.domain) return null;
  return { date: dateAt(tl.sheet.scrollLeft, tl.domain, tl.domainScale), scale: tl.domainScale, start: tl.domain.start };
}

/** Scroll the sheet so the date that was at its left edge is again, if the axis' start moved; the first draw shows where the items begin. */
export function viewAfter(tl, before) {
  const { domain, state } = tl;
  tl.domainScale = state.scale;
  if (before === null) tl.sheet.scrollLeft = xOf(domain.home ?? domain.start, domain, state.scale);
  else if (before.scale === state.scale && before.start.getTime() !== domain.start.getTime()) tl.sheet.scrollLeft = xOf(before.date, domain, state.scale);
}

/** Which ends of the axis the sheet is scrolled near: within half a sheet of it, and not yet at the most it may reach. */
function nearEnds(tl) {
  const { reach, state } = tl;
  const view = Math.max(0, tl.sheet.clientWidth - widthNow(tl));
  const left = tl.sheet.scrollLeft;
  const right = widthOf(tl.domain, state.scale) - left - view;
  return { before: left < view / 2 && reach.before < MAX_REACH_DAYS, after: right < view / 2 && reach.after < MAX_REACH_DAYS };
}

function extend(tl) {
  if (!tl.domain || tl.busy() || tl.drawing) return;
  const { before, after } = nearEnds(tl);
  if (!before && !after) return;
  const step = stepOf(tl);
  if (before) tl.reach.before = Math.min(MAX_REACH_DAYS, Math.max(tl.reach.before, step) + step);
  if (after) tl.reach.after = Math.min(MAX_REACH_DAYS, Math.max(tl.reach.after, step) + step);
  tl.render();
}

/** Draw again when the sheet's width has changed what the axis should cover. */
function refit(tl) {
  if (!tl.domain || tl.busy() || tl.drawing) return;
  const next = domainOf(tl);
  if (next.start.getTime() !== tl.domain.start.getTime() || next.end.getTime() !== tl.domain.end.getTime()) tl.render();
}

/** Extend the axis as the reader scrolls near its ends, and cover the sheet's width when it is resized. */
export function bindReach(tl) {
  tl.life.on(tl.sheet, 'scroll', () => extend(tl));
  const Observer = tl.doc.defaultView?.ResizeObserver;
  if (typeof Observer !== 'function') return;
  const observer = new Observer(() => { refit(tl); tl.windowMoved(); });
  observer.observe(tl.sheet);
  tl.life.add(() => observer.disconnect());
}
