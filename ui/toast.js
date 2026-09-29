/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Toasts: short-lived notices with at most one action, the shape an Undo takes.
 *
 *   const toaster = createToaster(host);
 *   toaster.show({ message: 'Note deleted', action: { label: 'Undo', run: restore } });
 *
 * A toast is `role="status"` (a `danger` one is `role="alert"`) inside one
 * labelled region, so it is read out without taking focus. It leaves after
 * `timeout` ms (6000 by default, 0 keeps it), and the countdown pauses while the
 * pointer rests on it or focus is inside it, so an Undo is never snatched away
 * mid-reach. The action runs once and closes its toast; Escape closes the
 * focused toast. Beyond `max` the oldest toast goes.
 */
import { button, createLife, documentOf, el } from './dom.js';
import { injectUiStyles } from './styles.js';

const CLASS = 'cloudcanvas-ui-toast';
const TONES = /* @__PURE__ */ new Set(['info', 'success', 'warning', 'danger']);

/** The least time a resumed countdown gets, so a toast never vanishes on pointer-out. */
const RESUME_FLOOR_MS = 1500;

function toastNode(doc, life, entry, labels, close) {
  const node = el(doc, 'div', { className: CLASS, attrs: {
    role: entry.tone === 'danger' ? 'alert' : 'status', 'data-tone': entry.tone, 'data-ui-id': entry.id
  } });
  node.append(el(doc, 'span', { className: `${CLASS}-message`, text: entry.message }));
  if (entry.action) {
    node.append(button(doc, { className: `${CLASS}-action`, label: entry.action.label, signal: life.signal,
      onClick: () => { try { entry.action.run(); } finally { close(entry.id); } } }));
  }
  node.append(button(doc, { className: `${CLASS}-dismiss`, label: '×', ariaLabel: labels.dismiss,
    signal: life.signal, onClick: () => close(entry.id) }));
  return node;
}

function validEntry(options, id, fallbackTimeout) {
  const message = String(options?.message ?? '').trim();
  if (message === '') throw new TypeError('A toast needs a message');
  const action = options.action;
  if (action && (typeof action.run !== 'function' || !String(action.label ?? '').trim())) {
    throw new TypeError('A toast action needs a label and a run function');
  }
  const tone = TONES.has(options.tone) ? options.tone : 'info';
  const timeout = Number.isFinite(options.timeout) && options.timeout >= 0 ? options.timeout : fallbackTimeout;
  return { id, message, tone, action: action ? { label: String(action.label), run: action.run } : null, timeout };
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
 * @param {{max?: number, timeout?: number, labels?: {region?: string, dismiss?: string}}} [options]
 * @returns {{show(options: object): string, dismiss(id: string): boolean, clear(): void, destroy(): void}}
 */
export function createToaster(host, { max = 3, timeout = 6000, labels = {} } = {}) {
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
  return {
    show(options) {
      if (life.dead) return null;
      count += 1;
      const entry = validEntry(options, `toast-${count}`, timeout);
      entry.node = toastNode(doc, life, entry, words, close);
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
