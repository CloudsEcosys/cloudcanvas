/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The minimal stylesheet a root needs to place blits: the host clips, the plane carries the camera, the overlay
 * sits on top, and every blit is placed absolutely from its container's (or scope's) origin. Nothing here themes
 * or paints; how a blit looks is the author's CSS. Injected once per document.
 */

/** Id of the single core stylesheet element. */
export const CORE_STYLE_ID = 'blit-css';

/** The markers the layers are found by. */
export const PLANE_ATTR = 'data-blit-plane';
export const OVERLAY_ATTR = 'data-blit-overlay';

export const CORE_CSS = `
[data-blit-root] { position: relative; overflow: hidden; }
[${PLANE_ATTR}] { position: absolute; inset: 0; transform-origin: 0 0; will-change: transform; }
[${OVERLAY_ATTR}] { position: absolute; inset: 0; pointer-events: none; }
[data-blit-root] [data-blit] { position: absolute; left: 0; top: 0; transform-origin: 0 0; }
[data-blit] [data-scope] { position: relative; }
[data-blit-root] [data-blit][hidden] { display: none; }
`;

/**
 * Put `css` in the document as the `<style id>` `id`, exactly once: rewriting a live `<style>` invalidates every
 * matched rule. The core's sheet goes in this way, and so does each add-on's CSS chunk.
 * @returns {HTMLStyleElement|null} the element, or null without a document
 */
export function injectStyle(id, css) {
  if (typeof document === 'undefined') return null;
  let element = document.getElementById(id);
  if (!element) {
    element = document.createElement('style');
    element.id = id;
    element.textContent = css;
    document.head.appendChild(element);
  }
  return element;
}
