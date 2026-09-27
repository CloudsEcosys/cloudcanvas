/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * What the PinManager keeps on top of the core root, and no more.
 *
 * Registration *is* the root's id index (`../core/root.js`): a registered Pin's
 * element is indexed under its Pin id, parked or not, and `pinOf` (`./pin-hierarchy.js`)
 * turns the element back into the Pin. `PinIndex` is the manager's `pins` Map
 * read through that index. The one structure left is the trait index - one Set
 * per trait name - because the global SVG pass (`../engine/svg-groups.js`) asks
 * "every Pin carrying X" every frame, parked Pins included, and the DOM cannot
 * answer for a Pin that is parked. Capabilities are read off the traits.
 *
 * Every function takes the manager as its first argument.
 */
import { indexBlit, unindexBlit } from '../core/root.js';
import { pinOf } from './pin-hierarchy.js';

/** The Pin `element` belongs to, when that Pin is registered with `manager`. */
export function registeredPin(manager, element) {
  const pin = element ? pinOf(element) : undefined;
  return pin && pin._manager === manager ? pin : undefined;
}

/** Index a Pin under its id, and under every trait name it carries. */
export function indexPin(manager, pin) {
  indexBlit(manager.root, pin.element, pin.id);
  indexTraits(manager, pin);
}

/** Drop a Pin from the root index and from every trait bucket. */
export function unindexPin(manager, pin) {
  unindexBlit(manager.root, pin.element);
  unindexTraits(manager, pin);
}

/** Record a Pin under every trait name it carries. */
export function indexTraits(manager, pin) {
  for (const trait of pin.traits.values()) {
    if (!trait || !trait.name) continue;
    if (!manager.traitIndex.has(trait.name)) manager.traitIndex.set(trait.name, new Set());
    manager.traitIndex.get(trait.name).add(pin);
  }
}

/** Take a Pin out of every bucket, dropping a bucket it leaves empty. */
export function unindexTraits(manager, pin) {
  for (const [name, bucket] of manager.traitIndex) {
    if (bucket.delete(pin) && bucket.size === 0) manager.traitIndex.delete(name);
  }
}

/** Whether any of a Pin's traits declares `capability`. */
export function hasCapability(pin, capability) {
  for (const trait of pin.traits.values()) {
    if (trait.name && trait.hasCapability(capability)) return true;
  }
  return false;
}

/**
 * The manager's `pins`: the read half of a Map of id -> Pin, over the root
 * index, so the frame context's `pinMap`, a `.get(id)` or a `.size` read the
 * one registry. It has no `set`, `delete` or `clear`: a Pin is registered and
 * removed through the manager, and a write here fails loudly instead of forking it.
 */
export class PinIndex {
  #manager;

  constructor(manager) {
    this.#manager = manager;
  }

  get(id) { return registeredPin(this.#manager, this.#manager.root.ids.get(String(id))); }

  has(id) { return this.get(id) !== undefined; }

  get size() { return Array.from(this.values()).length; }

  * values() {
    for (const element of this.#manager.root.ids.values()) {
      const pin = registeredPin(this.#manager, element);
      if (pin) yield pin;
    }
  }

  * keys() { for (const pin of this.values()) yield pin.id; }

  * entries() { for (const pin of this.values()) yield [pin.id, pin]; }

  [Symbol.iterator]() { return this.entries(); }

  forEach(callback, thisArg) {
    for (const pin of this.values()) callback.call(thisArg, pin, pin.id, this);
  }
}
