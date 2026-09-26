/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The framework stylesheet, its injection, and the theming API.
 *
 * Two rules govern everything below.
 *
 *   1. Every themable value is a custom-property read whose *fallback* is the
 *      dark default. There is no `:root` block: the dark theme IS the fallback
 *      chain, so a host that defines nothing still looks designed, and a host
 *      that defines one token changes exactly one thing. `tests/unit/styles.test.js`
 *      enforces this as a permanent invariant.
 *
 *   2. Templates ship no inline styles. Everything a built-in display template
 *      renders is styled from here, by class, so a consumer can restyle it and
 *      the framework can theme it. The one exception is the SVG string
 *      generators in `primitives/`, which build markup rather than DOM; those
 *      read the same tokens from inside their `style` attributes.
 */
import { CANVAS_DEFAULT_CSS } from './styles-css.js';

/**
 * The default stylesheet itself lives in `./styles-css.js` - it is data, not
 * code - and is re-exported here so this module stays the single door.
 */
export { CANVAS_DEFAULT_CSS } from './styles-css.js';

/** The theming API lives in ./theme.js; re-exported so styles.js stays the door. */
export { LIGHT_THEME, TOKEN_PREFIX, applyTheme } from './theme.js';

/** Id of the single base stylesheet element. */
export const BASE_STYLE_ID = 'cloudcanvas-styles';

/** Marker attribute on every per-session stylesheet element. */
export const SESSION_STYLE_ATTR = 'data-cc-session';

/**
 * Inject the base stylesheet, exactly once per document.
 *
 * Write-once matters: several sessions can share a page, and re-writing
 * `textContent` on a live `<style>` invalidates every rule the browser has
 * already matched. An existing element is returned untouched.
 *
 * @param {string} [customCSS] deprecated - pass session CSS to
 *   `injectSessionStyles()` instead, which returns a removable element. Routed
 *   there for compatibility; it does not modify the base sheet.
 * @returns {HTMLStyleElement|null} the base element (null when headless)
 */
export function injectCanvasStyles(customCSS = '') {
  if (typeof document === 'undefined') return null;

  let styleEl = document.getElementById(BASE_STYLE_ID);
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = BASE_STYLE_ID;
    styleEl.textContent = CANVAS_DEFAULT_CSS;
    document.head.appendChild(styleEl);
  }

  if (customCSS) injectSessionStyles(customCSS);
  return styleEl;
}

/**
 * Append one session's CSS as its own `<style data-cc-session>` element.
 *
 * Separate from the base sheet so a session can be torn down without touching
 * rules another session still depends on: the caller keeps the returned element
 * and removes it on destroy.
 *
 * @param {string} css
 * @returns {HTMLStyleElement|null} the new element, or null when there is
 *   nothing to inject
 */
export function injectSessionStyles(css) {
  if (typeof document === 'undefined') return null;
  if (typeof css !== 'string' || css.trim() === '') return null;

  const styleEl = document.createElement('style');
  styleEl.setAttribute(SESSION_STYLE_ATTR, '');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);
  return styleEl;
}

/**
 * The transform formatter lives in the core (`../core/port.js`, the default
 * port) and is re-exported here under its old name: one implementation.
 */
export { formatTransform3D } from '../core/port.js';
