/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The calendar's rules for what use added to it: the handle on a timed
 * event's bottom edge (a grip drawn when the event is pointed at, focused,
 * selected or in hand, and the resize cursor over it). The rest of the
 * calendar's rules - its grids, its chips, their tones and their 44px
 * targets under a finger - are in `./views.js`.
 *
 * Nothing here moves: a grip appears and a band is drawn, none of it is
 * animated, so there is no motion to turn off for a reader who asked for less.
 */

export const UI_CALENDAR_CSS = `/* ------------------ UI KIT: CALENDAR ------------------ */

/* The handle on a timed event's bottom edge: it resizes, and says so under the pointer. */
.cloudcanvas-ui-calendar-event-handle { position: absolute; right: 0; bottom: 0; left: 0; height: 6px; cursor: ns-resize; }
.cloudcanvas-ui-calendar-event-handle::before {
  content: "";
  position: absolute;
  bottom: 2px;
  left: calc(50% - 7px);
  width: 14px;
  height: 2px;
  background: currentcolor;
  border-radius: var(--cc-radius-sm, 6px);
  opacity: 0;
}
.cloudcanvas-ui-calendar-event:is(:hover, :focus-visible, .is-selected, .is-grabbed) .cloudcanvas-ui-calendar-event-handle::before { opacity: 0.7; }

/* The range being made: a band of slots with their times in it down a column; the days of a month or the strip, lit. */
.cloudcanvas-ui-calendar-draft {
  position: absolute;
  top: calc(var(--calendar-top) * var(--cc-ui-hour-height, 48px) / 60);
  right: 1px;
  left: 1px;
  height: calc(var(--calendar-length) * var(--cc-ui-hour-height, 48px) / 60);
  padding: 0 var(--cc-space-1, 4px);
  overflow: hidden;
  font-size: var(--cc-type-xs, 11px);
  white-space: nowrap;
  color: var(--cc-ui-bar-text, var(--cc-text, #e2e8f0));
  background: var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22));
  border: 2px dashed var(--cc-ui-drop, var(--cc-accent, #38bdf8));
  border-radius: var(--cc-radius-sm, 6px);
  pointer-events: none;
}
.cloudcanvas-ui-calendar-cell.is-range, .cloudcanvas-ui-calendar-allday-cell.is-range { background: var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22)); outline: 2px dashed var(--cc-ui-drop, var(--cc-accent, #38bdf8)); outline-offset: -2px; }

@media (pointer: coarse) {
  .cloudcanvas-ui-calendar-event-handle { height: 14px; }
}
`;
