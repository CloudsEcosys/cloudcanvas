/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Types: a potential blit backed by a `<template data-type="name">`, cloned into
 * every instance. `fill` lands as text in `[data-slot]`s; only a slot the
 * template itself marks `data-slot-html` takes markup, so spec data never can.
 * A name is never silently replaced: other markup under it throws.
 */

/** The attribute a template declares its type name in. */
export const TYPE_ATTR = 'data-type';

/** @type {Map<string, HTMLTemplateElement>} name -> the registered template */
const TYPES = /* @__PURE__ */ new Map();

/** @type {Map<string, Function[]>} name -> the traits every instance runs (`with`) */
const TRAITS = /* @__PURE__ */ new Map();

/**
 * Register a type from `{html}` or `{template}` (plus `with` traits), or (without a definition) find one.
 * @returns {HTMLTemplateElement|null} null when looking up an unknown name
 * @throws {TypeError} on a bad name or `with`, or on redefining a name with other markup
 */
export function defineType(name, definition = null) {
  if (typeof name !== 'string' || !name) throw new TypeError('type: name must be a non-empty string');
  const existing = findType(name);
  if (!definition) return existing;

  const traits = definition.with;
  if (traits !== undefined && !(Array.isArray(traits) && traits.every((fn) => typeof fn === 'function'))) {
    throw new TypeError('type: with must be an array of functions');
  }
  const template = templateOf(definition);

  // Compared parsed to parsed, so serialisation quirks never read as a change.
  if (existing && existing !== template && existing.innerHTML !== template.innerHTML) {
    throw new TypeError(`type: "${name}" is already defined with different markup`);
  }
  if (traits) TRAITS.set(name, traits);
  if (existing) return existing;

  template.setAttribute(TYPE_ATTR, name);
  TYPES.set(name, template);
  return template;
}

/** A definition's template: the one it hands over, or one parsed from its `html`. */
function templateOf({ html, template }) {
  if (template !== undefined) {
    if (!template || !isTemplate(template)) throw new TypeError('type: template must be a <template>');
    return template;
  }
  const parsed = document.createElement('template');
  parsed.innerHTML = typeof html === 'string' ? html : '';
  return parsed;
}

/** The registered template, or one the document declares, or null. */
export function findType(name) {
  const registered = TYPES.get(name);
  if (registered) return registered;
  if (typeof document === 'undefined') return null;

  // Compared, not interpolated into a selector: a name is any string.
  const declared = Array.from(document.querySelectorAll(`template[${TYPE_ATTR}]`))
    .find((template) => template.getAttribute(TYPE_ATTR) === name);
  if (declared) TYPES.set(name, declared);
  return declared || null;
}

/** The `with` traits a type gives every instance, by the instance's `data-type`. */
export function typeTraits(name) {
  return (name && TRAITS.get(name)) || [];
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
