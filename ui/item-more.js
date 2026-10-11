/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The "more" button of the item views (graph, timeline, calendar).
 *
 * An item's menu - Link to, Move to, Unlink, Set status, Remind me, View in, Collapse - was reached by a right-click,
 * Shift+F10 or a long press, and nothing on the screen said so: a reader who was never told never found it. The
 * selected item now wears one button, the kit's ellipsis, named "More actions for <title>", that asks for the very
 * menu those gestures ask for (`onMenu(id, point)`), the point under the button as the menu key's is under its item.
 *
 * ONE BUTTON PER VIEW, moved to the selected item and drawn only while the host takes a menu and nothing is in hand
 * (a drag or a pick-up). It is a button of its own beside the item (inside it only where the item is no button), so
 * the item is never a button holding a button; it stands in the tab order straight after its item, and it is no part
 * of the item: a press on it opens nothing and starts no drag, and the item's own keys do not hear it. Where it stands
 * is the view's sheet: each view's own rules place it where it covers neither the title nor a handle.
 */
import { el } from './dom.js';
import { createIcon } from './icons.js';

/** The class every view's button carries. */
export const MORE_CLASS = 'cloudcanvas-ui-item-more';

/** The words a name is made of, `{title}` filled in. */
export const MORE_WORDS = 'More actions for {title}';

/** The button, empty of a name: `nameMore` gives it one. `className` is the view's own, which places it. */
export function moreButton(doc, className) {
  const node = el(doc, 'button', { className: `${MORE_CLASS} ${className}`, attrs: { type: 'button' } });
  node.append(createIcon(doc, 'more'));
  return node;
}

/** Name `node` for the item it is on: its accessible name and its tooltip. */
export function nameMore(node, words, title) {
  const name = words.replace('{title}', title);
  node.setAttribute('aria-label', name);
  node.setAttribute('title', name);
}

/** Whether `target` is, or is inside, a view's "more" button. */
export function isMore(target) {
  return Boolean(target?.closest?.(`.${MORE_CLASS}`));
}

/** Where the menu a "more" button asks for opens: under the button's start edge. */
export function belowMore(node) {
  const rect = node.getBoundingClientRect();
  return { x: rect.left, y: rect.bottom };
}
