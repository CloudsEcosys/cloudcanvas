/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The panel add-on's CSS chunk (`../../addons/panel.js`), injected once when the first layer is made: the layer over
 * its host, the frame with its bar and body in every place, the tab strip, the buttons, the place menu's anchor,
 * the snap preview, and the resize add-on's handles worn as invisible grips along the frame's sides.
 *
 * The layer is a root, which the core sheet makes `position: relative; overflow: hidden` and the board chunk paints
 * as a canvas. Here, by specificity alone, it covers its host, paints nothing and lets presses through; only a panel
 * takes them back - except while a modal is shown (`cc-modal`): then the layer takes every press outside it, and the
 * modal's shadow dims everything beneath. A panel is placed by the port (a transform and a size), so moving between
 * places is a transition on those three, off while a gesture holds the panel and under `prefers-reduced-motion`. The bar is
 * `PANEL_TAB_PX` (28px) tall, the same as a collapsed edge's tab, which is what placement folds a panel to. In a
 * window of its own (whose body carries `data-cc-panels`) the frame is the whole window.
 */

/** The layer, the frame in each place, its parts, the preview and the grips. */
export const PANEL_CSS = `/* ------------------ PANEL ------------------ */

[data-blit-root][data-cc-panels] {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  background: none;
  z-index: var(--cc-panel-z, 10);
}

[data-cc-panels] [data-blit].cloudcanvas-panel {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  pointer-events: auto;
  color: var(--cc-text, #e2e8f0);
  background: var(--cc-panel-bg, #151a24);
  border: 1px solid var(--cc-panel-border, var(--cc-card-border, rgba(255, 255, 255, 0.1)));
  border-radius: var(--cc-panel-radius, var(--cc-radius-md, 10px));
  box-shadow: var(--cc-panel-shadow, var(--cc-shadow-2, 0 12px 32px rgba(0, 0, 0, 0.55)));
  transition: transform var(--cc-panel-motion, 180ms) ease, width var(--cc-panel-motion, 180ms) ease, height var(--cc-panel-motion, 180ms) ease;
}

/* While a modal is shown the layer takes every press outside it; the other panels take none. */
[data-blit-root][data-cc-panels].cc-modal {
  pointer-events: auto;
}

[data-cc-panels].cc-modal [data-blit].cloudcanvas-panel:not(.cc-at-modal) {
  pointer-events: none;
}

/* Hidden outranks the frame's display: an inactive tab, a closed or a new panel. */
[data-cc-panels] [data-blit].cloudcanvas-panel[hidden] {
  display: none;
}

[data-cc-panels] .cloudcanvas-panel:is(.cc-at-left, .cc-at-right, .cc-at-top, .cc-at-bottom, .cc-at-full) {
  border-radius: 0;
}

[data-cc-panels] .cloudcanvas-panel:is(.cc-at-left, .cc-at-right, .cc-at-top, .cc-at-bottom):not(.cc-drawer) {
  box-shadow: none;
}

[data-cc-panels] .cloudcanvas-panel:is(.cc-at-float, .cc-drawer) {
  z-index: var(--cc-panel-z-over, 1);
}

[data-cc-panels] .cloudcanvas-panel.cc-at-full {
  border-width: 0;
  box-shadow: none;
  z-index: var(--cc-panel-z-full, 2);
}

[data-cc-panels] .cloudcanvas-panel.cc-at-modal {
  box-shadow: var(--cc-panel-modal-shadow, 0 0 0 100vmax rgba(0, 0, 0, 0.45), 0 24px 64px rgba(0, 0, 0, 0.6));
  z-index: var(--cc-panel-z-modal, 3);
}

[data-cc-panels] [data-blit].cloudcanvas-panel:is(.is-dragging, .is-resizing) {
  transition: none;
  z-index: var(--cc-panel-z-moving, 4);
}

@media (prefers-reduced-motion: reduce) {
  [data-cc-panels] [data-blit].cloudcanvas-panel {
    transition: none;
  }
}

.cloudcanvas-panel-bar {
  position: relative;
  display: flex;
  flex: none;
  align-items: center;
  gap: var(--cc-space-1, 4px);
  box-sizing: border-box;
  height: var(--cc-panel-bar-size, 28px);
  padding: 0 var(--cc-space-1, 4px) 0 var(--cc-space-2, 8px);
  background: var(--cc-panel-bar-bg, rgba(255, 255, 255, 0.04));
  border-bottom: 1px solid var(--cc-panel-border, var(--cc-card-border, rgba(255, 255, 255, 0.1)));
  border-top-left-radius: inherit;
  border-top-right-radius: inherit;
  font-size: var(--cc-type-sm, 12px);
  cursor: grab;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-user-drag: none;
}

.cloudcanvas-panel-bar:focus-visible {
  outline: var(--cc-focus-ring-width, 2px) solid var(--cc-focus-ring, var(--cc-accent, #38bdf8));
  outline-offset: calc(-1 * var(--cc-focus-ring-width, 2px));
}

.cloudcanvas-panel.is-dragging > .cloudcanvas-panel-bar {
  cursor: grabbing;
}

.cloudcanvas-panel-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: var(--cc-weight-semibold, 600);
}

/* More tabs than fit scroll sideways (the add-on keeps the selected one in view); none shrinks below its text. */
.cloudcanvas-panel-tabs {
  display: flex;
  flex: 1;
  align-self: stretch;
  min-width: 0;
  gap: var(--cc-space-1, 4px);
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
}

.cloudcanvas-panel-controls {
  display: flex;
  flex: none;
  gap: var(--cc-space-1, 4px);
}

.cloudcanvas-panel-title[hidden],
.cloudcanvas-panel-tabs[hidden],
.cloudcanvas-panel-control[hidden] {
  display: none;
}

.cloudcanvas-panel-tab,
.cloudcanvas-panel-control {
  margin: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

.cloudcanvas-panel-tab {
  flex: none;
  box-sizing: border-box;
  max-width: var(--cc-panel-tab-max, 16ch);
  line-height: calc(var(--cc-panel-bar-size, 28px) - 2px);
  padding: 0 var(--cc-space-2, 8px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--cc-text-muted, #94a3b8);
  border-bottom: 2px solid transparent;
}

.cloudcanvas-panel-tab[aria-selected="true"] {
  color: var(--cc-text, #e2e8f0);
  border-bottom-color: var(--cc-accent, #38bdf8);
}

.cloudcanvas-panel-control {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: calc(var(--cc-panel-bar-size, 28px) - 6px);
  height: calc(var(--cc-panel-bar-size, 28px) - 6px);
  padding: 0;
  border-radius: var(--cc-radius-sm, 6px);
}

.cloudcanvas-panel-control:hover,
.cloudcanvas-panel-control:focus-visible,
.cloudcanvas-panel-tab:hover,
.cloudcanvas-panel-tab:focus-visible {
  background: var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22));
}

/* Pressed is a ring and a fill as well as a colour. */
.cloudcanvas-panel-control[aria-pressed="true"] {
  color: var(--cc-accent, #38bdf8);
  background: var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22));
  box-shadow: var(--cc-panel-pressed, inset 0 0 0 1px currentColor);
}

/* The place menu wears the menu add-on's look, hung under the bar's right end. */
.cloudcanvas-panel-bar > .cloudcanvas-context-menu[role="menu"] {
  top: 100%;
  right: 0;
  cursor: default;
}

.cloudcanvas-panel-bar .cloudcanvas-context-menu-item[aria-checked="true"] {
  color: var(--cc-accent, #38bdf8);
}

.cloudcanvas-panel-body {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: auto;
  border-bottom-left-radius: inherit;
  border-bottom-right-radius: inherit;
  user-select: text;
  -webkit-user-select: text;
}

.cloudcanvas-panel.is-collapsed > .cloudcanvas-panel-body {
  display: none;
}

/* A collapsed edge is its tab: the bar alone, its title turned along a side edge. */
.cloudcanvas-panel.is-collapsed:is(.cc-at-left, .cc-at-right, .cc-at-top, .cc-at-bottom) > .cloudcanvas-panel-bar {
  height: 100%;
  border-bottom: 0;
  cursor: pointer;
}

.cloudcanvas-panel.is-collapsed:is(.cc-at-left, .cc-at-right) > .cloudcanvas-panel-bar {
  padding: var(--cc-space-2, 8px) 0;
  writing-mode: vertical-rl;
}

.cloudcanvas-panel.is-collapsed:is(.cc-at-left, .cc-at-right, .cc-at-top, .cc-at-bottom) .cloudcanvas-panel-controls {
  display: none;
}

/* In a window of its own, the frame is the whole window. */
body[data-cc-panels] {
  margin: 0;
  background: var(--cc-panel-bg, #151a24);
  color: var(--cc-text, #e2e8f0);
  font-family: var(--cc-font, system-ui, sans-serif);
  font-size: var(--cc-type-md, 13px);
}

body[data-cc-panels] > [data-blit].cloudcanvas-panel {
  position: fixed;
  inset: 0;
  border-width: 0;
  border-radius: 0;
  box-shadow: none;
}

/* The resize add-on's handles as grips along the frame's sides. */
[data-cc-panels] .cloudcanvas-panel > .cloudcanvas-resize-handle[data-cc-resize-handle] {
  width: var(--cc-panel-grip, 6px);
  height: var(--cc-panel-grip, 6px);
  background: transparent;
  box-shadow: none;
  border-radius: 0;
  transform: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-user-drag: none;
}

[data-cc-panels] .cloudcanvas-panel > .cloudcanvas-resize-handle:is([data-cc-resize-handle="n"], [data-cc-resize-handle="s"]) {
  right: 0;
  left: 0;
  width: auto;
}

[data-cc-panels] .cloudcanvas-panel > .cloudcanvas-resize-handle:is([data-cc-resize-handle="e"], [data-cc-resize-handle="w"]) {
  top: 0;
  bottom: 0;
  height: auto;
}

[data-cc-panels] .cloudcanvas-panel > .cloudcanvas-resize-handle:is([data-cc-resize-handle="ne"], [data-cc-resize-handle="nw"], [data-cc-resize-handle="se"], [data-cc-resize-handle="sw"]) {
  width: calc(var(--cc-panel-grip, 6px) * 2);
  height: calc(var(--cc-panel-grip, 6px) * 2);
}

.cloudcanvas-panel-preview {
  position: absolute;
  top: 0;
  left: 0;
  box-sizing: border-box;
  background: var(--cc-panel-preview, rgba(56, 189, 248, 0.16));
  border: 2px solid var(--cc-accent, #38bdf8);
  pointer-events: none;
}

.cloudcanvas-panel-preview[hidden] {
  display: none;
}

`;
