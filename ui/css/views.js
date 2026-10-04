/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The UI kit's view rules: kanban, calendar, timeline and graph, and the tones
 * they share with the chips and the tree: a tone colours the leading edge, the
 * meaning tones (success, warning, danger) and the eight category tones alike.
 * Geometry that changes per element arrives as inline custom properties
 * written through the CSSOM (`--calendar-top`, `--timeline-x`, `--graph-x`,
 * ...); every size a theme may want is a `--cc-ui-*` token with its default in
 * the fallback.
 */

const FONT = 'var(--cc-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif)';
const LINE = 'var(--cc-ui-grid-line, var(--cc-card-border, rgba(255, 255, 255, 0.1)))';

export const UI_VIEWS_CSS = `/* ------------------ UI KIT: VIEWS ------------------ */

.cloudcanvas-ui-kanban, .cloudcanvas-ui-calendar, .cloudcanvas-ui-timeline, .cloudcanvas-ui-graph {
  font-family: ${FONT};
  color: var(--cc-text, #e2e8f0);
}
:is(.cloudcanvas-ui-kanban-card, .cloudcanvas-ui-calendar-event, .cloudcanvas-ui-timeline-bar, .cloudcanvas-ui-graph-node)[data-tone="success"] { border-left-color: var(--cc-tone-success, #22c55e); }
:is(.cloudcanvas-ui-kanban-card, .cloudcanvas-ui-calendar-event, .cloudcanvas-ui-timeline-bar, .cloudcanvas-ui-graph-node)[data-tone="warning"] { border-left-color: var(--cc-tone-warning, #eab308); }
:is(.cloudcanvas-ui-kanban-card, .cloudcanvas-ui-calendar-event, .cloudcanvas-ui-timeline-bar, .cloudcanvas-ui-graph-node)[data-tone="danger"] { border-left-color: var(--cc-tone-danger, #f87171); }
/* Category tones one to eight: the host's own palette, on the same edge. */
:is(.cloudcanvas-ui-kanban-card, .cloudcanvas-ui-calendar-event, .cloudcanvas-ui-timeline-bar, .cloudcanvas-ui-chips-chip, .cloudcanvas-ui-tree-row)[data-tone="1"] { border-left-color: var(--cc-ui-tone-1, #60a5fa); }
:is(.cloudcanvas-ui-kanban-card, .cloudcanvas-ui-calendar-event, .cloudcanvas-ui-timeline-bar, .cloudcanvas-ui-chips-chip, .cloudcanvas-ui-tree-row)[data-tone="2"] { border-left-color: var(--cc-ui-tone-2, #a78bfa); }
:is(.cloudcanvas-ui-kanban-card, .cloudcanvas-ui-calendar-event, .cloudcanvas-ui-timeline-bar, .cloudcanvas-ui-chips-chip, .cloudcanvas-ui-tree-row)[data-tone="3"] { border-left-color: var(--cc-ui-tone-3, #f472b6); }
:is(.cloudcanvas-ui-kanban-card, .cloudcanvas-ui-calendar-event, .cloudcanvas-ui-timeline-bar, .cloudcanvas-ui-chips-chip, .cloudcanvas-ui-tree-row)[data-tone="4"] { border-left-color: var(--cc-ui-tone-4, #fb923c); }
:is(.cloudcanvas-ui-kanban-card, .cloudcanvas-ui-calendar-event, .cloudcanvas-ui-timeline-bar, .cloudcanvas-ui-chips-chip, .cloudcanvas-ui-tree-row)[data-tone="5"] { border-left-color: var(--cc-ui-tone-5, #facc15); }
:is(.cloudcanvas-ui-kanban-card, .cloudcanvas-ui-calendar-event, .cloudcanvas-ui-timeline-bar, .cloudcanvas-ui-chips-chip, .cloudcanvas-ui-tree-row)[data-tone="6"] { border-left-color: var(--cc-ui-tone-6, #4ade80); }
:is(.cloudcanvas-ui-kanban-card, .cloudcanvas-ui-calendar-event, .cloudcanvas-ui-timeline-bar, .cloudcanvas-ui-chips-chip, .cloudcanvas-ui-tree-row)[data-tone="7"] { border-left-color: var(--cc-ui-tone-7, #2dd4bf); }
:is(.cloudcanvas-ui-kanban-card, .cloudcanvas-ui-calendar-event, .cloudcanvas-ui-timeline-bar, .cloudcanvas-ui-chips-chip, .cloudcanvas-ui-tree-row)[data-tone="8"] { border-left-color: var(--cc-ui-tone-8, #94a3b8); }
:is(.cloudcanvas-ui-kanban-item, .cloudcanvas-ui-calendar-event, .cloudcanvas-ui-timeline-bar, .cloudcanvas-ui-graph-node).is-grabbed,
.cloudcanvas-ui-kanban-item.is-grabbed .cloudcanvas-ui-kanban-card {
  outline: 2px dashed var(--cc-ui-drop, var(--cc-accent, #38bdf8));
  outline-offset: 2px;
}

/* Kanban */
.cloudcanvas-ui-kanban-lane {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(15rem, 1fr);
  gap: var(--cc-space-3, 12px);
  overflow-x: auto;
  scroll-snap-type: x proximity;
  isolation: isolate;
}
.cloudcanvas-ui-kanban-column {
  display: flex;
  flex-direction: column;
  min-height: 8rem;
  padding: var(--cc-space-2, 8px);
  background: var(--cc-scope-bg, rgba(0, 0, 0, 0.2));
  border: 1px solid ${LINE};
  border-radius: var(--cc-radius-md, 10px);
  scroll-snap-align: start;
}
.cloudcanvas-ui-kanban-column.is-drop-target { outline: 2px dashed var(--cc-ui-drop, var(--cc-accent, #38bdf8)); }
.cloudcanvas-ui-kanban-column.is-refused { outline: 2px dashed var(--cc-tone-danger, #f87171); }
.cloudcanvas-ui-kanban-heading {
  display: flex;
  justify-content: space-between;
  margin: 0 0 var(--cc-space-2, 8px);
  font-size: var(--cc-type-sm, 12px);
  font-weight: var(--cc-weight-semibold, 600);
}
.cloudcanvas-ui-kanban-count { color: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-kanban-cards { flex: 1; display: grid; align-content: start; gap: var(--cc-space-2, 8px); margin: 0; padding: 0; list-style: none; }
.cloudcanvas-ui-kanban-item.is-dragging { position: relative; z-index: var(--cc-z-ui-raised, 2); pointer-events: none; opacity: 0.85; }
.cloudcanvas-ui-kanban-card {
  display: grid;
  gap: 2px;
  width: 100%;
  padding: var(--cc-space-2, 8px) var(--cc-space-3, 12px);
  font: inherit;
  text-align: left;
  color: var(--cc-text, #e2e8f0);
  background: var(--cc-card-bg, rgba(30, 41, 59, 0.85));
  border: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-left: 4px solid var(--cc-accent, #38bdf8);
  border-radius: var(--cc-radius-sm, 6px);
  cursor: grab;
  touch-action: manipulation;
}
.cloudcanvas-ui-kanban-title { font-weight: var(--cc-weight-medium, 500); }
.cloudcanvas-ui-kanban-detail, .cloudcanvas-ui-kanban-meta { font-size: var(--cc-type-sm, 12px); color: var(--cc-text-muted, #94a3b8); }

/* Calendar */
.cloudcanvas-ui-calendar { display: grid; gap: var(--cc-space-2, 8px); }
.cloudcanvas-ui-calendar-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--cc-space-2, 8px); }
.cloudcanvas-ui-calendar-nav, .cloudcanvas-ui-calendar-views { display: flex; gap: var(--cc-space-1, 4px); }
.cloudcanvas-ui-calendar-title { flex: 1 1 10rem; margin: 0; font-size: var(--cc-type-lg, 15px); font-weight: var(--cc-weight-semibold, 600); }
:is(.cloudcanvas-ui-calendar-view, .cloudcanvas-ui-timeline-scale)[aria-pressed="true"] { color: var(--cc-ui-on-accent, #0f172a); background: var(--cc-accent, #38bdf8); }
:is(.cloudcanvas-ui-calendar-month, .cloudcanvas-ui-calendar-time) { border: 1px solid ${LINE}; border-radius: var(--cc-radius-md, 10px); overflow: hidden; }
:is(.cloudcanvas-ui-calendar-weekdays, .cloudcanvas-ui-calendar-week) { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); }
.cloudcanvas-ui-calendar-weekday { padding: var(--cc-space-1, 4px); font-size: var(--cc-type-xs, 11px); text-align: center; color: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-calendar-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  min-height: 5.5rem;
  padding: var(--cc-space-1, 4px);
  border-top: 1px solid ${LINE};
  border-left: 1px solid ${LINE};
  cursor: pointer;
}
.cloudcanvas-ui-calendar-cell:first-child { border-left: 0; }
.cloudcanvas-ui-calendar-cell.is-outside { opacity: 0.55; }
:is(.cloudcanvas-ui-calendar-day, .cloudcanvas-ui-calendar-day-head, .cloudcanvas-ui-calendar-more) {
  font: inherit;
  font-size: var(--cc-type-sm, 12px);
  color: var(--cc-text, #e2e8f0);
  background: transparent;
  border: 0;
  cursor: pointer;
}
.cloudcanvas-ui-calendar-day { align-self: flex-end; min-width: 1.75rem; min-height: 1.75rem; border-radius: var(--cc-radius-pill, 9999px); }
:is(.cloudcanvas-ui-calendar-cell.is-today .cloudcanvas-ui-calendar-day, .cloudcanvas-ui-calendar-day-head.is-today) {
  color: var(--cc-ui-on-accent, #0f172a);
  background: var(--cc-ui-today, var(--cc-accent, #38bdf8));
}
.cloudcanvas-ui-calendar-more { padding: 0 var(--cc-space-1, 4px); text-align: left; color: var(--cc-accent, #38bdf8); }
.cloudcanvas-ui-calendar-events { display: grid; gap: 2px; min-width: 0; }
.cloudcanvas-ui-calendar-event {
  display: flex;
  gap: var(--cc-space-1, 4px);
  min-width: 0;
  padding: 0 var(--cc-space-1, 4px);
  overflow: hidden;
  font: inherit;
  font-size: var(--cc-type-xs, 11px);
  text-align: left;
  white-space: nowrap;
  color: var(--cc-ui-bar-text, var(--cc-text, #e2e8f0));
  background: var(--cc-ui-bar, var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22)));
  border: 0;
  border-left: 3px solid var(--cc-accent, #38bdf8);
  border-radius: var(--cc-radius-sm, 6px);
  cursor: pointer;
}
.cloudcanvas-ui-calendar-event[data-movable] { cursor: grab; }
.cloudcanvas-ui-calendar-event-title { overflow: hidden; text-overflow: ellipsis; }
.cloudcanvas-ui-calendar-event-time { opacity: 0.8; }
:is(.cloudcanvas-ui-calendar-time-head, .cloudcanvas-ui-calendar-allday, .cloudcanvas-ui-calendar-time-grid) {
  display: grid;
  grid-template-columns: 3.5rem repeat(var(--calendar-days), minmax(0, 1fr));
}
.cloudcanvas-ui-calendar-day-head { padding: var(--cc-space-1, 4px); border-left: 1px solid ${LINE}; }
.cloudcanvas-ui-calendar-gutter { padding: var(--cc-space-1, 4px); font-size: var(--cc-type-xs, 11px); color: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-calendar-allday { border-top: 1px solid ${LINE}; }
.cloudcanvas-ui-calendar-allday-cell { display: grid; align-content: start; gap: 2px; min-height: 1.75rem; min-width: 0; padding: var(--cc-space-1, 4px); border-left: 1px solid ${LINE}; }
.cloudcanvas-ui-calendar-scroller { max-height: var(--cc-ui-time-height, 32rem); overflow-y: auto; border-top: 1px solid ${LINE}; }
.cloudcanvas-ui-calendar-time-grid { height: calc(var(--calendar-hours) * var(--cc-ui-hour-height, 48px)); }
.cloudcanvas-ui-calendar-hours { display: grid; grid-template-rows: repeat(var(--calendar-hours), 1fr); }
.cloudcanvas-ui-calendar-hour { padding: 0 var(--cc-space-1, 4px); font-size: var(--cc-type-xs, 11px); color: var(--cc-text-muted, #94a3b8); border-top: 1px solid ${LINE}; }
.cloudcanvas-ui-calendar-column {
  position: relative;
  min-width: 0;
  border-left: 1px solid ${LINE};
  background-image: var(--cc-ui-hour-lines, repeating-linear-gradient(to bottom, rgba(255, 255, 255, 0.06) 0 1px, transparent 1px var(--cc-ui-hour-height, 48px)));
  cursor: pointer;
}
.cloudcanvas-ui-calendar-timed {
  position: absolute;
  top: calc(var(--calendar-top) * var(--cc-ui-hour-height, 48px) / 60);
  left: calc(var(--calendar-lane) * 100% / var(--calendar-lanes) + 1px);
  width: calc(100% / var(--calendar-lanes) - 2px);
  height: calc(var(--calendar-length) * var(--cc-ui-hour-height, 48px) / 60 - 2px);
  flex-direction: column;
  white-space: normal;
}

/* Timeline */
.cloudcanvas-ui-timeline { --timeline-gutter: var(--cc-ui-gutter, 10rem); display: grid; gap: var(--cc-space-2, 8px); }
.cloudcanvas-ui-timeline-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--cc-space-2, 8px); }
.cloudcanvas-ui-timeline-scales { display: flex; gap: var(--cc-space-1, 4px); }
.cloudcanvas-ui-timeline-range { font-size: var(--cc-type-sm, 12px); color: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-timeline-sheet { position: relative; isolation: isolate; max-height: var(--cc-ui-timeline-height, 28rem); overflow: auto; border: 1px solid ${LINE}; border-radius: var(--cc-radius-md, 10px); }
.cloudcanvas-ui-timeline-grid { position: relative; width: calc(var(--timeline-gutter) + var(--timeline-width)); min-width: 100%; }
.cloudcanvas-ui-timeline-axis { position: sticky; top: 0; z-index: var(--cc-z-ui-sticky, 3); display: flex; height: 1.75rem; background: var(--cc-ui-surface, var(--cc-card-bg, rgba(30, 41, 59, 0.85))); border-bottom: 1px solid ${LINE}; }
.cloudcanvas-ui-timeline-corner { position: sticky; left: 0; z-index: var(--cc-z-ui-raised, 2); flex: none; width: var(--timeline-gutter); background: var(--cc-ui-surface, var(--cc-card-bg, rgba(30, 41, 59, 0.85))); }
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
.cloudcanvas-ui-timeline-group { position: sticky; left: 0; width: max-content; padding: var(--cc-space-1, 4px) var(--cc-space-2, 8px); font-size: var(--cc-type-sm, 12px); font-weight: var(--cc-weight-semibold, 600); color: var(--cc-text-muted, #94a3b8); }
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
  background: var(--cc-ui-surface, var(--cc-card-bg, rgba(30, 41, 59, 0.85)));
}
.cloudcanvas-ui-timeline-track { position: relative; flex: none; width: var(--timeline-width); height: 2.25rem; }
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
  overflow: hidden;
  font: inherit;
  font-size: var(--cc-type-xs, 11px);
  color: var(--cc-ui-bar-text, var(--cc-text, #e2e8f0));
  background: var(--cc-ui-bar, var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22)));
  border: 1px solid var(--cc-accent, #38bdf8);
  border-left-width: 4px;
  border-radius: var(--cc-radius-sm, 6px);
  cursor: pointer;
}
.cloudcanvas-ui-timeline-bar[data-movable] { cursor: grab; }
.cloudcanvas-ui-timeline-bar::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: calc(var(--timeline-progress, 0) * 100%);
  background: var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22));
}
.cloudcanvas-ui-timeline-bar.is-point { top: 50%; bottom: auto; left: calc(var(--timeline-x) - 7px); width: 14px; height: 14px; padding: 0; translate: 0 -50%; rotate: 45deg; }
.cloudcanvas-ui-timeline-bar-title { position: relative; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.cloudcanvas-ui-timeline-handle { position: absolute; top: 0; right: 0; bottom: 0; width: 10px; cursor: ew-resize; background: var(--cc-accent, #38bdf8); opacity: 0.4; }
.cloudcanvas-ui-timeline-now {
  position: absolute;
  top: 0;
  bottom: 0;
  left: calc(var(--timeline-gutter) + var(--timeline-x));
  width: 2px;
  pointer-events: none;
  background: var(--cc-tone-danger, #f87171);
}

/* Graph */
.cloudcanvas-ui-graph { display: grid; gap: var(--cc-space-2, 8px); }
.cloudcanvas-ui-graph-toolbar { display: flex; gap: var(--cc-space-1, 4px); }
.cloudcanvas-ui-graph-viewport {
  position: relative;
  height: var(--cc-ui-graph-height, 24rem);
  overflow: hidden;
  touch-action: none;
  background: var(--cc-scope-bg, rgba(0, 0, 0, 0.2));
  border: 1px solid ${LINE};
  border-radius: var(--cc-radius-md, 10px);
  cursor: grab;
}
.cloudcanvas-ui-graph-viewport.is-panning { cursor: grabbing; }
:is(.cloudcanvas-ui-graph-world, .cloudcanvas-ui-graph-edges, .cloudcanvas-ui-graph-nodes) { position: absolute; top: 0; left: 0; transform-origin: 0 0; overflow: visible; }
.cloudcanvas-ui-graph-edge { stroke: var(--cc-connector, rgba(56, 189, 248, 0.6)); stroke-width: 1.5; }
.cloudcanvas-ui-graph-arrow { fill: var(--cc-connector, rgba(56, 189, 248, 0.6)); }
.cloudcanvas-ui-graph-edge-label { fill: var(--cc-text-muted, #94a3b8); font-size: var(--cc-type-xs, 11px); }
.cloudcanvas-ui-graph-node {
  position: absolute;
  top: 0;
  left: 0;
  box-sizing: border-box;
  translate: var(--graph-x) var(--graph-y);
  padding: 0 var(--cc-space-2, 8px);
  overflow: hidden;
  font: inherit;
  font-size: var(--cc-type-sm, 12px);
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--cc-text, #e2e8f0);
  background: var(--cc-card-bg, rgba(30, 41, 59, 0.85));
  border: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-left: 4px solid var(--cc-accent, #38bdf8);
  border-radius: var(--cc-radius-md, 10px);
  box-shadow: var(--cc-shadow-1, 0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06));
  cursor: pointer;
}
.cloudcanvas-ui-graph-node.is-selected { border-color: var(--cc-accent, #38bdf8); }

@media (max-width: 40rem) {
  .cloudcanvas-ui-kanban-lane { grid-auto-columns: 85%; }
  .cloudcanvas-ui-timeline { --timeline-gutter: var(--cc-ui-gutter, 6rem); }
  :is(.cloudcanvas-ui-calendar-time-head, .cloudcanvas-ui-calendar-allday, .cloudcanvas-ui-calendar-time-grid) {
    grid-template-columns: 2.5rem repeat(var(--calendar-days), minmax(0, 1fr));
  }
  .cloudcanvas-ui-calendar-cell { min-height: 4rem; }
}
@media (pointer: coarse) {
  :is(.cloudcanvas-ui-calendar-day, .cloudcanvas-ui-calendar-day-head) { min-height: 2.25rem; }
}
`;
