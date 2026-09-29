/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Status: one truthful line about a region's state, read out politely (or
 * assertively for an error), with a Retry that exists only when it can work.
 *
 *   const status = createStatus(host);
 *   status.update({ status: 'error', message: 'Could not load.', retry: load });
 *
 * `status` is one of idle | loading | empty | error | unavailable | ready. Idle
 * with no message renders nothing visible but keeps the live region mounted,
 * so the next change is announced. Retry shows for error and unavailable only,
 * and only with a `retry` function. Every word is overridable (`labels`,
 * `retryLabel`) so the host owns its copy.
 */
import { button, createLife, documentOf, el, textNode, writeText } from './dom.js';
import { injectUiStyles } from './styles.js';

const CLASS = 'cloudcanvas-ui-status';

/** The default word for each status. */
export const STATUS_LABELS = /* @__PURE__ */ Object.freeze({
  idle: '', loading: 'Loading', empty: 'Nothing here yet', error: 'Something went wrong',
  unavailable: 'Unavailable', ready: ''
});

function statusNodes(doc, life, state) {
  const root = el(doc, 'div', { className: CLASS, attrs: { role: 'status', 'aria-live': 'polite' } });
  const label = el(doc, 'strong', { className: `${CLASS}-label` });
  const message = el(doc, 'span', { className: `${CLASS}-message` });
  const retry = button(doc, { className: `${CLASS}-retry`, label: 'Retry', signal: life.signal,
    onClick: () => state.retry?.() });
  root.append(label, message, retry);
  return { root, label, labelText: textNode(doc, label), message, messageText: textNode(doc, message), retry };
}

/**
 * @param {HTMLElement} host
 * @returns {{update(model: object): void, destroy(): void}}
 */
export function createStatus(host) {
  const doc = documentOf(host);
  injectUiStyles(doc);
  const life = createLife();
  const state = { retry: null };
  const nodes = statusNodes(doc, life, state);
  host.append(nodes.root);
  return {
    update(model = {}) {
      if (life.dead) return;
      const status = model.status ?? 'idle';
      if (!Object.hasOwn(STATUS_LABELS, status)) throw new TypeError(`Unknown status: ${String(status)}`);
      const word = String(model.labels?.[status] ?? STATUS_LABELS[status]);
      const message = String(model.message ?? '');
      nodes.root.setAttribute('data-status', status);
      nodes.root.setAttribute('aria-live', status === 'error' ? 'assertive' : 'polite');
      nodes.root.classList.toggle('is-quiet', word === '' && message === '');
      writeText(nodes.labelText, word);
      nodes.label.hidden = word === '';
      writeText(nodes.messageText, message);
      nodes.message.hidden = message === '';
      const canRetry = (status === 'error' || status === 'unavailable') && typeof model.retry === 'function';
      state.retry = canRetry ? model.retry : null;
      nodes.retry.hidden = !canRetry;
      writeText(nodes.retry.firstChild, model.retryLabel ?? 'Retry');
    },
    destroy() {
      if (!life.destroy()) return;
      state.retry = null;
      nodes.root.remove();
    }
  };
}
