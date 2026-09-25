/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Prototype System:
 * High-level, type-safe, declarative component system for CloudCanvas Pins.
 *
 * Couples a rigid typed schema, zero-allocation compiled blueprint, scoped styling,
 * dynamic reactive runtime state (`pin.state`), and trait composition into a single,
 * cohesive prototype specification without imperative DOM plumbing.
 */

import { defineComponent } from './define-component.js';
import { PinEvent } from './base.js';
import { rotatePin } from './interaction.js';
import { compileBlueprint } from './blueprint-compiler.js';

const INJECTED_STYLES = new Set();

/**
 * Coerce a value according to schema rule.
 */
function coerceValue(rule, val, key, componentName) {
  if (val === undefined || val === null) {
    return rule.default !== undefined ? rule.default : (rule.type === 'number' ? 0 : rule.type === 'boolean' ? false : '');
  }

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
  const {
    name,
    schema = {},
    styles = null,
    blueprint,
    actions = {},
    traits = ['draggable', 'selectable'],
    chrome = true
  } = spec;

  if (typeof name !== 'string' || name.length === 0) {
    throw new TypeError('definePrototype: name must be a non-empty string');
  }
  if (!blueprint || !Array.isArray(blueprint)) {
    throw new TypeError(`definePrototype: "${name}" requires a valid blueprint array`);
  }

  // 1. Build schema defaults & allowedKeys
  const allowedKeys = Object.keys(schema);
  const defaults = {};
  for (const [k, rule] of Object.entries(schema)) {
    defaults[k] = rule.default !== undefined
      ? rule.default
      : (rule.type === 'number' ? 0 : rule.type === 'boolean' ? false : '');
  }

  // 2. Inject scoped styles
  injectPrototypeStyles(name, styles);

  // 3. Compile blueprint into static templateFactory & binding descriptors
  const { templateFactory, bindingDescriptors } = compileBlueprint(blueprint, name, actions);

  // 4. Register with CloudCanvas DisplayTrait
  const handle = defineComponent({
    name,
    chrome,
    allowedKeys: allowedKeys.length > 0 ? allowedKeys : undefined,

    build(pin, contentEl) {
      const { root, bindings } = templateFactory(pin);
      contentEl.replaceChildren(root);

      // Initialize reactive state proxy
      if (!pin.state) {
        pin.state = createReactiveState(pin, schema, defaults, name);
      }

      // Bind actions as methods directly on pin
      for (const [actionName, fn] of Object.entries(actions)) {
        pin[actionName] = (...args) => fn(pin, ...args);
      }

      // Add signal emission helper
      if (!pin.emit) {
        pin.emit = (type, payload) => {
          pin.transmit(new PinEvent(type, { payload, source: pin, bubbles: true }));
        };
      }

      // Add rotation helper
      if (!pin.rotate) {
        pin.rotate = (deltaDeg) => rotatePin(pin, deltaDeg);
      }

      return { bindings, cache: new Map() };
    },

    update(pin, contents, state) {
      if (!state || !state.bindings) return;
      const { bindings, cache } = state;

      for (let i = 0; i < bindingDescriptors.length; i++) {
        const desc = bindingDescriptors[i];
        const targetNode = bindings[desc.index];
        if (!targetNode) continue;

        const val = contents.get(desc.key) !== undefined
          ? contents.get(desc.key)
          : defaults[desc.key];

        if (desc.type === 'text') {
          const str = val === undefined || val === null ? '' : String(val);
          if (targetNode.data !== str) {
            targetNode.data = str;
          }
        } else if (desc.type === 'class') {
          const cls = val ? `${desc.baseClass}-${val}` : '';
          const prev = cache.get(desc.index);
          if (prev !== cls) {
            if (prev) targetNode.classList.remove(prev);
            if (cls) targetNode.classList.add(cls);
            cache.set(desc.index, cls);
          }
        } else if (desc.type === 'attr') {
          const prev = cache.get(desc.index);
          if (prev !== val) {
            if (val === false || val === null || val === undefined) {
              targetNode.removeAttribute(desc.attrName);
            } else {
              targetNode.setAttribute(desc.attrName, String(val));
            }
            cache.set(desc.index, val);
          }
        } else if (desc.type === 'style') {
          const prev = cache.get(desc.index);
          if (prev !== val) {
            targetNode.style.setProperty(desc.propName, String(val ?? ''));
            cache.set(desc.index, val);
          }
        } else if (desc.type === 'value') {
          const str = String(val ?? '');
          if (targetNode.value !== str) {
            targetNode.value = str;
          }
        }
      }
    }
  });

  // 5. Prototype Object with Factory & Extension
  const prototype = {
    name,
    handle,
    schema: Object.freeze({ ...schema }),
    defaults: Object.freeze({ ...defaults }),

    create(session, options = {}) {
      const initialContents = {
        ...defaults,
        ...(options.state || options.contents || {})
      };

      const pin = session.createPin({
        chrome,
        ...options,
        type: name,
        contents: initialContents
      });

      // Attach default traits if absent
      for (const trait of traits) {
        if (!pin.traits.has(trait)) {
          pin.addTrait(trait);
        }
      }

      return pin;
    },

    extend(childSpec = {}) {
      const mergedSchema = { ...schema, ...(childSpec.schema || {}) };
      const mergedStyles = childSpec.styles
        ? (typeof styles === 'object' && typeof childSpec.styles === 'object'
            ? { ...styles, ...childSpec.styles }
            : `${styles || ''}\n${childSpec.styles}`)
        : styles;

      const mergedActions = { ...actions, ...(childSpec.actions || {}) };
      const mergedTraits = Array.from(new Set([...traits, ...(childSpec.traits || [])]));

      return definePrototype({
        ...spec,
        ...childSpec,
        name: childSpec.name || `${name}-extended`,
        schema: mergedSchema,
        styles: mergedStyles,
        blueprint: childSpec.blueprint || blueprint,
        actions: mergedActions,
        traits: mergedTraits,
        chrome: childSpec.chrome !== undefined ? childSpec.chrome : chrome
      });
    }
  };

  return prototype;
}
