/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Lazy offload: the viewport-driven counterpart to `reload: 'lazy'`.
 *
 * `reload: 'lazy'` lazily *creates* a scope's children once, on first visit. This
 * pass is the opposite direction on a different axis: a Pin flagged `offload`
 * whose global box has left the visible canvas (past a configurable margin) has
 * its element detached from the document - model, particle, traits and contents
 * all retained - and reattached the moment the camera pans or zooms it back into
 * range. It is DOM virtualization, not destruction: nothing is torn down and no
 * lazy provider is re-armed (that is `unload()`, a heavier and separate thing).
 *
 * The mechanism is deliberately *not* new: setting `pin._offloadDormant` makes
 * `resolveRenderMode` (`../pins/reload.js`) resolve the Pin to `unmounted`, so the
 * detach/reattach travels the exact same, already-proven structure-flush path the
 * `active` reload strategy uses when a scope sleeps. This pass only decides *when*
 * to raise and lower that one flag; `ConjugateRenderer` does the rest in the same
 * frame it does every other membership change.
 *
 * Two invariants shape the design:
 *
 *   - **Root-only evaluation.** Only root Pins are tested, against their correct
 *     `getGlobalBounds()`. Detaching a root's element takes its whole subtree out
 *     of the document with it, so nested Pins ride their root rather than being
 *     tested one by one.
 *   - **Camera-gated.** The sweep runs only when the viewport version moved (or a
 *     new offload Pin was just adopted), never on an idle frame, so the engine's
 *     idle-canvas-zero-writes invariant is preserved: a still camera does no
 *     offload work at all.
 */

/**
 * Screen-pixel clearance around the visible canvas before a Pin is offloaded.
 * Wide enough that a Pin is torn down well after it leaves view and rebuilt well
 * before it returns, so an ordinary pan never flashes an empty box.
 */
export const DEFAULT_OFFLOAD_MARGIN = 400;

/**
 * The canvas-space rectangle currently visible in the host.
 *
 * Derived through `viewport.screenToCanvas` - the same projection the pointer
 * router and every other screen<->canvas conversion use - so the visible box is
 * expressed in exactly the coordinates `getGlobalBounds()` reports a Pin in.
 *
 * @param {import('./viewport.js').Viewport} viewport
 * @param {{left?: number, top?: number, width?: number, height?: number}} hostRect
 * @returns {{minX: number, minY: number, maxX: number, maxY: number}}
 */
export function visibleCanvasRect(viewport, hostRect) {
  const left = hostRect.left || 0;
  const top = hostRect.top || 0;
  const width = hostRect.width || 0;
  const height = hostRect.height || 0;

  const topLeft = viewport.screenToCanvas(left, top, hostRect);
  const bottomRight = viewport.screenToCanvas(left + width, top + height, hostRect);

  return {
    minX: topLeft.x,
    minY: topLeft.y,
    maxX: bottomRight.x,
    maxY: bottomRight.y
  };
}

/**
 * The offload margin in force for a Pin: its own override, or the session default.
 * A per-Pin `offloadMargin` is honoured even when zero, so a Pin can be told to
 * offload the instant it clears the viewport edge.
 */
export function resolveOffloadMargin(pin, defaultMargin) {
  return typeof pin.offloadMargin === 'number' ? pin.offloadMargin : defaultMargin;
}

/**
 * Whether a Pin's global box lies entirely beyond the visible rectangle grown by
 * `margin` on every side. A Pin that so much as touches the grown rectangle is
 * kept: offload is a decision made only about Pins that are wholly clear of it.
 *
 * @param {{minX: number, minY: number, maxX: number, maxY: number}} bounds
 * @param {{minX: number, minY: number, maxX: number, maxY: number}} rect
 * @param {number} margin
 * @returns {boolean}
 */
export function isOutsideViewport(bounds, rect, margin) {
  return bounds.maxX < rect.minX - margin
    || bounds.minX > rect.maxX + margin
    || bounds.maxY < rect.minY - margin
    || bounds.minY > rect.maxY + margin;
}

/**
 * Drive one offload sweep for a renderer from the current frame context.
 *
 * The renderer's phase-0 entry point, kept here beside the policy the same way
 * `flushStructure` lives in `./mounting.js`: the renderer owns the sets, this owns
 * the sweep. A no-op when no Pin opted into offload, so the ordinary canvas pays
 * nothing. The visible box is read from the frame's viewport and host rect, with
 * the session as the fallback for both (the loop always supplies them).
 *
 * @param {import('./renderer.js').ConjugateRenderer} renderer
 * @param {object} context the per-frame context (`viewport`, `hostRect`)
 * @returns {number} how many Pins changed offload state this frame
 */
export function runOffloadSweep(renderer, context) {
  if (renderer._offloadPins.size === 0) return 0;

  const session = renderer.session;
  const viewport = context.viewport || (session ? session.viewport : null);
  const hostRect = context.hostRect || (session ? session.getHostRect() : null);

  const changed = renderer.offloadPass.sweep({
    renderer,
    pins: renderer._offloadPins,
    viewport,
    hostRect,
    viewportVersion: renderer.viewportVersion,
    defaultMargin: renderer._offloadMargin,
    force: renderer._offloadPending
  });
  renderer._offloadPending = false;
  return changed;
}

/**
 * The per-frame offload sweep, held as a small object for the one piece of state
 * it carries: the viewport version it last ran against, so it can no-op every
 * frame the camera did not move.
 */
export class OffloadPass {
  constructor() {
    /** Viewport version the last sweep ran against (-1 = never). */
    this._sweptVersion = -1;
  }

  /**
   * Bring every offload Pin's dormant flag in line with the current camera.
   *
   * Runs only when the camera moved since the last sweep, or when `force` is set
   * (a newly adopted offload Pin needs one evaluation even under a still camera).
   * A Pin whose in/out state actually changed is reconciled, so the renderer's
   * next structure flush detaches or reattaches it through the ordinary path.
   *
   * @param {object} args
   * @param {import('./renderer.js').ConjugateRenderer} args.renderer
   * @param {Iterable<import('../pins/pin.js').Pin>} args.pins offload Pins to test
   * @param {import('./viewport.js').Viewport|null} args.viewport
   * @param {object|null} args.hostRect
   * @param {number} args.viewportVersion current camera version
   * @param {number} args.defaultMargin session-level margin
   * @param {boolean} [args.force] evaluate even if the camera did not move
   * @returns {number} how many Pins changed offload state this sweep
   */
  sweep({ renderer, pins, viewport, hostRect, viewportVersion, defaultMargin, force = false }) {
    if (!force && viewportVersion === this._sweptVersion) return 0;
    this._sweptVersion = viewportVersion;
    if (!viewport || !hostRect) return 0;

    const rect = visibleCanvasRect(viewport, hostRect);
    let changed = 0;

    for (const pin of pins) {
      // Only root Pins are tested: a nested Pin leaves the document with the
      // root whose element contains it, so it needs no test of its own.
      if (pin.parent) continue;
      if (this._reconcileOne(renderer, pin, rect, defaultMargin)) changed += 1;
    }
    return changed;
  }

  /**
   * Test one Pin and, if its offload state flipped, raise or lower its dormant
   * flag and hand it to the renderer to detach or reattach.
   *
   * @returns {boolean} true when the Pin's state changed
   */
  _reconcileOne(renderer, pin, rect, defaultMargin) {
    const margin = resolveOffloadMargin(pin, defaultMargin);
    const outside = isOutsideViewport(pin.getGlobalBounds(), rect, margin);
    if (outside === Boolean(pin._offloadDormant)) return false;

    pin._offloadDormant = outside;
    // Structure invalidation, whichever direction: on the way out it resolves to
    // `unmounted`; on the way back the ordinary MOUNTED path re-queues content and
    // measurement, so a reattached Pin gets the identical freshly-visible
    // treatment any newly mounted Pin does - no special-cased under-render.
    renderer.reconcile(pin);
    return true;
  }

  /** Forget the last-swept version, so the next sweep runs unconditionally. */
  reset() {
    this._sweptVersion = -1;
  }
}
