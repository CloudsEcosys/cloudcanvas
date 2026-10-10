/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Switch: one on/off setting, as a native checkbox with the `switch` role and its words beside it. The whole
 * row is the target (at least 44px tall under a coarse pointer), so the box inside it can stay small.
 *
 *   const toggle = createSwitch(host, { onChange: (checked) => save(checked) });
 *   toggle.update({ label: 'Reminders', detail: 'Due and upcoming', checked: true });
 *
 * Controlled, like the kit's other controls: a press reports the state it asks for through `onChange` and the
 * switch shows the model's state again until the host answers with an `update`, so a refused change puts
 * itself back. `disabled` keeps the row readable and reports nothing.
 */
import { createLife, documentOf, el, textNode, uniqueId, writeText } from './dom.js';
import { injectUiStyles } from './styles.js';

const CLASS = 'cloudcanvas-ui-switch';

/**
 * @param {HTMLElement} host
 * @param {{onChange?: (checked: boolean) => void}} [options]
 * @returns {{update(model: {label: string, checked?: boolean, detail?: string, disabled?: boolean}): void, destroy(): void}}
 */
export function createSwitch(host, { onChange } = {}) {
  const doc = documentOf(host);
  injectUiStyles(doc);
  const life = createLife();
  const root = el(doc, 'label', { className: CLASS });
  const box = el(doc, 'input', { className: `${CLASS}-box`, attrs: { type: 'checkbox', role: 'switch' } });
  const words = el(doc, 'span', { className: `${CLASS}-label`, attrs: { id: uniqueId(CLASS) } });
  const detail = el(doc, 'span', { className: `${CLASS}-detail` });
  const wordsText = textNode(doc, words), detailText = textNode(doc, detail);
  root.append(box, words, detail);
  host.append(root);
  let shown = false;
  life.on(box, 'change', () => {
    const asked = Boolean(box.checked);
    box.checked = shown;
    if (!life.dead && !box.disabled) onChange?.(asked);
  });
  return {
    update(model = {}) {
      if (life.dead) return;
      const label = String(model.label ?? '').trim();
      if (label === '') throw new TypeError('A switch needs a label');
      shown = Boolean(model.checked);
      writeText(wordsText, label);
      writeText(detailText, String(model.detail ?? ''));
      detail.hidden = !model.detail;
      box.checked = shown;
      box.disabled = Boolean(model.disabled);
      box.setAttribute('aria-labelledby', words.id);
      box.setAttribute('aria-checked', String(shown));
      if (model.detail) { detail.id = detail.id || uniqueId(`${CLASS}-detail`); box.setAttribute('aria-describedby', detail.id); }
      else box.removeAttribute('aria-describedby');
    },
    destroy() {
      if (!life.destroy()) return;
      root.remove();
    },
  };
}
