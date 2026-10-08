/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Tabs: an ARIA tablist with one tab stop and optional close buttons.
 *
 *   const tabs = createTabs(host, { onSelect: (id) => show(id), onClose: (id) => drop(id) });
 *   tabs.update({ label: 'Views', activeId: 'today', items: [{ id: 'today', label: 'Today' }] });
 *
 * Arrows (and Home/End) rove; with `activation: 'auto'` (the default) the tab
 * that receives focus is selected, with 'manual' Enter or Space selects it.
 * Delete closes a closable tab. Close buttons sit beside their tab (a button
 * inside a tab is invalid ARIA) and are skipped by Tab: Delete is their keyboard
 * path. The labelled tablist owns its ordered tabs through `aria-owns`, outside
 * the visual rows so close buttons are not tablist children. `panelId` on an
 * item becomes the tab's `aria-controls`.
 */
import { createLife, documentOf, el, SR_ONLY_CLASS, textNode, uniqueId, uniqueItems, writeText } from './dom.js';
import { nextIndex, setTabStop } from './roving.js';
import { injectUiStyles } from './styles.js';

const CLASS = 'cloudcanvas-ui-tabs';

function tabView(doc) {
  const row = el(doc, 'div', { className: `${CLASS}-item`, attrs: { role: 'presentation' } });
  const tab = el(doc, 'button', { className: `${CLASS}-tab`, attrs: { id: uniqueId('ui-tab'), role: 'tab', type: 'button' } });
  const label = textNode(doc, tab);
  const close = el(doc, 'button', { className: `${CLASS}-close`, text: '×', attrs: { type: 'button', tabindex: '-1' } });
  row.append(tab, close);
  return { row, tab, label, close };
}

function writeTab(view, item, state) {
  view.tab.setAttribute('data-ui-id', item.id);
  view.tab.setAttribute('aria-selected', String(item.id === state.activeId));
  if (item.panelId) view.tab.setAttribute('aria-controls', String(item.panelId));
  else view.tab.removeAttribute('aria-controls');
  view.tab.disabled = item.disabled === true;
  writeText(view.label, item.label);
  view.close.setAttribute('data-ui-close', item.id);
  view.close.setAttribute('aria-label', `${state.closeLabel} ${String(item.label)}`);
  view.close.hidden = item.closable !== true;
}

function render(root, doc, views, state) {
  const keep = new Set(state.items.map((item) => item.id));
  for (const [id, view] of views) if (!keep.has(id)) { view.row.remove(); views.delete(id); }
  for (const item of state.items) {
    if (!views.has(item.id)) views.set(item.id, tabView(doc));
    const view = views.get(item.id);
    writeTab(view, item, state);
    root.append(view.row);
  }
  if (!views.has(state.focusId)) state.focusId = state.activeId ?? state.items[0]?.id ?? null;
  setTabStop([...views.values()].map((view) => view.tab), views.get(state.focusId)?.tab ?? null);
}

function selectable(state) {
  return state.items.filter((item) => item.disabled !== true);
}

function ownTabs(list, views, state, label) {
  const ids = state.items.map((item) => views.get(item.id).tab.id);
  list.setAttribute('aria-label', label);
  list.setAttribute('aria-orientation', 'horizontal');
  list.hidden = ids.length === 0;
  if (ids.length) list.setAttribute('aria-owns', ids.join(' '));
  else list.removeAttribute('aria-owns');
}

function onKey(event, views, state, callbacks) {
  const tab = event.target.closest?.('[role="tab"]');
  if (!tab) return;
  const id = tab.getAttribute('data-ui-id');
  const items = selectable(state);
  const item = state.items.find((entry) => entry.id === id);
  if (event.key === 'Delete' && item?.closable === true) {
    event.preventDefault();
    callbacks.onClose?.(id);
    return;
  }
  if ((event.key === 'Enter' || event.key === ' ') && item?.disabled !== true) {
    event.preventDefault();
    if (id !== state.activeId) callbacks.onSelect?.(id);
    return;
  }
  const to = nextIndex(event.key, items.findIndex((entry) => entry.id === id), items.length,
    { orientation: 'horizontal', wrap: true });
  if (to === null) return;
  event.preventDefault();
  state.focusId = items[to].id;
  setTabStop([...views.values()].map((view) => view.tab), views.get(state.focusId).tab);
  views.get(state.focusId).tab.focus();
  if (state.activation === 'auto' && state.focusId !== state.activeId) callbacks.onSelect?.(state.focusId);
}

function bindTabs(life, root, views, state, callbacks) {
  life.on(root, 'click', (event) => {
    const close = event.target.closest?.('[data-ui-close]');
    if (close && !close.hidden) { callbacks.onClose?.(close.getAttribute('data-ui-close')); return; }
    const tab = event.target.closest?.('[role="tab"]');
    const id = tab?.getAttribute('data-ui-id');
    if (id && !tab.disabled && id !== state.activeId) callbacks.onSelect?.(id);
  });
  life.on(root, 'keydown', (event) => onKey(event, views, state, callbacks));
}

/**
 * @param {HTMLElement} host
 * @param {{onSelect?: (id: string) => void, onClose?: (id: string) => void}} [callbacks]
 * @returns {{update(model: object): void, destroy(): void}}
 */
export function createTabs(host, callbacks = {}) {
  const doc = documentOf(host);
  injectUiStyles(doc);
  const life = createLife();
  const root = el(doc, 'div', { className: CLASS });
  // Ordered tab ownership separates semantics from the adjacent close layout.
  const list = el(doc, 'div', { className: SR_ONLY_CLASS, attrs: { role: 'tablist', hidden: true } });
  host.append(list, root);
  const views = new Map();
  const state = { items: [], activeId: null, focusId: null, activation: 'auto', closeLabel: 'Close' };
  bindTabs(life, root, views, state, callbacks);
  return {
    update(model = {}) {
      if (life.dead) return;
      state.items = uniqueItems(model.items ?? [], 'tab');
      if (state.activeId !== (model.activeId ?? null)) state.focusId = model.activeId ?? null;
      state.activeId = model.activeId ?? null;
      state.activation = model.activation === 'manual' ? 'manual' : 'auto';
      state.closeLabel = String(model.closeLabel ?? 'Close');
      render(root, doc, views, state);
      ownTabs(list, views, state, String(model.label ?? 'Tabs'));
    },
    destroy() {
      if (!life.destroy()) return;
      views.clear();
      root.remove();
      list.remove();
    }
  };
}
