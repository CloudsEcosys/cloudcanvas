/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * A prototype-level DOM spy: every layout read and every DOM write, in the
 * order they happened, without touching the elements under test.
 *
 * `tests/helpers/dom.js` gives one element a measurable box by defining own
 * accessors on it; that hides the read from anything watching the prototype.
 * Here the accessors are wrapped on the prototypes themselves, so a read made
 * anywhere in the engine lands in the log - and the offset metrics are derived
 * from the inline `style.width/height` the same way `setElementSize` derives
 * them, so a blit declared with `w`/`h` measures to that box.
 *
 * Nested calls are not double-counted: happy-dom implements `classList.add`
 * through `setAttribute`, and only the outermost call is recorded.
 */

const PX_PATTERN = /^(-?\d+(?:\.\d+)?)px$/;

function parsePixels(value) {
  const match = PX_PATTERN.exec(String(value || '').trim());
  return match ? Number(match[1]) : 0;
}

/** The nearest prototype that owns `name`, starting from `object`. */
function ownerOf(object, name) {
  let node = object;
  while (node && !Object.getOwnPropertyDescriptor(node, name)) node = Object.getPrototypeOf(node);
  if (!node) throw new TypeError(`domSpy: no prototype owns "${name}"`);
  return node;
}

const LAYOUT_METRICS = Object.freeze({
  offsetWidth: (element) => parsePixels(element.style.width),
  offsetHeight: (element) => parsePixels(element.style.height),
  offsetLeft: null,
  offsetTop: null
});

const WRITE_METHODS = Object.freeze([
  ['Element', 'setAttribute'],
  ['Element', 'removeAttribute'],
  ['Element', 'remove'],
  ['Element', 'replaceChildren'],
  ['Element', 'append'],
  ['Node', 'appendChild'],
  ['Node', 'insertBefore'],
  ['Node', 'removeChild'],
  ['DOMTokenList', 'add'],
  ['DOMTokenList', 'remove'],
  ['DOMTokenList', 'toggle'],
  ['CSSStyleDeclaration', 'setProperty'],
  ['CSSStyleDeclaration', 'removeProperty']
]);

/** Setters, each resolved from the sample instance that owns it. */
const WRITE_SETTERS = Object.freeze([
  ['element', 'innerHTML'],
  ['element', 'textContent'],
  // A text node's own value: the template kit's `node.data = text` path.
  ['text', 'data'],
  ['text', 'nodeValue']
]);

/** The prototypes the spy wraps, resolved from live instances rather than globals. */
function prototypes() {
  const div = document.createElement('div');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  return {
    Element: ownerOf(div, 'setAttribute'),
    Node: ownerOf(div, 'appendChild'),
    HTMLElement: ownerOf(div, 'offsetWidth'),
    DOMTokenList: ownerOf(div.classList, 'add'),
    CSSStyleDeclaration: ownerOf(div.style, 'setProperty'),
    SVGGraphicsElement: ownerOf(path, 'getBBox')
  };
}

/** Live instances the setters are resolved against. */
function samples() {
  return { element: document.createElement('div'), text: document.createTextNode('') };
}

function describeTarget(target) {
  if (target && typeof target.tagName === 'string') return target.tagName.toLowerCase();
  return target && target.constructor ? target.constructor.name : String(target);
}

/** Install the spy. Returns the live logs and a `restore()` that undoes every wrap. */
export function installDomSpy() {
  const protos = prototypes();
  const entries = [];
  const restores = [];
  let depth = 0;

  const record = (kind, name, target, detail) => {
    if (depth === 0) entries.push({ kind, name, target: describeTarget(target), detail });
  };

  const wrapAccessor = (proto, name, compute) => {
    const original = Object.getOwnPropertyDescriptor(proto, name);
    Object.defineProperty(proto, name, {
      configurable: true,
      get() {
        record('read', name, this, '');
        const own = original.get.call(this);
        if (!compute) return own;
        return compute(this) || own;
      },
      set: original.set
    });
    restores.push(() => Object.defineProperty(proto, name, original));
  };

  const wrapReadMethod = (proto, name) => {
    const original = Object.getOwnPropertyDescriptor(proto, name);
    Object.defineProperty(proto, name, {
      configurable: true,
      writable: true,
      value(...args) {
        record('read', name, this, '');
        return original.value.apply(this, args);
      }
    });
    restores.push(() => Object.defineProperty(proto, name, original));
  };

  const wrapWriteMethod = (proto, name, label) => {
    const original = Object.getOwnPropertyDescriptor(proto, name);
    Object.defineProperty(proto, name, {
      configurable: true,
      writable: true,
      value(...args) {
        record('write', label, this, args.map(String).join(',').slice(0, 80));
        depth += 1;
        try {
          return original.value.apply(this, args);
        } finally {
          depth -= 1;
        }
      }
    });
    restores.push(() => Object.defineProperty(proto, name, original));
  };

  const wrapWriteSetter = (proto, name, label) => {
    const original = Object.getOwnPropertyDescriptor(proto, name);
    Object.defineProperty(proto, name, {
      configurable: true,
      get: original.get,
      set(value) {
        record('write', label, this, String(value).slice(0, 80));
        depth += 1;
        try {
          original.set.call(this, value);
        } finally {
          depth -= 1;
        }
      }
    });
    restores.push(() => Object.defineProperty(proto, name, original));
  };

  for (const [name, compute] of Object.entries(LAYOUT_METRICS)) {
    wrapAccessor(protos.HTMLElement, name, compute);
  }
  wrapReadMethod(protos.Element, 'getBoundingClientRect');
  wrapReadMethod(protos.SVGGraphicsElement, 'getBBox');

  for (const [owner, name] of WRITE_METHODS) {
    const label = owner === 'Element' || owner === 'Node' ? name : `${owner === 'DOMTokenList' ? 'classList' : 'style'}.${name}`;
    wrapWriteMethod(protos[owner], name, label);
  }
  const instances = samples();
  for (const [sample, name] of WRITE_SETTERS) wrapWriteSetter(ownerOf(instances[sample], name), name, name);

  // Every named style property setter (`style.transform = ...`, `style.minHeight = ...`).
  for (const name of Object.getOwnPropertyNames(protos.CSSStyleDeclaration)) {
    const descriptor = Object.getOwnPropertyDescriptor(protos.CSSStyleDeclaration, name);
    if (descriptor && descriptor.set) wrapWriteSetter(protos.CSSStyleDeclaration, name, `style.${name}`);
  }

  return {
    entries,
    reads: () => entries.filter((entry) => entry.kind === 'read'),
    writes: () => entries.filter((entry) => entry.kind === 'write'),
    clear: () => { entries.length = 0; },
    restore: () => { while (restores.length > 0) restores.pop()(); }
  };
}
