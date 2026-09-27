/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The root: what `blit('#app')` does to its host. Two layers go inside it - the plane, carrying the camera
 * transform and every blit, and the screen-space overlay on top (existing layers are adopted) - and the frame
 * machinery lives on the host's state. The host is itself a blit (`app.blits` are the plane's direct blits); it
 * renders one blit as its world (`view`) and indexes its blits by id, parked ones included.
 */
import { Camera } from './camera.js';
import { CORE_CSS, CORE_STYLE_ID, OVERLAY_ATTR, PLANE_ATTR, injectStyle } from './css.js';
import { DEFAULT_HOST_RECT, createRoot, measureBlits, paintBlits, schedule } from './frame.js';
import { formatTransform3D } from './port.js';
import { BLIT_ATTR, MAX_DEPTH, ROOT_ATTR, isWithin, parentElementOf, rootOf, stateOf } from './state.js';
import { runTraits, stopTraits } from './use.js';

/** The existing direct child carrying `attribute`, or a fresh one appended. */
function adoptOrCreate(host, attribute) {
  const existing = host.querySelector(`:scope > [${attribute}]`);
  if (existing) return existing;
  const element = document.createElement('div');
  element.setAttribute(attribute, '');
  host.appendChild(element);
  return element;
}

/** Turn a host's state into a root - layers, camera, frame loop - kept as `state.root`. */
export function mountRoot(state) {
  const host = state.el;
  injectStyle(CORE_STYLE_ID, CORE_CSS);
  host.setAttribute(ROOT_ATTR, '');

  const plane = adoptOrCreate(host, PLANE_ATTR);
  const root = createRoot({ host, plane, overlay: adoptOrCreate(host, OVERLAY_ATTR), camera: new Camera() });
  root.hostRect = hostRectOf(host);
  root.demoted = new Set();
  // The root's own passes, registered before any hook: measure first, paint first, then the camera transform.
  root.hooks.read.add(() => measureBlits(root));
  root.hooks.write.add(() => paintBlits(root));
  root.hooks.write.add((ctx) => planePass(root, ctx));

  state.root = root;
  return root;
}

/** Rewrite the plane's transform on the frames the camera moved. */
function planePass(root, ctx) {
  if (!ctx.cameraMoved) return;
  const { x, y, scale } = root.camera;
  root.plane.style.transform = formatTransform3D(x, y, 0, scale);
}

/** The host's client box, or the default framing box without one. */
function hostRectOf(host) {
  const rect = host.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 ? rect : DEFAULT_HOST_RECT;
}

/** Join the root the element sits under; a top-level element moves onto the plane. Its traits start here. */
export function attachBlit(state) {
  const root = rootOf(state);
  if (parentElementOf(state.el) === root.host && state.el.parentElement !== root.plane) root.plane.appendChild(state.el);
  root.dirty.add(state);
  root.measure.add(state);
  indexBlit(root, state.el);
  if (root.view) demoteOne(root, state.el);
  schedule(root);
  runTraits(state);
}

/** The root a blit belongs to, read through anchors, so a parked blit's is found too. */
export function heldRootOf(element) {
  let node = element;
  for (let depth = 0; node && !stateOf(node)?.root && depth < MAX_DEPTH; depth += 1) node = parentElementOf(node);
  return node ? stateOf(node)?.root ?? null : null;
}

/** Take `element` and every blit inside it, parked ones included, out of the root's frame, traits and index. */
export function releaseBlits(root, element) {
  for (const each of [element, ...element.querySelectorAll(`[${BLIT_ATTR}]`)]) {
    const state = stateOf(each);
    root.demoted?.delete(each);
    unindexBlit(root, each);
    root.dirty.delete(state);
    root.measure.delete(state);
    if (state) stopTraits(state);
  }
  // A parked blit hangs behind an anchor comment: no comment inside, nothing parked inside.
  if (!element.ownerDocument.createTreeWalker(element, NodeFilter.SHOW_COMMENT).nextNode()) return;
  const parked = Array.from(root.ids.values()).filter((indexed) => !indexed.isConnected && isWithin(element, indexed));
  for (const indexed of parked) unindexBlit(root, indexed);
}

/** Index blit `element` under `id` (its own by default), replacing any entry it had; no id, no entry. */
export function indexBlit(root, element, id = element.id) {
  unindexBlit(root, element);
  const state = stateOf(element);
  if (!id || !state) return;
  root.ids.set(String(id), element);
  state.id = String(id);
}

/** Drop `element`'s entry, if it still holds it (a stale `state.id` then matches nothing). */
export function unindexBlit(root, element) {
  const id = stateOf(element)?.id;
  if (id && root.ids.get(id) === element) root.ids.delete(id);
}

/** The blit element indexed under `id`, else a `[data-blit]` under the host carrying it, else null. */
export function findBlit(root, id) {
  const key = String(id);
  return root.ids.get(key) ?? root.host?.querySelector(`[${BLIT_ATTR}][id="${key.replace(/["\\]/g, '\\$&')}"]`) ?? null;
}

/** Promote `element` as the rendered world; null or the host is the whole root. @returns {boolean} changed */
export function setViewRoot(root, element) {
  const next = element && element !== root.host ? element : null;
  if (next === root.view) return false;
  root.view = next;
  root.chain = next ? new Set() : null;
  for (let node = next, depth = 0; node && depth < MAX_DEPTH; depth += 1, node = parentElementOf(node)) root.chain.add(node);
  return true;
}

/** Whether the view root lets `element` take part: inside it, or on the branch above it. */
export function allows(root, element) {
  return !root.view || root.chain.has(element) || isWithin(root.view, element);
}

/** Show what the last promotion hid, then hide the top of every branch the view root does not allow. */
export function demoteOthers(root) {
  for (const element of root.demoted) element.hidden = false;
  root.demoted.clear();
  if (!root.view) return;
  for (const element of root.host.querySelectorAll(`[${BLIT_ATTR}]`)) demoteOne(root, element);
}

/** Hide a disallowed blit whose parent is allowed; one hidden by its author stays the author's. */
function demoteOne(root, element) {
  if (element.hidden || allows(root, element) || !allows(root, parentElementOf(element))) return;
  element.hidden = true;
  root.demoted.add(element);
}
