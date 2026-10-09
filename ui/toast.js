/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Toasts: short-lived notices with at most two actions.
 *
 *   const toaster = createToaster(host, { onAction: (toastId, actionId) => answer(toastId, actionId) });
 *   toaster.show({ message: 'Note deleted', action: { label: 'Undo', run: restore } });
 *   toaster.show({ message: 'Stand-up in five minutes', actions: [{ id: 'snooze', label: 'Snooze' }, { id: 'open', label: 'Open' }] });
 *
 * A toast is `role="status"` (a `danger` one is `role="alert"`) inside one
 * labelled region, so it is read out without taking focus. It leaves after
 * `timeout` ms (6000 by default, 0 keeps it), and the countdown pauses while the
 * pointer rests on it or focus is inside it, so an Undo is never snatched away
 * mid-reach. Escape closes the focused toast. Beyond `max` the oldest toast goes.
 *
 * TWO WAYS TO NAME AN ACTION, never both on one toast. `action: {label, run}`
 * is the Undo shape: one button that runs its own function. `actions` is a
 * list of `{id, label}`, two at most, reported through the toaster's
 * `onAction(toastId, actionId)` - one handler for every toast. Either way an
 * action is taken once and closes its toast.
 *
 * WHERE THE REGION SITS is the sheet's: along the bottom, held off each edge by
 * a token of its own (`--cc-ui-toast-inset-bottom`, `-left`, `-right`), so a
 * host keeps it clear of a bar or a button it floats there.
 */
import { button, createLife, documentOf, el, uniqueItems } from './dom.js';
import { injectUiStyles } from './styles.js';

const CLASS = 'cloudcanvas-ui-toast';
const TONES = /* @__PURE__ */ new Set(['info', 'success', 'warning', 'danger']);

/** The least time a resumed countdown gets, so a toast never vanishes on pointer-out. */
const RESUME_FLOOR_MS = 1500;

/** The most actions one toast offers. */
const MAX_ACTIONS = 2;

/** A toast's nodes: its message, a button for each action, and the dismiss control. `on.take` answers an action, `on.close` the dismiss. */
function toastNode(doc, life, entry, labels, on) {
  const node = el(doc, 'div', { className: CLASS, attrs: {
    role: entry.tone === 'danger' ? 'alert' : 'status', 'data-tone': entry.tone, 'data-ui-id': entry.id
  } });
  node.append(el(doc, 'span', { className: `${CLASS}-message`, text: entry.message }));
  for (const action of entry.actions) {
    node.append(button(doc, { className: `${CLASS}-action`, label: action.label, signal: life.signal, attrs: { 'data-ui-action': action.id },
      onClick: () => on.take(entry.id, action) }));
  }
  node.append(button(doc, { className: `${CLASS}-dismiss`, label: '×', ariaLabel: labels.dismiss,
    signal: life.signal, onClick: () => on.close(entry.id) }));
  return node;
}

/** The Undo shape as the one action it is: a label and the function it runs. It names no id, and is reported to no one else. */
function ownAction(action) {
  if (typeof action.run !== 'function' || !String(action.label ?? '').trim()) {
    throw new TypeError('A toast action needs a label and a run function');
  }
  return [{ id: null, label: String(action.label), run: action.run }];
}

/**
 * A toast's actions, checked before anything is shown, each as the label it
 * shows and what a press on it runs: the one `action`, or the listed
 * `actions`, which report through `onAction`.
 * @throws {TypeError} both forms at once, more than two, a repeated or missing id, a blank label
 */
function actionsOf(options, id, onAction) {
  if (options.action && options.actions) throw new TypeError('A toast takes action or actions, not both');
  if (options.action) return ownAction(options.action);
  const listed = uniqueItems(options.actions ?? [], 'toast action');
  if (listed.length > MAX_ACTIONS) throw new TypeError('A toast takes at most two actions');
  return listed.map((action) => {
    if (!String(action.label ?? '').trim()) throw new TypeError(`The toast action ${action.id} needs a label`);
    return { id: action.id, label: String(action.label), run: () => onAction?.(id, action.id) };
  });
}

function validEntry(options, id, fallbackTimeout, onAction) {
  const message = String(options?.message ?? '').trim();
  if (message === '') throw new TypeError('A toast needs a message');
  const tone = TONES.has(options.tone) ? options.tone : 'info';
  const timeout = Number.isFinite(options.timeout) && options.timeout >= 0 ? options.timeout : fallbackTimeout;
  return { id, message, tone, actions: actionsOf(options, id, onAction), timeout };
}

function armTimer(life, entry, close) {
  entry.cancel?.();
  entry.cancel = null;
  if (entry.timeout === 0 || entry.paused) return;
  const wait = Math.max(entry.remaining ?? entry.timeout, entry.remaining === undefined ? 0 : RESUME_FLOOR_MS);
  entry.deadline = Date.now() + wait;
  entry.cancel = life.later(() => close(entry.id), wait);
}

function bindPause(life, node, entry, close) {
  const pause = () => {
    if (entry.paused) return;
    entry.paused = true;
    if (entry.deadline) entry.remaining = Math.max(0, entry.deadline - Date.now());
    entry.cancel?.();
    entry.cancel = null;
  };
  const resume = () => {
    if (!entry.paused || node.matches(':hover') || node.contains(node.ownerDocument.activeElement)) return;
    entry.paused = false;
    armTimer(life, entry, close);
  };
  life.on(node, 'pointerenter', pause);
  life.on(node, 'focusin', pause);
  life.on(node, 'pointerleave', resume);
  life.on(node, 'focusout', () => queueMicrotask(resume));
  life.on(node, 'keydown', (event) => {
    if (event.key === 'Escape') { event.preventDefault(); close(entry.id); }
  });
}

/**
 * @param {HTMLElement} host
 * @param {{max?: number, timeout?: number, labels?: {region?: string, dismiss?: string},
 *   onAction?: (toastId: string, actionId: string) => void}} [options] `onAction` hears every action a toast lists in `actions`
 * @returns {{show(options: {message: string, tone?: 'info'|'success'|'warning'|'danger', timeout?: number,
 *   action?: {label: string, run: () => void}, actions?: Array<{id: string, label: string}>}): string,
 *   dismiss(id: string): boolean, clear(): void, destroy(): void}}
 */
export function createToaster(host, { max = 3, timeout = 6000, labels = {}, onAction } = {}) {
  const doc = documentOf(host);
  injectUiStyles(doc);
  const life = createLife();
  const words = { region: labels.region ?? 'Notifications', dismiss: labels.dismiss ?? 'Dismiss' };
  const region = el(doc, 'section', { className: `${CLASS}s`, attrs: { 'aria-label': words.region } });
  host.append(region);
  const entries = new Map();
  let count = 0;
  const close = (id) => {
    const entry = entries.get(id);
    if (!entry) return false;
    entry.cancel?.();
    entries.delete(id);
    entry.node.remove();
    return true;
  };
  // An action is taken once: it closes its toast whatever it does, and a toast that has gone takes none.
  const take = (id, action) => {
    if (!entries.has(id)) return;
    try { action.run(); } finally { close(id); }
  };
  return {
    show(options) {
      if (life.dead) return null;
      count += 1;
      const entry = validEntry(options, `toast-${count}`, timeout, onAction);
      entry.node = toastNode(doc, life, entry, words, { close, take });
      entries.set(entry.id, entry);
      region.append(entry.node);
      bindPause(life, entry.node, entry, close);
      armTimer(life, entry, close);
      while (entries.size > Math.max(1, max)) close(entries.keys().next().value);
      return entry.id;
    },
    dismiss: (id) => close(id),
    clear() { for (const id of [...entries.keys()]) close(id); },
    destroy() {
      if (!life.destroy()) return;
      entries.clear();
      region.remove();
    }
  };
}
