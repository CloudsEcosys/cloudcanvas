/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * focus: the blit as a zoom target. Its options say how the camera frames it -
 * `padding` (50) and `maxZoom` (3) - and with `focusOnClick` a click that
 * barely moved (under 5px) frames it.
 *
 *   blit.use({ focus });
 *   app.blit({ focus: { focusOnClick: true } });
 *
 * On a core blit that click moves `is-focused` onto it from the root's
 * previously focused blit, frames it through the root's `view()`, and announces
 * `focus:change` (payload `true`) on it and `focus:change` (`false`) on the one it
 * left.
 */
import { schedule } from '../core/frame.js';
import { stateOf } from '../core/state.js';
import { CLICK_TRAVEL_PX, coordinate, defineTrait } from './trait.js';

/** The class the focused element carries. */
export const FOCUSED_CLASS = 'is-focused';

function init(options) {
  return {
    padding: options.padding !== undefined ? Number(options.padding) : 50,
    maxZoom: options.maxZoom !== undefined ? Number(options.maxZoom) : 3.0,
    focusOnClick: Boolean(options.focusOnClick),
    promote: options.promote !== false,
    _downX: null,
    _downY: null
  };
}

/** Record where the press started, to tell a click from a drag. @returns {true} */
export function pressFocus(s, b, event) {
  s._downX = coordinate(event?.clientX);
  s._downY = coordinate(event?.clientY);
  return true;
}

/** Forget the press. @returns {boolean} whether it was a click: both ends known, under `CLICK_TRAVEL_PX` apart */
export function clickReleased(s, event) {
  const downX = s._downX;
  const downY = s._downY;
  s._downX = null;
  s._downY = null;
  if (downX === null || downY === null) return false;
  if (!Number.isFinite(event?.clientX) || !Number.isFinite(event?.clientY)) return false;
  return Math.hypot(event.clientX - downX, event.clientY - downY) < CLICK_TRAVEL_PX;
}

/**
 * Move the focus onto `b` and frame it in its root, as the root's `view()`
 * would. @returns {{x: number, y: number, scale: number}} the resolved camera
 */
export function focusBlit(s, b, root) {
  const previous = root.host.querySelector(`.${FOCUSED_CLASS}`);
  if (previous && previous !== b.el) {
    previous.classList.remove(FOCUSED_CLASS);
    stateOf(previous)?.handle?.emit('focus:change', false);
  }
  if (!b.el.classList.contains(FOCUSED_CLASS)) {
    b.el.classList.add(FOCUSED_CLASS);
    b.emit('focus:change', true);
  }
  const { x, y, w, h } = b.bounds;
  const camera = root.camera.fit({ x, y, width: w, height: h }, root.hostRect, { padding: s.padding, maxZoom: s.maxZoom });
  schedule(root);
  return camera;
}

/** A click on a core blit, with `focusOnClick`, focuses it. */
function release(s, b, event, env) {
  if (!clickReleased(s, event) || !s.focusOnClick) return false;
  focusBlit(s, b, env.root);
  return true;
}

/** Native only: a focused blit that stops being focussable gives the focus up. */
function mount(s, b) {
  return () => {
    if (!b.el.classList.contains(FOCUSED_CLASS)) return;
    b.el.classList.remove(FOCUSED_CLASS);
    b.emit('focus:change', false);
  };
}

/** The behaviour both shells share; the click's outcome is each shell's own. */
export const focusBehaviour = {
  capabilities: ['focussable', 'zoom-target'],
  init,
  press: pressFocus
};

export const focus = /* @__PURE__ */ defineTrait(focusBehaviour, { release, mount });
