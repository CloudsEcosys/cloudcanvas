/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Chips: a labelled group of small toggles - filters, tags, categories.
 *
 *   const chips = createChips(host, { onToggle: (id, pressed) => setFilter(id, pressed), onRemove: (id) => dropTag(id) });
 *   chips.update({ label: 'Categories', items: [{ id: 'w', label: 'Work', tone: '3', pressed: true, removable: true }] });
 *
 * CONTROLLED. A press reports `onToggle(id, pressed)` with the state asked for,
 * and Remove reports `onRemove(id)`; the group then shows what the next model
 * says. Each chip is a real button with `aria-pressed`, so Tab, Enter and Space
 * are the platform's. A removable chip has a second button beside it, named
 * for the chip ("Remove Work"; `removeLabel` is the host's word for the verb).
 *
 * NOTHING IS DRAWN THAT CANNOT WORK. Without `onToggle` a chip is text, not a
 * button; without `onRemove` no chip offers to be removed. When the chip that
 * has focus leaves the group, focus goes to the one that took its place, so a
 * keyboard user removing three tags is not sent back to the top of the page
 * three times. `tone` is written as `data-tone` for the sheet.
 */
import { createLife, documentOf, el, focusablesIn, textNode, uniqueItems, writeText } from './dom.js';
import { injectUiStyles } from './styles.js';
import { reconcileKeyedList } from '../addons/keyed-list.js';

const CLASS = 'cloudcanvas-ui-chips';
const CHIP = `.${CLASS}-chip`;

/** One chip: its face (a toggle button, or text when nothing answers a press) and, when chips can be removed, its Remove. */
function chipNode(doc, { toggles, removes }) {
  const node = el(doc, 'span', { className: `${CLASS}-chip` });
  const face = toggles
    ? el(doc, 'button', { className: `${CLASS}-toggle`, attrs: { type: 'button' } })
    : el(doc, 'span', { className: `${CLASS}-label` });
  const remove = removes ? el(doc, 'button', { className: `${CLASS}-remove`, text: '×', attrs: { type: 'button' } }) : null;
  node.append(face);
  if (remove) node.append(remove);
  node._uiChip = { face, text: textNode(doc, face), remove };
  return node;
}

function writeChip(node, item, chips) {
  const { face, text, remove } = node._uiChip;
  const label = String(item.label ?? item.id);
  writeText(text, label);
  if (item.tone) node.setAttribute('data-tone', String(item.tone));
  else node.removeAttribute('data-tone');
  if (chips.toggles) {
    face.setAttribute('data-ui-id', item.id);
    face.setAttribute('aria-pressed', String(item.pressed === true));
  }
  if (remove) {
    remove.setAttribute('data-ui-remove', item.id);
    remove.setAttribute('aria-label', `${chips.state.removeLabel} ${label}`);
    remove.hidden = item.removable !== true;
  }
}

/**
 * Redraw the chips in place. When the redraw took the focus from the group -
 * its chip left, or was moved - it goes back to that chip if it is still
 * there, else to the chip now in its place.
 */
function draw(chips) {
  const { doc, root, state } = chips;
  const active = doc.activeElement;
  const chip = active?.closest?.(CHIP) ?? null;
  const at = chip && root.contains(chip) ? Array.from(root.children).indexOf(chip) : -1;
  const nodes = reconcileKeyedList(root, state.items, {
    key: (item) => item.id,
    create: () => chipNode(doc, chips),
    update: (node, item) => writeChip(node, item, chips)
  });
  if (at < 0 || root.contains(doc.activeElement)) return;
  const heir = nodes.includes(chip) ? chip : nodes[Math.min(at, nodes.length - 1)];
  const targets = heir ? focusablesIn(heir) : [];
  (targets.includes(active) ? active : targets[0])?.focus();
}

function bindChips(chips, { onToggle, onRemove }) {
  const { root, state } = chips;
  chips.life.on(root, 'click', (event) => {
    const remove = event.target.closest?.('[data-ui-remove]');
    if (remove && root.contains(remove)) {
      if (!remove.hidden) onRemove(remove.getAttribute('data-ui-remove'));
      return;
    }
    const face = event.target.closest?.(`.${CLASS}-toggle`);
    if (!face || !root.contains(face)) return;
    const id = face.getAttribute('data-ui-id');
    onToggle(id, state.items.find((item) => item.id === id)?.pressed !== true);
  });
}

/**
 * @param {HTMLElement} host
 * @param {{onToggle?: (id: string, pressed: boolean) => void, onRemove?: (id: string) => void}} [callbacks]
 * @returns {{update(model: {label?: string, removeLabel?: string, items?: Array<{id: string, label?: string, tone?: string,
 *   pressed?: boolean, removable?: boolean}>}): void, destroy(): void}}
 */
export function createChips(host, callbacks = {}) {
  const doc = documentOf(host);
  injectUiStyles(doc);
  const life = createLife();
  const root = el(doc, 'div', { className: CLASS, attrs: { role: 'group' } });
  host.append(root);
  const chips = { doc, root, life, toggles: typeof callbacks.onToggle === 'function', removes: typeof callbacks.onRemove === 'function',
    state: { items: [], removeLabel: 'Remove' } };
  bindChips(chips, callbacks);
  return {
    update(model = {}) {
      if (life.dead) return;
      chips.state.items = uniqueItems(model.items ?? [], 'chip');
      chips.state.removeLabel = String(model.removeLabel ?? 'Remove');
      root.setAttribute('aria-label', String(model.label ?? 'Chips'));
      draw(chips);
    },
    destroy() {
      if (life.destroy()) root.remove();
    }
  };
}
