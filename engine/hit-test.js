/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Hit-testing the Pin tree: "which Pin is under this point".
 *
 * The engine resolves a Pin from a DOM node in exactly one way -
 * `.cloudcanvas-pin[data-pin-id]`, the same hook the pointer router
 * (`pinForEvent`) and the Sandbox's placement-time container drop
 * (`containerAt`) already read. This is that resolution promoted to a core query
 * so a dragged Pin can find what it was released over, and so any caller that
 * needs the pin tree hit-tested (a drop, a z-order pick) asks it here rather
 * than re-deriving the class-and-id walk.
 *
 * Deepest-first is the whole contract: a nested Pin's element sits *inside* its
 * parent's scope well, so the innermost Pin at a point is the topmost element in
 * the paint stack there. `document.elementsFromPoint` returns that stack in that
 * order, so the first resolvable Pin in it is the deepest one under the point -
 * the correct drop target. An environment with no layout (happy-dom, under the
 * unit suite) has no such stack; there the event's own `target` is the single
 * honest answer, and a caller expresses "released over X" through that target.
 *
 * `ignore` skips a Pin and its whole subtree: a Pin being dragged is the topmost
 * element under its own release point, and a Pin can never be dropped into
 * itself or into one of its own descendants.
 */

/* The element stack under a point is the place add-on's (`../addons/place.js`). */
import { elementsAt } from '../addons/place.js';

/** The one selector every layer resolves a Pin's root element by. */
const PIN_SELECTOR = '.cloudcanvas-pin';

/**
 * The deepest Pin under an event's point, or null when the point is over none.
 *
 * @param {CloudCanvasSession} session
 * @param {{clientX?: number, clientY?: number, target?: EventTarget}} event
 * @param {object} [options]
 * @param {Pin} [options.ignore] a Pin (and its subtree) to skip in the stack
 * @returns {Pin|null}
 */
export function droppablePinAt(session, event, options = {}) {
  if (!session || !event) return null;
  const ignore = options.ignore || null;

  for (const element of elementsAt(event)) {
    const pin = pinFromElement(session, element);
    if (!pin) continue;
    if (ignore && isSelfOrDescendant(pin, ignore)) continue;
    return pin;
  }
  return null;
}

/** The Pin a DOM node belongs to, resolved by class and registered id, or null. */
export function pinFromElement(session, element) {
  if (!element || typeof element.closest !== 'function') return null;
  const pinElement = element.closest(PIN_SELECTOR);
  const id = pinElement ? pinElement.getAttribute('data-pin-id') : null;
  return id ? session.getPin(id) ?? null : null;
}

/** Whether `pin` is `subject` itself, or sits somewhere in its subtree. */
function isSelfOrDescendant(pin, subject) {
  if (pin === subject) return true;
  return typeof pin.ancestors === 'function' && pin.ancestors().includes(subject);
}
