/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Tabs: an ARIA tablist with one tab stop, optional close buttons, and - for a
 * strip of folders - a pinned tab and the parent scopes behind each tab.
 *
 *   const tabs = createTabs(host, { onSelect: (id) => show(id), onClose: (id) => drop(id), onLayer: (id, layer) => up(id, layer) });
 *   tabs.update({ label: 'Views', activeId: 'today', items: [{ id: 'home', label: 'Home', pinned: true },
 *     { id: 'today', label: 'Today', closable: true, layers: [{ id: 'work', label: 'Work' }] }] });
 *
 * Arrows (and Home/End) rove; with `activation: 'auto'` (the default) the tab
 * that receives focus is selected, with 'manual' Enter or Space selects it.
 * Delete closes a closable tab. Close buttons sit beside their tab (a button
 * inside a tab is invalid ARIA) and are skipped by Tab: Delete is their keyboard
 * path. The labelled tablist owns its ordered tabs through `aria-owns`, outside
 * the visual rows so close buttons are not tablist children. `panelId` on an
 * item becomes the tab's `aria-controls`.
 *
 * `badge` on an item is the kit badge (`./badge.js`) inside its tab: the model
 * the nav bar takes, or a bare number for the count. What it says is part of
 * the tab's name. An item that names none has none, and its tab is untouched.
 *
 * `activeId: null` selects nothing: every tab is `aria-selected="false"`, and
 * the tab stop rests on the first tab that can take focus, so the list is
 * still one Tab away.
 *
 * `pinned: true` on an item marks its tab `data-pinned="true"`, which the sheet
 * draws quietly, and takes its close control off the page, `closable` or not:
 * Delete does not close it either. The strip does not move a pinned tab; the
 * order is the model's.
 *
 * `layers` on an item are the parent scopes its tab stands in front of,
 * outermost first: buttons beside the tab (`./tabs-layers.js`), at most three,
 * the rest folded into a menu. A press on one reports `onLayer(tabId,
 * layerId)` and selects nothing: going up is the host's to answer.
 *
 * A REDRAW KEEPS FOCUS. A tab or a layer the model still names stays where it
 * is, so focus on it is never lost, and a reorder hands focus back to what had
 * it. Focus on something that went - a layer, a fold, a close control - moves
 * to the tab it stood beside, and with that tab gone too, to the tab stop.
 */
import { badgeModel, createBadge } from './badge.js';
import { createLife, documentOf, el, SR_ONLY_CLASS, textNode, uniqueId, uniqueItems, writeText } from './dom.js';
import { keepFocus, placeChildren } from './render.js';
import { nextIndex, setTabStop } from './roving.js';
import { injectUiStyles } from './styles.js';
import { createFold, layersOf, writeLayers } from './tabs-layers.js';

const CLASS = 'cloudcanvas-ui-tabs';

function tabView(doc) {
  const row = el(doc, 'div', { className: `${CLASS}-item`, attrs: { role: 'presentation' } });
  const tab = el(doc, 'button', { className: `${CLASS}-tab`, attrs: { id: uniqueId('ui-tab'), role: 'tab', type: 'button' } });
  const label = textNode(doc, tab);
  const close = el(doc, 'button', { className: `${CLASS}-close`, text: '×', attrs: { type: 'button', tabindex: '-1' } });
  row.append(tab, close);
  return { row, tab, label, close, badge: null, layers: null };
}

/** Whether `item`'s tab can be closed: it says so, and it is not pinned. */
function closes(item) {
  return item?.closable === true && item.pinned !== true;
}

/** The close control is beside its tab, shown when the tab can be closed; a pinned tab has none on the page at all. */
function writeClose(view, item, closeLabel) {
  view.close.setAttribute('data-ui-close', item.id);
  view.close.setAttribute('aria-label', `${closeLabel} ${String(item.label)}`);
  view.close.hidden = !closes(item);
  if (item.pinned === true) view.close.remove();
  else if (view.close.parentNode !== view.row) view.row.append(view.close);
}

/** The tab's badge: mounted in the tab when its item first names one, redrawn after that, destroyed when the item names none. */
function writeBadge(view, badge) {
  const badged = badge !== undefined && badge !== null;
  view.tab.classList.toggle('is-badged', badged);
  if (!badged) {
    view.badge?.destroy();
    view.badge = null;
    return;
  }
  view.badge ??= createBadge(view.tab);
  view.badge.update(badgeModel(badge));
}

function writeTab(doc, view, item, state) {
  view.tab.setAttribute('data-ui-id', item.id);
  view.tab.setAttribute('aria-selected', String(item.id === state.activeId));
  if (item.panelId) view.tab.setAttribute('aria-controls', String(item.panelId));
  else view.tab.removeAttribute('aria-controls');
  if (item.pinned === true) view.tab.setAttribute('data-pinned', 'true');
  else view.tab.removeAttribute('data-pinned');
  view.tab.disabled = item.disabled === true;
  writeText(view.label, item.label);
  writeBadge(view, item.badge);
  writeClose(view, item, state.closeLabel);
  writeLayers(doc, view, item, item.id === state.activeId);
}

/** Take a tab out: its badge ends with it. */
function dropTab(views, id) {
  const view = views.get(id);
  view.badge?.destroy();
  view.row.remove();
  views.delete(id);
}

function selectable(state) {
  return state.items.filter((item) => item.disabled !== true);
}

/** Where the tab stop rests when the keys have not placed it: the selected tab, or - with none selected - the first that can take focus. */
function restingId(state) {
  const active = state.items.find((item) => item.id === state.activeId);
  return (active ?? selectable(state)[0] ?? state.items[0])?.id ?? null;
}

function render(root, doc, views, state) {
  const keep = new Set(state.items.map((item) => item.id));
  for (const id of [...views.keys()]) if (!keep.has(id)) dropTab(views, id);
  placeChildren(root, state.items.map((item) => {
    if (!views.has(item.id)) views.set(item.id, tabView(doc));
    const view = views.get(item.id);
    writeTab(doc, view, item, state);
    return view.row;
  }));
  if (!views.has(state.focusId)) state.focusId = restingId(state);
  setTabStop([...views.values()].map((view) => view.tab), views.get(state.focusId)?.tab ?? null);
}

/**
 * What has focus inside the tabs before a redraw, and the tab it stands
 * beside. Focus in the fold's menu counts as focus on the fold: that is where
 * the menu gives it back to.
 */
function heldBefore(root, doc, fold) {
  const active = doc.activeElement;
  const inMenu = fold.holds(active);
  const inStrip = root.contains(active) ? active : null;
  const node = inMenu ? fold.button() : inStrip;
  const beside = node?.closest(`.${CLASS}-item`)?.querySelector('[role="tab"]') ?? null;
  return { node, inMenu, tabId: beside?.getAttribute('data-ui-id') ?? null };
}

/**
 * Put focus right after a redraw. What held it and is still there gets it
 * back if a reorder took it. What held it and went - a layer, a fold, a close
 * control - hands it to the tab it stood beside, which takes the tab stop too,
 * so focus and the stop stay together; with that tab gone, or disabled, focus
 * goes to the tab stop. Focus outside the tabs is not theirs, and focus in a
 * menu that is still open is the menu's.
 */
function restoreFocus(root, views, state, fold, held) {
  if (!held.node || (held.inMenu && fold.open)) return;
  if (root.contains(held.node)) {
    keepFocus(root, held.node);
    return;
  }
  const beside = views.get(held.tabId)?.tab;
  if (beside && !beside.disabled) {
    state.focusId = held.tabId;
    setTabStop([...views.values()].map((view) => view.tab), beside);
  }
  views.get(state.focusId)?.tab.focus();
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
  if (event.key === 'Delete' && closes(item)) {
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

/** Answer a press in the strip: on a close control, a layer or a fold - each beside a tab - or on a tab. */
function onPress(event, state, fold, callbacks) {
  const hit = (selector) => event.target.closest?.(selector) ?? null;
  const close = hit('[data-ui-close]');
  const layer = hit('[data-ui-layer]');
  const folded = hit('[data-ui-fold]');
  const tab = hit('[role="tab"]');
  const id = tab?.getAttribute('data-ui-id');
  if (close && !close.hidden) callbacks.onClose?.(close.getAttribute('data-ui-close'));
  else if (layer) callbacks.onLayer?.(layer.parentElement.getAttribute('data-ui-layers'), layer.getAttribute('data-ui-layer'));
  else if (folded) fold.press(folded.getAttribute('data-ui-fold'), state.items);
  else if (id && !tab.disabled && id !== state.activeId) callbacks.onSelect?.(id);
}

function bindTabs(life, root, views, state, fold, callbacks) {
  life.on(root, 'click', (event) => onPress(event, state, fold, callbacks));
  life.on(root, 'keydown', (event) => onKey(event, views, state, callbacks));
}

/** The model's items, checked before anything is drawn: tab ids unique, and each tab's layer ids unique within it. */
function tabItems(items) {
  for (const item of uniqueItems(items, 'tab')) layersOf(item);
  return items;
}

/**
 * @param {HTMLElement} host
 * @param {{onSelect?: (id: string) => void, onClose?: (id: string) => void,
 *   onLayer?: (tabId: string, layerId: string) => void}} [callbacks]
 * @returns {{update(model: {label?: string, activeId?: string|null, activation?: 'auto'|'manual', closeLabel?: string,
 *   items?: Array<{id: string, label?: string, panelId?: string, badge?: number|object, closable?: boolean,
 *   pinned?: boolean, layers?: Array<{id: string, label?: string}>, disabled?: boolean}>}): void, destroy(): void}}
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
  const fold = createFold(host, views, callbacks);
  bindTabs(life, root, views, state, fold, callbacks);
  return {
    update(model = {}) {
      if (life.dead) return;
      state.items = tabItems(model.items ?? []);
      if (state.activeId !== (model.activeId ?? null)) state.focusId = model.activeId ?? null;
      state.activeId = model.activeId ?? null;
      state.activation = model.activation === 'manual' ? 'manual' : 'auto';
      state.closeLabel = String(model.closeLabel ?? 'Close');
      const held = heldBefore(root, doc, fold);
      render(root, doc, views, state);
      fold.sync(state.items);
      restoreFocus(root, views, state, fold, held);
      ownTabs(list, views, state, String(model.label ?? 'Tabs'));
    },
    destroy() {
      if (!life.destroy()) return;
      fold.destroy();
      for (const view of views.values()) view.badge?.destroy();
      views.clear();
      root.remove();
      list.remove();
    }
  };
}
