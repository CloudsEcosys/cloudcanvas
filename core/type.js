/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Types: a potential blit backed by a `<template>`.
 *
 * A type is the one place markup enters the core: author HTML parsed once into
 * a `<template data-type="name">`, cloned into every instance. `fill` lands as
 * text in the clone's `[data-slot]`s and children in its `[data-scope]`, so
 * nothing built from spec data ever becomes markup.
 *
 * Nothing is silently replaced: redefining a name with other markup throws
 * (the `TraitRegistry.register` rule), the same markup returns the same
 * template. A `<template data-type>` in the document is found on first use.
 */

/** The attribute a template declares its type name in. */
export const TYPE_ATTR = 'data-type';

/** @type {Map<string, HTMLTemplateElement>} name -> the registered template */
const TYPES = /* @__PURE__ */ new Map();

/**
 * Register a type, or (without a definition) find one.
 * @param {string} name
 * @param {{html?: string}} [definition]
 * @returns {HTMLTemplateElement|null} null when looking up an unknown name
 * @throws {TypeError} on a bad name, or on redefining a name with other markup
 */
export function defineType(name, definition = null) {
  if (typeof name !== 'string' || name.length === 0) {
    throw new TypeError('type: name must be a non-empty string');
  }

  const existing = findType(name);
  if (!definition) return existing;

  const template = document.createElement('template');
  template.innerHTML = typeof definition.html === 'string' ? definition.html : '';

  // Compared parsed to parsed, so serialisation quirks never read as a change.
  if (existing) {
    if (existing.innerHTML !== template.innerHTML) {
      throw new TypeError(`type: "${name}" is already defined with different markup`);
    }
    return existing;
  }

  template.setAttribute(TYPE_ATTR, name);
  TYPES.set(name, template);
  return template;
}

/** The registered template, or one the document declares, or null. */
export function findType(name) {
  const registered = TYPES.get(name);
  if (registered) return registered;
  if (typeof document === 'undefined') return null;

  const declared = document.querySelector(`template[${TYPE_ATTR}="${cssEscape(name)}"]`);
  if (declared) TYPES.set(name, declared);
  return declared || null;
}

/** Whether an element is a template, and so a potential blit. */
export function isTemplate(element) {
  return element.tagName === 'TEMPLATE' && Boolean(element.content);
}

/** A fresh `<div>` holding a clone of the type's content (`template` null: empty). */
export function instantiate(template) {
  const element = document.createElement('div');
  if (template) element.appendChild(template.content.cloneNode(true));
  return element;
}

/** A type name as it may appear inside an attribute selector. */
function cssEscape(name) {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') return CSS.escape(name);
  return name.replace(/["\\]/g, '\\$&');
}
