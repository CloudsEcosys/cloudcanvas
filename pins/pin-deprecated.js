/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The Pin's deprecated 0.3.0 aliases, kept for callers not yet migrated. `Pin`
 * extends this class, so the aliases sit one prototype below its own methods
 * and their 0.4.0 removal is one file delete (and `extends EventTarget` again).
 * Each one forwards to the native spelling named in its own note; none carries
 * logic of its own, and nothing here runs at import.
 */
import { childrenOf } from './pin-hierarchy.js';

/** The EventTarget a Pin is, carrying the aliases; `this` is the Pin. */
export class DeprecatedPinAliases extends EventTarget {
  /** @deprecated since 0.3.0 - use `Array.from(pin.children)`. Removed in 0.4.0. */
  getChildren() { return Array.from(childrenOf(this)); }

  /** @deprecated since 0.3.0 - use `pin.traits.get(name)`. Removed in 0.4.0. */
  getTrait(traitName) { return this.traits.get(traitName); }

  /** @deprecated since 0.3.0 - use `pin.traits.has(name)`. Removed in 0.4.0. */
  hasTrait(traitName) { return this.traits.has(traitName); }

  /** @deprecated since 0.3.0 - use `Array.from(pin.traits.values())`. Removed in 0.4.0. */
  getTraits() { return Array.from(this.traits.values()); }

  /** @deprecated since 0.3.0 - use {@link Pin#displayTrait}. Removed in 0.4.0. */
  getType() { return this.getDisplayTrait(); }

  /** @deprecated since 0.3.0 - use {@link Pin#setDisplayTrait}. Removed in 0.4.0. */
  setType(traitOrName, options) { return this.setDisplayTrait(traitOrName, options); }

  /** @deprecated since 0.3.0 - use `pin.contents.get(key)`. Removed in 0.4.0. */
  getContent(key) { return this.contents.get(key); }

  /** @deprecated since 0.3.0 - use `pin.contents.has(key)`. Removed in 0.4.0. */
  hasContent(key) { return this.contents.has(key); }

  /** @deprecated since 0.3.0 - use `new Map(pin.contents)`. Removed in 0.4.0. */
  getAllContents() { return new Map(this.contents); }

  /** @deprecated since 0.3.0 - use {@link Pin#invalidate}. Removed in 0.4.0. */
  _invalidate(kind = 'content') { return this.invalidate(kind); }

  /** @deprecated since 0.3.0 - use `pin.particle.getVectors()`. Removed in 0.4.0. */
  getVectors() { return this.particle.getVectors(); }

  /** @deprecated since 0.3.0 - use `pin.particle.getVector(index)`. Removed in 0.4.0. */
  getVector(index = 0) { return this.particle.getVector(index); }

  /** @deprecated since 0.3.0 - use `pin.particle.getPrimaryVector()`. Removed in 0.4.0. */
  getPrimaryVector() { return this.particle.getPrimaryVector(); }

  /** @deprecated since 0.3.0 - use {@link Pin#magnitude}. Removed in 0.4.0. */
  getMagnitude() { return this.magnitude; }

  /** @deprecated since 0.3.0 - use {@link Pin#gradient}. Removed in 0.4.0. */
  getGradient() { return this.gradient; }

  /** @deprecated since 0.3.0 - use {@link Pin#pinned}. Removed in 0.4.0. */
  setPinned(pinned) { this.pinned = pinned; }

  /** @deprecated since 0.3.0 - use {@link Pin#selected}. Removed in 0.4.0. */
  setSelected(selected) { this.selected = selected; }

  /** @deprecated since 0.3.0 - use {@link Pin#dragging}. Removed in 0.4.0. */
  setDragging(dragging) { this.dragging = dragging; }
}
