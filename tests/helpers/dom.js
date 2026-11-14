/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * DOM test utilities.
 *
 * happy-dom parses and styles a real document but runs no layout engine, so
 * `getBoundingClientRect()` reports 0x0 and `offsetWidth/offsetHeight` report 0 for
 * every element. Tests that assert on measured geometry declare the size explicitly
 * here: the inline style carries the intent (and is observable through
 * `getComputedStyle`), and both the rect and the offset metrics are derived from that
 * same style at measurement time.
 *
 * The frame's read phase measures in layout space (`offsetWidth/offsetHeight`), so that
 * pair is what production code actually reads.
 */

const PX_PATTERN = /^(-?\d+(?:\.\d+)?)px$/;

function parsePixels(value) {
  const match = PX_PATTERN.exec(String(value || '').trim());
  return match ? Number(match[1]) : 0;
}

function measureFromStyle(element, origin) {
  const width = parsePixels(element.style.width);
  const height = parsePixels(element.style.height);
  const left = origin.x;
  const top = origin.y;

  return {
    x: left,
    y: top,
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height,
    toJSON() {
      return { x: left, y: top, width, height, top, right: left + width, bottom: top + height, left };
    }
  };
}

/** Install a live, style-derived getter for a layout metric. */
function defineMetric(element, name, read) {
  Object.defineProperty(element, name, {
    configurable: true,
    get: read
  });
}

/**
 * Give an element a measurable box: inline size, a layout-backed
 * `getBoundingClientRect()`, and matching `offsetWidth` / `offsetHeight`.
 */
export function setElementSize(element, width, height, origin = { x: 0, y: 0 }) {
  if (!element || typeof element.getBoundingClientRect !== 'function') {
    throw new TypeError('setElementSize: expected a DOM element');
  }

  element.style.width = `${width}px`;
  element.style.height = `${height}px`;

  Object.defineProperty(element, 'getBoundingClientRect', {
    configurable: true,
    writable: true,
    value: () => measureFromStyle(element, origin)
  });

  defineMetric(element, 'offsetWidth', () => parsePixels(element.style.width));
  defineMetric(element, 'offsetHeight', () => parsePixels(element.style.height));

  return element;
}

/**
 * Declare an element's layout offset inside its offset parent, which is what the
 * read phase stores as a blit's scope offset (`sx`/`sy`).
 */
export function setElementOffset(element, left, top) {
  if (!element || typeof element.getBoundingClientRect !== 'function') {
    throw new TypeError('setElementOffset: expected a DOM element');
  }

  defineMetric(element, 'offsetLeft', () => left);
  defineMetric(element, 'offsetTop', () => top);

  return element;
}

/** The accessor for a property, found anywhere on an object's prototype chain. */
function findAccessor(object, name) {
  let node = object;
  while (node) {
    const descriptor = Object.getOwnPropertyDescriptor(node, name);
    if (descriptor && descriptor.set) return descriptor;
    node = Object.getPrototypeOf(node);
  }
  throw new TypeError(`spyInnerHTML: no writable "${name}" accessor found`);
}

/**
 * Record every `innerHTML` assignment made to an element, without changing what
 * the assignment does.
 *
 * This is how the renderer's central claim is tested: an idle frame must perform
 * *zero* writes, which is only observable at the assignment itself - the
 * resulting markup is identical either way.
 *
 * @returns {string[]} live array of the values written, newest last
 */
export function spyInnerHTML(element) {
  const accessor = findAccessor(element, 'innerHTML');
  const writes = [];

  Object.defineProperty(element, 'innerHTML', {
    configurable: true,
    get: () => accessor.get.call(element),
    set: (value) => {
      writes.push(value);
      accessor.set.call(element, value);
    }
  });

  return writes;
}

/**
 * Clear the document body between tests so suites stay independent.
 */
export function resetDocument() {
  document.body.innerHTML = '';
}
