/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The display types as core types: `card`, `media`, `raw` and `vector-pointer`,
 * each a `<template data-type>` whose `[data-slot]`s take text. `raw` is the one
 * markup type, so its single slot is the template's own `data-slot-html` opt-in.
 *
 * Registration is a call, never an import side effect, and goes through the
 * registry `type()` wraps (`../core/type.js`), so the legacy bundle that renders
 * through these templates never pulls in the blit handle. After it,
 * `type('card')` and `root.blit({type: 'card', fill: {title}})` work as for
 * any type. `mountType` is how the legacy `DisplayTrait` renders through them.
 */
import { SLOT_ATTR } from '../core/state.js';
import { defineType, findType, isTemplate } from '../core/type.js';

/**
 * Every class name the display types carry. Public API twice over: consumers
 * style them and the default stylesheet matches them. `GAUGE_ROW` is the
 * modifier the vector-pointer body carries beside `BODY`.
 */
export const CLS = /* @__PURE__ */ Object.freeze({
  HEADER: 'cloudcanvas-pin-header',
  TITLE: 'cloudcanvas-pin-title',
  BADGE_SLOT: 'cloudcanvas-pin-badge-slot',
  BODY: 'cloudcanvas-pin-body',
  GAUGE_ROW: 'cloudcanvas-pin-gauge-row',
  FOOTER: 'cloudcanvas-pin-footer',
  AUTHOR: 'cloudcanvas-pin-author',
  ACTION_BTN: 'cloudcanvas-pin-action-btn',
  NEEDLE_SLOT: 'cloudcanvas-pin-needle-slot',
  GAUGE: 'cloudcanvas-pin-gauge',
  LABEL: 'cloudcanvas-pin-label',
  METER_SLOT: 'cloudcanvas-pin-meter-slot',
  MEDIA: 'cloudcanvas-pin-media',
  CAPTION: 'cloudcanvas-pin-caption'
});

/** One element as markup; `slot` names a text slot. Constants only: nothing here is data. */
function tag(name, className, slot = '', inner = '', extra = '') {
  const slotAttr = slot ? ` ${SLOT_ATTR}="${slot}"` : '';
  return `<${name} class="${className}"${slotAttr}${extra}>${inner}</${name}>`;
}

/**
 * Name -> template markup. Every type but `raw` opens with the header, a title and a badge; the badge, needle and
 * meter are graphic slots the legacy renderer draws. Built by a call so the table is one pure expression.
 */
function displayTypeMarkup() {
  const header = tag('div', CLS.HEADER, '', tag('div', CLS.TITLE, 'title') + tag('span', CLS.BADGE_SLOT, 'badge'));
  return Object.freeze({
    card: header + tag('div', CLS.BODY, 'body') + tag('div', CLS.FOOTER, '',
      tag('span', CLS.AUTHOR, 'author') + tag('button', CLS.ACTION_BTN, 'action', '', ' type="button"')),
    media: header + tag('div', CLS.BODY, '', `<img class="${CLS.MEDIA}">` + tag('p', CLS.CAPTION, 'caption')),
    'vector-pointer': header + tag('div', `${CLS.BODY} ${CLS.GAUGE_ROW}`, '', tag('div', CLS.NEEDLE_SLOT, 'needle')
      + tag('div', CLS.GAUGE, '', tag('div', CLS.LABEL, 'label') + tag('div', CLS.METER_SLOT, 'meter'))),
    raw: `<div ${SLOT_ATTR}="html" data-slot-html></div>`
  });
}

/** Name -> template markup, frozen. */
export const DISPLAY_TYPES = /* @__PURE__ */ displayTypeMarkup();

/** Set once every display type is registered, so the legacy build path parses the markup once. */
let registered = false;

/**
 * Register the display types; a second call is a no-op, and a document or
 * caller that already defined one of these names with other markup throws.
 * @returns {string[]} the names registered
 */
export function registerDisplayTypes() {
  if (!registered) {
    for (const [name, html] of Object.entries(DISPLAY_TYPES)) defineType(name, { html });
    registered = true;
  }
  return Object.keys(DISPLAY_TYPES);
}

/**
 * Clone a type's content into `into`, replacing its children: the build half of
 * rendering through a type. `type` is a registered name or a `<template>`.
 * @returns {Record<string, Element>} the clone's slots by name, first wins (a null-prototype object)
 * @throws {TypeError} when the name is not a registered type
 */
export function mountType(type, into) {
  const template = typeof type === 'string' ? findType(type) : type;
  if (!template || !isTemplate(template)) throw new TypeError(`types: no type "${String(type)}"`);
  into.replaceChildren(template.content.cloneNode(true));
  const slots = Object.create(null);
  for (const slot of into.querySelectorAll(`[${SLOT_ATTR}]`)) slots[slot.getAttribute(SLOT_ATTR)] ??= slot;
  return slots;
}
