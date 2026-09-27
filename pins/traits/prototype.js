/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Prototype System: a typed schema, a compiled blueprint, scoped styles, reactive
 * `pin.state` and default traits in one declarative spec.
 *
 * A shim over the core type: `definePrototype({name, blueprint})` is
 * `type(name, {template})` with the blueprint compiled once into that template
 * (`./blueprint-compiler.js`), rendered through `defineComponent`'s typed build -
 * every instance a clone of it, bound by the compiled descriptor table.
 */

import { defineComponent } from './define-component.js';
import { PinEvent } from './base.js';
import { rotatePin } from './interaction.js';
import { compileBlueprint, writeBindings } from './blueprint-compiler.js';

const INJECTED_STYLES = new Set();

/** A schema rule's default: its own, else the empty value of its type. */
function ruleDefault(rule) {
  if (rule.default !== undefined) return rule.default;
  if (rule.type === 'number') return 0;
  return rule.type === 'boolean' ? false : '';
}

/**
 * Coerce a value according to schema rule.
 */
function coerceValue(rule, val, key, componentName) {
  if (val === undefined || val === null) return ruleDefault(rule);

  const type = rule.type || 'text';

  if (type === 'number') {
    const n = Number(val);
    if (!Number.isFinite(n)) {
      throw new TypeError(`[${componentName}] Property "${key}" must be a finite number, received "${val}"`);
    }
    if (rule.min !== undefined && n < rule.min) return rule.min;
    if (rule.max !== undefined && n > rule.max) return rule.max;
    return n;
  }

  if (type === 'boolean' || type === 'bool') {
    return Boolean(val);
  }

  if (type === 'enum') {
    const str = String(val);
    if (Array.isArray(rule.values) && !rule.values.includes(str)) {
      return rule.default !== undefined ? rule.default : rule.values[0];
    }
    return str;
  }

  if (type === 'object' && typeof val === 'object') {
    return val;
  }

  if ((type === 'array' || type === 'list') && Array.isArray(val)) {
    return val;
  }

  return String(val);
}

/**
 * Create a dynamic reactive Proxy over `pin.contents` enforcing schema types.
 */
export function createReactiveState(pin, schema, defaults, componentName) {
  return new Proxy({}, {
    get(_, prop) {
      if (typeof prop !== 'string') return undefined;
      const rule = schema[prop];
      if (!rule) {
        return pin.contents.get(prop);
      }
      const val = pin.contents.get(prop);
      return val !== undefined ? val : (defaults[prop] !== undefined ? defaults[prop] : undefined);
    },

    set(_, prop, value) {
      if (typeof prop !== 'string') return false;
      const rule = schema[prop];
      if (!rule) {
        throw new Error(`[${componentName}] Cannot set undeclared property "${prop}" on prototype with rigid schema`);
      }
      const coerced = coerceValue(rule, value, prop, componentName);
      if (pin.contents.get(prop) === coerced) return true;
      pin.setContent(prop, coerced);
      return true;
    },

    has(_, prop) {
      return (prop in schema) || pin.contents.has(prop);
    },

    ownKeys(_) {
      return Array.from(new Set([...Object.keys(schema), ...pin.contents.keys()]));
    },

    getOwnPropertyDescriptor(_, prop) {
      return {
        enumerable: true,
        configurable: true,
        writable: true,
        value: this.get(_, prop)
      };
    }
  });
}

/**
 * Automatically inject tokenized styles for a prototype once.
 */
function injectPrototypeStyles(name, styles) {
  if (typeof document === 'undefined' || !styles) return;
  const styleId = `cc-proto-${name}`;
  if (INJECTED_STYLES.has(styleId) || document.getElementById(styleId)) {
    INJECTED_STYLES.add(styleId);
    return;
  }

  let cssText = '';
  if (typeof styles === 'string') {
    cssText = styles;
  } else if (typeof styles === 'object') {
    cssText = Object.entries(styles)
      .map(([part, rules]) => `.${name}-${part} { ${rules} }`)
      .join('\n');
  }

  if (cssText.trim()) {
    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.dataset.ccPrototype = name;
    styleEl.textContent = cssText;
    document.head.appendChild(styleEl);
    INJECTED_STYLES.add(styleId);
  }
}

/**
 * The typed build: the type's clone is already in `contentEl`; bind it, then give
 * the Pin its reactive state, actions and the `emit` / `rotate` helpers.
 */
function bindInstance(pin, contentEl, { compiled, schema, defaults, actions, name }) {
  const bindings = compiled.bind(contentEl.firstChild, pin);
  if (!pin.state) pin.state = createReactiveState(pin, schema, defaults, name);
  for (const [actionName, fn] of Object.entries(actions)) {
    pin[actionName] = (...args) => fn(pin, ...args);
  }
  if (!pin.emit) {
    pin.emit = (type, payload) => pin.transmit(new PinEvent(type, { payload, source: pin, bubbles: true }));
  }
  if (!pin.rotate) pin.rotate = (deltaDeg) => rotatePin(pin, deltaDeg);
  return { bindings, cache: new Map() };
}

/**
 * Define a type-safe, declarative Prototype for CloudCanvas.
 *
 * @param {object} spec
 * @param {string} spec.name unique prototype/trait name
 * @param {Record<string, object>} [spec.schema] property definitions with types, defaults, and constraints
 * @param {string|Record<string, string>} [spec.styles] CSS rules or tokenized style map
 * @param {Array} spec.blueprint declarative structural tuple tree
 * @param {Record<string, Function>} [spec.actions] scriptable methods bound to pin instance
 * @param {string[]} [spec.traits] default attachable traits
 * @param {boolean} [spec.chrome] whether default card chrome is worn (default true)
 * @returns {object} PrototypeHandle
 */
export function definePrototype(spec = {}) {
  const { name, schema = {}, styles = null, blueprint, actions = {}, traits = ['draggable', 'selectable'] } = spec;
  const { chrome = true } = spec;

  if (typeof name !== 'string' || name.length === 0) {
    throw new TypeError('definePrototype: name must be a non-empty string');
  }
  if (!blueprint || !Array.isArray(blueprint)) {
    throw new TypeError(`definePrototype: "${name}" requires a valid blueprint array`);
  }

  // 1. Build schema defaults & allowedKeys
  const allowedKeys = Object.keys(schema);
  const defaults = {};
  for (const [k, rule] of Object.entries(schema)) defaults[k] = ruleDefault(rule);

  // 2. Inject scoped styles
  injectPrototypeStyles(name, styles);

  // 3. Compile the blueprint once; its template is the core type this prototype registers
  const compiled = compileBlueprint(blueprint, name, actions);

  // 4. Register with CloudCanvas DisplayTrait, rendering through that type
  const handle = defineComponent({
    name,
    chrome,
    allowedKeys: allowedKeys.length > 0 ? allowedKeys : undefined,
    template: compiled.template,
    build: (pin, contentEl) => bindInstance(pin, contentEl, { compiled, schema, defaults, actions, name }),
    update(pin, contents, state) {
      if (!state || !state.bindings) return;
      const valueOf = (key) => (contents.get(key) !== undefined ? contents.get(key) : defaults[key]);
      writeBindings(compiled.bindingDescriptors, state.bindings, state.cache, valueOf);
    }
  });

  // 5. Prototype Object with Factory & Extension
  const resolved = { name, schema, styles, blueprint, actions, traits, chrome, defaults };
  return {
    name,
    handle,
    schema: Object.freeze({ ...schema }),
    defaults: Object.freeze({ ...defaults }),
    create: (session, options = {}) => createPrototypePin(session, options, resolved),
    extend: (childSpec = {}) => extendPrototype(spec, resolved, childSpec)
  };
}

/** A Pin of the prototype: its defaults under the caller's state, and every default trait it lacks. */
function createPrototypePin(session, options, { name, chrome, defaults, traits }) {
  const initialContents = { ...defaults, ...(options.state || options.contents || {}) };
  const pin = session.createPin({ chrome, ...options, type: name, contents: initialContents });
  for (const trait of traits) {
    if (!pin.traits.has(trait)) pin.addTrait(trait);
  }
  return pin;
}

/** A child prototype: schema, styles, actions and traits merged over the parent's. */
function extendPrototype(spec, parent, childSpec) {
  const { name, schema, styles, blueprint, actions, traits, chrome } = parent;
  const mergedStyles = childSpec.styles
    ? (typeof styles === 'object' && typeof childSpec.styles === 'object'
        ? { ...styles, ...childSpec.styles }
        : `${styles || ''}\n${childSpec.styles}`)
    : styles;

  return definePrototype({
    ...spec,
    ...childSpec,
    name: childSpec.name || `${name}-extended`,
    schema: { ...schema, ...(childSpec.schema || {}) },
    styles: mergedStyles,
    blueprint: childSpec.blueprint || blueprint,
    actions: { ...actions, ...(childSpec.actions || {}) },
    traits: Array.from(new Set([...traits, ...(childSpec.traits || [])])),
    chrome: childSpec.chrome !== undefined ? childSpec.chrome : chrome
  });
}
