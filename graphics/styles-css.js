/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The framework's default stylesheet, as one string composed from `./css/`.
 *
 * Its own file for one reason: it is data, not code. `./styles.js` is the door -
 * injection, session sheets, the theming re-export - and holding the sheet
 * inside it made the twenty lines of logic hard to find. The rules
 * governing what may appear below are stated there and enforced by
 * `tests/unit/styles.test.js`; nothing imports this module directly except
 * `./styles.js`, which re-exports the constant unchanged.
 */

import { LIVE_REGION_CSS } from './css/announce.js';
import { CANVAS_CSS } from './css/canvas.js';
import { BORDER_CSS, GRAB_HANDLE_CSS, REDUCED_MOTION_CSS } from './css/chrome.js';
import { CARD_CSS } from './css/card.js';
import { CONTENT_CSS } from './css/content.js';
import { MENU_CSS } from './css/menu.js';
import { RESIZE_CSS } from './css/resize.js';
import { SVG_STATE_CSS } from './css/svg-state.js';

/**
 * Default stylesheet. Injected once per document by `injectCanvasStyles()`.
 *
 * Composed from per-owner chunks (`./css/`), in sheet order, byte for byte the
 * one string it always was. An add-on that owns a chunk (menu, resize,
 * svg-state, announce) injects just that chunk when it installs; the legacy
 * chunks travel only in this whole.
 *
 * Token groups: foundations (`--cc-font`, `--cc-type-*`, `--cc-space-*`,
 * `--cc-radius-*`, `--cc-shadow-*`, `--cc-z-*`) and parts (`--cc-bg`,
 * `--cc-text*`, `--cc-accent`, `--cc-focus*`, `--cc-card-*`, `--cc-scope-*`,
 * `--cc-badge-*`, `--cc-btn-*`, `--cc-meter-*`). `LIGHT_THEME` (`./theme.js`) is
 * the reference override set.
 */
export const CANVAS_DEFAULT_CSS = /* @__PURE__ */ [
  CANVAS_CSS,
  CONTENT_CSS,
  CARD_CSS,
  MENU_CSS,
  BORDER_CSS,
  RESIZE_CSS,
  GRAB_HANDLE_CSS,
  SVG_STATE_CSS,
  LIVE_REGION_CSS,
  REDUCED_MOTION_CSS
].join('');
