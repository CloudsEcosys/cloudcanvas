/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Blueprint Compiler:
 * Compiles a declarative structural blueprint tuple tree into:
 *   1. A template factory that constructs the DOM subtree once and wires actions
 *   2. An indexed array of direct-reference binding descriptors for zero-allocation updates
 *
 * Zero runtime dependencies, zero layout thrashing, stable node identity.
 */

/**
 * Compile a blueprint specification into a template factory and binding descriptor set.
 *
 * Blueprint node format:
 *   [tagAndClass, propsOrChild, ...restChildren]
 * Example:
 *   ['div.root',
 *     ['span.title', { text: '$title' }],
 *     ['button.btn', { on: { click: 'increment' } }, '+']
 *   ]
 *
 * @param {Array} blueprint root blueprint tuple or array of tuples
 * @param {string} componentName namespace prefix for CSS classes
 * @param {Record<string, Function>} actions map of action names to handler functions
 * @returns {{ templateFactory: (pin: Pin) => { root: Element, bindings: Node[] }, bindingDescriptors: object[] }}
 */
export function compileBlueprint(blueprint, componentName, actions = {}) {
  const bindingDescriptors = [];

  // Normalize single root or list of root elements
  const rootSpecs = Array.isArray(blueprint[0]) && typeof blueprint[0][0] === 'string'
    ? blueprint
    : [blueprint];

  function parseNode(spec, bindingsList, pin) {
    if (typeof spec === 'string') {
      const textNode = document.createTextNode(spec);
      return textNode;
    }

    if (!Array.isArray(spec) || spec.length === 0) {
      throw new TypeError(`compileBlueprint: invalid node spec "${JSON.stringify(spec)}"`);
    }

    const [tagAndClass, propsOrChild, ...restChildren] = spec;
    const parts = (tagAndClass || 'div').split('.');
    const tag = parts[0] || 'div';
    const classNames = parts.slice(1);

    const el = document.createElement(tag);

    // Apply namespaced classes
    for (const c of classNames) {
      el.classList.add(`${componentName}-${c}`);
    }

    let props = {};
    let children = [];

    if (propsOrChild && typeof propsOrChild === 'object' && !Array.isArray(propsOrChild)) {
      props = propsOrChild;
      children = restChildren;
    } else if (propsOrChild !== undefined) {
      children = [propsOrChild, ...restChildren];
    }

    // Process static attributes or bound attributes
    if (props.attrs) {
      for (const [k, v] of Object.entries(props.attrs)) {
        if (typeof v === 'string' && v.startsWith('$')) {
          const key = v.slice(1);
          const index = bindingsList.length;
          bindingsList.push(el);
          bindingDescriptors.push({ type: 'attr', attrName: k, key, index });
        } else {
          el.setAttribute(k, String(v));
        }
      }
    }

    // Process text binding or static text
    if (props.text !== undefined) {
      if (typeof props.text === 'string' && props.text.startsWith('$')) {
        const key = props.text.slice(1);
        const textNode = document.createTextNode('');
        el.appendChild(textNode);
        const index = bindingsList.length;
        bindingsList.push(textNode);
        bindingDescriptors.push({ type: 'text', key, index });
      } else {
        el.appendChild(document.createTextNode(String(props.text)));
      }
    }

    // Process class modifier binding ($key)
    if (props.class !== undefined && typeof props.class === 'string' && props.class.startsWith('$')) {
      const key = props.class.slice(1);
      const index = bindingsList.length;
      bindingsList.push(el);
      bindingDescriptors.push({
        type: 'class',
        key,
        baseClass: `${componentName}-${classNames[0] || 'elem'}`,
        index
      });
    }

    // Process style bindings (e.g. { style: { '--cc-pin-rotation': '$rotation' } })
    if (props.style && typeof props.style === 'object') {
      for (const [propName, propVal] of Object.entries(props.style)) {
        if (typeof propVal === 'string' && propVal.startsWith('$')) {
          const key = propVal.slice(1);
          const index = bindingsList.length;
          bindingsList.push(el);
          bindingDescriptors.push({ type: 'style', propName, key, index });
        } else {
          el.style.setProperty(propName, String(propVal));
        }
      }
    }

    // Process value binding for form inputs
    if (props.value !== undefined && typeof props.value === 'string' && props.value.startsWith('$')) {
      const key = props.value.slice(1);
      const index = bindingsList.length;
      bindingsList.push(el);
      bindingDescriptors.push({ type: 'value', key, index });
    }

    // Wire action event handlers
    if (props.on && typeof props.on === 'object') {
      for (const [eventName, actionName] of Object.entries(props.on)) {
        el.addEventListener(eventName, (event) => {
          event.stopPropagation();
          const fn = actions[actionName] || (pin ? pin[actionName] : null);
          if (typeof fn === 'function') {
            fn(pin, event);
          }
        });
      }
    }

    // Recursively append children
    for (const child of children) {
      if (Array.isArray(child)) {
        el.appendChild(parseNode(child, bindingsList, pin));
      } else if (typeof child === 'string') {
        if (child.startsWith('$')) {
          const key = child.slice(1);
          const textNode = document.createTextNode('');
          el.appendChild(textNode);
          const index = bindingsList.length;
          bindingsList.push(textNode);
          bindingDescriptors.push({ type: 'text', key, index });
        } else {
          el.appendChild(document.createTextNode(child));
        }
      }
    }

    return el;
  }

  const templateFactory = (pin) => {
    const bindings = [];
    let root;
    if (rootSpecs.length === 1) {
      root = parseNode(rootSpecs[0], bindings, pin);
    } else {
      root = document.createElement('div');
      root.classList.add(`${componentName}-container`);
      for (const spec of rootSpecs) {
        root.appendChild(parseNode(spec, bindings, pin));
      }
    }
    return { root, bindings };
  };

  return { templateFactory, bindingDescriptors };
}
