/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The display widgets' CSS chunk (`../../addons/types.js`): the card surface a
 * `card`, `media` or `vector-pointer` blit wears unless `chrome` is false, the
 * border toggle, and the sections a widget hides while empty. Themed through
 * the tokens; the content classes themselves are the shared template rules.
 */

/** The widget surface, its toggles, and the markup region. */
export const CARD_CSS = `/* ------------------ DISPLAY WIDGETS ------------------ */

:is([data-type="card"], [data-type="media"], [data-type="vector-pointer"])[data-blit]:not([data-chrome="false"]) {
  box-sizing: border-box;
  padding: var(--cc-space-3, 12px) var(--cc-space-4, 16px);
  background: var(--cc-card-bg, rgba(30, 41, 59, 0.85));
  backdrop-filter: blur(var(--cc-card-blur, 12px));
  -webkit-backdrop-filter: blur(var(--cc-card-blur, 12px));
  border: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-radius: var(--cc-radius-md, 10px);
  box-shadow: var(--cc-shadow-1, 0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06));
  max-width: var(--cc-card-max-width, 340px);
}

[data-blit][style*="width"]:not([data-chrome="false"]) {
  max-width: none;
}

[data-blit][data-bordered="false"],
[data-blit][data-bordered="false"]:hover {
  border-color: transparent;
}

/* A widget toggles its empty sections with the hidden attribute; a host rule giving one a display must not show it. */
[data-type] [hidden] {
  display: none;
}

.cloudcanvas-pin-html {
  min-width: 0;
}

`;
