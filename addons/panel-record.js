/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The panel add-on's records (`./panel.js`): one per panel element, kept across trait restarts, holding its
 * options, its frame and any gesture in flight; and the slot rules that make the open panels of one place the
 * tabs of one frame.
 *
 * A write of the options restarts a trait in this framework, so the trait is a thin door onto this record: its
 * cleanup only marks the record stopped and checks at the end of the task (a microtask). A restart inside the
 * same `set()` takes the record straight back, so the bar, the focus and a gesture in flight are never touched;
 * a removal or `{panel: false}` finds it still stopped and takes the frame down. `setPanel` and the layer's own
 * writes (a tab switch, a slot's settings carried to its next member) write the attribute with no restart.
 *
 * A slot (`slotOf`) shows one member: the one that says `active`, else the first in document order. A panel
 * that enters an occupied slot becomes its active member and takes the slot's `size`, `pinned`, `collapsed`
 * (an edge) or `box` (floating) from the member that was showing, unless the same write set them; a tab switch
 * carries them the same way, and a member that leaves hands them to the next. `panel:change` is announced once
 * per task, after the writes of that task have settled. A `window:` slot is a browser window: the write that sends
 * a panel there opens it (or is refused), and every refresh hands the window module what changed.
 */
import { schedule } from '../core/frame.js';
import { writeAttribute } from '../core/spec.js';
import { childBlitsOf } from '../core/state.js';
import { RESIZE_DIRECTIONS, RESIZING_CLASS } from './resize.js';
import { listen, titleOf } from './trait.js';
import { setVisible } from './widget.js';
import { buildFrame, closeMenu, focusTab, syncFrame, titleFor, unbuildFrame } from './panel-frame.js';
import { syncCover, syncModal } from './panel-modal.js';
import { openWindow, syncWindows as syncDoor, windowOf as doorWindow } from './panel-door.js';
import { cancelGesture } from './panel-snap.js';
import { axisOf, insetsNormalised, isEdge, mergePanel, normalisePanel, slotNormalised } from './panel-place.js';

/** @type {WeakMap<Element, object>} panel element -> its record */
const RECORDS = /* @__PURE__ */ new WeakMap();


/** The side of an edge strip that faces the content: the only one that sizes it. */
const INNER_SIDE = /* @__PURE__ */ Object.freeze({ left: 'e', right: 'w', top: 's', bottom: 'n' });

/** What `panel:change` watches. */
const CHANGE_KEYS = /* @__PURE__ */ Object.freeze(['at', 'pinned', 'collapsed', 'open', 'active']);

let uids = 0;

const sameJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** The record of a panel's handle, or null. */
export function recordOf(b) {
  return (b && b.el && RECORDS.get(b.el)) || null;
}

/** The panels of a layer that are live, in document order; one away in a window is read through its anchor. */
export function ordered(layer) {
  const out = [];
  for (const element of childBlitsOf(layer.root.plane)) {
    const rec = RECORDS.get(element);
    if (rec && rec.layer === layer && !rec.destroyed) out.push(rec);
  }
  return out;
}

/** The slot a record occupies with options `o` (its own by default). */
export function slotFor(rec, o = rec.options) {
  return slotNormalised(o, rec.el.id || rec.uid);
}

/** The options in force as plain data, `active` resolved. */
export function optionsOf(rec) {
  return JSON.parse(JSON.stringify({ ...rec.options, active: rec.active }));
}

/** The room the layer's pinned panels take now, held at the layer's last size. */
export function currentInsets(layer) {
  return insetsNormalised(ordered(layer).map((rec) => ({ ...rec.options, active: rec.active })), layer.size);
}

/* ------------------ LIFECYCLE ------------------ */

/** The trait's body: the record (new or kept), the options put in force. @returns {() => void} the cleanup */
export function startRecord(b, options, layer) {
  const next = normalisePanel(options);
  const given = options === true || options === undefined || options === null ? {} : { ...options };
  let rec = RECORDS.get(b.el);
  if (rec && rec.layer !== layer) {
    destroyRecord(rec);
    rec = null;
  }
  rec ??= createRecord(b, layer);
  rec.running = true;
  commit(rec, given, next, false);
  rec.announced ??= stateFor(rec);
  return () => {
    rec.running = false;
    queueMicrotask(() => { if (!rec.running) destroyRecord(rec); });
  };
}

function createRecord(b, layer) {
  const rec = {
    b, el: b.el, layer, uid: `panel-${(uids += 1)}`, raw: {}, options: null, active: false, from: null,
    running: false, destroyed: false, fresh: true, away: false, box: null, gesture: null, modal: null, menu: null,
    announced: null, offs: [], parts: null, title: titleOf(b.el), labelled: b.el.hasAttribute('aria-label'),
    resizeKey: b.el.hasAttribute('data-resize') ? null : 'false', resizeDue: false
  };
  rec.actions = {
    write: (patch) => write(rec, patch),
    close: () => close(rec),
    full: () => toggleFull(rec),
    select: (member, focus) => selectTab(member, focus),
    member: (uid) => layer.byUid.get(uid) ?? null,
    insets: () => currentInsets(layer),
    joining: (edge) => joining(rec, edge),
    insetsAs: (o) => insetsAs(rec, o),
    reveal: () => {
      layer.reveal.add(rec);
      invalidate(layer);
    },
    show: () => syncShown(rec),
    invalidate: () => invalidate(layer)
  };
  RECORDS.set(b.el, rec);
  layer.byUid.set(rec.uid, rec);
  layer.fresh.add(rec);
  // Shown from its first placed frame, so a new panel never slides in from the layer's corner.
  b.el.hidden = true;
  rec.parts = buildFrame(rec);
  rec.offs.push(
    b.on('resize:end', (event) => { if (event.target === rec.el) resized(rec, event.detail.payload); }),
    listen(b.el, ['transitionend', 'transitioncancel'], (event) => remeasure(rec, event))
  );
  return rec;
}

/**
 * A size transition outlasts the frame that measured it, so the core holds a size from mid-way: declaring the
 * placed size again when it ends has it read once more, so `b.size` (and the resize add-on) start from the truth.
 */
function remeasure(rec, event) {
  if (event.target !== rec.el || !rec.box || (event.propertyName !== 'width' && event.propertyName !== 'height')) return;
  rec.b.set({ w: rec.box.w, h: rec.box.h });
}

/** Take a panel down: its gesture, menu and modal end, its slot passes on; still in the document, it is handed back. */
export function destroyRecord(rec) {
  if (rec.destroyed) return;
  rec.destroyed = true;
  const layer = rec.layer;
  cancelGesture(rec);
  closeMenu(rec, false);
  syncModal(rec, false);
  for (const off of rec.offs) off();
  RECORDS.delete(rec.el);
  layer.byUid.delete(rec.uid);
  layer.fresh.delete(rec);
  layer.reveal.delete(rec);
  if (rec.resizeKey !== 'false' && rec.el.isConnected) rec.b.set({ resize: false });
  if (layer.closing) return;
  if (rec.el.isConnected) {
    unbuildFrame(rec);
    rec.el.hidden = false;
  }
  if (rec.options && layer.shown.get(slotFor(rec)) === rec) handOn(layer, rec, slotFor(rec), rec.options);
  refresh(layer);
}

/* ------------------ WRITES ------------------ */

/** Merge `patch` into the options and put them in force; refused whole, before anything is written. */
export function write(rec, patch) {
  const raw = mergePanel(rec.raw, patch);
  commit(rec, raw, normalisePanel(raw), true);
}

/** Put `raw` in force unless it changes nothing; `writeBack` when it did not arrive through the attribute. */
function commit(rec, raw, next, writeBack) {
  let given = raw;
  let options = next;
  let rewrite = writeBack && !sameJson(raw, rec.raw);
  const door = windowDoor(rec, options);
  if (door.refused) {
    given = keepPlace(rec, raw, door.refused);
    options = normalisePanel(given);
    rewrite = true;
  }
  if (rewrite) writeAttribute(rec.el, 'panel', given);
  rec.raw = given;
  const before = rec.options;
  if (before && sameJson(before, options)) {
    // Already at a window whose window had gone: the one just opened still needs its frames.
    if (door.opened && !rec.layer.settling) refresh(rec.layer);
    return;
  }
  rec.options = options;
  settle(rec, before, false);
}

/** A window could not be opened: the place stays as it was, and the panel says why. */
function keepPlace(rec, raw, reason) {
  const kept = { ...raw };
  const was = rec.options?.at;
  // Already at `window` with no window to be had (reopened, say): back where it came from, never open and unseen.
  if (was === 'window') kept.at = returnPlace(rec);
  else if (was) kept.at = was;
  else delete kept.at;
  queueMicrotask(() => rec.b.emit('panel:refused', { at: 'window', reason }));
  return kept;
}

/** Resolve the slots a write moved, then bring every frame up to date. Re-entrant writes queue behind it. */
function settle(rec, before, force) {
  const layer = rec.layer;
  layer.queue.push([rec, before, force]);
  if (layer.settling) return;
  layer.settling = true;
  try {
    while (layer.queue.length > 0) resolveSlot(layer, ...layer.queue.shift());
  } finally {
    layer.settling = false;
  }
  refresh(layer);
}

/** A panel that entered a slot (or asked to be its active member) takes it; one that left it hands it on. */
function resolveSlot(layer, rec, before, force) {
  if (rec.destroyed) return;
  const now = rec.options;
  const slot = slotFor(rec, now);
  const was = before ? slotFor(rec, before) : null;
  if (before && before.at !== now.at) rec.from = before.at;
  const entered = now.open && (!before || !before.open || was !== slot);
  const selected = now.active === true && (force || before?.active !== true);
  // Markup the layer found when it mounted is declared, not put anywhere: its slots show the first, or the active.
  const declared = !before && layer.adopting;
  if (!declared && (entered || selected)) takeSlot(layer, rec, slot, before);
  if (before?.open && layer.shown.get(was) === rec && (was !== slot || !now.open)) handOn(layer, rec, was, before);
}

/**
 * The settings slot member `from` hands to `to` that `keep(key)` passes: on an edge its `size` on that edge's axis
 * (the other axis stays `to`'s), `pinned` and `collapsed`; floating, its `box`.
 */
function settingsOf(from, to, keep) {
  if (from.at === 'float') return keep('box') ? { box: from.box } : {};
  if (!isEdge(from.at)) return {};
  const axis = axisOf(from.at);
  const out = keep('size') ? { size: { ...to.size, [axis]: from.size[axis] } } : {};
  for (const key of ['pinned', 'collapsed']) if (keep(key)) out[key] = from[key];
  return out;
}

/** Whether this write left `key` as it was (a new panel: did not give it), so the slot's own may be carried. */
function unsetBy(rec, before, axis) {
  return (key) => {
    if (key === 'size' && before) return before.size[axis] === rec.options.size[axis];
    if (before) return sameJson(before[key], rec.options[key]);
    const given = rec.raw[key];
    return key === 'size' ? given === undefined || (typeof given === 'object' && given?.[axis] === undefined) : !(key in rec.raw);
  };
}

function takeSlot(layer, rec, slot, before) {
  const holder = layer.shown.get(slot);
  layer.shown.set(slot, rec);
  if (!holder || holder === rec || holder.destroyed) return;
  write(rec, { ...settingsOf(holder.options, rec.options, unsetBy(rec, before, axisOf(holder.options.at))), active: true });
  write(holder, { active: false });
}

function handOn(layer, rec, slot, before) {
  const members = ordered(layer).filter((each) => each !== rec && each.options.open && slotFor(each) === slot);
  const next = members.find((each) => each.options.active === true) ?? members[0];
  if (!next) {
    layer.shown.delete(slot);
    return;
  }
  layer.shown.set(slot, next);
  write(next, settingsOf(before, next.options, () => true));
}

/** What `rec` would be at `edge`: its options there, with the slot's settings carried as joining carries them. */
function joining(rec, edge) {
  const there = { ...rec.options, at: edge };
  const holder = rec.layer.shown.get(edge);
  return holder && holder !== rec ? { ...there, ...settingsOf(holder.options, there, () => true) } : there;
}

/** The insets as they would be with `rec` shown as `o`, in place of whatever its edge shows now. */
function insetsAs(rec, o) {
  const others = ordered(rec.layer).filter((each) => each !== rec && !(isEdge(o.at) && slotFor(each) === o.at));
  return insetsNormalised([...others.map((each) => ({ ...each.options, active: each.active })), { ...o, active: true }], rec.layer.size);
}

/* ------------------ ACTIONS ------------------ */

/** The close control and a modal's Escape: `dismiss` first, and only an unprevented one closes. */
function close(rec) {
  if (rec.b.emit('dismiss').defaultPrevented) return false;
  write(rec, rec.options.at === 'window' ? { open: false, at: returnPlace(rec) } : { open: false });
  return true;
}

/* ------------------ WINDOWS ------------------ */

/** Going to a window needs one open for its slot: `{opened}` when one was opened now, `{refused}` why it could not be. */
function windowDoor(rec, o) {
  if (o.at !== 'window' || !o.open) return {};
  const slot = slotFor(rec, o);
  if (rec.layer.windows.has(slot)) return {};
  const refused = openWindow(rec.layer, slot, o);
  return refused ? { refused } : { opened: true };
}

/** The window a panel is in, or null. */
function windowOf(rec) {
  const o = rec.options;
  return o.at === 'window' && o.open ? doorWindow(rec.layer, slotFor(rec)) : null;
}

/** The layer's windows up to date (`./panel-door.js`), handed what the window module needs of the records. */
function syncWindows(layer) {
  layer.windowContext ??= {
    members: (slot) => layer.members.get(slot) ?? [],
    title: titleFor,
    write,
    returnPlace,
    refuse: (rec, reason) => {
      write(rec, { at: returnPlace(rec) });
      queueMicrotask(() => rec.b.emit('panel:refused', { at: 'window', reason }));
    }
  };
  syncDoor(layer, layer.windowContext);
}

/** Where a panel goes back to from a window: the place it came from, else floating, else its first place. */
function returnPlace(rec) {
  const { places } = rec.options;
  if (rec.from && rec.from !== 'window') return rec.from;
  return places.includes('float') ? 'float' : (places.find((place) => place !== 'window') ?? 'float');
}

/** `full`, and back to the place it came from. */
function toggleFull(rec) {
  const o = rec.options;
  if (o.at !== 'full') {
    if (o.places.includes('full')) write(rec, { at: 'full' });
    return;
  }
  const fallback = o.places.includes('float') ? 'float' : o.places.find((place) => place !== 'full');
  const back = rec.from && rec.from !== 'full' ? rec.from : fallback;
  if (back) write(rec, { at: back });
}

/** Show `member` in its slot; with `focus`, its own tab takes the keyboard. */
function selectTab(member, focus) {
  if (!member || member.destroyed) return;
  if (member.options.active === true) settle(member, member.options, true);
  else write(member, { active: true });
  if (focus) focusTab(member);
}

/** `resize:end`: the new box when floating, the new thickness on an edge. */
function resized(rec, payload) {
  if (rec.destroyed || !payload) return;
  const o = rec.options;
  rec.box = null;
  if (!payload.cancelled && o.at === 'float') write(rec, { box: { x: rec.b.x, y: rec.b.y, w: payload.width, h: payload.height } });
  else if (!payload.cancelled && isEdge(o.at)) {
    const axis = axisOf(o.at);
    write(rec, { size: { [axis]: axis === 'x' ? payload.width : payload.height } });
  }
  if (rec.resizeDue) syncResize(rec);
  invalidate(rec.layer);
}

/* ------------------ REFRESH ------------------ */

/** Which member each slot shows, and the open members of each, in document order. */
function resolveShown(layer) {
  const records = ordered(layer);
  const shown = new Map();
  const members = new Map();
  for (const rec of records) {
    const o = rec.options;
    if (!o.open) continue;
    const slot = slotFor(rec, o);
    const held = shown.get(slot);
    if (!held || (o.active === true && held.options.active !== true)) shown.set(slot, rec);
    members.set(slot, [...(members.get(slot) ?? []), rec]);
  }
  for (const rec of records) rec.active = shown.get(slotFor(rec)) === rec;
  layer.shown = shown;
  layer.members = members;
  return records;
}

/** Every frame up to date, the placement due next frame, `panel:change` due at the end of the task. */
function refresh(layer) {
  for (const rec of resolveShown(layer)) {
    syncFrame(rec, layer.members.get(slotFor(rec)) ?? [rec]);
    if (!rec.fresh) syncShown(rec);
    syncResize(rec);
  }
  syncWindows(layer);
  syncCover(layer, ordered(layer));
  if (!layer.announcing) {
    layer.announcing = true;
    queueMicrotask(() => announce(layer));
  }
  invalidate(layer);
}

/** Shown or not (in a window, only once its frame is there), and holding the keyboard while it is a shown modal. */
export function syncShown(rec) {
  setVisible(rec.el, rec.active && (rec.options.at !== 'window' || rec.away));
  syncModal(rec, rec.active && rec.options.at === 'modal');
}

/** The resize add-on as this place needs it: every side floating, the inner side on an edge, none otherwise. */
function resizeOf(o) {
  if (o.collapsed || !(o.at === 'float' || isEdge(o.at))) return false;
  const directions = o.at === 'float' ? [...RESIZE_DIRECTIONS] : [INNER_SIDE[o.at]];
  return { directions, alwaysVisibleHandles: true, minWidth: o.min.w, minHeight: o.min.h };
}

/** Rewrite the resize trait only when what it needs changed, and never under a resize in flight. */
function syncResize(rec) {
  if (rec.el.classList.contains(RESIZING_CLASS)) {
    rec.resizeDue = true;
    return;
  }
  const next = resizeOf(rec.options);
  const key = JSON.stringify(next);
  rec.resizeDue = false;
  if (key === rec.resizeKey) return;
  rec.resizeKey = key;
  rec.b.set({ resize: next });
}

function stateFor(rec) {
  const { at, pinned, collapsed, open } = rec.options;
  return { at, pinned, collapsed, open, active: rec.active };
}

/** `panel:change` on every panel whose place, pin, fold, openness or activity moved since it last spoke. */
function announce(layer) {
  layer.announcing = false;
  for (const rec of ordered(layer)) {
    const now = stateFor(rec);
    const last = rec.announced;
    rec.announced = now;
    if (!last || CHANGE_KEYS.every((key) => last[key] === now[key])) continue;
    rec.b.emit('panel:change', { ...now, from: last.at, window: windowOf(rec) });
  }
}

/** The layer's passes have work next frame. */
export function invalidate(layer) {
  layer.dirty = true;
  if (layer.root) schedule(layer.root);
}
