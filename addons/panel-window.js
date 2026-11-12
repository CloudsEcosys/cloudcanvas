/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The window place (`./panel.js`), loaded by `import()` the first time a panel goes to a window: the frames of a
 * `window:<group or id>` slot, bars included, shown in the browser window the record module opened for it, with
 * the opener's stylesheets copied in and no scripts.
 *
 * A frame leaves the layer through `park.js`, so its blit stays in the tree (found, saved, listed) while its
 * element is away, and its traits keep running (`keepTraits`): the bar's own listeners are what make its controls
 * work from the other window. Only the active member of the slot is displayed there, as on the layer; the window's
 * title is its title. When the last member leaves, the window closes; when the window closes by any means - its
 * own close button, or the opener going away - every frame comes back to the place it came from, so the opener
 * never leaves an orphan window open.
 */
import { forgetPlacement } from '../core/port.js';
import { stateOf } from '../core/state.js';
import { park, unpark } from './park.js';
import { listen } from './trait.js';

/** What is copied into a window: the document's stylesheets, linked and inline, CloudCanvas's own among them. */
const SHEETS = 'link[rel~="stylesheet"], style';

/** Every window of the layer up to date with its slot's open members; a closed one hands its frames back. */
export function syncWindows(layer, ctx) {
  for (const entry of Array.from(layer.windows.values())) {
    if (entry.win.closed) closed(layer, entry, ctx);
    else syncWindow(layer, entry, ctx);
  }
}

function syncWindow(layer, entry, ctx) {
  const members = ctx.members(entry.slot);
  if (members.length === 0) {
    shut(layer, entry);
    return;
  }
  if (!entry.ready) prepare(layer, entry, ctx);
  for (const rec of Array.from(entry.frames)) if (!members.includes(rec)) bringBack(entry, rec);
  for (const rec of members) if (!entry.frames.has(rec)) sendAway(entry, rec);
  const title = ctx.title(members.find((rec) => rec.active) ?? members[0]);
  if (entry.win.document.title !== title) entry.win.document.title = title;
}

/** The window's document made the frames' own: the opener's stylesheets, an empty body marked as a panels place. */
function prepare(layer, entry, ctx) {
  const source = layer.el.ownerDocument;
  const doc = entry.win.document;
  doc.head.replaceChildren(...Array.from(source.querySelectorAll(SHEETS), (node) => copySheet(doc, node)));
  doc.body.replaceChildren();
  doc.body.setAttribute('data-cc-panels', '');
  entry.offs = [
    listen(entry.win, ['pagehide'], () => closed(layer, entry, ctx)),
    listen(source.defaultView, ['pagehide'], () => closed(layer, entry, ctx))
  ];
  entry.ready = true;
}

/** A stylesheet element copied as a node (never re-parsed markup); a link keeps its resolved address. */
function copySheet(doc, node) {
  const copy = doc.importNode(node, true);
  if (node.href) copy.href = node.href;
  return copy;
}

/** Park the frame in the layer and show it in the window, free of the placement the port wrote on it. */
function sendAway(entry, rec) {
  const state = stateOf(rec.el);
  if (!state) return;
  park(state, true);
  for (const property of ['transform', 'width', 'height']) rec.el.style.removeProperty(property);
  entry.win.document.body.appendChild(rec.el);
  entry.frames.add(rec);
  // In the window there is no placement to wait for: it shows now.
  rec.layer.fresh.delete(rec);
  rec.fresh = false;
  rec.away = true;
  rec.actions.show();
}

/** Put the frame back where its anchor holds its place, hidden like a new panel until the next frame places it. */
function bringBack(entry, rec) {
  entry.frames.delete(rec);
  rec.away = false;
  const state = stateOf(rec.el);
  if (!state?.anchor) return;
  unpark(state, true);
  forgetPlacement(rec.el);
  rec.box = null;
  if (rec.destroyed) return;
  rec.el.hidden = true;
  rec.fresh = true;
  rec.layer.fresh.add(rec);
  rec.actions.invalidate();
}

/** Every frame back, the listeners off, the window closed and forgotten. */
function shut(layer, entry) {
  entry.closing = true;
  for (const rec of Array.from(entry.frames)) bringBack(entry, rec);
  for (const off of entry.offs ?? []) off();
  entry.offs = [];
  layer.windows.delete(entry.slot);
  if (!entry.win.closed) entry.win.close();
}

/** The window went (or the opener is going): its frames back, each panel to the place it came from. */
function closed(layer, entry, ctx) {
  if (entry.closing) return;
  const members = new Set([...entry.frames, ...ctx.members(entry.slot)]);
  shut(layer, entry);
  for (const rec of members) if (!rec.destroyed && rec.options.at === 'window') ctx.write(rec, { at: ctx.returnPlace(rec) });
}

/** Every window of a layer that is going away, closed now, its frames back where they were. */
export function shutWindows(layer) {
  for (const entry of Array.from(layer.windows.values())) shut(layer, entry);
}
