/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The edit lock: while a Pin is being edited, nothing renders into it.
 *
 * A display trait owns the inside of the content node and rewrites it from
 * `pin.contents`. An editor - a `contenteditable` node, an `<input>`, an IME
 * composition in flight - lives inside that same node, and a render during the
 * edit destroys it: the node identity, the caret, the selection, and the
 * half-typed word all go with it. No amount of care inside a trait can prevent
 * that, because the trait is not the one deciding when to run.
 *
 * So the lock is a *deferral*, never a drop:
 *
 *   - `beginEdit()` closes the content funnel and announces `'edit'` (true),
 *   - every render request made while it is closed sets `_editDirty` and returns
 *     without touching the DOM,
 *   - `endEdit()` opens it again, replays exactly one content invalidation - so
 *     the Pin lands on whatever its contents finished as, not on a stale queue
 *     of intermediate states - and announces `'edit'` (false).
 *
 * One gate, at the top of `renderContent` (`./pin-render.js`), covers both
 * callers by construction: the renderer's batched content pass and the
 * synchronous fallback path both funnel through it.
 *
 * Every function takes the Pin as its first argument.
 */
import { EDIT_EVENT } from '../addons/edit.js';
import { emitPinSignal } from './traits/base.js';

/** The signal type announcing an edit lock transition; payload is the new state. One name, the edit add-on's. */
export { EDIT_EVENT as EDIT_SIGNAL } from '../addons/edit.js';

/** Install the lock's state on a freshly constructed Pin. */
export function initEditState(pin) {
  /** @type {boolean} whether the content funnel is currently closed */
  pin._editing = false;
  /** @type {Element|null} the node holding the caret, when the caller named one */
  pin._editNode = null;
  /** @type {boolean} whether a render was deferred and owes a replay */
  pin._editDirty = false;
}

/**
 * Take the edit lock.
 *
 * Idempotent: re-entering an edit that is already open changes nothing and
 * announces nothing. An editor that arms itself on both `focus` and
 * `pointerdown` - the usual pair - must not emit two signals, and must not
 * forget the deferred render the first call already recorded.
 *
 * @param {Pin} pin
 * @param {Element|null} [node] the node holding the caret, for callers that
 *   want it back from `pin._editNode` when the edit ends
 * @returns {boolean} true when this call opened the lock
 */
export function beginEdit(pin, node = null) {
  if (pin._editing) return false;

  pin._editing = true;
  pin._editNode = node || null;
  pin._editDirty = false;

  emitPinSignal(pin, EDIT_EVENT, true);
  return true;
}

/**
 * Release the edit lock and replay the work it deferred.
 *
 * The replay is a single `invalidate('content')`, issued only if something
 * actually asked to render while the lock was held: an edit that changed no
 * contents costs no frame. Because it is an invalidation rather than a render,
 * an attached Pin repaints in the next frame's write phase like any other
 * content change, and an unattached one repaints synchronously - the same split
 * every other content write already obeys.
 *
 * @returns {boolean} true when this call released the lock
 */
export function endEdit(pin) {
  if (!pin._editing) return false;

  const owed = pin._editDirty;
  pin._editing = false;
  pin._editNode = null;
  pin._editDirty = false;

  if (owed) pin.invalidate('content');
  emitPinSignal(pin, EDIT_EVENT, false);
  return true;
}

/**
 * The gate itself: whether the caller must leave this Pin's DOM alone.
 *
 * Recording the deferral here rather than at each call site is the whole point -
 * a render path that forgets to set `_editDirty` is a render silently lost.
 *
 * @returns {boolean} true when the render must not proceed
 */
export function deferRender(pin) {
  if (!pin._editing) return false;
  pin._editDirty = true;
  return true;
}
