/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The UI kit's control rules: buttons and fields, dialog, tabs, splitter,
 * results, status, toasts, composer, voice, markdown, breadcrumbs, badge, tree,
 * progress, chips, nav bar, empty state and combobox. Data, not code; joined
 * with `./views.js` by `../styles.js`. The live-region rule is the engine's own
 * (`LIVE_REGION_CSS`), so a region is hidden even where the canvas sheet is not
 * loaded and even under a CSP that refuses inline style attributes.
 */
import { LIVE_REGION_CSS } from '../../graphics/css/announce.js';

export const UI_CONTROLS_CSS = `${LIVE_REGION_CSS}/* ------------------ UI KIT: CONTROLS ------------------ */

.cloudcanvas-ui-button {
  min-height: var(--cc-control-min, 28px);
  padding: var(--cc-space-1, 4px) var(--cc-space-3, 12px);
  font: inherit;
  font-size: var(--cc-type-md, 13px);
  color: var(--cc-btn-text, #7dd3fc);
  background: var(--cc-btn-bg, rgba(56, 189, 248, 0.12));
  border: 1px solid var(--cc-btn-border, rgba(56, 189, 248, 0.35));
  border-radius: var(--cc-radius-sm, 6px);
  cursor: pointer;
}
.cloudcanvas-ui-button:hover:not(:disabled) { background: var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22)); }
.cloudcanvas-ui-button.is-primary { color: var(--cc-ui-on-accent, #0f172a); background: var(--cc-accent, #38bdf8); }
.cloudcanvas-ui-button:disabled { opacity: 0.5; cursor: not-allowed; }
.cloudcanvas-ui-field {
  box-sizing: border-box;
  min-height: var(--cc-control-min, 28px);
  padding: var(--cc-space-1, 4px) var(--cc-space-2, 8px);
  font: inherit;
  font-size: var(--cc-type-md, 13px);
  color: var(--cc-text, #e2e8f0);
  background: var(--cc-input-bg, rgba(255, 255, 255, 0.06));
  border: 1px solid var(--cc-input-border, rgba(255, 255, 255, 0.16));
  border-radius: var(--cc-radius-sm, 6px);
}
:is(.cloudcanvas-ui-button, .cloudcanvas-ui-field, .cloudcanvas-ui-tabs-tab, .cloudcanvas-ui-splitter, .cloudcanvas-ui-results-option,
  .cloudcanvas-ui-dialog-panel, .cloudcanvas-ui-kanban-card, .cloudcanvas-ui-calendar-day, .cloudcanvas-ui-calendar-day-head,
  .cloudcanvas-ui-calendar-event, .cloudcanvas-ui-calendar-more, .cloudcanvas-ui-timeline-bar, .cloudcanvas-ui-graph-node,
  .cloudcanvas-ui-breadcrumbs-open, .cloudcanvas-ui-tree-row, .cloudcanvas-ui-chips-toggle, .cloudcanvas-ui-chips-remove,
  .cloudcanvas-ui-navbar-link):focus-visible {
  outline: var(--cc-focus-ring-width, 2px) solid var(--cc-focus-ring, var(--cc-accent, #38bdf8));
  outline-offset: var(--cc-focus-ring-offset, 2px);
}
.cloudcanvas-ui-dialog, .cloudcanvas-ui-tabs, .cloudcanvas-ui-results, .cloudcanvas-ui-status, .cloudcanvas-ui-toasts,
.cloudcanvas-ui-composer, .cloudcanvas-ui-voice, .cloudcanvas-ui-markdown, .cloudcanvas-ui-breadcrumbs, .cloudcanvas-ui-tree,
.cloudcanvas-ui-progress, .cloudcanvas-ui-chips, .cloudcanvas-ui-navbar, .cloudcanvas-ui-empty {
  font-family: var(--cc-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
  color: var(--cc-text, #e2e8f0);
}
[class^="cloudcanvas-ui-"][hidden], [class*=" cloudcanvas-ui-"][hidden] { display: none; }
.cloudcanvas-ui-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

.cloudcanvas-ui-dialog {
  width: min(var(--cc-ui-dialog-width, 36rem), calc(100vw - 2rem));
  max-height: calc(100dvh - 2rem);
  padding: 0;
  background: transparent;
  border: 0;
  overflow: visible;
}
.cloudcanvas-ui-dialog::backdrop { background: var(--cc-ui-backdrop, rgba(2, 6, 23, 0.6)); }
.cloudcanvas-ui-dialog.is-modal:not([open]) { display: none; }
.cloudcanvas-ui-dialog-panel {
  display: grid;
  gap: var(--cc-space-3, 12px);
  max-height: calc(100dvh - 2rem);
  overflow: auto;
  padding: var(--cc-space-4, 16px);
  background: var(--cc-ui-surface, var(--cc-card-bg, rgba(30, 41, 59, 0.85)));
  border: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-radius: var(--cc-radius-md, 10px);
  box-shadow: var(--cc-shadow-2, 0 12px 32px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.09));
  backdrop-filter: blur(var(--cc-card-blur, 12px));
}
.cloudcanvas-ui-dialog-header { display: flex; align-items: center; justify-content: space-between; gap: var(--cc-space-2, 8px); }
.cloudcanvas-ui-dialog-title { margin: 0; font-size: var(--cc-type-lg, 15px); font-weight: var(--cc-weight-semibold, 600); }
.cloudcanvas-ui-dialog-description { margin: 0; color: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-dialog-body { min-width: 0; }

.cloudcanvas-ui-tabs { display: flex; gap: var(--cc-space-1, 4px); overflow-x: auto; scroll-snap-type: x proximity; scrollbar-width: thin; }
.cloudcanvas-ui-tabs-item { display: inline-flex; align-items: center; flex: none; scroll-snap-align: start; }
.cloudcanvas-ui-tabs-tab, .cloudcanvas-ui-tabs-close {
  min-height: var(--cc-control-min, 28px);
  padding: var(--cc-space-1, 4px) var(--cc-space-3, 12px);
  font: inherit;
  color: var(--cc-text-muted, #94a3b8);
  background: transparent;
  border: 0;
  border-bottom: 2px solid transparent;
  cursor: pointer;
}
.cloudcanvas-ui-tabs-close { padding: var(--cc-space-1, 4px); }
.cloudcanvas-ui-tabs-tab[aria-selected="true"] {
  color: var(--cc-text, #e2e8f0);
  border-bottom-color: var(--cc-accent, #38bdf8);
  font-weight: var(--cc-weight-semibold, 600);
}
.cloudcanvas-ui-tabs-tab:disabled { opacity: 0.5; cursor: not-allowed; }

.cloudcanvas-ui-splitter { flex: none; position: relative; min-width: 8px; min-height: 8px; touch-action: none; cursor: col-resize; }
.cloudcanvas-ui-splitter[aria-orientation="horizontal"] { cursor: row-resize; }
.cloudcanvas-ui-splitter::before {
  content: "";
  position: absolute;
  inset: 0;
  margin: auto;
  width: 2px;
  background: var(--cc-card-border, rgba(255, 255, 255, 0.1));
}
.cloudcanvas-ui-splitter[aria-orientation="horizontal"]::before { width: auto; height: 2px; }
.cloudcanvas-ui-splitter:hover::before, .cloudcanvas-ui-splitter.is-dragging::before { background: var(--cc-accent, #38bdf8); }

.cloudcanvas-ui-results-list { display: grid; gap: 2px; }
.cloudcanvas-ui-results-option {
  display: grid;
  padding: var(--cc-space-2, 8px);
  border-radius: var(--cc-radius-sm, 6px);
  cursor: pointer;
}
.cloudcanvas-ui-results-option[aria-selected="true"], .cloudcanvas-ui-results-option:hover { background: var(--cc-ui-selected, var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22))); }
.cloudcanvas-ui-results-detail { font-size: var(--cc-type-sm, 12px); color: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-results-empty { margin: 0; padding: var(--cc-space-2, 8px); color: var(--cc-text-muted, #94a3b8); }

.cloudcanvas-ui-status { display: flex; flex-wrap: wrap; align-items: center; gap: var(--cc-space-2, 8px); }
.cloudcanvas-ui-status-message { color: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-status[data-status="error"] .cloudcanvas-ui-status-label { color: var(--cc-tone-danger, #f87171); }
.cloudcanvas-ui-status[data-status="unavailable"] .cloudcanvas-ui-status-label { color: var(--cc-tone-warning, #eab308); }

.cloudcanvas-ui-toasts {
  position: fixed;
  inset: auto var(--cc-space-3, 12px) var(--cc-ui-toast-offset, 16px);
  z-index: var(--cc-z-ui-toast, 1300);
  display: grid;
  justify-items: center;
  gap: var(--cc-space-2, 8px);
  pointer-events: none;
}
.cloudcanvas-ui-toast {
  display: flex;
  align-items: center;
  gap: var(--cc-space-2, 8px);
  max-width: min(32rem, 100%);
  padding: var(--cc-space-2, 8px) var(--cc-space-3, 12px);
  color: var(--cc-text, #e2e8f0);
  background: var(--cc-ui-surface, var(--cc-card-bg, rgba(30, 41, 59, 0.85)));
  border: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-left: 4px solid var(--cc-tone-info, #38bdf8);
  border-radius: var(--cc-radius-md, 10px);
  box-shadow: var(--cc-shadow-2, 0 12px 32px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.09));
  pointer-events: auto;
}
.cloudcanvas-ui-toast[data-tone="success"] { border-left-color: var(--cc-tone-success, #22c55e); }
.cloudcanvas-ui-toast[data-tone="warning"] { border-left-color: var(--cc-tone-warning, #eab308); }
.cloudcanvas-ui-toast[data-tone="danger"] { border-left-color: var(--cc-tone-danger, #f87171); }
.cloudcanvas-ui-toast-message { flex: 1; }

.cloudcanvas-ui-composer { display: grid; gap: var(--cc-space-2, 8px); }
.cloudcanvas-ui-composer-input { width: 100%; min-height: 4.5rem; resize: vertical; }
.cloudcanvas-ui-composer-actions { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: flex-end; gap: var(--cc-space-2, 8px); }
.cloudcanvas-ui-composer-voice { margin-right: auto; }
.cloudcanvas-ui-composer.is-pending .cloudcanvas-ui-composer-input { opacity: 0.7; }

.cloudcanvas-ui-voice { display: grid; gap: var(--cc-space-2, 8px); justify-items: start; }
.cloudcanvas-ui-voice.is-listening .cloudcanvas-ui-voice-mic { color: var(--cc-ui-on-accent, #0f172a); background: var(--cc-tone-danger, #f87171); }
.cloudcanvas-ui-voice-consent, .cloudcanvas-ui-voice-review { display: flex; flex-wrap: wrap; gap: var(--cc-space-2, 8px); align-items: center; }
.cloudcanvas-ui-voice-consent-text { flex-basis: 100%; margin: 0; font-size: var(--cc-type-sm, 12px); color: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-voice-status { margin: 0; font-size: var(--cc-type-sm, 12px); color: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-voice-status:empty { display: none; }
.cloudcanvas-ui-voice-preview { flex-basis: 100%; min-height: 3rem; }

.cloudcanvas-ui-markdown { line-height: 1.5; overflow-wrap: anywhere; }
.cloudcanvas-ui-markdown :is(p, ul, ol, blockquote, pre) { margin: 0 0 var(--cc-space-2, 8px); }
.cloudcanvas-ui-markdown :is(h1, h2, h3, h4, h5, h6) { margin: var(--cc-space-3, 12px) 0 var(--cc-space-1, 4px); font-weight: var(--cc-weight-semibold, 600); }
.cloudcanvas-ui-markdown :is(ul, ol) { padding-left: var(--cc-space-4, 16px); }
.cloudcanvas-ui-markdown blockquote {
  padding: 0 var(--cc-space-3, 12px);
  color: var(--cc-text-muted, #94a3b8);
  border-left: 3px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
}
.cloudcanvas-ui-markdown :is(code, pre) { font-family: var(--cc-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace); font-size: var(--cc-type-sm, 12px); }
.cloudcanvas-ui-markdown pre { padding: var(--cc-space-2, 8px); overflow-x: auto; background: var(--cc-input-bg, rgba(255, 255, 255, 0.06)); border-radius: var(--cc-radius-sm, 6px); }
.cloudcanvas-ui-markdown a { color: var(--cc-accent, #38bdf8); }
.cloudcanvas-ui-markdown-task-item { list-style: none; }
.cloudcanvas-ui-markdown-mention { color: var(--cc-accent, #38bdf8); font-weight: var(--cc-weight-medium, 500); }

.cloudcanvas-ui-breadcrumbs { font-size: var(--cc-type-sm, 12px); color: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-breadcrumbs-list { display: flex; flex-wrap: wrap; align-items: center; gap: var(--cc-space-1, 4px); margin: 0; padding: 0; list-style: none; }
.cloudcanvas-ui-breadcrumbs-item { position: relative; display: inline-flex; align-items: center; gap: var(--cc-space-1, 4px); min-width: 0; overflow-wrap: anywhere; }
.cloudcanvas-ui-breadcrumbs-item + .cloudcanvas-ui-breadcrumbs-item::before {
  content: "";
  flex: none;
  width: 0.4em;
  height: 0.4em;
  border-top: 1px solid var(--cc-text-muted, #94a3b8);
  border-right: 1px solid var(--cc-text-muted, #94a3b8);
  transform: rotate(45deg);
}
.cloudcanvas-ui-breadcrumbs-open {
  padding: 0 var(--cc-space-1, 4px);
  font: inherit;
  color: var(--cc-accent, #38bdf8);
  background: transparent;
  border: 0;
  border-radius: var(--cc-radius-sm, 6px);
  cursor: pointer;
}
.cloudcanvas-ui-breadcrumbs-open:hover { text-decoration: underline; }
.cloudcanvas-ui-breadcrumbs-item[aria-current="page"] { color: var(--cc-text, #e2e8f0); font-weight: var(--cc-weight-semibold, 600); }

.cloudcanvas-ui-badge {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 var(--cc-space-1, 4px);
  font: inherit;
  font-size: var(--cc-type-xs, 11px);
  font-weight: var(--cc-weight-semibold, 600);
  line-height: 1;
  color: var(--cc-ui-on-accent, #0f172a);
  background: var(--cc-accent, #38bdf8);
  border-radius: var(--cc-radius-pill, 9999px);
  box-sizing: border-box;
}
.cloudcanvas-ui-badge.is-dot {
  min-width: 0.5rem;
  width: 0.5rem;
  height: 0.5rem;
  padding: 0;
}
.cloudcanvas-ui-badge[data-tone="danger"] { background: var(--cc-tone-danger, #f87171); }
.cloudcanvas-ui-badge[data-tone="warning"] { background: var(--cc-tone-warning, #eab308); }
.cloudcanvas-ui-badge[data-tone="success"] { background: var(--cc-tone-success, #22c55e); }

.cloudcanvas-ui-tree { display: grid; gap: 2px; }
.cloudcanvas-ui-tree-row {
  display: flex;
  align-items: center;
  gap: var(--cc-space-1, 4px);
  width: 100%;
  min-height: var(--cc-control-min, 28px);
  padding: 0 var(--cc-space-2, 8px);
  font: inherit;
  text-align: left;
  color: inherit;
  background: transparent;
  border: 0;
  border-left: 3px solid transparent;
  border-radius: var(--cc-radius-sm, 6px);
  cursor: pointer;
}
.cloudcanvas-ui-tree-row:hover, .cloudcanvas-ui-tree-row[aria-selected="true"] { background: var(--cc-ui-selected, var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22))); }
.cloudcanvas-ui-tree-row[aria-selected="true"] { font-weight: var(--cc-weight-semibold, 600); }
.cloudcanvas-ui-tree-indent { flex: none; width: calc(var(--tree-level, 0) * var(--cc-space-4, 16px)); }
.cloudcanvas-ui-tree-twisty { flex: none; display: inline-grid; place-items: center; width: 1.25em; height: 1.25em; visibility: hidden; }
.cloudcanvas-ui-tree-twisty::before {
  content: "";
  width: 0.4em;
  height: 0.4em;
  border-top: 1px solid var(--cc-text-muted, #94a3b8);
  border-right: 1px solid var(--cc-text-muted, #94a3b8);
  transform: rotate(45deg);
}
.cloudcanvas-ui-tree-row[aria-expanded] .cloudcanvas-ui-tree-twisty { visibility: visible; }
.cloudcanvas-ui-tree-row[aria-expanded="true"] .cloudcanvas-ui-tree-twisty::before { transform: rotate(135deg); }
.cloudcanvas-ui-tree-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cloudcanvas-ui-tree-count { flex: none; font-size: var(--cc-type-xs, 11px); color: var(--cc-text-muted, #94a3b8); }

.cloudcanvas-ui-progress { display: grid; gap: var(--cc-space-1, 4px); }
.cloudcanvas-ui-progress-label { font-size: var(--cc-type-sm, 12px); color: var(--cc-text-muted, #94a3b8); }
.cloudcanvas-ui-progress-bar { width: 100%; height: 0.5rem; accent-color: var(--cc-accent, #38bdf8); }

.cloudcanvas-ui-chips { display: flex; flex-wrap: wrap; gap: var(--cc-space-1, 4px); }
.cloudcanvas-ui-chips-chip {
  display: inline-flex;
  align-items: stretch;
  max-width: 100%;
  font-size: var(--cc-type-sm, 12px);
  border: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-radius: var(--cc-radius-sm, 6px);
}
.cloudcanvas-ui-chips-chip[data-tone] { border-left-width: 3px; }
.cloudcanvas-ui-chips-toggle, .cloudcanvas-ui-chips-label, .cloudcanvas-ui-chips-remove {
  display: inline-flex;
  align-items: center;
  min-height: var(--cc-control-min, 28px);
  padding: 0 var(--cc-space-2, 8px);
  font: inherit;
  color: inherit;
  background: transparent;
  border: 0;
}
.cloudcanvas-ui-chips-toggle, .cloudcanvas-ui-chips-remove { cursor: pointer; }
.cloudcanvas-ui-chips-toggle:hover, .cloudcanvas-ui-chips-remove:hover { background: var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22)); }
.cloudcanvas-ui-chips-toggle[aria-pressed="true"] {
  font-weight: var(--cc-weight-semibold, 600);
  background: var(--cc-ui-selected, var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22)));
}
.cloudcanvas-ui-chips-remove { padding: 0 var(--cc-space-1, 4px); color: var(--cc-text-muted, #94a3b8); }

.cloudcanvas-ui-navbar-list { display: flex; gap: var(--cc-space-1, 4px); margin: 0; padding: 0; overflow-x: auto; list-style: none; }
.cloudcanvas-ui-navbar-item { flex: none; }
.cloudcanvas-ui-navbar-link {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--cc-space-1, 4px);
  width: 100%;
  min-height: var(--cc-control-min, 28px);
  padding: var(--cc-space-1, 4px) var(--cc-space-3, 12px);
  font: inherit;
  color: var(--cc-text-muted, #94a3b8);
  background: transparent;
  border: 0;
  border-bottom: 2px solid transparent;
  cursor: pointer;
}
.cloudcanvas-ui-navbar-link:hover { color: var(--cc-text, #e2e8f0); }
.cloudcanvas-ui-navbar-link[aria-current="page"] {
  font-weight: var(--cc-weight-semibold, 600);
  color: var(--cc-text, #e2e8f0);
  border-bottom-color: var(--cc-accent, #38bdf8);
}
.cloudcanvas-ui-navbar[data-placement="bottom"] .cloudcanvas-ui-navbar-list { gap: 0; overflow-x: visible; }
.cloudcanvas-ui-navbar[data-placement="bottom"] .cloudcanvas-ui-navbar-item { flex: 1; min-width: 0; }
.cloudcanvas-ui-navbar[data-placement="bottom"] .cloudcanvas-ui-navbar-link { border-bottom: 0; border-top: 2px solid transparent; }
.cloudcanvas-ui-navbar[data-placement="bottom"] .cloudcanvas-ui-navbar-link[aria-current="page"] { border-top-color: var(--cc-accent, #38bdf8); }

.cloudcanvas-ui-empty { display: grid; justify-items: center; gap: var(--cc-space-2, 8px); padding: var(--cc-space-4, 16px); text-align: center; }
.cloudcanvas-ui-empty-title { margin: 0; font-size: var(--cc-type-lg, 15px); font-weight: var(--cc-weight-semibold, 600); }
.cloudcanvas-ui-empty-body { margin: 0; color: var(--cc-text-muted, #94a3b8); }

.cloudcanvas-ui-combobox {
  position: absolute;
  z-index: var(--cc-z-ui-raised, 2);
  max-width: min(24rem, calc(100vw - 2rem));
  max-height: 16rem;
  overflow: auto;
  padding: var(--cc-space-1, 4px);
  background: var(--cc-ui-surface, var(--cc-card-bg, rgba(30, 41, 59, 0.85)));
  border: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-radius: var(--cc-radius-md, 10px);
  box-shadow: var(--cc-shadow-2, 0 12px 32px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.09));
  backdrop-filter: blur(var(--cc-card-blur, 12px));
}

@media (pointer: coarse) {
  :is(.cloudcanvas-ui-button, .cloudcanvas-ui-field, .cloudcanvas-ui-tabs-tab, .cloudcanvas-ui-tabs-close, .cloudcanvas-ui-breadcrumbs-open,
    .cloudcanvas-ui-tree-row, .cloudcanvas-ui-chips-toggle, .cloudcanvas-ui-chips-remove, .cloudcanvas-ui-navbar-link) { min-height: var(--cc-control-min-coarse, 44px); }
  .cloudcanvas-ui-splitter { min-width: 20px; min-height: 20px; }
}
@media (max-width: 40rem) {
  .cloudcanvas-ui-dialog { width: 100vw; max-width: 100vw; margin: auto 0 0; }
  .cloudcanvas-ui-dialog-panel { border-radius: var(--cc-radius-md, 10px) var(--cc-radius-md, 10px) 0 0; }
}
`;
