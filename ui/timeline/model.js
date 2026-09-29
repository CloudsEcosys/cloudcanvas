/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The timeline's arithmetic: items checked, the date domain they need, where a
 * date falls in pixels at a scale, and the ticks of the axis. Pure.
 */
import { addDays, addMonths, startOfDay, startOfMonth, startOfWeek, toDate } from '../calendar/dates.js';

/** Pixels per day at each scale, and the padding (days) either side of the items. */
export const TIMELINE_SCALES = /* @__PURE__ */ Object.freeze({
  day: { perDay: 64, pad: 2 },
  week: { perDay: 20, pad: 7 },
  month: { perDay: 5, pad: 31 }
});

const DAY_MS = 86400000;

/** Every item checked (string ids, unique; a real start; an end after it or none), in the given order. */
export function normalizeItems(items) {
  if (!Array.isArray(items)) throw new TypeError('Timeline items must be an array');
  const seen = new Set();
  return items.map((item) => {
    const id = item?.id;
    if (typeof id !== 'string' || id.trim() === '' || seen.has(id)) throw new TypeError(`Invalid or duplicate timeline id: ${String(id)}`);
    seen.add(id);
    const start = toDate(item.start);
    if (!start) throw new TypeError(`Timeline item ${id} has no valid start`);
    const end = item.end === undefined || item.end === null ? null : toDate(item.end);
    if (item.end !== undefined && item.end !== null && !end) throw new TypeError(`Timeline item ${id} has an invalid end`);
    const progress = Number.isFinite(item.progress) ? Math.min(1, Math.max(0, item.progress)) : null;
    return { id, title: String(item.title ?? id), start, end: end && end > start ? end : null,
      group: item.group ? String(item.group) : '', tone: item.tone ? String(item.tone) : '', progress, movable: item.movable !== false };
  });
}

/** The first and last day the axis covers: every item, today, and the scale's padding. */
export function domainFor(items, scale, now) {
  const { pad } = TIMELINE_SCALES[scale];
  let first = startOfDay(now);
  let last = startOfDay(now);
  for (const item of items) {
    if (item.start < first) first = startOfDay(item.start);
    const end = item.end ?? item.start;
    if (end > last) last = startOfDay(end);
  }
  return { start: addDays(first, -pad), end: addDays(last, pad + 1) };
}

/** Pixel offset of `date` from the domain start. */
export function xOf(date, domain, scale) {
  return ((date.getTime() - domain.start.getTime()) / DAY_MS) * TIMELINE_SCALES[scale].perDay;
}

/** The axis width in pixels. */
export function widthOf(domain, scale) {
  return xOf(domain.end, domain, scale);
}

/** A bar's left and width; a milestone (no end) has width 0. */
export function barOf(item, domain, scale) {
  const left = xOf(item.start, domain, scale);
  if (!item.end) return { left, width: 0, point: true };
  return { left, width: Math.max(4, xOf(item.end, domain, scale) - left), point: false };
}

/** The tick dates for a scale: every day, every week start, or every month start. */
export function tickDates(domain, scale, weekStartsOn = 1) {
  const ticks = [];
  let date = scale === 'month' ? startOfMonth(domain.start) : scale === 'week' ? startOfWeek(domain.start, weekStartsOn) : domain.start;
  while (date < domain.end) {
    if (date >= domain.start) ticks.push(date);
    date = scale === 'month' ? addMonths(date, 1) : addDays(date, scale === 'week' ? 7 : 1);
  }
  return ticks;
}

/** An item's times moved by `days`, or its end moved by `days` when `resize` (never before its start). */
export function shiftItem(times, days, resize) {
  if (resize) {
    const end = addDays(times.end ?? times.start, days);
    return { start: times.start, end: end > times.start ? end : times.end ?? null };
  }
  return { start: addDays(times.start, days), end: times.end ? addDays(times.end, days) : null };
}
