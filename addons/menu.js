/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * menu: the root's own right-click menu - the overlay panels that show
 * whichever commands apply where the click landed.
 *
 *   const off = menu(blit('#app'), { items: [
 *     { id: 'hello', label: 'Say hello', when: (app, { target }) => Boolean(target), action: (app, { target }) => ... }
 *   ] });
 *
 * Items come by value (`opts.items`) or in a registry the caller owns
 * (`opts.registry`, a `MenuRegistry`, `./menu-registry.js`): there is no
 * module-wide menu. `when` and `action` get the subject - the root's handle -
 * and the context `{target, x, y}`, `target` the blit under the click
 * (`closest('[data-blit]')`) or null on bare canvas. `installMenu` takes the
 * subject and `resolve(event)` as options: the legacy session passes itself
 * and `{pin, x, y}`. A submenu trigger opens a flyout beside itself; a chain keeps
 * to the side its first flyout took. Up/Down rove a panel, Right opens,
 * Left and Escape step out, a press outside closes.
 *
 * When nothing applies the platform's menu opens; a right-click another
 * listener already defaulted away (a gesture the pan add-on cancelled) opens nothing.
 */
import { BLIT_ATTR, stateOf } from '../core/state.js';
import { MenuRegistry, isTrigger, visibleItems } from './menu-registry.js';
import { listen, requireRootOf } from './trait.js';

export { MenuRegistry, visibleItems } from './menu-registry.js';

/** The menu element, a flyout panel, one group, one command, a trigger, and the id attribute. */
export const MENU_CLASS = 'cloudcanvas-context-menu';
export const MENU_FLYOUT_CLASS = 'cloudcanvas-context-menu-flyout';
export const MENU_GROUP_CLASS = 'cloudcanvas-context-menu-group';
export const MENU_ITEM_CLASS = 'cloudcanvas-context-menu-item';
export const MENU_ITEM_SUBMENU_CLASS = 'cloudcanvas-context-menu-item--submenu';
export const MENU_ITEM_ATTR = 'data-menu-item';

/* ------------------ OPEN AND CLOSE ------------------ */

/** Build the persistent, hidden menu element in the overlay; `m` carries the state from here on. */
function mountMenu(m) {
  const element = document.createElement('div');
  element.className = MENU_CLASS;
  element.setAttribute('role', 'menu');
  element.hidden = true;
  Object.assign(m, {
    element,
    context: null,
    items: new Map(),
    panels: [],
    onClick: (event) => runClickedItem(m, event),
    onDocumentPointerDown: (event) => { if (!panelOf(m, event.target)) closeMenu(m); },
    onDocumentKeyDown: (event) => onMenuKeyDown(m, event)
  });
  element.addEventListener('click', m.onClick);
  m.overlay.appendChild(element);
}

/** Show the menu for one click, if anything applies. @returns {boolean} opened: the caller owes a `preventDefault()` */
export function openMenu(m, context) {
  if (!m || !m.element) return false;
  const items = visibleItems(m, context);
  // A fresh opening supersedes whatever was up, flyouts and document listeners included.
  closeMenu(m);
  if (items.length === 0) return false;

  m.panels = [{ element: m.element, triggerButton: null, triggerId: null, depth: 0, itemIds: renderInto(m, m.element, items), side: 'right' }];
  // Unhidden before it is placed: the clamp needs a real measurement.
  m.element.hidden = false;
  placeInHost(m, m.element, { mode: 'point', x: context.x, y: context.y });
  m.context = context;
  documentListeners(m, true);
  focusFirstItem(m.element);
  return true;
}

/** Close every panel, and hand the keyboard to the host if the menu held it. @returns {boolean} it was open */
export function closeMenu(m) {
  if (!isMenuOpen(m)) return false;
  // Asked before the panels go: removing the focused element drops focus to the body.
  const held = Boolean(panelOf(m, m.element.ownerDocument.activeElement));
  closePanelsDeeperThan(m, 0);
  m.element.hidden = true;
  m.element.textContent = '';
  m.items.clear();
  m.panels = [];
  m.context = null;
  documentListeners(m, false);
  if (held && typeof m.host.focus === 'function') m.host.focus({ preventScroll: true });
  return true;
}

export function isMenuOpen(m) {
  return Boolean(m && m.element) && m.element.hidden === false;
}

/** The open panel whose box contains `node`, if any. */
function panelOf(m, node) {
  return node ? m.panels.find((panel) => panel.element.contains(node)) ?? null : null;
}

function focusQuietly(element) {
  if (element && typeof element.focus === 'function') element.focus({ preventScroll: true });
}

/** Focus a panel's first command: a menu the pointer opened is still a keyboard menu. */
function focusFirstItem(element) {
  focusQuietly(element.querySelector(`.${MENU_ITEM_CLASS}`));
}

/** Listen on the document while open (`on`), or stop: a press outside closes, keys drive the panels. */
function documentListeners(m, on) {
  const method = on ? 'addEventListener' : 'removeEventListener';
  document[method]('pointerdown', m.onDocumentPointerDown);
  document[method]('keydown', m.onDocumentKeyDown);
}

/* ------------------ PANELS ------------------ */

/** One button per command, one wrapper per group (first-appearance order). @returns {string[]} the ids rendered */
function renderInto(m, container, items) {
  const doc = container.ownerDocument;
  const groups = new Map();
  for (const item of items) {
    if (groups.has(item.group)) groups.get(item.group).push(item);
    else groups.set(item.group, [item]);
  }

  container.textContent = '';
  const ids = [];
  for (const group of groups.values()) {
    const wrapper = doc.createElement('div');
    wrapper.className = MENU_GROUP_CLASS;
    for (const item of group) {
      wrapper.appendChild(itemButton(m, doc, item));
      m.items.set(item.id, item);
      ids.push(item.id);
    }
    container.appendChild(wrapper);
  }
  return ids;
}

/** A real button; a trigger also carries popup semantics and a trailing caret. */
function itemButton(m, doc, item) {
  const button = doc.createElement('button');
  button.type = 'button';
  button.className = MENU_ITEM_CLASS;
  button.setAttribute('role', 'menuitem');
  button.setAttribute(MENU_ITEM_ATTR, item.id);
  button.textContent = item.label;
  if (!isTrigger(m, item)) return button;

  button.classList.add(MENU_ITEM_SUBMENU_CLASS);
  button.setAttribute('aria-haspopup', 'menu');
  button.setAttribute('aria-expanded', 'false');
  Object.assign(button.style, { display: 'flex', alignItems: 'center', justifyContent: 'space-between' });
  const caret = doc.createElement('span');
  caret.className = `${MENU_ITEM_SUBMENU_CLASS}-caret`;
  caret.setAttribute('aria-hidden', 'true');
  caret.textContent = '▸';
  button.appendChild(caret);
  return button;
}

/**
 * Open a trigger's flyout and move focus into it. Only one branch is open per
 * level, so deeper panels close first; re-opening the open one only refocuses.
 * @returns {boolean} a flyout is open for this trigger
 */
function openFlyout(m, triggerItem, triggerButton) {
  const parentPanel = panelOf(m, triggerButton);
  if (!parentPanel) return false;
  const already = m.panels[m.panels.indexOf(parentPanel) + 1];
  if (already && already.triggerId === triggerItem.id) {
    focusFirstItem(already.element);
    return true;
  }

  closePanelsDeeperThan(m, parentPanel.depth);
  const children = visibleItems(m, m.context, triggerItem.id);
  if (children.length === 0) return false;

  const panel = m.element.ownerDocument.createElement('div');
  panel.className = `${MENU_CLASS} ${MENU_FLYOUT_CLASS}`;
  panel.setAttribute('role', 'menu');
  panel.addEventListener('click', m.onClick);
  m.overlay.appendChild(panel);
  const itemIds = renderInto(m, panel, children);
  const side = placeInHost(m, panel, {
    mode: 'box', rect: triggerButton.getBoundingClientRect(), preferSide: parentPanel.side, allowFlip: parentPanel.depth === 0
  });

  triggerButton.setAttribute('aria-expanded', 'true');
  m.panels.push({ element: panel, triggerButton, triggerId: triggerItem.id, depth: parentPanel.depth + 1, itemIds, side });
  focusFirstItem(panel);
  return true;
}

/** Remove every panel deeper than `depth`, innermost first; the root element is only ever hidden. */
function closePanelsDeeperThan(m, depth) {
  while (m.panels.length > 0 && m.panels[m.panels.length - 1].depth > depth) {
    const panel = m.panels.pop();
    for (const id of panel.itemIds) m.items.delete(id);
    panel.triggerButton?.setAttribute('aria-expanded', 'false');
    if (panel.element !== m.element) {
      panel.element.removeEventListener('click', m.onClick);
      panel.element.remove();
    }
  }
}

/* ------------------ PLACEMENT ------------------ */

/**
 * Place a panel in overlay coordinates (client minus the host's cached origin)
 * and fit it in the host. A point anchor (the click) is clamped back inside by
 * its overhang, never past the near edge. A box anchor (a trigger) opens on its
 * committed side and flips only for the first flyout (`allowFlip`); failing
 * both it clamps on that side, since reversing would land on its own ancestors.
 * @returns {'left'|'right'|null} the side a box took
 */
function placeInHost(m, element, anchor) {
  const hostRect = m.root.hostRect;
  // `|| 0`: a synthetic event without coordinates opens at the host's corner, never at `NaNpx`.
  const hostLeft = hostRect.left || 0;
  const hostTop = hostRect.top || 0;
  const hostRight = hostLeft + (hostRect.width || 0);
  const box = anchor.mode === 'box';
  element.style.top = `${(box ? anchor.rect.top : (Number(anchor.y) || 0)) - hostTop}px`;
  element.style.left = `${(box ? anchor.rect.right : (Number(anchor.x) || 0)) - hostLeft}px`;

  const measured = element.getBoundingClientRect();
  const side = box ? placeBoxHorizontally(element, anchor, measured.width, hostLeft, hostRight) : null;
  if (!box) clampFarEdge(element, 'left', measured.right, hostRight);
  clampFarEdge(element, 'top', measured.bottom, hostTop + (hostRect.height || 0));
  return side;
}

/** Fit a flyout beside its trigger on the committed side, else (first flyout only) the other, else clamp. */
function placeBoxHorizontally(element, anchor, panelWidth, hostLeft, hostRight) {
  const { rect, preferSide, allowFlip } = anchor;
  const fits = { right: rect.right + panelWidth <= hostRight, left: rect.left - panelWidth >= hostLeft };
  const at = { right: rect.right - hostLeft, left: (rect.left - panelWidth) - hostLeft };
  const order = allowFlip ? [preferSide, 'left', 'right'] : [preferSide];
  const side = order.find((each) => fits[each]);
  if (side) {
    element.style.left = `${at[side]}px`;
    return side;
  }
  element.style.left = `${preferSide === 'left' ? 0 : Math.max(0, (hostRight - hostLeft) - panelWidth)}px`;
  return preferSide;
}

/** Pull a far edge back inside the host by its overhang, never past the near edge. */
function clampFarEdge(element, styleProp, boxFar, hostFar) {
  const over = boxFar - hostFar;
  if (over > 0) element.style[styleProp] = `${Math.max(0, parseFloat(element.style[styleProp]) - over)}px`;
}

/* ------------------ ACTIVATION AND KEYS ------------------ */

/** A trigger opens its flyout and the chain stays up; a leaf runs, then the whole chain closes. */
function runClickedItem(m, event) {
  const button = event.target && typeof event.target.closest === 'function'
    ? event.target.closest(`[${MENU_ITEM_ATTR}]`) : null;
  const item = button ? m.items.get(button.getAttribute(MENU_ITEM_ATTR)) : null;
  if (!item) return false;
  if (isTrigger(m, item)) return openFlyout(m, item, button);
  if (typeof item.action !== 'function') return false;

  item.action(m.subject, m.context);
  closeMenu(m);
  return true;
}

/** Escape steps out a level (closing at the top); Up/Down rove; Right opens a trigger; Left steps out. */
function onMenuKeyDown(m, event) {
  if (!isMenuOpen(m)) return;
  const active = m.element.ownerDocument.activeElement;
  let handled = false;
  if (event.key === 'Escape') {
    handled = true;
    if (!stepOut(m, m.panels[m.panels.length - 1])) closeMenu(m);
  } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    handled = moveRoving(panelOf(m, active), active, event.key === 'ArrowDown' ? 1 : -1);
  } else if (event.key === 'ArrowRight') {
    const item = typeof active?.getAttribute === 'function' ? m.items.get(active.getAttribute(MENU_ITEM_ATTR)) : null;
    handled = Boolean(item) && isTrigger(m, item) && openFlyout(m, item, active);
  } else if (event.key === 'ArrowLeft') {
    handled = stepOut(m, panelOf(m, active));
  }
  if (handled && typeof event.preventDefault === 'function') event.preventDefault();
}

/** Close a flyout and step back to its trigger. @returns {boolean} there was a flyout */
function stepOut(m, panel) {
  if (!panel || panel.depth === 0) return false;
  closePanelsDeeperThan(m, panel.depth - 1);
  focusQuietly(panel.triggerButton);
  return true;
}

function moveRoving(panel, active, delta) {
  const buttons = panel ? Array.from(panel.element.querySelectorAll(`.${MENU_ITEM_CLASS}`)) : [];
  if (buttons.length === 0) return false;
  focusQuietly(buttons[(buttons.indexOf(active) + delta + buttons.length) % buttons.length]);
  return true;
}

/* ------------------ THE TRAIT ------------------ */

/** Items by value, as a registry of their own. */
function registryOf(items) {
  const registry = new MenuRegistry();
  for (const item of items ?? []) registry.register(item);
  return registry;
}

/** The core's context: the blit under the click, or null on bare canvas. */
function blitContext(host, event) {
  const hit = event.target && typeof event.target.closest === 'function' ? event.target.closest(`[${BLIT_ATTR}]`) : null;
  return { target: hit && hit !== host ? stateOf(hit).handle : null, x: event.clientX, y: event.clientY };
}

/**
 * Install the menu on `host`, drawing in `options.overlay`. `options`: `registry`,
 * `subject`, `resolve(event)`, and `state`, the record the menu lives in.
 * @returns {() => void} off, which closes the menu and takes its element away
 */
export function installMenu(host, root, options) {
  const { registry, subject, resolve, overlay } = options;
  const m = Object.assign(options.state ?? {}, { host, root, overlay, registry, subject, resolve });
  mountMenu(m);
  const off = listen(host, ['contextmenu'], (event) => {
    if (!event.defaultPrevented && openMenu(m, m.resolve(event))) event.preventDefault();
  });
  return () => {
    off();
    closeMenu(m);
    m.element.removeEventListener('click', m.onClick);
    m.element.remove();
  };
}

/** The root trait: `opts.items` by value, or `opts.registry`. @returns {() => void} off */
export function menu(b, opts, root) {
  const options = opts && typeof opts === 'object' ? opts : {};
  const found = requireRootOf(b, root, 'menu');
  return installMenu(b.el, found, {
    registry: options.registry ?? registryOf(options.items),
    subject: b,
    resolve: (event) => blitContext(b.el, event),
    overlay: found.overlay
  });
}
