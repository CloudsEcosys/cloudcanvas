/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Tree: a hierarchy the host owns, drawn as the rows that are open.
 *
 *   const tree = createTree(host, { onActivate: (id) => open(id), onToggle: (id, expanded) => setOpen(id, expanded) });
 *   tree.update({ label: 'Notebooks', expanded: ['w'], selectedId: 'p',
 *     items: [{ id: 'w', label: 'Work', count: 12 }, { id: 'p', parentId: 'w', label: 'Plan', tone: '2' }] });
 *
 * CONTROLLED. `expanded` and `selectedId` are the model's. Enter or a click
 * reports `onActivate(id)`; the twisty, Right and Left report
 * `onToggle(id, expanded)`; the tree then shows what the next model says. The
 * one thing it keeps is where the tab stop is.
 *
 * KEYS. One tab stop that roves: Up and Down move through the rows on show,
 * Home and End jump, Right opens a closed row or enters an open one, Left
 * closes an open row or goes to its parent, Enter activates. Rows are
 * `<button role="treeitem">`, so inside a canvas their keys and presses are
 * already a control's.
 *
 * THE LIST IS THE HOST'S DATA, so it is drawn whatever its shape: an item
 * whose parent is not in the list shows at the root, and a loop of parents is
 * cut at its first item. Only a repeated id is refused. `count` is shown beside
 * the label (zero is a count); `tone` is written as `data-tone` for the sheet.
 */
import { createLife, documentOf, el, textNode, uniqueItems, writeText } from './dom.js';
import { nextIndex, setTabStop } from './roving.js';
import { injectUiStyles } from './styles.js';
import { reconcileKeyedList } from '../addons/keyed-list.js';

const CLASS = 'cloudcanvas-ui-tree';
const ROW = '[role="treeitem"]';

/** Each item under the parent it names when that parent is in the list (and is not itself); `null` holds the roots. */
function childrenByParent(items) {
  const ids = new Set(items.map((item) => item.id));
  const children = new Map([[null, []]]);
  for (const item of items) {
    const named = item.parentId === null || item.parentId === undefined ? null : String(item.parentId);
    const parent = named !== null && named !== item.id && ids.has(named) ? named : null;
    if (!children.has(parent)) children.set(parent, []);
    children.get(parent).push(item);
  }
  return children;
}

/**
 * The forest every item appears in exactly once. Items no root leads to are in
 * a loop of parents (or hang below one): the first of them, in list order, is
 * moved to the root, which frees the rest.
 */
function forestOf(items) {
  const children = childrenByParent(items);
  const reached = new Set();
  const reach = (parentId) => {
    for (const item of children.get(parentId) ?? []) {
      reached.add(item.id);
      reach(item.id);
    }
  };
  reach(null);
  for (const item of items) {
    if (reached.has(item.id)) continue;
    const siblings = children.get(String(item.parentId));
    siblings.splice(siblings.indexOf(item), 1);
    children.get(null).push(item);
    reached.add(item.id);
    reach(item.id);
  }
  return children;
}

/** The rows on show, depth first: every root, and the children of each open row. */
function visibleRows(children, expanded) {
  const rows = [];
  const walk = (parentId, level) => {
    const siblings = children.get(parentId) ?? [];
    siblings.forEach((item, index) => {
      const hasChildren = (children.get(item.id) ?? []).length > 0;
      const open = hasChildren && expanded.has(item.id);
      rows.push({ id: item.id, item, parentId, level, position: index + 1, size: siblings.length, hasChildren, expanded: open });
      if (open) walk(item.id, level + 1);
    });
  };
  walk(null, 1);
  return rows;
}

/**
 * The row that holds the tab stop: the one that had it if it is still on show,
 * else its nearest ancestor that is, else the selected row, else the first.
 */
function tabStopId(state, children) {
  const parents = new Map();
  for (const [parentId, items] of children) for (const item of items) parents.set(item.id, parentId);
  const shown = new Set(state.rows.map((row) => row.id));
  for (let id = state.focusId; id !== null && id !== undefined; id = parents.get(id) ?? null) {
    if (shown.has(id)) return id;
  }
  return shown.has(state.selectedId) ? state.selectedId : state.rows[0]?.id ?? null;
}

function rowNode(doc) {
  const node = el(doc, 'button', { className: `${CLASS}-row`, attrs: { type: 'button', role: 'treeitem', tabindex: '-1' } });
  const label = el(doc, 'span', { className: `${CLASS}-label` });
  const count = el(doc, 'span', { className: `${CLASS}-count` });
  node.append(el(doc, 'span', { className: `${CLASS}-indent`, attrs: { 'aria-hidden': 'true' } }),
    el(doc, 'span', { className: `${CLASS}-twisty`, attrs: { 'aria-hidden': 'true' } }), label, count);
  node._uiText = { label: textNode(doc, label), count: textNode(doc, count) };
  return node;
}

function writeRow(node, row, state) {
  const { item } = row;
  const counted = item.count !== undefined && item.count !== null;
  node.setAttribute('data-ui-id', row.id);
  node.setAttribute('aria-level', String(row.level));
  node.setAttribute('aria-posinset', String(row.position));
  node.setAttribute('aria-setsize', String(row.size));
  if (state.selectedId === null) node.removeAttribute('aria-selected');
  else node.setAttribute('aria-selected', String(row.id === state.selectedId));
  if (row.hasChildren) node.setAttribute('aria-expanded', String(row.expanded));
  else node.removeAttribute('aria-expanded');
  if (item.tone) node.setAttribute('data-tone', String(item.tone));
  else node.removeAttribute('data-tone');
  node.style.setProperty('--tree-level', String(row.level - 1));
  writeText(node._uiText.label, item.label ?? row.id);
  writeText(node._uiText.count, counted ? item.count : '');
  node._uiText.count.parentNode.hidden = !counted;
}

/** Give the row `id` the tab stop, and the focus when asked. */
function moveStop(tree, id, { focus }) {
  const nodes = Array.from(tree.root.querySelectorAll(ROW));
  const node = nodes.find((entry) => entry.getAttribute('data-ui-id') === id) ?? null;
  tree.state.focusId = id;
  setTabStop(nodes, node);
  if (focus) node?.focus();
}

/** Redraw the rows in place. Focus the redraw took from the tree (its row closed, or was moved) goes to the tab stop. */
function draw(tree) {
  const { doc, root, state } = tree;
  const had = root.contains(doc.activeElement);
  reconcileKeyedList(root, state.rows, {
    key: (row) => row.id,
    create: () => rowNode(doc),
    update: (node, row) => writeRow(node, row, state)
  });
  moveStop(tree, state.focusId, { focus: had && !root.contains(doc.activeElement) });
}

/** What `key` does on the row at `index`: move the focus, report a toggle, activate - or null when the key is not the tree's. */
function keyAction(key, index, rows) {
  const row = rows[index];
  if (key === 'Enter') return { activate: row.id };
  if (key === 'ArrowRight') {
    if (!row.hasChildren) return null;
    return row.expanded ? { focus: rows[index + 1].id } : { toggle: row.id, expanded: true };
  }
  if (key === 'ArrowLeft') {
    if (row.expanded) return { toggle: row.id, expanded: false };
    return row.parentId === null ? null : { focus: row.parentId };
  }
  const to = nextIndex(key, index, rows.length, { orientation: 'vertical' });
  return to === null ? null : { focus: rows[to].id };
}

function bindTree(tree) {
  const { root, state, callbacks } = tree;
  const rowOf = (event) => {
    const node = event.target.closest?.(ROW);
    const index = node && root.contains(node) ? state.rows.findIndex((row) => row.id === node.getAttribute('data-ui-id')) : -1;
    return index;
  };
  tree.life.on(root, 'keydown', (event) => {
    const index = rowOf(event);
    const action = index < 0 ? null : keyAction(event.key, index, state.rows);
    if (!action) return;
    event.preventDefault();
    if (action.focus !== undefined) moveStop(tree, action.focus, { focus: true });
    else if (action.toggle !== undefined) callbacks.onToggle?.(action.toggle, action.expanded);
    else callbacks.onActivate?.(action.activate);
  });
  tree.life.on(root, 'click', (event) => {
    const row = state.rows[rowOf(event)];
    if (!row) return;
    moveStop(tree, row.id, { focus: false });
    if (row.hasChildren && event.target.closest?.(`.${CLASS}-twisty`)) callbacks.onToggle?.(row.id, !row.expanded);
    else callbacks.onActivate?.(row.id);
  });
}

/**
 * @param {HTMLElement} host
 * @param {{onActivate?: (id: string) => void, onToggle?: (id: string, expanded: boolean) => void}} [callbacks]
 * @returns {{update(model: {label?: string, items?: Array<{id: string, parentId?: string, label?: string, count?: number,
 *   tone?: string}>, expanded?: string[], selectedId?: string}): void, destroy(): void}}
 */
export function createTree(host, callbacks = {}) {
  const doc = documentOf(host);
  injectUiStyles(doc);
  const life = createLife();
  const root = el(doc, 'div', { className: CLASS, attrs: { role: 'tree' } });
  host.append(root);
  const tree = { doc, root, life, callbacks, state: { rows: [], focusId: null, selectedId: null } };
  bindTree(tree);
  return {
    update(model = {}) {
      if (life.dead) return;
      const children = forestOf(uniqueItems(model.items ?? [], 'tree'));
      const selectedId = model.selectedId ?? null;
      if (selectedId !== null && selectedId !== tree.state.selectedId) tree.state.focusId = selectedId;
      tree.state.selectedId = selectedId;
      tree.state.rows = visibleRows(children, new Set((model.expanded ?? []).map(String)));
      tree.state.focusId = tabStopId(tree.state, children);
      root.setAttribute('aria-label', String(model.label ?? 'Tree'));
      draw(tree);
    },
    destroy() {
      if (life.destroy()) root.remove();
    }
  };
}
