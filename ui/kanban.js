/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Kanban: columns of cards, moved by drag or by keyboard.
 *
 *   const board = createKanban(host, {
 *     onMove: (cardId, columnId, index) => move(cardId, columnId, index),
 *     onActivate: (cardId) => open(cardId),
 *     canMove: (cardId, fromId, toId) => toId !== 'done' || 'Finish the checklist first'
 *   });
 *   board.update({ label: 'Plan', columns: [{ id: 'todo', label: 'To do', cards: [{ id: 'a', title: 'Call' }] }] });
 *
 * CONTROLLED. A drop reports `onMove(cardId, columnId, index)` - `index` counts
 * the target column's cards without the moved one - and the board shows the
 * model it is given, so a refused or failed move simply stays put. `canMove`
 * returning a string refuses with that reason, shown and announced.
 *
 * KEYBOARD. One tab stop; arrows rove between cards, Enter opens one. Space
 * picks a card up: arrows then move it (Left/Right between columns, Up/Down
 * within one), Space or Enter drops it, Escape puts it back. Every step is
 * announced. A touch drag starts after a short press, so swiping still scrolls.
 */
import { createLiveRegion, say } from '../addons/announce.js';
import { reconcileKeyedList } from '../addons/keyed-list.js';
import { createLife, documentOf, el, uniqueId, uniqueItems } from './dom.js';
import { trackDrag } from './drag.js';
import { bindBoardKeys, cardNodes, focusCard, placeOf } from './kanban-keys.js';
import { injectUiStyles } from './styles.js';

const CLASS = 'cloudcanvas-ui-kanban';

function cardNode(doc) {
  const item = el(doc, 'li', { className: `${CLASS}-item` });
  const card = el(doc, 'button', { className: `${CLASS}-card`, attrs: { type: 'button', tabindex: '-1' } });
  card.append(el(doc, 'span', { className: `${CLASS}-title` }), el(doc, 'span', { className: `${CLASS}-detail` }),
    el(doc, 'span', { className: `${CLASS}-meta` }));
  item.append(card);
  return item;
}

function writeCard(item, card, column) {
  const button = item.firstChild;
  const [title, detail, meta] = button.children;
  button.setAttribute('data-ui-id', card.id);
  button.setAttribute('data-column-id', column.id);
  if (card.tone) button.setAttribute('data-tone', String(card.tone));
  else button.removeAttribute('data-tone');
  title.textContent = String(card.title ?? '');
  detail.textContent = String(card.detail ?? '');
  detail.hidden = !card.detail;
  meta.textContent = String(card.meta ?? '');
  meta.hidden = !card.meta;
}

function columnNode(doc, column) {
  const section = el(doc, 'section', { className: `${CLASS}-column` });
  const heading = el(doc, 'h3', { className: `${CLASS}-heading`, attrs: { id: uniqueId(CLASS) } });
  heading.append(el(doc, 'span', { className: `${CLASS}-label` }), el(doc, 'span', { className: `${CLASS}-count` }));
  const list = el(doc, 'ul', { className: `${CLASS}-cards`, attrs: { role: 'list' } });
  section.setAttribute('aria-labelledby', heading.id);
  section.append(heading, list);
  section.setAttribute('data-column-id', column.id);
  return section;
}

function writeColumn(section, column, doc) {
  const [label, count] = section.firstChild.children;
  label.textContent = String(column.label ?? column.id);
  count.textContent = String(column.cards.length);
  reconcileKeyedList(section.lastChild, column.cards, {
    key: (card) => card.id, create: () => cardNode(doc), update: (item, card) => writeCard(item, card, column)
  });
}

/** The model with its columns and cards checked: ids unique across the whole board. */
function normalize(model) {
  const columns = uniqueItems(model.columns ?? [], 'column')
    .map((column) => ({ ...column, cards: Array.isArray(column.cards) ? column.cards : [] }));
  uniqueItems(columns.flatMap((column) => column.cards), 'card');
  return { ...model, columns };
}

function render(board, model) {
  const columns = model.columns;
  board.model = model;
  board.root.setAttribute('aria-label', String(model.label ?? 'Board'));
  const hadFocus = board.root.contains(board.doc.activeElement) ? board.state.focusId : null;
  reconcileKeyedList(board.lane, columns, {
    key: (column) => column.id, create: (column) => columnNode(board.doc, column),
    update: (section, column) => writeColumn(section, column, board.doc)
  });
  const cards = cardNodes(board);
  if (!cards.some((card) => card.getAttribute('data-ui-id') === board.state.focusId)) {
    board.state.focusId = cards[0]?.getAttribute('data-ui-id') ?? null;
  }
  focusCard(board, board.state.focusId, { move: hadFocus !== null });
}

/** The column and index a pointer at `point` would drop into. */
function dropAt(board, point, draggedId) {
  const hit = board.doc.elementFromPoint?.(point.x, point.y);
  const section = hit?.closest?.(`.${CLASS}-column`);
  if (!section || !board.lane.contains(section)) return null;
  const cards = Array.from(section.querySelectorAll(`.${CLASS}-card`)).filter((card) => card.getAttribute('data-ui-id') !== draggedId);
  const index = cards.findIndex((card) => {
    const box = card.getBoundingClientRect();
    return point.y < box.top + box.height / 2;
  });
  return { columnId: section.getAttribute('data-column-id'), index: index === -1 ? cards.length : index, section };
}

/** `true` when the move is allowed, otherwise the refusal text. */
export function moveVerdict(canMove, cardId, fromId, toId) {
  if (fromId === toId || typeof canMove !== 'function') return true;
  const verdict = canMove(cardId, fromId, toId);
  if (verdict === true || verdict === undefined) return true;
  return typeof verdict === 'string' && verdict.trim() ? verdict : 'This move is not allowed.';
}

function clearDropMarks(board) {
  for (const node of board.lane.querySelectorAll('.is-drop-target, .is-refused')) node.classList.remove('is-drop-target', 'is-refused');
}

function bindPointer(board) {
  trackDrag(board.life, board.lane, {
    selector: `.${CLASS}-card`,
    onStart(card, point) {
      board.drag = { id: card.getAttribute('data-ui-id'), from: card.getAttribute('data-column-id'), origin: point, card };
      card.closest('li').classList.add('is-dragging');
    },
    onMove(point) {
      const drag = board.drag;
      drag.card.closest('li')?.style.setProperty('transform', `translate(${point.x - drag.origin.x}px, ${point.y - drag.origin.y}px)`);
      const lane = board.lane.getBoundingClientRect();
      if (point.x > lane.right - 32) board.lane.scrollLeft += 12;
      else if (point.x < lane.left + 32) board.lane.scrollLeft -= 12;
      clearDropMarks(board);
      const target = dropAt(board, point, drag.id);
      if (target) target.section.classList.add(moveVerdict(board.callbacks.canMove, drag.id, drag.from, target.columnId) === true ? 'is-drop-target' : 'is-refused');
    },
    onEnd(point) {
      const drag = board.drag;
      board.drag = null;
      drag.card.closest('li')?.classList.remove('is-dragging');
      drag.card.closest('li')?.style.removeProperty('transform');
      clearDropMarks(board);
      const target = point ? dropAt(board, point, drag.id) : null;
      if (target) board.commit(drag.id, drag.from, target.columnId, target.index);
      else board.render();
    }
  });
}

/**
 * @param {HTMLElement} host
 * @param {{onMove?: (cardId: string, columnId: string, index: number) => void,
 *   onActivate?: (cardId: string) => void,
 *   canMove?: (cardId: string, fromColumnId: string, toColumnId: string) => boolean|string}} [callbacks]
 * @returns {{update(model: object): void, destroy(): void}}
 */
export function createKanban(host, callbacks = {}) {
  const doc = documentOf(host);
  injectUiStyles(doc);
  const life = createLife();
  const root = el(doc, 'div', { className: CLASS, attrs: { role: 'group' } });
  const lane = el(doc, 'div', { className: `${CLASS}-lane` });
  root.append(lane);
  host.append(root);
  const board = { doc, life, root, lane, callbacks, model: { columns: [] }, state: { focusId: null, grab: null },
    drag: null, region: createLiveRegion(root), moveVerdict };
  board.say = (text) => say(board.region, text);
  board.render = () => render(board, board.model);
  board.commit = (cardId, from, to, index) => {
    const verdict = moveVerdict(callbacks.canMove, cardId, from, to);
    if (verdict !== true) { board.say(verdict); board.render(); return false; }
    const here = placeOf(board, cardId);
    if (here && here.columnId === to && here.index === index) { board.render(); return false; }
    callbacks.onMove?.(cardId, to, index);
    board.render();
    return true;
  };
  life.on(lane, 'click', (event) => {
    const card = event.target.closest?.(`.${CLASS}-card`);
    if (card && !board.state.grab) callbacks.onActivate?.(card.getAttribute('data-ui-id'));
  });
  bindBoardKeys(board);
  bindPointer(board);
  return {
    update(model = {}) {
      if (life.dead) return;
      board.model = normalize(model);
      if (!board.state.grab && !board.drag) board.render();
    },
    destroy() {
      if (life.destroy()) root.remove();
    }
  };
}
