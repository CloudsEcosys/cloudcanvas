/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * panel: regions over a host that float, attach to an edge, open as a modal, fill the host, fold away and share a
 * frame as tabs, behind a small, configurable set of controls.
 *
 *   blit.use({ panel });                              // cloudcanvas/defaults names it too
 *   const layer = panels(document.querySelector('#shell'));
 *   const sheet = layer.add(document.querySelector('#sheet'), { id: 'sheet', at: 'right', title: 'Sheet' });
 *   setPanel(sheet, { at: 'float' });                 // merge a patch into its options
 *   panelOf(sheet);                                   // its options, whole and normalised
 *   bodyOf(sheet);                                    // the body element holding the content
 *
 * `panels(host)` gives a positioned host one layer (`./panel-layer.js`): a root of its own over the host, letting
 * presses through, whose blits are the panels. A panel is a blit there carrying this trait; its element is a frame
 * the add-on owns, a bar then a body (`./panel-frame.js`), and its options are data that round-trip through
 * `data-panel` (`./panel-place.js` normalises and places them). Markup alone declares one:
 * `<section data-blit data-panel='{"at":"right","title":"Sheet"}'>` inside the layer element; its children become
 * the body. Signals on the panel: `panel:change` `{at, pinned, collapsed, open, active, from, window}`,
 * `panel:refused` `{at, reason}`, `dismiss` (cancelable) before the close control or Escape closes it, and drag's
 * and resize's own; `panels:inset` `{top, right, bottom, left}` on the host.
 *
 * `at: 'window'` shows a frame in a browser window of its own: `./panel-door.js` opens it inside the gesture that
 * asked, and `./panel-window.js`, loaded the first time, moves the frame there and back. A blocked window is
 * `panel:refused`, and the panel stays where it was.
 */
import { blit } from '../core/blit.js';
import { resize } from './resize.js';
import { createLayer, layerOfHost, layerOfRoot, requireHost } from './panel-layer.js';
import { optionsOf, recordOf, startRecord, write } from './panel-record.js';

export { PANEL_CONTROLS, PANEL_EDGES, PANEL_PLACES, PANEL_TAB_PX, insetsOf, placeOf, slotOf } from './panel-place.js';

/** The trait, `(b, options, root) => cleanup`: a blit of a panels layer becomes a panel. */
export function panel(b, options, root) {
  const layer = layerOfRoot(root);
  if (!layer) {
    throw new TypeError('panel: a panel lives on a panels layer; make one with panels(host) and add to it with layer.add(content, options)');
  }
  return startRecord(b, options, layer);
}

/**
 * The layer on `host`, made the first time: `{el, root, add, list, snapshot, apply, insets, off}`. Names `panel`
 * (and `resize`, which sizes panels) so a page that never imported the defaults works the same.
 * @throws {TypeError} when the host is not a positioned element outside every CloudCanvas root
 */
export function panels(host) {
  const known = layerOfHost(host);
  if (known) return known.api;
  requireHost(host);
  blit.use({ panel, resize });
  return createLayer(host);
}

function requirePanel(b, name) {
  const rec = recordOf(b);
  if (!rec) throw new TypeError(`${name}: not a panel (a blit carrying the panel trait on a panels layer)`);
  return rec;
}

/** A panel's options, whole and normalised, `active` resolved; plain data. */
export function panelOf(b) {
  return optionsOf(requirePanel(b, 'panelOf'));
}

/** Merge `patch` into a panel's options and write them; refused whole, before anything changes. @returns the options in force */
export function setPanel(b, patch) {
  const rec = requirePanel(b, 'setPanel');
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw new TypeError('setPanel: expected an object patch');
  write(rec, patch);
  return optionsOf(rec);
}

/** The body element holding a panel's content. */
export function bodyOf(b) {
  return requirePanel(b, 'bodyOf').parts.body;
}
