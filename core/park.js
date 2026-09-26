/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Parking: an element that leaves the document while its blit stays in the
 * tree leaves a Comment anchor in its place. The anchor keeps the element's
 * logical ancestry readable (`parentElementOf` walks through it) and its
 * position among its siblings, so the element returns to exactly where it was.
 */
import { stateOf } from './state.js';

/** @type {WeakMap<Comment, import('./state.js').BlitState>} anchor -> the record it holds a place for */
const OWNERS = /* @__PURE__ */ new WeakMap();

/** The record an anchor node holds a place for, or undefined for any other node. */
export function parkedStateOf(node) {
  return OWNERS.get(node);
}

/** Take the element out, leaving an anchor where it was. @returns {boolean} whether it moved */
export function park(state) {
  const element = state.el;
  if (state.anchor || !element.parentNode) return false;

  // Two plain moves rather than `replaceChild`: the same two writes the frame's
  // read/write discipline is observed at, so a park is never an invisible one.
  const anchor = element.ownerDocument.createComment(`blit ${element.id || ''}`);
  element.parentNode.insertBefore(anchor, element);
  element.parentNode.removeChild(element);
  state.anchor = anchor;
  OWNERS.set(anchor, state);
  return true;
}

/** Put the element back at its anchor. @returns {boolean} false when there was no live anchor */
export function unpark(state) {
  const anchor = state.anchor;
  if (!anchor) return false;

  state.anchor = null;
  OWNERS.delete(anchor);
  if (!anchor.parentNode) return false;
  anchor.parentNode.insertBefore(state.el, anchor);
  anchor.parentNode.removeChild(anchor);
  return true;
}

/** Forget the anchor and take it out of the tree; the element stays where it is. */
export function dropAnchor(state) {
  const anchor = state.anchor;
  if (!anchor) return false;

  state.anchor = null;
  OWNERS.delete(anchor);
  if (anchor.parentNode) anchor.parentNode.removeChild(anchor);
  return true;
}

/**
 * Put the element in `container`: back at its anchor when the anchor is there,
 * otherwise appended (any anchor elsewhere is dropped).
 * @returns {boolean} whether the element moved
 */
export function place(state, container) {
  if (state.el.parentNode === container) return false;
  if (state.anchor && state.anchor.parentNode === container) return unpark(state);

  dropAnchor(state);
  container.appendChild(state.el);
  return true;
}

/** Leave the tree entirely: the element out, and no anchor left behind. */
export function detach(state) {
  dropAnchor(state);
  if (!state.el.parentNode) return false;
  state.el.parentNode.removeChild(state.el);
  return true;
}

/** The node standing for an element in its parent: the anchor while parked, else the element. */
export function nodeOf(element) {
  const state = stateOf(element);
  return state && state.anchor ? state.anchor : element;
}
