/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The legacy chrome chunks of `CANVAS_DEFAULT_CSS` that sit between and after the add-on chunks:
 * the border toggle, the chromeless grab handle and the reduced-motion overrides. Data, not code.
 */

/** The border toggle. */
export const BORDER_CSS = `/* ------------------ BORDER TOGGLE & RESIZE HANDLES ------------------ */

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

`;

/** The chromeless grab handle. */
export const GRAB_HANDLE_CSS = `/* ---- CHROMELESS GRAB HANDLE ---- */

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
}

`;

/** Reduced-motion overrides; the sheet's last rule. */
export const REDUCED_MOTION_CSS = `@media (prefers-reduced-motion: reduce) {
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
