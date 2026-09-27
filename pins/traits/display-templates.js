/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * DisplayTrait templates: per-display-type DOM construction and mutation.
 *
 * Each template is a `{ build, update }` pair:
 *   - `build(pin, contentEl)` clones the display type's `<template>` (a core type,
 *     `../../addons/types.js`) into the content element exactly once and returns
 *     the live node references ("bindings") the update pass writes through.
 *   - `update(pin, contents, bindings, cache)` mutates text nodes and attributes
 *     only. Nothing is re-created, so node identity is stable across every frame.
 *
 * Text always travels through `Text.data`, which the DOM escapes for us - that is
 * the whole XSS story for titles, bodies, authors, captions and labels. The single
 * markup opt-in is the `html` content key, which a caller sets deliberately.
 *
 * SVG-backed slots are the one place `innerHTML` is still used (the primitives are
 * string generators). Each slot re-renders only when its own inputs changed, which
 * `cache` records.
 *
 * Non-text values crossing that markup boundary are validated, not escaped: colors
 * through `safeColor` (a color that is not a color would otherwise close its own
 * attribute) and media `src` through `safeUrl` (`setAttribute` blocks injection but
 * not a `javascript:` navigation). Validating here also keeps the slot cache
 * signatures keyed on what actually gets rendered.
 *
 * Templates carry no inline styles. Every class in `CLS` is styled by
 * `CANVAS_DEFAULT_CSS`, so the built-in look is themable and overridable by one
 * class rule - an inline style is neither.
 */

import {
  createVectorPointerSVG,
  createGradientMeterSVG,
  createBadgeSVG,
  createPlaceholderDataURI,
  safeColor,
  safeUrl
} from '../../graphics/primitives/primitives.js';
import { CLS, mountType, registerDisplayTypes } from '../../addons/types.js';
/**
 * The DOM writes live in `./template-kit.js`, which is the public half of this
 * module: the built-in templates and a consumer's own template mutate the DOM
 * through exactly the same four functions.
 */
import {
  makeTextNode,
  setAttr,
  setSlot,
  setText,
  setVisible
} from './template-kit.js';

/**
 * The class table and the markup now live with the display types themselves
 * (`../../addons/types.js`); re-exported so `CLS` keeps its public import path.
 */
export { CLS };

/** The one content key rendered as markup instead of text. */
export const HTML_KEY = 'html';

/**
 * The display type that renders nothing at all.
 *
 * Named here rather than spelled as a literal at its three call sites (the
 * template table, the registry definition, and `../../engine/hydrate.js`)
 * because it is the contract between them.
 */
export const PRESERVE_TYPE = 'preserve';

/** Display types where an `html` content key overrides the template. */
const HTML_OVERRIDABLE = new Set(['card', 'raw']);

const ACCENT = '#38bdf8';
const MEDIA_BADGE_COLOR = '#eab308';
const METER_MIN = 0;
const METER_MAX = 100;
const NEEDLE_SIZE = 36;

/* ------------------ DOM HELPERS ------------------ */

/** Normalise the `badge` content value, which is either a string or `{ text, color }`. */
function readBadge(value, fallbackColor) {
  if (value === undefined || value === null) return { text: '', color: fallbackColor };
  if (typeof value === 'object') {
    return {
      text: value.text === undefined || value.text === null ? '' : String(value.text),
      color: safeColor(value.color, fallbackColor)
    };
  }
  return { text: String(value), color: fallbackColor };
}

function updateBadgeSlot(slot, text, color, cache) {
  setSlot(slot, text ? createBadgeSVG(text, color) : '', cache, 'badge', `${text}|${color}`);
  setVisible(slot, Boolean(text));
}

/**
 * Render through a display type: its template cloned into the content element,
 * the header's title text node and badge slot bound. @returns the slots too
 */
function mountDisplay(name, contentEl) {
  registerDisplayTypes();
  const slots = mountType(name, contentEl);
  return { slots, titleText: makeTextNode(slots.title), badgeSlot: slots.badge };
}

/* ------------------ RAW / HTML OVERRIDE ------------------ */

/**
 * Markup mode: the content element itself is the innerHTML target - it plays the
 * `raw` type's single `data-slot-html` slot, so a raw Pin gains no wrapper element.
 * Used by `raw` and by any type whose contents carry the `html` override key.
 */
function buildHtml(pin, contentEl) {
  contentEl.replaceChildren();
  return { mode: 'html', htmlTarget: contentEl };
}

function updateHtml(pin, contents, bindings, cache) {
  const value = contents.get(HTML_KEY);
  const markup = value === undefined || value === null ? '' : String(value);
  if (cache.html === markup) return;
  cache.html = markup;
  bindings.htmlTarget.innerHTML = markup;
}

/* ------------------ CARD ------------------ */

function buildCard(pin, contentEl) {
  const { slots, titleText, badgeSlot } = mountDisplay('card', contentEl);
  return {
    mode: 'card',
    titleText,
    badgeSlot,
    body: slots.body,
    bodyText: makeTextNode(slots.body),
    footer: contentEl.querySelector(`.${CLS.FOOTER}`),
    authorText: makeTextNode(slots.author),
    actionButton: slots.action,
    actionText: makeTextNode(slots.action)
  };
}

function updateCard(pin, contents, bindings, cache) {
  setText(bindings.titleText, contents.get('title') || 'Pin');

  const badge = readBadge(contents.get('badge'), ACCENT);
  updateBadgeSlot(bindings.badgeSlot, badge.text, badge.color, cache);

  const body = contents.get('body') || '';
  setText(bindings.bodyText, body);
  setVisible(bindings.body, body !== '');

  const author = contents.get('author') || '';
  setText(bindings.authorText, author);

  const action = contents.get('actionText') || '';
  setText(bindings.actionText, action);
  setAttr(bindings.actionButton, 'data-action', action, cache, 'action');
  setVisible(bindings.actionButton, action !== '');
  setVisible(bindings.footer, author !== '' || action !== '');
}

/* ------------------ VECTOR POINTER ------------------ */

function buildVectorPointer(pin, contentEl) {
  const { slots, titleText, badgeSlot } = mountDisplay('vector-pointer', contentEl);
  return {
    mode: 'vector-pointer',
    titleText,
    badgeSlot,
    needleSlot: slots.needle,
    labelText: makeTextNode(slots.label),
    meterSlot: slots.meter
  };
}

function updateVectorPointer(pin, contents, bindings, cache) {
  const angle = contents.has('angle') ? Number(contents.get('angle')) : pin.particle.getPrimaryVector();
  const magnitude = contents.has('magnitude') ? Number(contents.get('magnitude')) : pin.magnitude;
  const color = safeColor(contents.get('color'), ACCENT);

  setText(bindings.titleText, contents.get('title') || 'Vector Pointer');
  updateBadgeSlot(bindings.badgeSlot, `${angle.toFixed(0)}°`, color, cache);

  setSlot(
    bindings.needleSlot,
    createVectorPointerSVG(angle, { color, size: NEEDLE_SIZE }),
    cache,
    'needle',
    `${angle}|${color}`
  );

  setText(bindings.labelText, contents.get('label') || `Mag: ${magnitude.toFixed(1)}`);

  setSlot(
    bindings.meterSlot,
    createGradientMeterSVG(magnitude, METER_MIN, METER_MAX, { color }),
    cache,
    'meter',
    `${magnitude}|${color}`
  );
}

/* ------------------ MEDIA ------------------ */

function buildMedia(pin, contentEl) {
  const { slots, titleText, badgeSlot } = mountDisplay('media', contentEl);
  const image = contentEl.querySelector(`.${CLS.MEDIA}`);
  const caption = slots.caption;
  return { mode: 'media', titleText, badgeSlot, image, caption, captionText: makeTextNode(caption) };
}

function updateMedia(pin, contents, bindings, cache) {
  setText(bindings.titleText, contents.get('title') || 'Media');

  const badge = readBadge(contents.get('badge') || 'AVIF', MEDIA_BADGE_COLOR);
  updateBadgeSlot(bindings.badgeSlot, badge.text, badge.color, cache);

  setAttr(bindings.image, 'src', safeUrl(contents.get('src'), createPlaceholderDataURI()), cache, 'src');
  setAttr(bindings.image, 'alt', contents.get('alt') || 'Media Primitive', cache, 'alt');

  const caption = contents.get('caption') || '';
  setText(bindings.captionText, caption);
  setVisible(bindings.caption, caption !== '');
}

/* ------------------ PRESERVE ------------------ */

/**
 * Preserve mode: the markup already in the element *is* the content.
 *
 * The one template that neither builds nor mutates. It exists for DOM the
 * framework did not author - server-rendered or hand-written markup handed over
 * by `adopt` / `hydrate` (`../../engine/hydrate.js`). By the time a display
 * template runs, `buildElementStructure` has already relocated that markup into
 * the content node, and it is the finished article: every other `build` opens
 * with a `replaceChildren`, which here would delete precisely what was adopted.
 *
 * `update` is a no-op for the whole life of the Pin, not just the first frame.
 * Contents written onto a preserve Pin are data for its traits and its
 * consumers, never a render instruction - so `setContent` cannot wipe adopted
 * markup. Asking for the markup to be replaced is `setDisplayTrait`, which rebuilds
 * under the new type's signature; that is the existing contract, not a case
 * this template has to know about.
 */
function buildPreserve() {
  return { mode: PRESERVE_TYPE };
}

function updatePreserve() {}

/* ------------------ TEMPLATE TABLE ------------------ */

/** @type {Record<string, { build: Function, update: Function }>} */
export const DISPLAY_TEMPLATES = {
  card: { build: buildCard, update: updateCard },
  'vector-pointer': { build: buildVectorPointer, update: updateVectorPointer },
  media: { build: buildMedia, update: updateMedia },
  raw: { build: buildHtml, update: updateHtml },
  [PRESERVE_TYPE]: { build: buildPreserve, update: updatePreserve }
};

export const HTML_TEMPLATE = { build: buildHtml, update: updateHtml };

/** Fallback for an unregistered display type: a card renders anything. */
export const DEFAULT_TEMPLATE = DISPLAY_TEMPLATES.card;

/**
 * Whether `contents` should be rendered through the markup override for `displayType`.
 * `raw` is markup by definition; `card` opts in per Pin by carrying an `html` key.
 */
export function usesHtmlOverride(displayType, contents) {
  if (displayType === 'raw') return true;
  return HTML_OVERRIDABLE.has(displayType) && contents.has(HTML_KEY);
}
