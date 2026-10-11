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

@media (pointer: coarse) {
  .cloudcanvas-ui-calendar-event-handle { height: 14px; }
}
`;
