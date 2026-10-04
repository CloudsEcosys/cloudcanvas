/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Empty state: what a region says when it has nothing to show.
 *
 *   const empty = createEmptyState(host, { onAction: () => newNote() });
 *   empty.update({ title: 'No notes yet', body: 'Notes you write appear here.', actionLabel: 'New note' });
 *
 * A title, a sentence, and at most one action. The action is drawn only when
 * the model names it and something answers it: a button that does nothing is
 * not an invitation. A part with no words is hidden rather than left as a gap.
 *
 * It is content, not a live region. For a state that changes while the user
 * waits - loading, failed, retry - use `createStatus`.
 */
import { button, createLife, documentOf, el, textNode, writeText } from './dom.js';
import { injectUiStyles } from './styles.js';

const CLASS = 'cloudcanvas-ui-empty';

/** Write `value` into a part and hide the part when there are no words; returns whether it shows. */
function writePart(node, text, value) {
  const words = String(value ?? '').trim();
  writeText(text, words);
  node.hidden = words === '';
  return words !== '';
}

/**
 * @param {HTMLElement} host
 * @param {{onAction?: () => void}} [callbacks]
 * @returns {{update(model: {title?: string, body?: string, actionLabel?: string}): void, destroy(): void}}
 */
export function createEmptyState(host, { onAction } = {}) {
  const doc = documentOf(host);
  injectUiStyles(doc);
  const life = createLife();
  const acts = typeof onAction === 'function';
  const root = el(doc, 'div', { className: CLASS });
  const title = el(doc, 'p', { className: `${CLASS}-title`, attrs: { hidden: true } });
  const body = el(doc, 'p', { className: `${CLASS}-body`, attrs: { hidden: true } });
  const action = button(doc, { className: `${CLASS}-action`, label: '', signal: life.signal, onClick: () => onAction?.(), attrs: { hidden: true } });
  const texts = { title: textNode(doc, title), body: textNode(doc, body) };
  root.append(title, body, action);
  host.append(root);
  return {
    update(model = {}) {
      if (life.dead) return;
      writePart(title, texts.title, model.title);
      writePart(body, texts.body, model.body);
      const named = writePart(action, action.firstChild, model.actionLabel);
      action.hidden = !(acts && named);
    },
    destroy() {
      if (life.destroy()) root.remove();
    }
  };
}
