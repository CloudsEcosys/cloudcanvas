/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The UI kit's rules for a tab strip (`../tabs.js`): a row of folder tabs.
 * Data, not code; joined with the other chunks by `../styles.js`, before
 * `./tabs-layers.js`, which draws what stands behind a tab. What is said here
 * is not shipped; the sheet itself carries only a line where a rule needs one.
 *
 * EVERY TAB IS A FOLDER TAB, with a stack behind it or with none: rounded top
 * corners, a flat foot on the strip's baseline, a hairline edge, and a soft
 * shadow on what is behind it. A close control is the far end of the same tab.
 * A strip does not change shape when one of its tabs gains its first layer.
 *
 * THE ACTIVE TAB STANDS IN FRONT: as tall as the strip, on the lit face, its
 * foot marked to its far end and its label heavier. Every other row is one
 * step back, exactly as a layer is - a step lower and one wash of shade more -
 * and brings its own layers back with it. A row says which it is
 * (`is-active`); with nothing selected, none is in front. A tab is labelled in
 * the text colour, as a layer is: a muted label would not clear 4.5:1 on a
 * face in the shade. A flag that rises out of its tab (`--cc-ui-flag-rise`)
 * stands as high on a tab a step back as on the one in front - what its tab
 * lost, it gains - and a flag given no rise stays in the middle of its tab.
 *
 * A FOLDER TAB IS NOT SEEN THROUGH. The kit's surface is translucent, and a
 * translucent tab would tint what it overlaps instead of hiding it. So a face
 * is that surface laid on the page's own colour (`--cc-bg`): the same colour
 * the surface shows over the page, and nothing behind it shows. The two washes
 * every face is made of are named once, on the strip.
 *
 * A LONG LABEL IS CUT with an ellipsis at `--cc-ui-tab-width`, and said whole
 * in the tab's title. It is cut across only (`overflow-x: clip`), so a flag
 * still stands out of the top of its tab. A badged tab is not cut: its label
 * is bare text beside the badge, with no box of its own to cut it in, and
 * cutting the tab instead would take the badge first.
 *
 * WHAT A ROW CLIPS. A stack keeps to its own row, so a layer that opens out
 * never widens the strip - and a ring drawn outside a tab would be cut at the
 * row's edge. So a tab wears its ring inside, and so does a tab being moved.
 *
 * A MOVE (`../tabs-reorder.js`). The tab in hand is outlined inside its own
 * face, and the place it would land is a bar at that edge of the row it would
 * stand beside, edged in the page's colour so it is told from any face it lies
 * over. Neither takes room, so nothing shifts under the pointer; a row is the
 * bar's frame only while it carries one.
 */
export const UI_TABS_CSS = `
/* ------------------ UI KIT: TABS ------------------ */

/* A strip that scrolls clips, so it keeps the room a risen flag stands in. */
.cloudcanvas-ui-tabs {
  --tab-face: linear-gradient(var(--cc-ui-surface, var(--cc-card-bg, rgba(30, 41, 59, 0.85))), var(--cc-ui-surface, var(--cc-card-bg, rgba(30, 41, 59, 0.85))));
  --layer-shade: linear-gradient(var(--cc-ui-tab-layer, var(--cc-scope-bg, rgba(0, 0, 0, 0.2))), var(--cc-ui-tab-layer, var(--cc-scope-bg, rgba(0, 0, 0, 0.2))));
  display: flex;
  gap: var(--cc-space-1, 4px);
  padding-top: var(--cc-ui-flag-rise, 0px);
  overflow-x: auto;
  scroll-snap-type: x proximity;
  scrollbar-width: thin;
}
.cloudcanvas-ui-tabs-item { display: inline-flex; align-items: center; flex: none; overflow-x: clip; scroll-snap-align: start; }
.cloudcanvas-ui-tabs-tab, .cloudcanvas-ui-tabs-close {
  min-height: var(--cc-control-min, 28px);
  padding: var(--cc-space-1, 4px) var(--cc-space-3, 12px);
  font: inherit;
  color: var(--cc-text, #e2e8f0);
  border: 0;
  border-bottom: 2px solid transparent;
  cursor: pointer;
}
.cloudcanvas-ui-tabs-close { padding: var(--cc-space-1, 4px); }
/* The folder face: opaque, the tab in front of whatever is behind it in its row. */
.cloudcanvas-ui-tabs :is(.cloudcanvas-ui-tabs-tab, .cloudcanvas-ui-tabs-close) {
  position: relative;
  align-self: stretch;
  background-color: var(--cc-bg, #0f1117);
  background-image: var(--tab-face);
  border-top: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
}
.cloudcanvas-ui-tabs .cloudcanvas-ui-tabs-tab {
  border-left: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-right: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-radius: var(--cc-radius-sm, 6px) var(--cc-radius-sm, 6px) 0 0;
  box-shadow: var(--cc-ui-tab-layer-shadow, var(--cc-shadow-1, 0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06)));
}
.cloudcanvas-ui-tabs .is-closable > .cloudcanvas-ui-tabs-tab { border-right-width: 0; border-top-right-radius: 0; }
.cloudcanvas-ui-tabs .cloudcanvas-ui-tabs-close {
  border-right: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-top-right-radius: var(--cc-radius-sm, 6px);
}
/* In front. */
.cloudcanvas-ui-tabs-tab[aria-selected="true"] { border-bottom-color: var(--cc-accent, #38bdf8); font-weight: var(--cc-weight-semibold, 600); }
.cloudcanvas-ui-tabs [aria-selected="true"] + .cloudcanvas-ui-tabs-close { border-bottom-color: var(--cc-accent, #38bdf8); }
/* One step back: a step lower, under one wash of shade. A flag that rises keeps its height. */
.cloudcanvas-ui-tabs-item:not(.is-active) { padding-top: var(--cc-ui-tab-layer-step, 3px); }
.cloudcanvas-ui-tabs-item:not(.is-active) > :is(.cloudcanvas-ui-tabs-tab, .cloudcanvas-ui-tabs-close) { background-image: var(--layer-shade), var(--tab-face); }
.cloudcanvas-ui-tabs-item:not(.is-active) .cloudcanvas-ui-badge[data-shape="flag"] {
  transform: translateY(calc(-1 * (var(--cc-ui-flag-rise, 0px) + min(var(--cc-ui-flag-rise, 0px), var(--cc-ui-tab-layer-step, 3px)))));
}
.cloudcanvas-ui-tabs-tab:disabled { opacity: 0.5; cursor: not-allowed; }
/* A long label is cut, across only; a badged tab is not. */
.cloudcanvas-ui-tabs-tab:where(:not(.is-badged)) {
  max-width: var(--cc-ui-tab-width, 16rem);
  overflow-x: clip;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* A badge needs the height a tab's padding takes: the label is centred in the whole tab instead, where it already sat. */
.cloudcanvas-ui-tabs-tab.is-badged {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--cc-space-1, 4px);
  padding-top: 0;
  padding-bottom: 0;
}
/* A pinned tab stays put and cannot be closed: a small mark before its label says so, in the label's own colour. */
.cloudcanvas-ui-tabs-tab[data-pinned="true"]::before {
  content: "";
  display: inline-block;
  flex: none;
  width: 0.375em;
  height: 0.375em;
  margin-right: var(--cc-space-1, 4px);
  vertical-align: middle;
  background: currentColor;
  border-radius: var(--cc-radius-pill, 9999px);
}
/* The ring is worn inside: a row cuts what is drawn outside its tab. */
.cloudcanvas-ui-tabs-tab:focus-visible {
  outline: var(--cc-focus-ring-width, 2px) solid var(--cc-focus-ring, var(--cc-accent, #38bdf8));
  outline-offset: calc(-1 * var(--cc-focus-ring-width, 2px));
}

/* A tab in hand, and the bar where it would land. */
.cloudcanvas-ui-tabs.is-drag-active, .cloudcanvas-ui-tabs.is-drag-active button { cursor: grabbing; }
.cloudcanvas-ui-tabs-item.is-dragging > .cloudcanvas-ui-tabs-tab {
  outline: var(--cc-focus-ring-width, 2px) dashed var(--cc-ui-drop, var(--cc-accent, #38bdf8));
  outline-offset: calc(-1 * var(--cc-focus-ring-width, 2px));
}
.cloudcanvas-ui-tabs-item[data-drop] { position: relative; }
.cloudcanvas-ui-tabs-item[data-drop]::after {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  z-index: var(--cc-z-ui-raised, 2);
  width: var(--cc-focus-ring-width, 2px);
  background: var(--cc-ui-drop, var(--cc-accent, #38bdf8));
  outline: 1px solid var(--cc-bg, #0f1117);
}
.cloudcanvas-ui-tabs-item[data-drop="after"]::after { inset: 0 0 0 auto; }

/* Under a finger a tab is 44px tall and its close control 44px wide. */
@media (pointer: coarse) {
  .cloudcanvas-ui-tabs-tab, .cloudcanvas-ui-tabs-close { min-height: var(--cc-control-min-coarse, 44px); }
  .cloudcanvas-ui-tabs-close { min-width: var(--cc-control-min-coarse, 44px); }
}
`;
