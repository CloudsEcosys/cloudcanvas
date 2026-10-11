/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Making a span by dragging across the empty part of a row. A band follows
 * the pointer, from the day the press was on to the day the pointer is on,
 * either way round and a day at least; the release reports
 * `onCreate({groupId, start, end})` - end exclusive - for the group whose row
 * it was (null for a row with no group), and Escape drops the band. While the
 * band is drawn a host's update waits: the sheet is drawn again when the drag
 * ends. Nothing is made by the kit.
 */
import { el } from '../dom.js';
import { trackDrag } from '../drag.js';
import { addDays } from '../calendar/dates.js';
import { TL, TIMELINE_SCALES, dayAt } from './model.js';

const TRACK = `.${TL}-track`;

/** The band for a drag whose press was on day `from` and pointer is on day `to` (counted from the domain's start). */
function spanOf(tl, from, to) {
  const first = Math.min(from, to);
  const days = Math.abs(to - from) + 1;
  const start = addDays(tl.domain.start, first);
  return { start, end: addDays(start, days), first, days };
}

function dayUnder(tl, creating, point) {
  return dayAt(point.x - creating.track.getBoundingClientRect().left, tl.state.scale);
}

function drawBand(tl, creating, point) {
  const span = spanOf(tl, creating.from, dayUnder(tl, creating, point));
  const perDay = TIMELINE_SCALES[tl.state.scale].perDay;
  const { band } = creating;
  band.style.setProperty('--timeline-x', `${span.first * perDay}px`);
  band.style.setProperty('--timeline-w', `${span.days * perDay}px`);
  const last = addDays(span.end, -1);
  band.textContent = span.days === 1 ? tl.format.format(span.start) : `${tl.format.format(span.start)} – ${tl.format.format(last)}`;
  creating.span = span;
}

function endCreate(tl, point) {
  const creating = tl.state.creating;
  tl.state.creating = null;
  creating.band.remove();
  if (point !== null && creating.span) {
    tl.callbacks.onCreate({ groupId: creating.groupId, start: creating.span.start, end: creating.span.end });
  }
  tl.render();
}

/** Wire the drag across a row's empty track. */
export function bindCreate(tl) {
  trackDrag(tl.life, tl.sheet, {
    selector: TRACK,
    canStart: (track, event) => typeof tl.callbacks.onCreate === 'function' && !tl.state.pending && event.target === track,
    onStart(track, point) {
      const band = el(tl.doc, 'div', { className: `${TL}-draft`, attrs: { 'aria-hidden': 'true' } });
      track.append(band);
      tl.state.creating = { track, band, groupId: track.getAttribute('data-group-id'), span: null, from: 0 };
      tl.state.creating.from = dayUnder(tl, tl.state.creating, point);
    },
    onMove(point) {
      if (tl.state.creating) drawBand(tl, tl.state.creating, point);
    },
    onEnd(point) {
      if (tl.state.creating) endCreate(tl, point);
    }
  });
}
