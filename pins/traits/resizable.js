/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * ResizableTrait: the resize add-on (`../../addons/resize.js`) on a Pin, made
 * by `classFromTrait` - handles, threshold, clamping and the `resize:start` /
 * `resize:end` signals all live there, once.
 *
 * Opt-in, and *that is the toggle*: a Pin is resizable exactly while it holds
 * this trait; `removeTrait('resizable')` takes its handles with it. On a Pin
 * the session's pointer router delivers the gesture (every handle carries
 * `data-cc-control`, so the router declines the deferred capture and the drag
 * stands down), and a new box is applied by `resizePin`, which is the whole of
 * the particle-size-to-rendered-size propagation.
 */
import { classFromTrait, pinHandle } from '../../addons/class-from-trait.js';
import { handlesVisible, resizeBehaviour, syncHandles } from '../../addons/resize.js';

export {
  MIN_RESIZE,
  RESIZE_DIRECTIONS,
  RESIZE_HANDLE_ATTR,
  RESIZE_HANDLE_CLASS,
  RESIZING_CLASS
} from '../../addons/resize.js';
export { resizePin } from '../../addons/class-from-trait.js';

/**
 * Options: `directions`, `minWidth`/`minHeight`, `maxWidth`/`maxHeight`,
 * `alwaysVisibleHandles` (a Pin with no selection to follow needs it).
 */
export class ResizableTrait extends classFromTrait(resizeBehaviour, 'resizable') {
  /** Selected-only by default; always while resizing or with `alwaysVisibleHandles`. */
  handlesVisible(pin) {
    return handlesVisible(this, pin ? pinHandle(pin) : null);
  }

  /** Mirror `handlesVisible` onto every handle. @returns {boolean} whether they show */
  syncHandles(pin) {
    return syncHandles(this, pin ? pinHandle(pin) : null);
  }
}
