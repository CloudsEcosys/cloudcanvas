/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The panel's frame (`./panel.js`): a bar - the title, or the tab strip of its slot, then the buttons `controls`
 * names - over a body that holds the author's content and is never rewritten; the place menu; the bar's keys.
 *
 * Built once per record and kept across trait restarts. A sync writes only what moved - a title's text, a
 * button's name, state or visibility, the tabs and buttons reconciled by key - so a write of the options never
 * rebuilds an unchanged bar and never takes the focus off it. Every text reaches the DOM as text.
 *
 * Keys on the bar itself (one tab stop): the arrows move a floating panel 16px, Shift with them sizes it (the box
 * floating, the thickness on an edge), Enter or Space unfolds a collapsed one. Left and Right rove the tab strip
 * and select; the place menu roves with the arrows and closes with Escape.
 */
import { h } from '../graphics/primitives/element.js';
import { KEY_ATTR, reconcileKeyedList } from './keyed-list.js';
import { MENU_CLASS, MENU_ITEM_CLASS } from './menu.js';
import { RESIZE_HANDLE_CLASS, RESIZING_CLASS } from './resize.js';
import { isControlTarget, listen } from './trait.js';
import { leadingText, setText, setVisible } from './widget.js';
import { PANEL_PLACES, isEdge, placeNormalised } from './panel-place.js';
import { pressBar } from './panel-snap.js';

/** The frame's class, and its parts'. Place and state ride classes (`cc-at-<place>`, `is-collapsed`, `cc-drawer`). */
export const PANEL_CLASS = 'cloudcanvas-panel';
export const PANEL_BAR_CLASS = 'cloudcanvas-panel-bar';
export const PANEL_BODY_CLASS = 'cloudcanvas-panel-body';
export const PANEL_TAB_CLASS = 'cloudcanvas-panel-tab';
export const PANEL_CONTROL_CLASS = 'cloudcanvas-panel-control';

/** The place a menu item puts the panel in. */
export const PANEL_PLACE_ATTR = 'data-cc-panel-place';

/** How far one arrow press moves or sizes a panel, in px. */
export const PANEL_STEP_PX = 16;

const PLACE_NAMES = /* @__PURE__ */ Object.freeze({
  float: 'Float', left: 'Left edge', right: 'Right edge', top: 'Top edge', bottom: 'Bottom edge',
  modal: 'Modal', full: 'Full', window: 'Own window'
});

const ARROWS = /* @__PURE__ */ Object.freeze({ ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] });

/** Which way grows an edge strip: towards the content. */
const INWARD = /* @__PURE__ */ Object.freeze({ left: [1, 0], right: [-1, 0], top: [0, 1], bottom: [0, -1] });

/** Each control: its glyph, its name (what pressing it does), whether it is pressed, where it shows, what it does. */
const CONTROLS = /* @__PURE__ */ Object.freeze({
  collapse: {
    glyph: (o) => (o.collapsed ? '+' : '−'), name: (title) => `Collapse ${title}`, pressed: (o) => o.collapsed,
    shown: (o) => o.at === 'float' || isEdge(o.at), press: (rec) => rec.actions.write({ collapsed: !rec.options.collapsed })
  },
  pin: {
    glyph: () => '◫', name: (title) => `Pin ${title} beside the content`, pressed: (o) => o.pinned,
    shown: (o) => isEdge(o.at), press: (rec) => rec.actions.write({ pinned: !rec.options.pinned })
  },
  place: {
    glyph: () => '⋯', name: (title) => `Move ${title} to another place`, pressed: null,
    shown: (o) => o.places.length > 1, press: (rec) => (rec.menu ? closeMenu(rec, true) : openMenu(rec))
  },
  full: {
    glyph: (o) => (o.at === 'full' ? '❐' : '◻'), name: (title) => `Show ${title} full size`,
    pressed: (o) => o.at === 'full', shown: (o) => o.at !== 'window' && o.places.includes('full'), press: (rec) => rec.actions.full()
  },
  close: { glyph: () => '×', name: (title) => `Close ${title}`, pressed: null, shown: () => true, press: (rec) => rec.actions.close() }
});

/** Write an attribute only when it moved; null removes it. */
function attr(element, name, value) {
  if (value === null) {
    if (element.hasAttribute(name)) element.removeAttribute(name);
  } else if (element.getAttribute(name) !== value) element.setAttribute(name, value);
}

function toggleClass(element, name, on) {
  if (element.classList.contains(name) !== on) element.classList.toggle(name, on);
}

/** A panel's title: its own, else its element's (`titleOf`, read when it was made), else its id. */
export function titleFor(rec) {
  return rec.options.title || rec.title || rec.el.id || 'Panel';
}

/* ------------------ BUILD ------------------ */

/** The bar and the body, the element's children moved into the body; the bar's listeners on the record. */
export function buildFrame(rec) {
  const title = h('span', { class: 'cloudcanvas-panel-title' });
  const strip = h('div', { class: 'cloudcanvas-panel-tabs', role: 'tablist', hidden: true });
  const controls = h('div', { class: 'cloudcanvas-panel-controls' });
  const bar = h('div', { class: PANEL_BAR_CLASS, tabindex: '0' }, title, strip, controls);
  const body = h('div', { class: PANEL_BODY_CLASS, id: bodyId(rec) });
  // The resize add-on's handles are its own, not content: they stay direct children.
  for (const node of Array.from(rec.el.childNodes)) {
    if (!(node.nodeType === 1 && node.classList.contains(RESIZE_HANDLE_CLASS))) body.appendChild(node);
  }
  rec.el.prepend(bar, body);
  rec.el.classList.add(PANEL_CLASS);
  rec.offs.push(
    listen(bar, ['pointerdown'], (event) => pressBar(rec, event)),
    listen(bar, ['dblclick'], (event) => {
      const { at, places } = rec.options;
      if (!isControlTarget(event.target) && at !== 'window' && places.includes('full')) rec.actions.full();
    }),
    listen(bar, ['click'], (event) => clicked(rec, event)),
    listen(bar, ['keydown'], (event) => keyed(rec, event)),
    listen(rec.el, ['dragstart'], (event) => { if (ownPress(rec, event.target)) event.preventDefault(); })
  );
  return { bar, title, titleText: leadingText(title), strip, controls, body };
}

/**
 * Whether a press is the panel's own - a gesture of its bar or a handle in flight, or a node of either: a text
 * selection over the frame must not turn it into the browser's drag (which would cancel the gesture).
 */
function ownPress(rec, target) {
  if (rec.gesture || rec.el.classList.contains(RESIZING_CLASS)) return true;
  const node = target?.nodeType === 1 ? target : target?.parentElement;
  return Boolean(node?.closest?.(`.${PANEL_BAR_CLASS}, .${RESIZE_HANDLE_CLASS}`));
}

/** The frame taken back down: the body's children where the body was, the panel's classes and roles gone. */
export function unbuildFrame(rec) {
  const { bar, body } = rec.parts;
  bar.remove();
  body.replaceWith(...Array.from(body.childNodes));
  rec.el.classList.remove(PANEL_CLASS, 'is-collapsed', 'cc-drawer', ...PANEL_PLACES.map((place) => `cc-at-${place}`));
  rec.el.removeAttribute('inert');
}

/** The ids the tab roles point by: a body, and the tab in `owner`'s strip for `member`. */
const bodyId = (rec) => `cc-${rec.uid}-body`;
const tabId = (owner, member) => `cc-${owner.uid}-tab-${member.uid}`;

/* ------------------ SYNC ------------------ */

/** The frame up to date with its options and its slot's `members`; only what moved is written. */
export function syncFrame(rec, members) {
  const o = rec.options;
  const name = titleFor(rec);
  const el = rec.el;
  for (const place of PANEL_PLACES) toggleClass(el, `cc-at-${place}`, place === o.at);
  toggleClass(el, 'is-collapsed', o.collapsed && (o.at === 'float' || isEdge(o.at)));
  toggleClass(el, 'cc-drawer', isEdge(o.at) && !o.pinned);
  if (!rec.labelled) attr(el, 'aria-label', rec.modal ? name : null);

  const { bar, titleText } = rec.parts;
  const tab = o.collapsed && isEdge(o.at);
  setText(titleText, name);
  attr(bar, 'role', tab ? 'button' : 'group');
  attr(bar, 'aria-label', tab ? `Expand ${name}` : name);
  attr(bar, 'aria-expanded', tab ? 'false' : null);
  syncTabs(rec, members);
  reconcileKeyedList(rec.parts.controls, o.controls, {
    key: (control) => control,
    create: () => h('button', { type: 'button', class: PANEL_CONTROL_CLASS }, h('span', { 'aria-hidden': 'true' })),
    update: (button, control) => syncControl(rec, button, CONTROLS[control], name)
  });
}

/**
 * One tab per open member of the slot when there are two or more, else the title alone. The strip is a `tablist`
 * named for the place; each tab controls its member's body, and this panel's body is the `tabpanel` its own tab
 * names. A newly selected tab is asked to be scrolled into view (`revealTab`, the layer's passes).
 */
function syncTabs(rec, members) {
  const { strip, title, body } = rec.parts;
  const tabbed = members.length > 1;
  setVisible(strip, tabbed);
  setVisible(title, !tabbed);
  attr(strip, 'aria-label', tabbed ? `${PLACE_NAMES[rec.options.at]} panels` : null);
  attr(body, 'role', tabbed ? 'tabpanel' : null);
  attr(body, 'aria-labelledby', tabbed ? tabId(rec, rec) : null);
  reconcileKeyedList(strip, tabbed ? members : [], {
    key: (member) => member.uid,
    // Not a button: the bar drags from a tab as from the rest of it, and a press that never moves selects it.
    create: (member) => h('div', { role: 'tab', class: PANEL_TAB_CLASS, id: tabId(rec, member), 'aria-controls': bodyId(member) }),
    update: (node, member) => {
      setText(leadingText(node), titleFor(member));
      attr(node, 'aria-selected', String(member.active));
      attr(node, 'tabindex', member.active ? '0' : '-1');
    }
  });
  const selected = tabbed ? members.find((member) => member.active)?.uid ?? null : null;
  if (selected !== rec.parts.revealed) {
    rec.parts.revealed = selected;
    if (selected && rec.active) rec.actions.reveal();
  }
}

/**
 * The read half of keeping the selected tab in view: where the strip must scroll to show it, or null when it
 * shows already (or nothing is tabbed).
 */
export function revealTab(rec) {
  const { strip } = rec.parts;
  const tab = strip.querySelector('[aria-selected="true"]');
  if (!tab || strip.hidden) return null;
  const start = tab.offsetLeft - strip.offsetLeft;
  const end = start + tab.offsetWidth;
  if (start < strip.scrollLeft) return start;
  return end > strip.scrollLeft + strip.clientWidth ? end - strip.clientWidth : null;
}

function syncControl(rec, button, control, name) {
  const o = rec.options;
  const label = control.name(name);
  setVisible(button, control.shown(o));
  setText(leadingText(button.firstChild), control.glyph(o));
  attr(button, 'aria-label', label);
  attr(button, 'title', label);
  attr(button, 'aria-pressed', control.pressed ? String(control.pressed(o)) : null);
  if (control === CONTROLS.place) {
    attr(button, 'aria-haspopup', 'menu');
    attr(button, 'aria-expanded', String(Boolean(rec.menu)));
  }
}

/** Give the keyboard to `member`'s own tab for itself. */
export function focusTab(member) {
  const tab = member.parts.strip.querySelector(`[${KEY_ATTR}="${member.uid}"]`);
  if (tab) tab.focus({ preventScroll: true });
}

/* ------------------ THE PLACE MENU ------------------ */

function placeButton(rec) {
  return rec.parts.controls.querySelector(`[${KEY_ATTR}="place"]`);
}

/** A `menu` of `menuitemradio`s, one per allowed place, under the place button; a press outside closes it. */
function openMenu(rec) {
  const o = rec.options;
  const items = o.places.map((place) => h('button', {
    type: 'button', class: MENU_ITEM_CLASS, role: 'menuitemradio', 'aria-checked': String(place === o.at), [PANEL_PLACE_ATTR]: place
  }, PLACE_NAMES[place]));
  const menu = h('div', { class: MENU_CLASS, role: 'menu', 'aria-label': `Places for ${titleFor(rec)}` }, items);
  rec.parts.bar.appendChild(menu);
  const offOutside = listen(rec.el.ownerDocument, ['pointerdown'], (event) => {
    if (!menu.contains(event.target) && !placeButton(rec)?.contains(event.target)) closeMenu(rec, false);
  }, true);
  rec.menu = { element: menu, off: offOutside };
  attr(placeButton(rec), 'aria-expanded', 'true');
  (items.find((item) => item.getAttribute('aria-checked') === 'true') ?? items[0])?.focus({ preventScroll: true });
}

/** Close the place menu, if open; `refocus` hands the keyboard back to the place button. */
export function closeMenu(rec, refocus) {
  if (!rec.menu) return false;
  const { element, off } = rec.menu;
  rec.menu = null;
  off();
  element.remove();
  const button = placeButton(rec);
  if (button) attr(button, 'aria-expanded', 'false');
  if (refocus && button) button.focus({ preventScroll: true });
  return true;
}

function menuKeyed(rec, event) {
  const items = Array.from(rec.menu.element.children);
  const index = items.indexOf(event.target);
  const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
  if (event.key === 'Tab') {
    closeMenu(rec, false);
    return;
  }
  if (event.key === 'Escape') closeMenu(rec, true);
  else if (step) items[(index + step + items.length) % items.length].focus({ preventScroll: true });
  else return;
  // Handled here: a modal's Escape must not close the panel the menu belongs to.
  event.preventDefault();
  event.stopPropagation();
}

/* ------------------ PRESSES AND KEYS ------------------ */

/** One listener for the bar: a control, a tab, or a menu item. */
function clicked(rec, event) {
  const target = event.target;
  const item = target.closest?.(`[${PANEL_PLACE_ATTR}]`);
  if (item && rec.menu?.element.contains(item)) {
    closeMenu(rec, true);
    rec.actions.write({ at: item.getAttribute(PANEL_PLACE_ATTR) });
    return;
  }
  const button = target.closest?.(`.${PANEL_CONTROL_CLASS}`);
  if (button && rec.parts.controls.contains(button)) {
    CONTROLS[button.getAttribute(KEY_ATTR)]?.press(rec);
    return;
  }
  const tab = target.closest?.(`.${PANEL_TAB_CLASS}`);
  if (tab && rec.parts.strip.contains(tab)) rec.actions.select(rec.actions.member(tab.getAttribute(KEY_ATTR)), true);
}

function keyed(rec, event) {
  const target = event.target;
  if (rec.menu && rec.menu.element.contains(target)) menuKeyed(rec, event);
  else if (target.classList?.contains(PANEL_TAB_CLASS)) tabKeyed(rec, event);
  else if (target === rec.parts.bar) barKeyed(rec, event);
}

/** Left and Right move among the tabs and select. */
function tabKeyed(rec, event) {
  const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
  if (!step) return;
  const tabs = Array.from(rec.parts.strip.children);
  const next = tabs[(tabs.indexOf(event.target) + step + tabs.length) % tabs.length];
  event.preventDefault();
  rec.actions.select(rec.actions.member(next.getAttribute(KEY_ATTR)), true);
}

function barKeyed(rec, event) {
  const o = rec.options;
  if ((event.key === 'Enter' || event.key === ' ') && o.collapsed) {
    event.preventDefault();
    rec.actions.write({ collapsed: false });
    return;
  }
  const arrow = ARROWS[event.key];
  const patch = arrow && !o.collapsed ? (event.shiftKey ? sizeStep(rec, arrow) : moveStep(rec, arrow)) : null;
  if (!patch) return;
  event.preventDefault();
  rec.actions.write(patch);
}

/** The place as it stands now: the stored options placed on the layer's last size (clamps applied), or null. */
function placedNow(rec) {
  return rec.layer.size ? placeNormalised(rec.options, rec.layer.size, rec.actions.insets()) : null;
}

/** The floating box as it stands, its position the clamped one. */
function boxNow(rec) {
  const { box } = rec.options;
  const placed = placedNow(rec);
  return { x: placed?.x ?? box.x ?? 0, y: placed?.y ?? box.y ?? 0, w: box.w, h: box.h };
}

function moveStep(rec, [dx, dy]) {
  if (rec.options.at !== 'float') return null;
  const box = boxNow(rec);
  return { box: { ...box, x: box.x + dx * PANEL_STEP_PX, y: box.y + dy * PANEL_STEP_PX } };
}

function sizeStep(rec, [dx, dy]) {
  const o = rec.options;
  if (o.at === 'float') {
    const box = boxNow(rec);
    return { box: { ...box, w: Math.max(o.min.w, box.w + dx * PANEL_STEP_PX), h: Math.max(o.min.h, box.h + dy * PANEL_STEP_PX) } };
  }
  const inward = INWARD[o.at];
  const delta = inward ? (dx * inward[0] + dy * inward[1]) * PANEL_STEP_PX : 0;
  if (delta === 0) return null;
  const across = o.at === 'left' || o.at === 'right';
  const placed = placedNow(rec);
  const axis = across ? 'x' : 'y';
  const now = placed ? (across ? placed.w : placed.h) : o.size[axis];
  return { size: { [axis]: Math.max(across ? o.min.w : o.min.h, now + delta) } };
}
