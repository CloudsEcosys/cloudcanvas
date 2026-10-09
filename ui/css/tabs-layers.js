/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The UI kit's rules for a tab's layers (`../tabs-layers.js`): the parent
 * scopes a tab stands in front of, drawn as folder tabs stacked behind it.
 * Data, not code; joined with the other chunks by `../styles.js`.
 *
 * HOW THE STACK IS MADE. A layer's button is its place in the row and its
 * whole target: as tall as the strip, and as wide as the part of the layer
 * that peeks out. What is seen is the button's face, which is free of the row:
 * it runs one corner's width under whatever stands in front of it, starts one
 * step lower for each step back it stands, and takes one more wash of shade.
 * Nothing is given a stacking level at rest - later in the page is nearer the
 * front - so the order rises to the tab without the sheet counting it.
 *
 * A FOLDER TAB IS NOT SEEN THROUGH. The kit's surface is translucent, and a
 * translucent tab would tint what it overlaps instead of hiding it. So a face
 * is that surface laid on the page's own colour (`--cc-bg`): the same colour
 * the surface shows over the page, and nothing behind it shows.
 */
export const UI_TAB_LAYERS_CSS = `
/* ------------------ UI KIT: TAB LAYERS ------------------ */

/* A strip that has a stack is a row of folders. Every tab in it is a folder tab, the front of its own stack: rounded top
   corners, a flat foot on the strip's baseline, a hairline edge, and a soft shadow on what is behind it. A close control
   is the far end of the same tab. A stack keeps to its own row, so a layer that opens out never widens the strip. */
.cloudcanvas-ui-tabs[data-layered] {
  --tab-face: linear-gradient(var(--cc-ui-surface, var(--cc-card-bg, rgba(30, 41, 59, 0.85))), var(--cc-ui-surface, var(--cc-card-bg, rgba(30, 41, 59, 0.85))));
  --layer-shade: linear-gradient(var(--cc-ui-tab-layer, var(--cc-scope-bg, rgba(0, 0, 0, 0.2))), var(--cc-ui-tab-layer, var(--cc-scope-bg, rgba(0, 0, 0, 0.2))));
}
.cloudcanvas-ui-tabs[data-layered] .cloudcanvas-ui-tabs-item { overflow-x: clip; }
.cloudcanvas-ui-tabs[data-layered] :is(.cloudcanvas-ui-tabs-tab, .cloudcanvas-ui-tabs-close) {
  position: relative;
  align-self: stretch;
  background-color: var(--cc-bg, #0f1117);
  background-image: var(--tab-face);
  border-top: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
}
.cloudcanvas-ui-tabs[data-layered] .cloudcanvas-ui-tabs-tab {
  border-left: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-right: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-radius: var(--cc-radius-sm, 6px) var(--cc-radius-sm, 6px) 0 0;
  box-shadow: var(--cc-ui-tab-layer-shadow, var(--cc-shadow-1, 0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06)));
}
.cloudcanvas-ui-tabs[data-layered] .is-closable > .cloudcanvas-ui-tabs-tab { border-right-width: 0; border-top-right-radius: 0; }
.cloudcanvas-ui-tabs[data-layered] .cloudcanvas-ui-tabs-close {
  border-right: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-top-right-radius: var(--cc-radius-sm, 6px);
}
.cloudcanvas-ui-tabs[data-layered] [aria-selected="true"] + .cloudcanvas-ui-tabs-close { border-bottom-color: var(--cc-accent, #38bdf8); }

.cloudcanvas-ui-tabs-layers { display: inline-flex; align-self: stretch; }
.cloudcanvas-ui-tabs-layer {
  position: relative;
  flex: none;
  box-sizing: border-box;
  width: var(--cc-ui-tab-layer-peek, 4.5rem);
  min-height: var(--cc-control-min, 28px);
  padding: 0;
  font: inherit;
  font-size: var(--cc-type-sm, 12px);
  color: var(--cc-text, #e2e8f0);
  background: transparent;
  border: 0;
  cursor: pointer;
}
.cloudcanvas-ui-tabs-layer.is-fold { width: var(--cc-control-min, 28px); }
.cloudcanvas-ui-tabs-layer:disabled { opacity: 0.5; cursor: not-allowed; }
/* The label starts at the face's near edge, at its top as on a folder's tab, and ends before the corner the face is tucked under. */
.cloudcanvas-ui-tabs-layer-face {
  position: absolute;
  inset: var(--cc-ui-tab-layer-step, 3px) auto 0 0;
  box-sizing: border-box;
  width: max-content;
  min-width: calc(100% + var(--cc-radius-sm, 6px));
  max-width: calc(100% + var(--cc-radius-sm, 6px));
  padding: var(--cc-space-1, 4px) var(--cc-space-3, 12px) 0 var(--cc-space-2, 8px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.2;
  text-align: start;
  background-color: var(--cc-bg, #0f1117);
  border: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-width: 1px 0 0 1px;
  border-radius: var(--cc-radius-sm, 6px) var(--cc-radius-sm, 6px) 0 0;
  box-shadow: var(--cc-ui-tab-layer-shadow, var(--cc-shadow-1, 0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06)));
}
.cloudcanvas-ui-tabs-layer.is-fold > .cloudcanvas-ui-tabs-layer-face { padding-right: var(--cc-space-2, 8px); text-align: center; }
/* One step back, one step lower and one wash of shade more over the tab's own face. */
.cloudcanvas-ui-tabs-layer[data-depth="1"] > .cloudcanvas-ui-tabs-layer-face { background-image: var(--layer-shade), var(--tab-face); }
.cloudcanvas-ui-tabs-layer[data-depth="2"] > .cloudcanvas-ui-tabs-layer-face {
  top: calc(2 * var(--cc-ui-tab-layer-step, 3px));
  background-image: var(--layer-shade), var(--layer-shade), var(--tab-face);
}
.cloudcanvas-ui-tabs-layer[data-depth="3"] > .cloudcanvas-ui-tabs-layer-face {
  top: calc(3 * var(--cc-ui-tab-layer-step, 3px));
  background-image: var(--layer-shade), var(--layer-shade), var(--layer-shade), var(--tab-face);
}
/* Under the pointer or the keys a layer comes to the front and opens out to its label, over what stood in front of it:
   whole now, and lit as a control is under the pointer rather than shaded as something behind. */
.cloudcanvas-ui-tabs-layer:is(:hover, :focus-visible):not(:disabled) { z-index: var(--cc-z-ui-raised, 2); }
.cloudcanvas-ui-tabs-layer:is(:hover, :focus-visible):not(:disabled) > .cloudcanvas-ui-tabs-layer-face {
  max-width: var(--cc-ui-tab-layer-width, 12rem);
  background-image: linear-gradient(var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22)), var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22))), var(--tab-face);
  border-right-width: 1px;
}
/* The ring is the face's, inside it: by then the face is in front of every neighbour, and wider than the place it left. */
.cloudcanvas-ui-tabs-layer:focus-visible { outline: none; }
.cloudcanvas-ui-tabs-layer:focus-visible > .cloudcanvas-ui-tabs-layer-face {
  outline: var(--cc-focus-ring-width, 2px) solid var(--cc-focus-ring, var(--cc-accent, #38bdf8));
  outline-offset: calc(-1 * var(--cc-focus-ring-width, 2px));
}
/* The fold's menu is mounted beside the strip and takes no room there. */
.cloudcanvas-ui-tabs-menu { display: contents; }

/* A layer eases open only for a user who has not asked for less motion. */
@media (prefers-reduced-motion: no-preference) {
  .cloudcanvas-ui-tabs-layer-face { transition: max-width 120ms ease-out; }
}
@media (pointer: coarse) {
  .cloudcanvas-ui-tabs-layer { min-width: var(--cc-control-min-coarse, 44px); min-height: var(--cc-control-min-coarse, 44px); }
}
`;
