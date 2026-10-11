/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Confirm: one question, answered true or false.
 *
 *   if (await confirmDialog({ title: 'Delete note?', body: 'This cannot be undone.', confirmLabel: 'Delete', danger: true })) remove();
 *
 * It is the kit's dialog (`./dialog.js`) with Cancel and Confirm in it, so the dialog's behaviour is the
 * confirmation's: the page behind it is inert, Tab stays inside, Escape, the backdrop and Close are each a "no",
 * and focus goes back to whatever opened it. The question is answered once; the dialog is gone before the answer
 * arrives, so a host that opens something next takes focus from where it belongs.
 *
 * Focus starts on Confirm. A `danger` question starts it on Cancel, so a key pressed too many times never deletes
 * anything, and its Confirm wears the danger tone. It is drawn in the document's body unless `host` is given (a
 * host inside a modal dialog of its own keeps the question above that dialog).
 *
 * The promise resolves; it rejects only for a question that cannot be asked: no title, or nowhere to draw it.
 */
import { createDialog } from './dialog.js';
import { button, createLife, documentOf, el } from './dom.js';

const CLASS = 'cloudcanvas-ui-confirm';

/** The words of a confirmation, checked before anything is drawn. */
function checkedWords({ title, body, confirmLabel, cancelLabel }) {
  const heading = String(title ?? '').trim();
  if (heading === '') throw new TypeError('A confirmation needs a title');
  return { heading, body: String(body ?? ''), confirm: String(confirmLabel ?? 'Confirm'), cancel: String(cancelLabel ?? 'Cancel') };
}

/** The row of choices: Cancel first, so the safe one is reached first, then Confirm in the tone the question has. */
function choices(doc, life, words, danger, answer) {
  const row = el(doc, 'div', { className: `${CLASS}-actions` });
  const cancel = button(doc, { label: words.cancel, className: `${CLASS}-cancel`, signal: life.signal, onClick: () => answer(false) });
  const confirm = button(doc, { label: words.confirm, className: `${CLASS}-confirm ${danger ? 'is-danger' : 'is-primary'}`, signal: life.signal, onClick: () => answer(true) });
  row.append(cancel, confirm);
  return { row, cancel, confirm };
}

/**
 * @param {{title: string, body?: string, confirmLabel?: string, cancelLabel?: string, danger?: boolean, host?: HTMLElement}} question
 * @returns {Promise<boolean>} true for Confirm; false for Cancel, Escape, the backdrop and Close
 */
export function confirmDialog(question = {}) {
  return new Promise((resolve) => {
    const words = checkedWords(question);
    const host = question.host ?? globalThis.document?.body;
    const doc = documentOf(host);
    const life = createLife();
    let dialog = null;
    const answer = (value) => {
      if (life.dead) return;
      dialog.update({ open: false, title: words.heading });
      dialog.destroy();
      life.destroy();
      resolve(value);
    };
    dialog = createDialog(host, { onClose: () => answer(false) });
    const { row, cancel, confirm } = choices(doc, life, words, question.danger === true, answer);
    dialog.update({ open: true, title: words.heading, description: words.body, closeLabel: words.cancel, content: row });
    (question.danger === true ? cancel : confirm).focus();
  });
}
