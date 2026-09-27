/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * drag: a press, past a 3px threshold, moves the blit with the pointer.
 *
 *   blit.use({ drag });
 *   app.blit({ x: 100, y: 100, drag: true });
 *
 * Two signals, both keyed on the threshold rather than the press, so a click is
 * silent: `drag:start` `{x, y}`, the position left from, and `drag:end`
 * `{x, y, cancelled}`, the one come to rest at (`cancelled` when the gesture was
 * taken away rather than released). The blit carries `is-dragging` while
 * pressed. A press on a control (`isControlTarget`) is the page's and never drags.
 */
import { coordinate, defineTrait, isControlTarget, passedThreshold } from './trait.js';

/** The class the element carries while a drag press is live. */
export const DRAGGING_CLASS = 'is-dragging';

/** A fresh drag record: the press, and whether it has become a drag. */
function init() {
  return { dragging: false, dragOffset: { x: 0, y: 0 }, _downX: null, _downY: null, _translating: false };
}

/**
 * Arm a drag, unless the press landed on a control. The offset is measured at
 * the press, so once the threshold is crossed the blit follows the pointer
 * exactly, travel already spent included.
 * @returns {boolean} whether a drag was armed
 */
export function pressDrag(s, b, event, env) {
  if (isControlTarget(event ? event.target : null)) return false;

  s.dragging = true;
  s._translating = false;
  s._downX = coordinate(event?.clientX);
  s._downY = coordinate(event?.clientY);
  if (b.el && b.el.classList) b.el.classList.add(DRAGGING_CLASS);

  const at = env.point(event);
  s.dragOffset = { x: at.x - b.x, y: at.y - b.y };
  return true;
}

/** Follow the pointer once it has gone somewhere; the first such move announces `drag:start`. */
export function moveDrag(s, b, event, env) {
  if (!s.dragging) return;
  if (!s._translating && !passedThreshold(s, event)) return;

  if (!s._translating) {
    s._translating = true;
    b.emit('drag:start', { x: b.x, y: b.y });
  }
  const at = env.point(event);
  b.set({ x: at.x - s.dragOffset.x, y: at.y - s.dragOffset.y });
}

/** End the press. @returns {boolean} whether it had become a drag */
export function releaseDrag(s, b) {
  const translated = s._translating;
  s._downX = null;
  s._downY = null;
  s._translating = false;

  if (s.dragging) {
    s.dragging = false;
    if (b.el && b.el.classList) b.el.classList.remove(DRAGGING_CLASS);
  }
  return translated;
}

/** Announce where the drag came to rest; no event is the cancellation convention. */
export function endDrag(b, event) {
  b.emit('drag:end', { x: b.x, y: b.y, cancelled: event === undefined });
  return true;
}

/** `releaseDrag` then, for a real drag, `endDrag`. @returns {boolean} whether `drag:end` was announced */
function release(s, b, event) {
  return releaseDrag(s, b) ? endDrag(b, event) : false;
}

/** The behaviour both shells share (`./class-from-trait.js` builds `DraggableTrait` from it). */
export const dragBehaviour = {
  capabilities: ['interactive', 'movable'],
  init,
  press: pressDrag,
  move: moveDrag,
  release,
  detach: (s, b) => release(s, b)
};

export const drag = /* @__PURE__ */ defineTrait(dragBehaviour);
