/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Placement: where a new Pin goes when the caller does not care, only that it
 * does not land on top of something else.
 *
 * `Math.random()` is the usual answer and it is the wrong one twice over: it
 * overlaps anyway (a uniform sample knows nothing about what is already there),
 * and it makes the canvas untestable, because the same script produces a
 * different layout every run. This is the deterministic replacement: the same
 * canvas and the same request always produce the same point.
 *
 * The search is a ring spiral around an anchor. Rings, not a grid, because the
 * answer wanted is "as close to the anchor as possible" and a ring enumerates
 * candidates in exactly that order; the sample count grows with the radius so
 * angular resolution stays roughly constant as the rings get longer.
 *
 * The search itself knows nothing about where it is searching. What is occupied
 * arrives as a function, so the same ring spiral serves both scopes:
 *
 *   - no `within`: canvas space, occupancy is `session.queryBox` (the spatial
 *     index the rest of the engine uses), and the result is a *top-left* corner
 *     ready to hand straight to `createPin({ x, y })`.
 *   - `within: parent`: the parent's own scope, occupancy is its children's
 *     boxes, and the result is *parent-local* - which is the coordinate space a
 *     child Pin's particle already lives in, so it goes straight to
 *     `createPin({ parent, x, y })`.
 */

/* The ring spiral and its box maths are the place add-on's (`../addons/place.js`): one implementation. */
import { boxOf, centroidOf, explicitAnchor, occupancyOf, spiral } from '../addons/place.js';

/**
 * Find a free top-left corner for a box of `width` x `height`.
 *
 * @param {CloudCanvasSession} session
 * @param {object} [options]
 * @param {number} [options.width=200]
 * @param {number} [options.height=120]
 * @param {Pin|string} [options.within] search this Pin's scope instead of the
 *   canvas; the result is parent-local
 * @param {Pin|string} [options.near] place beside this Pin (or Pin id), read in
 *   the same space the search runs in
 * @param {{x: number, y: number}} [options.anchor] explicit centre, in the same
 *   space the search runs in
 * @param {number} [options.margin=24] clearance kept from existing Pins
 * @returns {{x: number, y: number}} top-left corner - canvas space, or
 *   parent-local when `within` was given
 */
export function place(session, options = {}) {
  const box = boxOf(options);
  const scope = scopeFor(session, options);
  return spiral(scope.occupancy, anchorFor(session, scope, options, box), box);
}

/* ------------------ OCCUPANCY ------------------ */

/**
 * The space this search runs in: what is occupied, and what it is occupied by.
 *
 * Both occupancy functions answer the same question in different coordinate
 * spaces, which is the whole reason the search takes a function: a scope has no
 * entry in the canvas-wide spatial index (its children are positioned relative
 * to it), so a global query would answer about the wrong space entirely.
 *
 * The scoped boxes are snapshotted once and shared with the anchor, so the
 * search and the point it starts from can never disagree about what is there.
 *
 * @returns {{parent: Pin|null, boxes: object[]|null,
 *            occupancy: (minX: number, minY: number, maxX: number, maxY: number) => Array}}
 */
function scopeFor(session, options) {
  if (options.within === undefined || options.within === null) {
    return {
      parent: null,
      boxes: null,
      occupancy: (minX, minY, maxX, maxY) => session.queryBox(minX, minY, maxX, maxY)
    };
  }

  const parent = resolvePin(session, options.within);
  if (!parent) {
    throw new TypeError(`place: within "${idOf(options.within)}" is not a Pin in this session`);
  }

  const boxes = occupiedChildBoxes(parent);
  return {
    parent,
    boxes,
    occupancy: occupancyOf(boxes)
  };
}

/** Parent-local boxes of every child that occupies space. */
function occupiedChildBoxes(parent) {
  const boxes = [];
  for (const child of parent.children) {
    // A utility Pin is machinery, not content, exactly as `queryBox` treats it.
    if (!child || child.utility || !child.particle) continue;
    boxes.push(child.particle.getBounds());
  }
  return boxes;
}

/**
 * Where the search starts, in whichever space the search runs in.
 *
 * Precedence is explicit intent first, in both spaces: a caller-supplied
 * `anchor`, then the centre of the Pin the new one belongs beside. What follows
 * differs, because the two spaces have different answers to "where is the user
 * looking":
 *
 *   - canvas: the middle of the viewport, the only sensible default because a
 *     Pin placed outside it may as well not exist.
 *   - a scope: the centroid of what is already in it, so a scope fills outwards
 *     from its own contents rather than from a corner - and, for an empty scope,
 *     the top-left inset by one margin, because there is nothing to be near and
 *     a deterministic corner is what a first child wants.
 */
function anchorFor(session, scope, options, box) {
  const anchor = explicitAnchor(options.anchor);
  if (anchor) return anchor;

  const near = resolvePin(session, options.near);
  if (near) return scope.parent ? localCentre(near) : globalCentre(near);
  if (!scope.parent) return viewportCentre(session);

  const centroid = centroidOf(scope.boxes);
  if (centroid) return centroid;

  // The centre whose corner is exactly (margin, margin).
  return { x: box.margin + box.width / 2, y: box.margin + box.height / 2 };
}

/** The centre of a Pin's box in its own parent's space. */
function localCentre(pin) {
  const bounds = pin.particle.getBounds();
  return { x: bounds.centerX, y: bounds.centerY };
}

/** The centre of a Pin's box in canvas space. */
function globalCentre(pin) {
  const bounds = pin.getGlobalBounds();
  return { x: bounds.centerX, y: bounds.centerY };
}

/** The canvas-space point currently at the middle of the host box. */
function viewportCentre(session) {
  const hostRect = session.getHostRect();
  const left = hostRect.left || 0;
  const top = hostRect.top || 0;
  return session.viewport.screenToCanvas(
    left + (hostRect.width || 0) / 2,
    top + (hostRect.height || 0) / 2,
    hostRect
  );
}

/** A Pin argument that may be an id, a Pin, or nothing. */
function resolvePin(session, pinOrId) {
  if (!pinOrId) return null;
  const pin = typeof pinOrId === 'string' ? session.getPin(pinOrId) : pinOrId;
  return pin && typeof pin.getGlobalBounds === 'function' ? pin : null;
}

/** How to name an unresolvable Pin argument in an error. */
function idOf(pinOrId) {
  if (typeof pinOrId === 'string') return pinOrId;
  return (pinOrId && pinOrId.id) || String(pinOrId);
}
