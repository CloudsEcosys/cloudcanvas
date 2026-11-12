/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The window place's static half (`./panel.js`): the window is opened here, at once, while the gesture that asked
 * for it is still live (a popup blocker allows nothing later), and `./panel-window.js` - everything else the window
 * does - is loaded by `import()` the first time one opens, so a page that never uses a window never loads it.
 *
 * A layer keeps one entry per `window:<group or id>` slot in `layer.windows`. When the window cannot be opened, the
 * reason is returned and the caller keeps the panel where it was.
 */

/** The window module once loaded, and its load while in flight. */
let kit = null;
let loading = null;
let opened = 0;

/**
 * A window for `slot`, opened now, sized to the floating box. @returns {string|null} why it could not be opened,
 * or null when it is open
 */
export function openWindow(layer, slot, o) {
  const view = layer.el.ownerDocument.defaultView;
  const features = `popup,width=${Math.max(o.box.w, o.min.w)},height=${Math.max(o.box.h, o.min.h)}`;
  // A name of its own each time, so no window still open (or closing) under the same name is handed back.
  const name = `cloudcanvas-panel-${(opened += 1)}-${slot}`;
  let win = null;
  try {
    win = view.open('', name, features);
  } catch (error) {
    return `the window could not be opened: ${error?.message ?? error}`;
  }
  if (!win) return 'the browser did not open the window (a popup blocker, or no user gesture)';
  layer.windows.set(slot, { win, slot, frames: new Set(), ready: false, closing: false, offs: [] });
  return null;
}

/** The window open for `slot`, or null. */
export function windowOf(layer, slot) {
  return layer.windows.get(slot)?.win ?? null;
}

/** The layer's windows brought up to date with `ctx` (`./panel-window.js`), loading that module the first time. */
export function syncWindows(layer, ctx) {
  if (layer.windows.size === 0) return;
  if (kit) {
    kit.syncWindows(layer, ctx);
    return;
  }
  loading ??= import('./panel-window.js');
  loading.then((module) => {
    kit = module;
    kit.syncWindows(layer, ctx);
  }, (error) => {
    loading = null;
    failed(layer, ctx, error);
  });
}

/** The module did not load: each window closes and its panels go back, refused. */
function failed(layer, ctx, error) {
  for (const entry of Array.from(layer.windows.values())) {
    layer.windows.delete(entry.slot);
    entry.win.close();
    for (const rec of ctx.members(entry.slot)) ctx.refuse(rec, `the window module did not load: ${error?.message ?? error}`);
  }
}

/** Every window of a layer closed now, the frames back where they were (the layer is going away). */
export function closeWindows(layer) {
  if (kit) kit.shutWindows(layer);
  for (const entry of layer.windows.values()) entry.win.close();
  layer.windows.clear();
}
