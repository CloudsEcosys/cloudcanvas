/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The framework's default stylesheet, as one string.
 *
 * Its own file for one reason: it is data, not code. `./styles.js` is the door -
 * injection, session sheets, the theming re-export - and holding four hundred
 * lines of CSS inside it made the twenty lines of logic hard to find. The rules
 * governing what may appear below are stated there and enforced by
 * `tests/unit/styles.test.js`; nothing imports this module directly except
 * `./styles.js`, which re-exports the constant unchanged.
 */

/**
 * Default stylesheet. Injected once per document by `injectCanvasStyles()`.
 *
 * Token groups: foundations (`--cc-font`, `--cc-type-*`, `--cc-space-*`,
 * `--cc-radius-*`, `--cc-shadow-*`, `--cc-z-*`) and parts (`--cc-bg`,
 * `--cc-text*`, `--cc-accent`, `--cc-focus*`, `--cc-card-*`, `--cc-scope-*`,
 * `--cc-badge-*`, `--cc-btn-*`, `--cc-meter-*`). `LIGHT_THEME` (`./theme.js`) is
 * the reference override set.
 */
export const CANVAS_DEFAULT_CSS = `
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

/* ------------------ SCOPE ------------------ */

/*
 * Every Pin carries a scope container, whether or not it will ever hold a child.
 * An empty one must therefore cost nothing at all - no box, no border, no gap -
 * or a plain card would render with a dashed well hanging off the bottom of it.
 * So the resting state is *absent*, and the well is a state the renderer grants:
 * \`cc-populated\` is written only when a live child is actually inside, together
 * with the measured \`min-height\` that makes the clipped box the right size
 * (see \`ScopeWellPass\` in \`src/engine/scope-well.js\`).
 */
.cloudcanvas-pin-scope {
  position: relative;
  width: 100%;
  display: none;
  min-height: 0;
  margin: 0;
}

.cloudcanvas-pin-scope.cc-populated {
  display: block;
  /* Stated, not inherited: the renderer writes a min-height measured from child
     offsets, which are relative to this element's *content* box, so the box
     model here cannot be left to whatever the host page declares. */
  box-sizing: border-box;
  margin-top: var(--cc-space-2, 8px);
  min-height: var(--cc-scope-min-height, 40px);
  border-radius: var(--cc-radius-sm, 6px);
  background: var(--cc-scope-bg, rgba(0, 0, 0, 0.2));
  /* An outline rather than a border, for the same reason: a border would eat
     two pixels out of the content box under \`border-box\` and clip the last row
     of every well by exactly its own width. An outline occupies no layout. */
  outline: 1px dashed var(--cc-scope-border, rgba(255, 255, 255, 0.15));
  outline-offset: -1px;
  /* The well is a *frame*: a child that runs past it is clipped rather than
     escaping over its siblings. Measured min-height is what keeps that honest. */
  overflow: var(--cc-scope-overflow, hidden);
}

/* ------------------ CHILD LAYOUT (Sprint 8.2) ------------------ */

/*
 * A container Pin opts its scope well into flex/grid flow through \`pin.layout\`
 * ('row' | 'column' | 'grid'); 'free' is the default and carries no class at all,
 * so a plain card's children stay absolutely positioned exactly as before. The
 * three classes live on the scope well - layout is about how a Pin arranges *its
 * children*, not how the Pin itself sits - and are compounded onto \`cc-populated\`
 * so an empty well still costs nothing (it stays \`display: none\` until a live
 * child grants it the box, above). Compounded, they also outrank \`cc-populated\`'s
 * own \`display: block\` on specificity, so the flow display wins without \`!important\`.
 *
 * Every mode reads one \`--cc-layout-gap\` custom property (written by the \`gap\`
 * option); its fallback is the sheet's standard spacing token, so a container with
 * no gap set still spaces its children sensibly. Grid is deliberately minimal for
 * v1: auto-placed cells in a single implicit column flow, no template control.
 *
 * Every mode also states its cross-axis alignment, and this is not cosmetic. A
 * flow container decides where its children *sit*; it never decides how big they
 * are - a Pin's size is its own, set on the Pin and measured back into its
 * particle. The browser's default (\`align-items: stretch\`, and \`justify-items\`
 * too on a grid) would size them instead, and the measurement pass would then
 * write that imposed size back into the particle as if the Pin had asked for it:
 * a Row would silently overwrite every child's height, a Column and a Grid its
 * width. So each mode pins its start edge explicitly.
 */
.cloudcanvas-pin-scope.cc-populated.is-layout-row {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: var(--cc-layout-gap, var(--cc-space-2, 8px));
}

.cloudcanvas-pin-scope.cc-populated.is-layout-column {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--cc-layout-gap, var(--cc-space-2, 8px));
}

.cloudcanvas-pin-scope.cc-populated.is-layout-grid {
  display: grid;
  grid-auto-flow: row;
  align-items: start;
  justify-items: start;
  /* A template-less grid is a single column - indistinguishable from a column
     flex. One knob keeps v1 an actual grid without a template editor: the whole
     column track list is a single custom property, defaulting to as many equal
     min-120px columns as the well is wide enough to hold. A consumer overrides
     the entire template through \`--cc-grid-columns\`; finer per-track control is a
     documented v2. */
  grid-template-columns: var(--cc-grid-columns, repeat(auto-fill, minmax(120px, 1fr)));
  gap: var(--cc-layout-gap, var(--cc-space-2, 8px));
}

/*
 * A flow child's position comes entirely from its parent's flex/grid flow, so it
 * drops out of absolute positioning. \`position: relative\` rather than \`static\`
 * deliberately: z-index is inert on a static box, and both \`is-dragging\` and
 * \`cc-elevated\` raise a child through z-index, so a reorder drag would stop
 * elevating under \`static\`. \`top/left: auto\` neutralises the shell's \`top/left: 0\`;
 * the renderer stops writing this child a transform (\`_applyPosition\`) and the
 * stale one is cleared as the class goes on (\`syncFlowChild\` in pin-element.js).
 */
.cloudcanvas-pin.is-flow-child {
  position: relative;
  top: auto;
  left: auto;
}

/* ------------------ PRIMITIVE SURFACES ------------------ */

.cloudcanvas-primitive-card {
  padding: var(--cc-space-3, 12px) var(--cc-space-4, 16px);
  background: var(--cc-card-bg, rgba(30, 41, 59, 0.85));
  backdrop-filter: blur(var(--cc-card-blur, 12px));
  -webkit-backdrop-filter: blur(var(--cc-card-blur, 12px));
  border: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-radius: var(--cc-radius-md, 10px);
  box-shadow: var(--cc-shadow-1, 0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06));
  color: inherit;
  /* A readable measure for cards that size themselves. A Pin built with an
     explicit \`width\` clears this inline (see \`createDefaultElement\`), so the
     clamp never fights an author who already stated the width they wanted. */
  max-width: var(--cc-card-max-width, 340px);
}

.cloudcanvas-primitive-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--cc-space-1, 4px);
  padding: var(--cc-space-1, 4px) var(--cc-space-2, 8px);
  border-radius: var(--cc-radius-pill, 9999px);
  background: var(--cc-badge-bg, rgba(56, 189, 248, 0.15));
  color: var(--cc-badge-text, #38bdf8);
  border: 1px solid var(--cc-badge-border, rgba(56, 189, 248, 0.3));
  font-size: var(--cc-type-sm, 12px);
  font-weight: var(--cc-weight-semibold, 600);
  line-height: 1;
  white-space: nowrap;
}

/* ------------------ DISPLAY TEMPLATES ------------------ */

.cloudcanvas-pin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--cc-space-3, 12px);
  margin-bottom: var(--cc-space-2, 8px);
}

.cloudcanvas-pin-title {
  font-size: var(--cc-type-lg, 15px);
  font-weight: var(--cc-weight-semibold, 600);
  color: var(--cc-text, #e2e8f0);
  line-height: 1.25;
}

.cloudcanvas-pin-badge-slot {
  display: inline-flex;
  align-items: center;
  flex: none;
}

.cloudcanvas-pin-body {
  font-size: var(--cc-type-md, 13px);
  color: var(--cc-text-muted, #94a3b8);
  line-height: 1.45;
}

.cloudcanvas-pin-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--cc-space-2, 8px);
  margin-top: var(--cc-space-3, 12px);
  font-size: var(--cc-type-xs, 11px);
  color: var(--cc-text-muted, #94a3b8);
}

/* The one text run in the footer that had no line-height of its own, so it
   inherited whatever the host page's body copy declared and the footer row's
   height moved with it. 1.45 is the sheet's body ratio; a single-line ellipsised
   run needs a stated one exactly as much as a wrapping paragraph does. */
.cloudcanvas-pin-author {
  font-size: var(--cc-type-xs, 11px);
  line-height: 1.45;
  color: var(--cc-text-muted, #94a3b8);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cloudcanvas-pin-action-btn {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: var(--cc-control-min, 28px);
  padding: var(--cc-space-1, 4px) var(--cc-space-2, 8px);
  background: var(--cc-btn-bg, rgba(56, 189, 248, 0.12));
  border: 1px solid var(--cc-btn-border, rgba(56, 189, 248, 0.35));
  border-radius: var(--cc-radius-sm, 6px);
  color: var(--cc-btn-text, #7dd3fc);
  font-family: inherit;
  font-size: var(--cc-type-xs, 11px);
  font-weight: var(--cc-weight-medium, 500);
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.cloudcanvas-pin-action-btn:hover {
  background: var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22));
  border-color: var(--cc-accent, #38bdf8);
}

/* A coarse pointer gets the full 44px target without changing the desktop look. */
@media (pointer: coarse) {
  .cloudcanvas-pin-action-btn {
    min-height: var(--cc-control-min-coarse, 44px);
  }
}

.cloudcanvas-pin-media {
  display: block;
  width: 100%;
  max-height: var(--cc-media-max-height, 120px);
  object-fit: cover;
  border-radius: var(--cc-radius-sm, 6px);
  background: var(--cc-scope-bg, rgba(0, 0, 0, 0.2));
}

.cloudcanvas-pin-caption {
  margin: var(--cc-space-2, 8px) 0 0;
  font-size: var(--cc-type-xs, 11px);
  color: var(--cc-text-muted, #94a3b8);
  line-height: 1.35;
}

/* The vector-pointer body: needle on the left, gauge column filling the rest. */
.cloudcanvas-pin-gauge-row {
  display: flex;
  align-items: center;
  gap: var(--cc-space-3, 12px);
  padding: var(--cc-space-1, 4px) 0;
}

.cloudcanvas-pin-needle-slot {
  display: flex;
  align-items: center;
  flex: none;
}

.cloudcanvas-pin-gauge {
  flex: 1;
  min-width: 0;
}

.cloudcanvas-pin-label {
  margin-bottom: var(--cc-space-1, 4px);
  font-size: var(--cc-type-xs, 11px);
  color: var(--cc-text-muted, #94a3b8);
}

.cloudcanvas-pin-meter-slot {
  display: block;
}

/* ------------------ CONTEXT MENU ------------------ */

/* The canvas's own right-click menu (src/engine/context-menu.js). It lives in
   the overlay - the one layer that draws in screen space - which is why it is
   positioned from the click's host-relative coordinates and needs its pointer
   events back: the overlay itself is inert.
   Every value chains through a part token to a foundation one, so a theme that
   restyles cards restyles the menu with them and nothing new has to be named. */
.cloudcanvas-context-menu {
  position: absolute;
  min-width: var(--cc-menu-min-width, 168px);
  padding: var(--cc-space-1, 4px);
  background: var(--cc-menu-bg, var(--cc-card-bg, rgba(30, 41, 59, 0.85)));
  border: 1px solid var(--cc-menu-border, var(--cc-card-border, rgba(255, 255, 255, 0.1)));
  border-radius: var(--cc-radius-md, 10px);
  box-shadow: var(--cc-shadow-2, 0 12px 32px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.09));
  backdrop-filter: blur(var(--cc-card-blur, 12px));
  -webkit-backdrop-filter: blur(var(--cc-card-blur, 12px));
  font-size: var(--cc-type-md, 13px);
  color: var(--cc-text, #e2e8f0);
  pointer-events: auto;
  user-select: none;
  z-index: var(--cc-z-menu, 1200);
}

/* Closed is the resting state, and the attribute has to outrank the display
   above - which it does on specificity alone, so no \`!important\` is needed. */
.cloudcanvas-context-menu[hidden] {
  display: none;
}

/* Groups are the only structure: consecutive ones are told apart by a rule
   rather than a separator element nobody can label. */
.cloudcanvas-context-menu-group + .cloudcanvas-context-menu-group {
  margin-top: var(--cc-space-1, 4px);
  padding-top: var(--cc-space-1, 4px);
  border-top: 1px solid var(--cc-menu-border, var(--cc-card-border, rgba(255, 255, 255, 0.1)));
}

.cloudcanvas-context-menu-item {
  display: block;
  width: 100%;
  min-height: var(--cc-control-min, 28px);
  padding: var(--cc-space-1, 4px) var(--cc-space-3, 12px);
  background: var(--cc-menu-item-bg, transparent);
  border: 0;
  border-radius: var(--cc-radius-sm, 6px);
  color: inherit;
  font-family: inherit;
  font-size: inherit;
  text-align: left;
  white-space: nowrap;
  cursor: pointer;
}

.cloudcanvas-context-menu-item:hover,
.cloudcanvas-context-menu-item:focus-visible {
  background: var(--cc-menu-item-bg-hover, var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22)));
}

@media (pointer: coarse) {
  .cloudcanvas-context-menu-item {
    min-height: var(--cc-control-min-coarse, 44px);
  }
}

/* ------------------ BORDER TOGGLE & RESIZE HANDLES ------------------ */

/*
 * \`bordered: false\` (or \`pin.bordered = false\` at any time) withholds the card's
 * border and nothing else. Finer-grained than \`chrome: false\`, which takes the
 * whole card - surface, padding, radius, shadow, border - away at once for a
 * component that draws its own.
 *
 * \`border-color: transparent\` rather than \`border: none\`, deliberately. The card
 * is \`box-sizing: border-box\`, but that only makes a *specified* width include
 * its border: a card that sizes itself to its content has none, so dropping the
 * border shrinks it by 2px in each axis, and dropping it from an explicitly
 * sized one moves the content box out by the same amount. Keeping the border and
 * making it invisible costs one paint and moves nothing at all.
 *
 * The \`:hover\` pairing is not redundant: \`.cloudcanvas-pin:hover\` above sets a
 * border colour at equal specificity, so the plain selector alone would win or
 * lose on source order.
 */
.cloudcanvas-pin.is-borderless,
.cloudcanvas-pin.is-borderless:hover {
  border-color: transparent;
}

/*
 * Resize handles, appended by \`ResizableTrait\` (src/pins/traits/resizable.js).
 *
 * Direct children of the Pin's root element, outside the content node, so a
 * content re-render never takes them away. Each carries \`data-cc-control\`, which
 * is what makes the pointer router decline the deferred capture and
 * \`DraggableTrait\` stand down on it (\`CONTROL_SELECTOR\`, src/pins/pin-element.js).
 *
 * Visibility is the \`hidden\` property, written by the trait - so no \`display\` is
 * declared here, and the user-agent \`[hidden]\` rule keeps working on a page that
 * never loaded this stylesheet. The reset below only defends it from a host
 * sheet that gives every div a display value.
 */
.cloudcanvas-resize-handle {
  position: absolute;
  box-sizing: border-box;
  width: var(--cc-resize-handle-size, 10px);
  height: var(--cc-resize-handle-size, 10px);
  border-radius: var(--cc-radius-sm, 6px);
  background: var(--cc-resize-handle-bg, var(--cc-accent, #38bdf8));
  box-shadow: var(--cc-resize-handle-ring, 0 0 0 1px rgba(8, 10, 16, 0.65));
  z-index: var(--cc-z-drag, 1100);
  touch-action: none;
}

.cloudcanvas-resize-handle[hidden] {
  display: none !important;
}

/* A coarse pointer gets a target it can actually hit. */
@media (pointer: coarse) {
  .cloudcanvas-resize-handle {
    width: var(--cc-resize-handle-size-coarse, 20px);
    height: var(--cc-resize-handle-size-coarse, 20px);
  }
}

/*
 * One rule per direction: where the handle sits on the box, and what the pointer
 * says it will do. The \`translate\` is what centres it *on* the edge rather than
 * inside it, so the affordance straddles the boundary it moves.
 */
.cloudcanvas-resize-handle[data-cc-resize-handle="nw"] {
  top: 0;
  left: 0;
  transform: translate(-50%, -50%);
  cursor: nwse-resize;
}

.cloudcanvas-resize-handle[data-cc-resize-handle="n"] {
  top: 0;
  left: 50%;
  transform: translate(-50%, -50%);
  cursor: ns-resize;
}

.cloudcanvas-resize-handle[data-cc-resize-handle="ne"] {
  top: 0;
  right: 0;
  transform: translate(50%, -50%);
  cursor: nesw-resize;
}

.cloudcanvas-resize-handle[data-cc-resize-handle="w"] {
  top: 50%;
  left: 0;
  transform: translate(-50%, -50%);
  cursor: ew-resize;
}

.cloudcanvas-resize-handle[data-cc-resize-handle="e"] {
  top: 50%;
  right: 0;
  transform: translate(50%, -50%);
  cursor: ew-resize;
}

.cloudcanvas-resize-handle[data-cc-resize-handle="sw"] {
  bottom: 0;
  left: 0;
  transform: translate(-50%, 50%);
  cursor: nesw-resize;
}

.cloudcanvas-resize-handle[data-cc-resize-handle="s"] {
  bottom: 0;
  left: 50%;
  transform: translate(-50%, 50%);
  cursor: ns-resize;
}

.cloudcanvas-resize-handle[data-cc-resize-handle="se"] {
  bottom: 0;
  right: 0;
  transform: translate(50%, 50%);
  cursor: nwse-resize;
}

/* A resize is a drag of the box: it clears its neighbours the same way, and the
   grab cursor must not fight the direction cursor under the pointer. */
.cloudcanvas-pin.is-resizing {
  z-index: var(--cc-z-drag, 1100);
  cursor: default;
}

/* ---- CHROMELESS GRAB HANDLE ---- */

/*
 * The drag affordance for a chromeless control, appended by \`DraggableTrait\`
 * (src/pins/traits/interaction.js). With \`chrome: false\` the Pin's own surface is
 * often a real control - a \`<button>\`, an \`<input>\` - that the drag correctly
 * declines (\`CONTROL_SELECTOR\`), so this small grip at the corner is the one
 * thing left to grab by.
 *
 * The mirror image of the resize handles above: a direct child of the root so it
 * rides the Pin's transform and a content re-render never removes it, but
 * deliberately *not* \`data-cc-control\` - initiating a drag is its whole purpose.
 * \`translate(-50%, -50%)\` straddles the top-left corner so the grip sits over the
 * boundary rather than inside the control's hit area. Visibility is the \`hidden\`
 * property, written by the trait on selection - so no \`display\` is declared here
 * and the user-agent \`[hidden]\` rule holds on a page with no framework CSS.
 *
 * The whole background - the grip dots over a fill - lives inside the token's
 * fallback, so a theme replaces the entire look with one \`--cc-grab-handle-bg\`
 * and the sheet still reads a single token.
 */
.cloudcanvas-grab-handle {
  position: absolute;
  top: 0;
  left: 0;
  box-sizing: border-box;
  width: var(--cc-grab-handle-size, 12px);
  height: var(--cc-grab-handle-size, 12px);
  transform: translate(-50%, -50%);
  border-radius: var(--cc-radius-sm, 6px);
  background: var(--cc-grab-handle-bg, radial-gradient(var(--cc-grab-handle-dot, rgba(255, 255, 255, 0.7)) 0.75px, transparent 1px) 0 0 / 4px 4px, var(--cc-grab-handle-fill, rgba(30, 41, 59, 0.92)));
  box-shadow: var(--cc-grab-handle-ring, 0 0 0 1px rgba(8, 10, 16, 0.65));
  cursor: grab;
  z-index: var(--cc-z-drag, 1100);
  touch-action: none;
}

.cloudcanvas-grab-handle:active {
  cursor: grabbing;
}

.cloudcanvas-grab-handle[hidden] {
  display: none !important;
}

/* A coarse pointer gets a target it can actually hit. */
@media (pointer: coarse) {
  .cloudcanvas-grab-handle {
    width: var(--cc-grab-handle-size-coarse, 20px);
    height: var(--cc-grab-handle-size-coarse, 20px);
  }
/* ------------------ SVG STATE & 3D INTERPOLATION ------------------ */

.cloudcanvas-svg-state-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
  pointer-events: none;
  transform-style: preserve-3d;
}

.cloudcanvas-svg-state-host {
  width: 100%;
  height: 100%;
  display: block;
  overflow: visible;
  pointer-events: none;
  transform-style: preserve-3d;
  transform-origin: center center;
}

.cloudcanvas-svg-state-path {
  vector-effect: non-scaling-stroke;
  transform-box: fill-box;
  transform-origin: center center;
}

/* ------------------ UTILITY ------------------ */

/* Announcement target for assistive technology: in the accessibility tree,
   out of the visual one. */
.cloudcanvas-live-region {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

@media (prefers-reduced-motion: reduce) {
  .cloudcanvas-pin,
  .cloudcanvas-focus-veil {
    transition: none;
  }

  /* The SVG generators carry their own inline transitions. */
  .cloudcanvas-pin-needle-slot svg,
  .cloudcanvas-pin-meter-slot *,
  .cloudcanvas-svg-state-path,
  .cloudcanvas-svg-state-host {
    transition: none !important;
  }
}
`;
