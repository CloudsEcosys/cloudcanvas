/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The legacy session's right-click menu: the menu add-on (`../addons/menu.js`)
 * installed on the session's host, reading the one registry every session
 * shares. `when` and `action` get the session and `{pin, x, y}`.
 *
 * What stays here is Pin-shaped or legacy API: the shared `menuRegistry` and
 * its `registerMenuItem` / `unregisterMenuItem`, the built-in commands
 * (`../defaults.js` installs them), the z-order pair they run, and the
 * `(session, ...)` functions over the session's `_contextMenu` record.
 */
import { PIN_CLASS } from '../pins/pin-element.js';
import { canGoBack, canGoForward } from './navigation.js';
import { pinFromElement } from './hit-test.js';
import { MenuRegistry, closeMenu, installMenu, isMenuOpen, openMenu, visibleItems } from '../addons/menu.js';

export {
  MENU_CLASS, MENU_FLYOUT_CLASS, MENU_GROUP_CLASS, MENU_ITEM_ATTR, MENU_ITEM_CLASS, MENU_ITEM_SUBMENU_CLASS,
  MenuRegistry
} from '../addons/menu.js';

/* ------------------ Z-ORDER (the DOM is the model) ------------------ */

/** Move a Pin in front of its siblings: paint order is document order. @returns {boolean} it moved */
export function bringToFront(pin) {
  const element = pin ? pin.element : null;
  const container = element ? element.parentNode : null;
  if (!container || container.lastElementChild === element) return false;

  container.appendChild(element);
  return true;
}

/**
 * Move a Pin behind every sibling *Pin* - not behind the focus veil, which is
 * the plane's first child on purpose. @returns {boolean} it moved
 */
export function sendToBack(pin) {
  const element = pin ? pin.element : null;
  const container = element ? element.parentNode : null;
  if (!container || typeof container.querySelector !== 'function') return false;

  const first = container.querySelector(`:scope > .${PIN_CLASS}`);
  if (!first || first === element) return false;

  container.insertBefore(element, first);
  return true;
}

/* ------------------ REGISTRY ------------------ */

/** The commands the framework ships, installed by `../defaults.js`: navigation, then the Pin-scoped z-order. */
export const BUILT_IN_MENU_ITEMS = /* @__PURE__ */ Object.freeze([
  {
    id: 'nav-back',
    label: 'Back',
    group: 'navigation',
    when: (session) => canGoBack(session),
    action: (session) => session.popFocus()
  },
  {
    id: 'nav-forward',
    label: 'Forward',
    group: 'navigation',
    when: (session) => canGoForward(session),
    action: (session) => session.goForward()
  },
  {
    id: 'bring-to-front',
    label: 'Bring to front',
    group: 'order',
    when: (session, { pin }) => Boolean(pin),
    action: (session, { pin }) => bringToFront(pin)
  },
  {
    id: 'send-to-back',
    label: 'Send to back',
    group: 'order',
    when: (session, { pin }) => Boolean(pin),
    action: (session, { pin }) => sendToBack(pin)
  }
]);

/** The registry every session reads. One menu, however many canvases; empty until `../defaults.js` fills it. */
export const menuRegistry = /* @__PURE__ */ new MenuRegistry();

/** Add a command to the canvas menu (see {@link MenuRegistry#register}). */
export function registerMenuItem(item) {
  return menuRegistry.register(item);
}

/** Take a command back off it. */
export function unregisterMenuItem(id) {
  return menuRegistry.unregister(id);
}

/** The top-level commands that apply to one click, in registration order. */
export function menuItemsFor(session, context) {
  return visibleItems({ registry: menuRegistry, subject: session }, context);
}

/* ------------------ THE SESSION'S MENU ------------------ */

/** Install the menu add-on on the session's host, drawing in its overlay. @returns {Element|null} the menu element */
export function mountContextMenu(session) {
  if (typeof document === 'undefined' || !session || !session.overlayElement) return null;
  unmountContextMenu(session);

  const state = {};
  state.off = installMenu(session.hostElement, session._frame, {
    registry: menuRegistry,
    ...session.options?.menu,
    state,
    subject: session,
    overlay: session.overlayElement,
    resolve: (event) => ({ pin: pinFromElement(session, event.target), x: event.clientX, y: event.clientY })
  });
  session._contextMenu = state;
  return state.element;
}

/** Close the menu, take the add-on off, and forget the state. */
export function unmountContextMenu(session) {
  const state = session ? session._contextMenu : null;
  if (!state) return false;

  state.off();
  session._contextMenu = null;
  return true;
}

/** Show the menu for one click, if anything applies. @returns {boolean} opened: the caller owes a `preventDefault()` */
export function openContextMenu(session, context) {
  return openMenu(session ? session._contextMenu : null, context);
}

/** Hide the menu and give the canvas its keyboard back. @returns {boolean} a menu was open */
export function closeContextMenu(session) {
  return closeMenu(session ? session._contextMenu : null);
}

/** Whether the session's menu is currently on screen. */
export function isContextMenuOpen(session) {
  return isMenuOpen(session ? session._contextMenu : null);
}
