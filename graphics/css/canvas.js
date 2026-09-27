/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The legacy canvas chunk of `CANVAS_DEFAULT_CSS`: the host, its layers and the Pin shell.
 * Data, not code; `../styles-css.js` composes it with the other chunks, in order.
 */

/** Host, layers and Pin shell rules; the leading newline is the sheet's own. */
export const CANVAS_CSS = `
/* ------------------ HOST ------------------ */

.cloudcanvas-host {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  user-select: none;
  touch-action: none;
  background-color: var(--cc-bg, #0f1117);
  background-image: radial-gradient(
    circle at var(--cc-grid-dot-size, 1px) var(--cc-grid-dot-size, 1px),
    var(--cc-grid-dot, rgba(255, 255, 255, 0.12)) var(--cc-grid-dot-size, 1px),
    transparent 0
  );
  background-size: var(--cc-grid-size, 24px) var(--cc-grid-size, 24px);
  font-family: var(--cc-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
  font-size: var(--cc-type-md, 13px);
  color: var(--cc-text, #e2e8f0);
}

/* The host is a single tab stop and pins are roving targets (keyboard nav lands
   with 4b); both show the same ring, and only for keyboard focus. */
.cloudcanvas-host:focus-visible,
.cloudcanvas-pin:focus-visible {
  outline: var(--cc-focus-ring-width, 2px) solid var(--cc-focus-ring, var(--cc-accent, #38bdf8));
  outline-offset: var(--cc-focus-ring-offset, 2px);
}

/* ------------------ LAYERS ------------------ */

/* The layer carries the camera transform, exactly like the plane, so a connector
   drawn in canvas coordinates lands on the Pins it joins at every zoom. Stroke
   width is kept honest by \`vector-effect: non-scaling-stroke\` on the paths;
   dash *length* still scales with zoom, which is the documented tradeoff. */
.cloudcanvas-svg-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: visible;
  transform-origin: 0 0;
  z-index: var(--cc-z-svg, 10);
}

.cloudcanvas-plane {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform-origin: 0 0;
  will-change: transform;
  pointer-events: none;
  z-index: var(--cc-z-plane, 20);
}

.cloudcanvas-overlay-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: var(--cc-z-overlay, 30);
}

/* The focus veil dims everything outside the focused subtree. It lives inside
   the plane, so it is bounded in *canvas* space rather than screen space: the
   huge negative inset is what keeps it covering the visible box at any pan or
   zoom the camera can reach. A theme that sets \`--cc-focus-veil: transparent\`
   disables it without touching the element. */
.cloudcanvas-focus-veil {
  position: absolute;
  inset: -100000px;
  pointer-events: none;
  opacity: 0;
  background: var(--cc-focus-veil, rgba(8, 10, 16, 0.45));
  transition: opacity 0.25s ease;
  z-index: var(--cc-z-veil, 900);
}

.cloudcanvas-focus-veil.is-active {
  opacity: 1;
}

/* ------------------ PIN SHELL ------------------ */

.cloudcanvas-pin {
  position: absolute;
  top: 0;
  left: 0;
  display: inline-block;
  pointer-events: auto;
  box-sizing: border-box;
  transform-origin: 0 0;
  cursor: grab;
  transition: box-shadow 0.15s ease, border-color 0.15s ease, opacity 0.2s ease;
}

/* A compositor hint is a promise to keep a layer alive, so it is worth making
   only while a Pin is actually moving. The renderer adds this on the frame it
   writes a new transform and sweeps it once the Pin has been still for ~30
   frames; a canvas of a thousand stationary Pins costs zero layers. */
.cloudcanvas-pin.cc-moving {
  will-change: transform;
}

.cloudcanvas-pin:hover {
  border-color: var(--cc-card-border-hover, rgba(255, 255, 255, 0.18));
  box-shadow: var(--cc-shadow-2, 0 12px 32px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.09));
}

.cloudcanvas-pin:active {
  cursor: grabbing;
}

.cloudcanvas-pin.is-selected {
  outline: var(--cc-focus-ring-width, 2px) solid var(--cc-accent, #38bdf8);
  outline-offset: var(--cc-focus-ring-offset, 2px);
}

.cloudcanvas-pin.is-focused {
  box-shadow: var(
    --cc-shadow-focus,
    0 0 0 2px var(--cc-focus, #833446),
    0 10px 30px var(--cc-focus-glow, rgba(131, 52, 70, 0.35))
  ) !important;
}

/*
 * Stacking is a property of a *chain*, not of one element: a nested Pin cannot
 * paint above a root Pin unless every scope between them is raised too, because
 * each ancestor's z-index opens a stacking context its descendants are trapped
 * in. \`setElevationChain\` (src/engine/elevation.js) walks the parent chain and
 * these two rules are what it writes - no \`!important\` anywhere, so a consumer
 * theme can still redefine the layering through the tokens.
 */
.cloudcanvas-pin.cc-elevated {
  z-index: var(--cc-z-elevated, 1000);
}

.cloudcanvas-pin.is-dragging,
.cloudcanvas-pin.cc-dragging {
  z-index: var(--cc-z-drag, 1100);
}

.cloudcanvas-pin.is-dragging {
  cursor: grabbing;
  box-shadow: var(--cc-shadow-2, 0 12px 32px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.09));
}

/* Applied by the renderer to a sleeping persistent (or provisioned lazy) Pin:
   mounted, so its subtree and cached geometry survive, but out of layout - the
   renderer's read phase skips it and reuses the size measured while awake. */
.cloudcanvas-pin.is-dormant {
  display: none;
}

.cloudcanvas-pin-content {
  position: relative;
}

/*
 * Display templates build every optional section up front and toggle it with the
 * hidden property. Host stylesheets routinely give those sections a display
 * value (.cloudcanvas-pin-header { display: flex }), which outranks the
 * user-agent [hidden] rule - so the framework states the intent explicitly.
 */
.cloudcanvas-pin-content [hidden] {
  display: none !important;
}

/* Opt-in via the \`selectableText\` Pin option; the drag gesture stands down
   inside the content node so a pointer press can place a caret instead. */
.cloudcanvas-pin.is-selectable-text .cloudcanvas-pin-content {
  user-select: text;
  -webkit-user-select: text;
  cursor: auto;
}

/* ...with the header row kept back as the drag handle, since the shell's own
   padding is too small a target to move a card by (see \`isTextRegionTarget\`
   in src/pins/pin-element.js, which draws the same line). */
.cloudcanvas-pin.is-selectable-text .cloudcanvas-pin-header {
  user-select: none;
  -webkit-user-select: none;
  cursor: grab;
}

`;
