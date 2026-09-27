/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The scope-well pass: giving a Pin's child container a size.
 *
 * A scope well is `position: relative` around absolutely positioned children, so
 * it has no intrinsic height at all. Without a written `min-height` it collapses
 * and its children spill over whatever is below them; with one, it is a frame
 * that clips. This is where that height comes from.
 *
 * Two answers per parent, both derived from the Pin graph and never from layout:
 *
 *   - *extent*    - the furthest bottom edge across the parent's **live**
 *                   children. A dormant or unmounted child occupies nothing,
 *                   which is the whole point of it being asleep.
 *   - *populated* - the same question asked as a boolean, and the only thing
 *                   that grants the well its box, border, gap and clipping
 *                   (`cc-populated` in `CANVAS_DEFAULT_CSS`).
 *
 * One parent is exempt from the first answer and not the second: a *flow*
 * container (`pin.layout` is 'row', 'column' or 'grid'). Its children are placed
 * by flex or grid and their particle x/y describe nothing, so an extent measured
 * from them is measured from where they used to be; such a well is left to size
 * itself from its own content and only `populated` is written.
 *
 * Writing a min-height changes the parent's own box, so the caller re-measures
 * the parent afterwards. That is a one-level-per-frame convergence, not a loop:
 * the parent's new size feeds *its* parent's extent next frame, each level
 * settles once, and the whole-pixel change gate below stops the cascade the
 * moment a value repeats.
 */
import { SCOPE_POPULATED_CLASS } from '../pins/pin-element.js';
import { forEachChild } from '../pins/pin-hierarchy.js';

/**
 * Per-renderer scope-well state: what was last written, and which parents are
 * owed a recomputation.
 */
export class ScopeWellPass {
  constructor() {
    /** @type {WeakMap<Pin, {height: number, populated: boolean}>} */
    this._applied = new WeakMap();

    /**
     * Parents whose well must be recomputed even though nothing of theirs is in
     * the frame's dirty set - a child forgotten outright leaves no dirt behind
     * it, so the loss is recorded here instead.
     * @type {Set<Pin>}
     */
    this._dirty = new Set();
  }

  /** Record that a parent's well may have changed for a reason nothing else saw. */
  invalidate(parent) {
    if (!parent) return false;
    this._dirty.add(parent);
    return true;
  }

  /**
   * Size every well whose contents may have moved.
   *
   * @param {object} frame
   * @param {Iterable<Pin>} frame.frameDirty  Pins that changed this frame
   * @param {(pin: Pin) => boolean} frame.isLive  participation test
   * @param {(parent: Pin) => void} frame.onWrite  called for each rewritten well
   * @returns {number} how many wells were rewritten
   */
  update(frame) {
    const parents = this._parents(frame.frameDirty);
    if (parents.size === 0) return 0;

    let written = 0;
    for (const parent of parents) {
      if (!this._apply(parent, frame.isLive)) continue;
      frame.onWrite(parent);
      written += 1;
    }
    return written;
  }

  /** Every parent whose well this frame could have changed. */
  _parents(frameDirty) {
    const parents = new Set(this._dirty);
    this._dirty.clear();

    for (const pin of frameDirty) {
      if (pin.parent) parents.add(pin.parent);
    }
    return parents;
  }

  /** Write one parent's well, only when its quantized state actually moved. */
  _apply(parent, isLive) {
    const scope = parent.scopeElement;
    if (!scope || !scope.style) return false;

    const { height, populated } = extentOf(parent, isLive);
    const flow = isFlowParent(parent);
    const applied = this._applied.get(parent);
    if (applied && applied.height === height
      && applied.populated === populated && applied.flow === flow) return false;

    this._applied.set(parent, { height, populated, flow });
    // A flow parent lays its children out with flex or grid, and a flow child's
    // particle x/y no longer says where it renders - so `extentOf` above is
    // measured from positions the child left behind, and must not size the well.
    // The flow itself sizes it: no written min-height at all, leaving the
    // stylesheet's own floor (`--cc-scope-min-height`) as the only one.
    scope.style.minHeight = populated && !flow ? `${height}px` : '';
    if (scope.classList) scope.classList.toggle(SCOPE_POPULATED_CLASS, populated);
    return true;
  }

  clear() {
    this._dirty.clear();
  }
}

/**
 * Whether a parent places its children by flow (`pin.layout` is 'row', 'column'
 * or 'grid') rather than by their own transforms.
 *
 * The literal `'free'` rather than an import, for the reason `_applyPosition`
 * spells out in `./renderer.js`: the engine does not depend on the pins layer's
 * modules. A parent with no `layout` at all - anything built before the accessor
 * existed, or a test double - is free, which is the pre-8.2 behaviour exactly.
 */
export function isFlowParent(parent) {
  return Boolean(parent && parent.layout && parent.layout !== 'free');
}

/**
 * The furthest bottom edge across a parent's live children, rounded *up* to a
 * whole pixel: quantized so sub-pixel physics cannot oscillate the change gate,
 * and upward so a child is never clipped by a fraction of its own last row.
 *
 * @returns {{height: number, populated: boolean}}
 */
export function extentOf(parent, isLive) {
  // The allocation-free child walk, not the `children` Set; read-only, so it
  // honours `forEachChild`'s no-reorder contract. One small accumulator per
  // dirty parent replaces a whole Set of every child.
  const acc = { extent: 0, populated: false };
  forEachChild(parent, accumulateExtent, acc, isLive);
  return { height: Math.ceil(acc.extent), populated: acc.populated };
}

/** `forEachChild` visitor for `extentOf`: fold one live child into the extent. */
function accumulateExtent(child, acc, isLive) {
  if (!isLive(child)) return;
  acc.populated = true;
  const bottom = child.particle.y + child.particle.height;
  if (bottom > acc.extent) acc.extent = bottom;
}
