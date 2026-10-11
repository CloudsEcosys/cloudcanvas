/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The timeline's rules: the toolbar with the hint under it, the sheet, the
 * axis with the gutter's separator on its corner, the rows, and the bar - its
 * title, its status tone, its progress, the handles at its ends. The rules the
 * timeline shares with the other views - its tones, its mark when selected or
 * in hand, its heading's look, its milestone's 44px target under a finger -
 * are in `./views.js`.
 *
 * WHAT A GESTURE DOES IS SAID BEFORE IT IS MADE: the root says which ones the
 * host takes (`data-can-move`, `data-can-create`, `data-can-link`,
 * `data-can-fold`, `data-can-unlink`), so what can be moved has the grab
 * cursor, a handle that resizes the resize cursor, and a handle that is only
 * there to be dragged is drawn when it can be used: on hover, on focus and on
 * the selected row.
 *
 * A TITLE IS ALWAYS DRAWN: inside the bar it ends in an ellipsis, and beside
 * a milestone or a short bar it stands clear of the bar's handles.
 *
 * Nothing here moves: a handle appears, a band is drawn, a bar is placed;
 * none of it is animated, so there is no motion to turn off for a reader who
 * asked for less.
 */

const LINE = 'var(--cc-ui-grid-line, var(--cc-card-border, rgba(255, 255, 255, 0.1)))';
const SURFACE = 'var(--cc-ui-surface, var(--cc-card-bg, rgba(30, 41, 59, 0.85)))';
const ACCENT = 'var(--cc-accent, #38bdf8)';
const RING = 'var(--cc-focus-ring-width, 2px) solid var(--cc-focus-ring, var(--cc-accent, #38bdf8))';

export const UI_TIMELINE_CSS = `/* ------------------ UI KIT: TIMELINE ------------------ */

.cloudcanvas-ui-timeline { --timeline-gutter: var(--cc-ui-gutter, 10rem); display: grid; gap: var(--cc-space-2, 8px); min-width: 0; }
.cloudcanvas-ui-timeline-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--cc-space-2, 8px); }
.cloudcanvas-ui-timeline-scales { display: flex; gap: var(--cc-space-1, 4px); }
.cloudcanvas-ui-timeline-range { font-size: var(--cc-type-sm, 12px); color: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-timeline-hint { margin: 0; font-size: var(--cc-type-xs, 11px); color: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-timeline-sheet { position: relative; isolation: isolate; max-height: var(--cc-ui-timeline-height, 28rem); overflow: auto; border: 1px solid ${LINE}; border-radius: var(--cc-radius-md, 10px); }
.cloudcanvas-ui-timeline-grid { position: relative; width: calc(var(--timeline-gutter) + var(--timeline-width)); min-width: 100%; }
.cloudcanvas-ui-timeline-axis { position: sticky; top: 0; z-index: var(--cc-z-ui-sticky, 3); display: flex; height: 1.75rem; background: ${SURFACE}; border-bottom: 1px solid ${LINE}; }
.cloudcanvas-ui-timeline-corner { position: sticky; left: 0; z-index: var(--cc-z-ui-raised, 2); flex: none; width: var(--timeline-gutter); background: ${SURFACE}; }
.cloudcanvas-ui-timeline-ticks { position: relative; flex: none; width: var(--timeline-width); }
.cloudcanvas-ui-timeline-tick {
  position: absolute;
  top: 0;
  bottom: 0;
  left: var(--timeline-x);
  padding: var(--cc-space-1, 4px);
  font-size: var(--cc-type-xs, 11px);
  white-space: nowrap;
  color: var(--cc-text-muted, #94a3b8);
  border-left: 1px solid ${LINE};
}

/* The gutter's separator: a grip on the corner's edge, a cursor that says what a drag does. */
.cloudcanvas-ui-timeline-gutter-handle { position: absolute; top: 0; right: -3px; bottom: 0; width: 6px; cursor: col-resize; touch-action: none; border-radius: var(--cc-radius-sm, 6px); }
.cloudcanvas-ui-timeline-gutter-handle::after { content: ""; position: absolute; top: 6px; bottom: 6px; left: 2px; width: 2px; border-radius: var(--cc-radius-sm, 6px); background: var(--cc-text-muted, #94a3b8); opacity: 0.5; }
.cloudcanvas-ui-timeline-gutter-handle:is(:hover, :focus-visible, .is-grabbed)::after { background: ${ACCENT}; opacity: 1; }
.cloudcanvas-ui-timeline-gutter-handle:focus-visible { outline: ${RING}; outline-offset: 0; }

/* A group's heading: a row of its own, level 1 of the treegrid. */
.cloudcanvas-ui-timeline-group { position: sticky; left: 0; width: max-content; }
.cloudcanvas-ui-timeline-group-cell { display: flex; align-items: center; gap: var(--cc-space-1, 4px); padding: var(--cc-space-1, 4px) var(--cc-space-2, 8px); font-size: var(--cc-type-sm, 12px); font-weight: var(--cc-weight-semibold, 600); color: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-timeline-group-label:focus-visible { outline: ${RING}; outline-offset: var(--cc-focus-ring-offset, 2px); }

.cloudcanvas-ui-timeline-row { display: flex; align-items: center; min-height: 2.25rem; border-bottom: 1px solid ${LINE}; }
.cloudcanvas-ui-timeline-label {
  position: sticky;
  left: 0;
  z-index: var(--cc-z-ui-raised, 2);
  flex: none;
  width: var(--timeline-gutter);
  padding: 0 var(--cc-space-2, 8px);
  overflow: hidden;
  font-size: var(--cc-type-sm, 12px);
  white-space: nowrap;
  text-overflow: ellipsis;
  background: ${SURFACE};
  cursor: pointer;
}
.cloudcanvas-ui-timeline-label::after { content: ""; position: absolute; top: 0; right: 0; bottom: 0; border-right: 1px solid ${LINE}; }
.cloudcanvas-ui-timeline-row.is-current .cloudcanvas-ui-timeline-label { font-weight: var(--cc-weight-semibold, 600); }
.cloudcanvas-ui-timeline-track { position: relative; flex: none; width: var(--timeline-width); height: 2.25rem; }

/* A bar: its title inside (or beside it), its status in its outline and fill, its progress as the fill that is done. */
.cloudcanvas-ui-timeline-bar {
  position: absolute;
  top: 6px;
  bottom: 6px;
  left: var(--timeline-x);
  width: var(--timeline-w);
  min-width: 4px;
  display: flex;
  align-items: center;
  padding: 0 var(--cc-space-2, 8px);
  font: inherit;
  font-size: var(--cc-type-xs, 11px);
  color: var(--cc-ui-bar-text, var(--cc-text, #e2e8f0));
  background: var(--cc-ui-bar, var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22)));
  border: 1px solid var(--timeline-tone, ${ACCENT});
  border-left-width: 4px;
  border-radius: var(--cc-radius-sm, 6px);
  cursor: pointer;
}
.cloudcanvas-ui-timeline-bar[data-movable] { cursor: grab; }
.cloudcanvas-ui-timeline-bar[data-status-tone="success"] { --timeline-tone: var(--cc-tone-success, #22c55e); }
.cloudcanvas-ui-timeline-bar[data-status-tone="warning"] { --timeline-tone: var(--cc-tone-warning, #eab308); }
.cloudcanvas-ui-timeline-bar[data-status-tone="danger"] { --timeline-tone: var(--cc-tone-danger, #f87171); }
.cloudcanvas-ui-timeline-bar[data-status-tone="muted"] { --timeline-tone: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-timeline-bar::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: calc(var(--timeline-progress, 0) * 100%);
  background: var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22));
  border-radius: inherit;
}
.cloudcanvas-ui-timeline-bar[data-status-tone]::before { background: color-mix(in oklab, var(--timeline-tone) var(--timeline-fill, 40%), transparent); }
.cloudcanvas-ui-timeline-bar.is-point { top: 50%; bottom: auto; left: calc(var(--timeline-x) - 7px); width: 14px; height: 14px; padding: 0; translate: 0 -50%; rotate: 45deg; }
.cloudcanvas-ui-timeline-bar-title { position: relative; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }

/* The title of a milestone, or of a bar too short to hold it: beside it, a part of the same item. */
.cloudcanvas-ui-timeline-outside {
  position: absolute;
  top: 50%;
  left: calc(var(--timeline-x) + var(--timeline-w) + 22px);
  translate: 0 -50%;
  font-size: var(--cc-type-xs, 11px);
  white-space: nowrap;
  color: var(--cc-text, #e2e8f0);
  cursor: pointer;
}
.cloudcanvas-ui-timeline-outside.is-point { left: calc(var(--timeline-x) + 12px); }

/* The handles at a bar's ends: each resizes, and says so under the pointer. */
:is(.cloudcanvas-ui-timeline-handle, .cloudcanvas-ui-timeline-handle-start) { position: absolute; top: 0; bottom: 0; width: 10px; cursor: ew-resize; background: ${ACCENT}; opacity: 0.4; }
.cloudcanvas-ui-timeline-handle { right: 0; border-radius: 0 var(--cc-radius-sm, 6px) var(--cc-radius-sm, 6px) 0; }
.cloudcanvas-ui-timeline-handle-start { left: 0; border-radius: var(--cc-radius-sm, 6px) 0 0 var(--cc-radius-sm, 6px); }
.cloudcanvas-ui-timeline-row:is(:hover, :focus-within, .is-current) :is(.cloudcanvas-ui-timeline-handle, .cloudcanvas-ui-timeline-handle-start) { opacity: 0.75; }
.cloudcanvas-ui-timeline-now {
  position: absolute;
  top: 0;
  bottom: 0;
  left: calc(var(--timeline-gutter) + var(--timeline-x));
  width: 2px;
  pointer-events: none;
  background: var(--cc-tone-danger, #f87171);
}
`;
