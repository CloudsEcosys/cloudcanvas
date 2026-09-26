/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The minimal stylesheet a root needs to place blits: the host clips, the
 * plane carries the camera, the overlay sits on top, and every blit is placed
 * absolutely from its container's (or scope's) origin. Nothing here themes or
 * paints; how a blit looks is the author's CSS. Injected once per document.
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
`;

/**
 * Put the core stylesheet in the document, exactly once.
 * Write-once: rewriting a live `<style>` invalidates every rule already matched.
 * @returns {HTMLStyleElement|null} the element, or null without a document
 */
export function injectCoreStyles() {
  if (typeof document === 'undefined') return null;

  let element = document.getElementById(CORE_STYLE_ID);
  if (!element) {
    element = document.createElement('style');
    element.id = CORE_STYLE_ID;
    element.textContent = CORE_CSS;
    document.head.appendChild(element);
  }
  return element;
}
