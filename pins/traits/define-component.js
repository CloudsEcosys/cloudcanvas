/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * `defineComponent`: the one-call path from a `{ build, update }` template to a
 * registered, instantiable Pin type.
 *
 * A component is not a new kind of object. It is a `DisplayTrait` carrying a
 * caller-supplied template pair, which is exactly what the built-in card, media
 * and vector-pointer types are - so a component inherits the whole contract for
 * free: build-once/mutate-after rendering, stable node identity, `allowedKeys`
 * validation on `setContents`, and a registry name a Pin can be created by.
 *
 * The alternative - a hand-written `PinTrait` subclass per component, which is
 * what `src/components/*.js` still does - re-derives that contract every time,
 * and every re-derivation is where `innerHTML` churn and lost node identity get
 * back in. This module exists so a component author writes the two functions
 * that are actually theirs and nothing else.
 *
 * The registry is injectable (`registry`) rather than assumed: a consumer with
 * their own `TraitRegistry`, and every test that must not leak a name into the
 * shared singleton, needs the same call to target theirs.
 *
 * A shim over the core type: `defineComponent({name, template?, build, update})`
 * is `type(name, {template})` (markup-free when it declares none) plus the
 * build/update pair. Every build first clones the type into the content element
 * (`mountType`), then runs the component's `build` over the clone - the one path
 * the built-in display types and `definePrototype` render through too. The type
 * is registered on the first build, so defining a component needs no document.
 */

import { defineType } from '../../core/type.js';
import { mountType } from '../../addons/types.js';
import { DisplayTrait } from './display.js';
import { traitRegistry } from './registry.js';

/**
 * @typedef {object} ComponentSpec
 * @property {string} name registry name, and the trait's own name
 * @property {(pin: Pin, contentEl: Element) => object} build constructs the
 *   subtree once and returns the live node references the update pass writes
 * @property {(pin: Pin, contents: Map<string, *>, bindings: object, cache: object) => void} update
 *   mutates those nodes; runs on every render
 * @property {object} [defaults] options every instance starts from (a caller's
 *   own options win over these)
 * @property {string[]|Set<string>} [allowedKeys] content keys this component
 *   accepts; `setContents` rejects anything else
 * @property {boolean} [chrome] whether the Pin's default chrome is built around
 *   the content element (`false` = the component owns the whole Pin)
 * @property {TraitRegistry} [registry] registry to define into; defaults to the
 *   shared singleton
 * @property {HTMLTemplateElement|(() => HTMLTemplateElement)} [template] the
 *   component's static structure, registered as its core type and cloned into
 *   the content element before `build` binds it (none: an empty type)
 */

/**
 * @typedef {object} ComponentHandle
 * @property {string} name the registered name
 * @property {(options?: object) => DisplayTrait} createTrait a fresh trait
 *   instance, defaults applied, caller options on top
 */

/**
 * Register a display component and return its handle.
 *
 * @param {ComponentSpec} spec
 * @returns {ComponentHandle}
 * @throws {TypeError} on a missing name or an incomplete template pair
 * @throws {Error} when the name is already registered (the registry refuses to
 *   silently replace a definition other code depends on)
 */
export function defineComponent(spec = {}) {
  const { name, build, update } = spec;

  if (typeof name !== 'string' || name.length === 0) {
    throw new TypeError('defineComponent: name must be a non-empty string');
  }
  if (typeof build !== 'function' || typeof update !== 'function') {
    throw new TypeError(`defineComponent: "${name}" requires both build() and update()`);
  }

  const registry = spec.registry || traitRegistry;
  const typed = { ...spec, build: typedBuild(spec) };
  registry.register(name, DisplayTrait, traitDefaults(typed));

  return Object.freeze({
    name,
    createTrait: (options = {}) => registry.create(name, { ...options, ...identity(typed) })
  });
}

/**
 * The component's `build`, run over its core type: registered on first use
 * (a name taken with other markup throws), cloned into `contentEl` every build.
 */
function typedBuild({ name, template, build }) {
  let registered = null;
  return (pin, contentEl) => {
    registered ??= defineType(name, typeDefinition(template));
    mountType(registered, contentEl);
    return build(pin, contentEl);
  };
}

/** The core type definition for a component's `template` (an element, a lazy getter, or none). */
function typeDefinition(template) {
  const resolved = typeof template === 'function' ? template() : template;
  return resolved ? { template: resolved } : { html: '' };
}

/**
 * What a caller may not swap out at construction time.
 *
 * Registered defaults are ordinarily caller-overridable, and for tone, colour or
 * capabilities that is exactly right. The name and the template pair are not
 * options, they are what the component *is*: `DisplayTrait` keys its rebuild
 * signature on the trait name, so two different templates sharing one name would
 * make a swap between them invisible - the subtree would never be rebuilt.
 */
function identity(spec) {
  return { name: spec.name, build: spec.build, update: spec.update };
}

/**
 * The registered default options.
 *
 * Identity (`name`, `displayType`) and the template pair are merged *over* the
 * caller's `defaults`, because they are what makes this definition the component
 * it is: a `defaults.build` that outranked the spec's would define a different
 * component under the same name. Everything else in `defaults` is a starting
 * value a caller may override at `createTrait` time, which is `mergeOptions`'
 * existing rule.
 */
function traitDefaults(spec) {
  const defaults = {
    ...(spec.defaults || {}),
    name: spec.name,
    displayType: (spec.defaults && spec.defaults.displayType) || spec.name,
    build: spec.build,
    update: spec.update
  };

  if (spec.allowedKeys !== undefined) defaults.allowedKeys = spec.allowedKeys;
  if (spec.chrome !== undefined) defaults.chrome = spec.chrome;

  return defaults;
}
