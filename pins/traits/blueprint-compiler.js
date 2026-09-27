/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Blueprint Compiler: a declarative tuple tree compiled ONCE into a
 * `<template>` (the core type `definePrototype` registers, `./prototype.js`)
 * plus a fixed table of binding descriptors.
 *
 * Every instance is a clone of that template; `bind` walks the clone to the
 * binding nodes by the child-index paths recorded at compile time and wires
 * the `on` handlers. The descriptor table is built by the one compile and
 * never again, so its length is the blueprint's binding count however many
 * instances exist (it grew by the binding count on every build before).
 *
 * Markup hardening: an `on*` attribute name is refused at compile time (events
 * go through `on`), and a bound URL attribute is written through `safeUrl`.
 */
import { safeUrl } from '../../graphics/primitives/primitives.js';

/** Attributes whose bound value is navigated or fetched, so it must pass `safeUrl`. */
const URL_ATTRIBUTES = new Set(['href', 'src', 'action', 'formaction', 'poster', 'xlink:href']);

/**
 * Compile a blueprint.
 *
 * Blueprint node format: `[tagAndClass, propsOrChild, ...restChildren]`, e.g.
 *   ['div.root', ['span.title', { text: '$title' }], ['button.btn', { on: { click: 'increment' } }, '+']]
 *
 * @param {Array} blueprint root blueprint tuple or array of tuples
 * @param {string} componentName namespace prefix for CSS classes
 * @param {Record<string, Function>} actions map of action names to handler functions
 * @returns {{ templateFactory: (pin: Pin) => { root: Element, bindings: Node[] }, bindingDescriptors: object[],
 *   template: () => HTMLTemplateElement, bind: (root: Element, pin: Pin) => Node[] }}
 */
export function compileBlueprint(blueprint, componentName, actions = {}) {
  const rootSpecs = Array.isArray(blueprint[0]) && typeof blueprint[0][0] === 'string' ? blueprint : [blueprint];
  const bindingDescriptors = [];
  const plan = { name: componentName, descriptors: bindingDescriptors, paths: [], handlers: [] };
  let compiled = null;

  // Built on first use, not at definition: a module may define a prototype where no document exists yet.
  const template = () => (compiled ??= buildTemplate(rootSpecs, plan));
  const bind = (root, pin) => bindClone(root, plan, actions, pin);
  const templateFactory = (pin) => {
    const root = template().content.firstChild.cloneNode(true);
    return { root, bindings: bind(root, pin) };
  };
  return { templateFactory, bindingDescriptors, template, bind };
}

/** The one compile: the root (or a container of roots) inside a fresh `<template>`. */
function buildTemplate(rootSpecs, plan) {
  let root;
  if (rootSpecs.length === 1) {
    root = buildNode(rootSpecs[0], [], plan);
  } else {
    root = document.createElement('div');
    root.classList.add(`${plan.name}-container`);
    for (const spec of rootSpecs) appendChild(root, spec, [], plan);
  }
  const template = document.createElement('template');
  template.content.appendChild(root);
  return template;
}

/** Record a binding at `path`; the descriptor's index is its node's place in the bindings list. */
function addBinding(plan, path, descriptor) {
  plan.descriptors.push({ ...descriptor, index: plan.paths.length });
  plan.paths.push(path);
}

/** A bound (`$key`) value's key, or null for a static one. */
function boundKey(value) {
  return typeof value === 'string' && value.startsWith('$') ? value.slice(1) : null;
}

/** Append one child spec: a nested tuple, a `$key` text binding, or static text. */
function appendChild(parent, child, parentPath, plan) {
  const path = [...parentPath, parent.childNodes.length];
  if (Array.isArray(child)) {
    parent.appendChild(buildNode(child, path, plan));
    return;
  }
  if (typeof child !== 'string') return;
  const key = boundKey(child);
  parent.appendChild(document.createTextNode(key === null ? child : ''));
  if (key !== null) addBinding(plan, path, { type: 'text', key });
}

/** One element from its tuple, in the original order: classes, attrs, text, class, style, value, on, children. */
function buildNode(spec, path, plan) {
  if (typeof spec === 'string') return document.createTextNode(spec);
  if (!Array.isArray(spec) || spec.length === 0) {
    throw new TypeError(`compileBlueprint: invalid node spec "${JSON.stringify(spec)}"`);
  }

  const [tagAndClass, propsOrChild, ...restChildren] = spec;
  const [tag, ...classNames] = (tagAndClass || 'div').split('.');
  const element = document.createElement(tag || 'div');
  for (const className of classNames) element.classList.add(`${plan.name}-${className}`);

  const hasProps = propsOrChild && typeof propsOrChild === 'object' && !Array.isArray(propsOrChild);
  const props = hasProps ? propsOrChild : {};
  const children = hasProps ? restChildren : (propsOrChild === undefined ? [] : [propsOrChild, ...restChildren]);

  compileAttributes(element, props.attrs, path, plan);
  if (props.text !== undefined) appendChild(element, String(props.text), path, plan);
  const classKey = boundKey(props.class);
  if (classKey !== null) {
    addBinding(plan, path, { type: 'class', key: classKey, baseClass: `${plan.name}-${classNames[0] || 'elem'}` });
  }
  compileStyles(element, props.style, path, plan);
  const valueKey = boundKey(props.value);
  if (valueKey !== null) addBinding(plan, path, { type: 'value', key: valueKey });
  for (const [eventName, actionName] of Object.entries(typeof props.on === 'object' ? props.on || {} : {})) {
    plan.handlers.push({ path, eventName, actionName });
  }
  for (const child of children) appendChild(element, child, path, plan);
  return element;
}

/** Static attributes set on the template, bound ones recorded; an `on*` name is refused. */
function compileAttributes(element, attrs, path, plan) {
  for (const [name, value] of Object.entries(attrs || {})) {
    if (/^on/i.test(name)) {
      throw new TypeError(`compileBlueprint: "${name}" is an event attribute; use the on prop`);
    }
    const key = boundKey(value);
    if (key === null) element.setAttribute(name, String(value));
    else addBinding(plan, path, { type: 'attr', attrName: name, key, url: URL_ATTRIBUTES.has(name.toLowerCase()) });
  }
}

/** Static style properties set on the template, bound ones recorded. */
function compileStyles(element, style, path, plan) {
  if (!style || typeof style !== 'object') return;
  for (const [propName, value] of Object.entries(style)) {
    const key = boundKey(value);
    if (key === null) element.style.setProperty(propName, String(value));
    else addBinding(plan, path, { type: 'style', propName, key });
  }
}

/** The node at a child-index path under `root`. */
function nodeAt(root, path) {
  let node = root;
  for (const index of path) node = node.childNodes[index];
  return node;
}

/** A clone's binding nodes, in descriptor-index order, with its `on` handlers wired. */
function bindClone(root, plan, actions, pin) {
  for (const { path, eventName, actionName } of plan.handlers) {
    nodeAt(root, path).addEventListener(eventName, (event) => {
      event.stopPropagation();
      const fn = actions[actionName] || (pin ? pin[actionName] : null);
      if (typeof fn === 'function') fn(pin, event);
    });
  }
  return plan.paths.map((path) => nodeAt(root, path));
}

/** Write one text binding: `Text.data`, escaped by the DOM. */
function writeText(node, value) {
  const text = value === undefined || value === null ? '' : String(value);
  if (node.data !== text) node.data = text;
}

/** Swap a `base-value` modifier class. */
function writeClass(node, value, descriptor, cache) {
  const className = value ? `${descriptor.baseClass}-${value}` : '';
  const previous = cache.get(descriptor.index);
  if (previous === className) return;
  if (previous) node.classList.remove(previous);
  if (className) node.classList.add(className);
  cache.set(descriptor.index, className);
}

/** Set or remove an attribute; a URL attribute's value passes `safeUrl` (a `javascript:` URL is dropped). */
function writeAttribute(node, value, descriptor, cache) {
  if (cache.get(descriptor.index) === value) return;
  cache.set(descriptor.index, value);
  const text = value === false || value === null || value === undefined ? null : String(value);
  const safe = descriptor.url && text !== null ? safeUrl(text, null) : text;
  if (safe === null) node.removeAttribute(descriptor.attrName);
  else node.setAttribute(descriptor.attrName, safe);
}

function writeStyle(node, value, descriptor, cache) {
  if (cache.get(descriptor.index) === value) return;
  node.style.setProperty(descriptor.propName, String(value ?? ''));
  cache.set(descriptor.index, value);
}

function writeValue(node, value) {
  const text = String(value ?? '');
  if (node.value !== text) node.value = text;
}

/** Binding type -> its diff-first write. */
const BINDING_WRITERS = /* @__PURE__ */ Object.freeze({
  text: writeText,
  class: writeClass,
  attr: writeAttribute,
  style: writeStyle,
  value: writeValue
});

/**
 * Write every binding from `valueOf(key)`; each write is skipped when unchanged.
 * @param {object[]} descriptors the compiled table
 * @param {Node[]} bindings the instance's nodes, by descriptor index
 * @param {Map} cache per-instance last-written values
 * @param {(key: string) => *} valueOf
 */
export function writeBindings(descriptors, bindings, cache, valueOf) {
  for (const descriptor of descriptors) {
    const node = bindings[descriptor.index];
    if (node) BINDING_WRITERS[descriptor.type](node, valueOf(descriptor.key), descriptor, cache);
  }
}
