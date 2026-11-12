/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The modal place (`./panel.js`): while a panel is shown as a modal it holds the keyboard - the focus moves to its
 * bar, Tab and Shift+Tab cycle inside it, Escape closes it as the close control does (`dismiss` first) - and once
 * it is closed the focus returns to the element that had it before, when that is still there to take it.
 *
 * The frame is a `dialog` (`aria-modal`) only for as long as it is a shown modal. The cover is here too: while a
 * modal is shown the layer takes every press outside it, and while a panel is modal or full the others are inert.
 */
import { listen } from './trait.js';

/** The class the layer carries while a modal is shown: it takes every press outside the modal. */
export const MODAL_LAYER_CLASS = 'cc-modal';

/** What can take the focus inside the frame. */
const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), [contenteditable="true"], [contenteditable=""]';

/** Hold the keyboard (`on`) or let it go; a no-op when nothing changes. */
export function syncModal(rec, on) {
  if (on === Boolean(rec.modal)) return;
  if (on) enterModal(rec);
  else leaveModal(rec);
}

function enterModal(rec) {
  const el = rec.el;
  const doc = el.ownerDocument;
  const before = doc.activeElement;
  rec.modal = {
    back: before && before !== doc.body ? before : null,
    off: listen(doc, ['keydown'], (event) => held(rec, event))
  };
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  if (!rec.labelled) el.setAttribute('aria-label', rec.parts.titleText.data);
  rec.parts.bar.focus({ preventScroll: true });
}

/**
 * Let the keyboard go. The focus returns to the element that had it before the modal, when that is still in the
 * document and shown - one inside the panel only while the panel is still shown - and only when the focus is
 * still the modal's (inside it, or dropped). Otherwise it is left alone: the application hears `panel:change`.
 */
function leaveModal(rec) {
  const { back, off } = rec.modal;
  const el = rec.el;
  rec.modal = null;
  off();
  el.removeAttribute('role');
  el.removeAttribute('aria-modal');
  if (!rec.labelled) el.removeAttribute('aria-label');
  const active = el.ownerDocument.activeElement;
  const ours = !active || active === el.ownerDocument.body || el.contains(active);
  // Given back once the covered panels are no longer inert (`syncCover`), or the element could not take it.
  if (ours && back) rec.layer.refocus = { rec, back };
}

/** Whether `back` can take the focus again: in the document, shown, and in a shown panel if it is in this one. */
function returnable(rec, back) {
  if (!back || !back.isConnected || back.closest('[hidden], [inert]')) return false;
  const shown = !rec.destroyed && rec.el.isConnected && !rec.el.hidden;
  return shown || !rec.el.contains(back);
}

/** The keys a shown modal keeps: Escape closes it, Tab stays inside it. */
function held(rec, event) {
  if (event.defaultPrevented) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    rec.actions.close();
  } else if (event.key === 'Tab') {
    cycle(rec, event);
  }
}

/** Tab past the last focusable wraps to the first, Shift+Tab before the first to the last; from outside, in. */
function cycle(rec, event) {
  const el = rec.el;
  const items = Array.from(el.querySelectorAll(FOCUSABLE)).filter((item) => !item.disabled && !item.closest('[hidden], [inert]'));
  const active = el.ownerDocument.activeElement;
  const index = items.indexOf(active);
  const first = items[0];
  const last = items[items.length - 1];
  let next = null;
  if (!el.contains(active)) next = event.shiftKey ? last : first;
  else if (event.shiftKey && index === 0) next = last;
  else if (!event.shiftKey && index === items.length - 1) next = first;
  if (!next) return;
  event.preventDefault();
  next.focus({ preventScroll: true });
}

/**
 * While a modal is shown the layer takes every press outside it (the panel chunk, `cc-modal`); while a panel is
 * modal or full, the panels it covers are `inert`, so the keyboard does not reach them either.
 */
export function syncCover(layer, records) {
  const modal = records.some((rec) => rec.modal);
  if (layer.el.classList.contains(MODAL_LAYER_CLASS) !== modal) layer.el.classList.toggle(MODAL_LAYER_CLASS, modal);
  const shownAt = (place) => records.find((rec) => rec.active && !rec.fresh && rec.options.at === place);
  const cover = shownAt('modal') ?? shownAt('full');
  for (const rec of records) {
    const inert = Boolean(cover) && rec !== cover && rec.options.at !== 'window';
    if (rec.el.hasAttribute('inert') === inert) continue;
    if (inert) rec.el.setAttribute('inert', '');
    else rec.el.removeAttribute('inert');
  }
  const pending = layer.refocus;
  layer.refocus = null;
  if (pending && returnable(pending.rec, pending.back)) pending.back.focus({ preventScroll: true });
}
