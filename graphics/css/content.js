/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The legacy content chunk of `CANVAS_DEFAULT_CSS`: scopes, child layout, primitive surfaces
 * and the display templates. Data, not code; `../styles-css.js` composes it.
 */

/** Scope, child layout, surface and display-template rules. */
export const CONTENT_CSS = `/* ------------------ SCOPE ------------------ */

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

`;
