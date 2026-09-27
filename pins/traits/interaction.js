/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Interaction traits on Pins: dragging, selection, focus/zoom targeting, and
 * physics drift. Each class is the Pin shell of an add-on (`../../addons/drag.js`,
 * `select.js`, `focus.js`, `physics.js`) made by `classFromTrait`: the behaviour
 * lives there, once. What stays here is what only a Pin has - the router's
 * text-region flag, drop-to-reparent, the chromeless grab handle, session
 * focus and promotion, and the particle a Pin drifts through.
 */

import { CONTROL_SELECTOR } from '../../addons/trait.js';
import { reparentPin, reorderChild, insertionSiblingFor } from '../reparent.js';
import { droppablePinAt } from '../../engine/hit-test.js';
import { classFromTrait, pinHandle } from '../../addons/class-from-trait.js';
import { dragBehaviour, endDrag, releaseDrag } from '../../addons/drag.js';
import { clickReleased, focusBehaviour } from '../../addons/focus.js';
import { driftForce, physicsBehaviour } from '../../addons/physics.js';
import { applySelection, selectBehaviour } from '../../addons/select.js';

/**
 * Pointer travel (px) a press must exceed before the Pin starts translating:
 * below the 5px a click may carry, so a press that never leaves the band is a
 * click that moved nothing and still focuses through `FocussableTrait`.
 */
export { DRAG_THRESHOLD_PX } from '../../addons/trait.js';

/**
 * FocussableTrait: the Pin as a zoom target (`padding`, `maxZoom`). With
 * `focusOnClick`, a click focuses it through the session - promoted to render
 * root with a breadcrumb back out unless `{promote: false}`, the camera-only look.
 * The reticle is the session's `cursor-focus` cursor.
 */
export class FocussableTrait extends classFromTrait(focusBehaviour, 'focussable') {
  /** Focus the Pin when the pointer barely moved between down and up. */
  onPointerUp(pin, event, session) {
    if (clickReleased(this, event) && this.focusOnClick && session) {
      session.focus(pin, { promote: this.promote });
    }
  }

  onFocus(pin, session) {
    pin.activate(session ? session.getContext() : {});
  }

  onUnfocus(pin, session) {}
}

/**
 * Class the chromeless grab handle carries; the stylesheet's only hook. Unlike
 * the resize handles it is no `data-cc-control`: starting a drag is its job.
 */
export const GRAB_HANDLE_CLASS = 'cloudcanvas-grab-handle';

/**
 * DraggableTrait: the drag add-on on a Pin (`drag:start` / `drag:end` at the
 * threshold, `is-dragging` while pressed). On top of it, what only a Pin has:
 * a press the router marked a text region is the platform's caret; a finished
 * drag that lands in another scope reparents (or reorders in a flow container);
 * and a chromeless Pin whose surface is a real control gets a grab handle,
 * shown while selected, following the `select` signal.
 */
export class DraggableTrait extends classFromTrait(dragBehaviour, 'draggable') {
  constructor(options = {}) {
    super(options);
    /** The chromeless grab handle, built lazily and only while chrome is off. */
    this._grabHandle = null;
    /** Selection listener, kept so `onDetach` can take it back off. */
    this._onSelect = null;
  }

  /** Follow the selection and reconcile the grab handle at once. */
  onAttach(pin) {
    if (typeof pin.addEventListener === 'function') {
      this._onSelect = () => this._syncGrabHandle(pin);
      pin.addEventListener('select', this._onSelect);
    }
    this._syncGrabHandle(pin);
  }

  /** A live `chrome` toggle re-renders content; the handle follows it here. */
  onRender(pin) {
    this._syncGrabHandle(pin);
  }

  /** Begin a drag, unless the router marked the press a text region (a caret, not a gesture). */
  onPointerDown(pin, event, session) {
    if (event && event._ccTextRegion === true) return;
    super.onPointerDown(pin, event, session);
  }

  /**
   * End the gesture; a real drag resolves its drop, then announces `drag:end`
   * with the final position. No event is a cancel, which never drops.
   * @returns {boolean} true when `drag:end` was announced
   */
  onPointerUp(pin, event, session) {
    if (!releaseDrag(this, pinHandle(pin))) return false;
    this._resolveDrop(pin, event, session);
    return endDrag(pinHandle(pin), event);
  }

  /**
   * Reparent the Pin when its release point lands in a different scope.
   *
   * The point handed to `reparentPin` is the Pin's own current canvas-space
   * top-left - the drag already moved it there - so a reparent keeps it exactly
   * where the user let go, with no visible jump. The same hit-test the Sandbox's
   * placement-time container drop uses (`droppablePinAt`) resolves the deepest
   * Pin under the release, skipping the dragged Pin's own subtree.
   *
   * `target === pin.parent` is the regression lock: an ordinary drag that ends
   * over empty root canvas (both null) or back inside its current parent does
   * nothing here, so it stays the plain move the last `onPointerMove` already
   * committed. A cancelled drag (no event) or one routed without a session -
   * `cancelDrag`, `onDetach` - never reparents: it was not a drop.
   *
   * One case intercepts the regression lock: a drop back inside a *flow* container
   * the Pin already belongs to is a reorder, not a no-op. See {@link _resolveReorder}.
   *
   * @returns {boolean} whether the Pin was reparented or reordered
   */
  _resolveDrop(pin, event, session) {
    if (event === undefined || !session) return false;

    const target = droppablePinAt(session, event, { ignore: pin });

    // A drop inside the flow container the Pin already belongs to reorders it
    // among its siblings rather than reparenting (same parent) or doing nothing.
    if (this._resolveReorder(pin, target, event)) return true;

    if (target === pin.parent) return false;

    const corner = pin.getGlobalBounds();
    reparentPin(pin, target, { x: corner.minX, y: corner.minY });
    return true;
  }

  /**
   * Reorder the Pin within its own flow container when the drop landed inside it.
   *
   * The trigger is narrow and deliberate: the Pin's parent must be a flow
   * container (`layout !== 'free'`) and the drop target must resolve to that same
   * container - either the well itself (dropped on open space, appended to the
   * end) or one of its direct children (a sibling, inserted before/after by the
   * drop point against that sibling's midpoint on the layout's main axis). A drop
   * that leaves the container falls through to the reparent path; a Pin in a free
   * container never reaches here, so ordinary dragging is untouched.
   *
   * @returns {boolean} whether the Pin was reordered
   */
  _resolveReorder(pin, target, event) {
    const container = pin.parent;
    if (!container || container.layout === 'free') return false;
    if (target !== container && (!target || target.parent !== container)) return false;

    reorderChild(container, pin, insertionSiblingFor(container, pin, event));
    return true;
  }

  onDetach(pin) {
    this.onPointerUp(pin);

    if (this._onSelect && typeof pin.removeEventListener === 'function') {
      pin.removeEventListener('select', this._onSelect);
    }
    this._onSelect = null;
    this._removeGrabHandle();
  }

  /* ------------------ CHROMELESS GRAB HANDLE ------------------ */

  /**
   * Bring the grab handle into line with the Pin's chrome, its surface and its
   * selection.
   *
   * Existence is gated on {@link _needsGrabHandle}: a chromeless Pin whose own
   * surface is a real control gets a handle, everything else has it removed from
   * the DOM outright (matching how `removeTrait` fully removes resize handles,
   * never just hides them). A chromeless *non*-control - a divider, a bare adopted
   * section - is already draggable by its whole surface and needs nothing. Once it
   * exists, visibility tracks selection through the same `hidden` property the
   * resize handles use.
   *
   * @returns {boolean} whether the handle is now visible
   */
  _syncGrabHandle(pin) {
    if (!this._needsGrabHandle(pin)) {
      this._removeGrabHandle();
      return false;
    }

    const handle = this._ensureGrabHandle(pin);
    if (!handle) return false;

    const visible = Boolean(pin.selected);
    handle.hidden = !visible;
    return visible;
  }

  /**
   * Whether this Pin needs a grab handle at all: chromeless, with a control for a
   * surface.
   *
   * The feature exists for exactly one situation - `chrome: false` and the Pin's
   * content is a real control (`<button>`, `<input>`, a `data-cc-control` widget)
   * that `onPointerDown` stands down on, leaving nothing to drag by. The control
   * is read as the content node's first element child, which is where every lib
   * widget builds it (`contentEl.replaceChildren(root)`); a chromed Pin, or a
   * chromeless one whose surface is ordinary markup, is draggable already and is
   * skipped. The framework's own root children - the resize handles, this handle -
   * are never mistaken for it, because it looks *inside* the content node only.
   *
   * @returns {boolean}
   */
  _needsGrabHandle(pin) {
    if (!pin || pin.chrome !== false || !pin.element) return false;

    const content = pin.contentElement;
    const surface = content ? content.firstElementChild : null;
    return Boolean(
      surface
      && typeof surface.matches === 'function'
      && surface.matches(CONTROL_SELECTOR)
    );
  }

  /**
   * Build the handle once, as a direct child of the Pin's *root* - never the
   * content node a display trait rebuilds, and never carrying `data-cc-control`,
   * which is what leaves it a normal drag-initiating surface.
   *
   * @returns {Element|null} the handle, or null in headless mode
   */
  _ensureGrabHandle(pin) {
    if (this._grabHandle) return this._grabHandle;
    if (!pin.element || typeof document === 'undefined') return null;

    const handle = document.createElement('div');
    handle.className = GRAB_HANDLE_CLASS;
    // Chrome, not content: the Pin is announced by its control and its label, and
    // an unlabelled grip div in the accessibility tree is noise.
    handle.setAttribute('aria-hidden', 'true');
    handle.hidden = true;

    pin.element.appendChild(handle);
    this._grabHandle = handle;
    return handle;
  }

  /** Take the handle back out of the DOM; a chromed Pin carries none at all. */
  _removeGrabHandle() {
    if (!this._grabHandle) return;
    if (this._grabHandle.parentNode) {
      this._grabHandle.parentNode.removeChild(this._grabHandle);
    }
    this._grabHandle = null;
  }
}

/** SelectableTrait: the select add-on on a Pin (`is-selected`, the `select` signal). */
export class SelectableTrait extends classFromTrait(selectBehaviour, 'selectable') {
  select(pin) {
    applySelection(this, pinHandle(pin), true);
  }

  deselect(pin) {
    applySelection(this, pinHandle(pin), false);
  }

  /** @returns {boolean} the new selection */
  toggle(pin) {
    applySelection(this, pinHandle(pin), !this.selected);
    return this.selected;
  }
}

/**
 * PhysicsTrait: the physics add-on's drift field on a Pin. The Pin's particle
 * integrates it (unpinned while the trait holds), and only while the Pin is awake.
 */
export class PhysicsTrait extends classFromTrait(physicsBehaviour, 'physics') {
  onAttach(pin) {
    pin.particle.pinned = false;
  }

  onDetach(pin) {
    pin.particle.pinned = true;
  }

  onTick(pin, dt) {
    if (!this.floatDrift || pin.particle.pinned || !pin.active) return;
    const { fx, fy } = driftForce(this, pin.particle.x, pin.particle.y, pin.particle.getPrimaryVector());
    // Scaled by dt: drift is an acceleration over time, not a per-frame impulse.
    pin.particle.applyForce(fx * dt, fy * dt);
  }
}

/**
 * Rotate a Pin's primary vector by `deltaDeg` and mirror the result into its
 * `angle` content. Free function rather than a trait: rotation is an operation
 * on a Pin, it carries no per-Pin state to compose.
 *
 * Both writes are content writes, so both invalidate: an attached Pin repaints
 * in the next frame's write phase and an unattached one repaints synchronously,
 * exactly as `setContent` and `setVectors` promise. Rendering here as well would
 * be a third repaint the model never asked for - and, mid-edit, one the edit
 * lock has already deferred.
 *
 * Returns the normalised angle in [0, 360).
 */
export function rotatePin(pin, deltaDeg) {
  const current = Number(pin.particle.getPrimaryVector()) || 0;
  const delta = Number(deltaDeg) || 0;
  const angle = ((current + delta) % 360 + 360) % 360;

  pin.setVectors([angle, pin.particle.getVector(1)]);
  pin.setContent('angle', angle);

  return angle;
}
