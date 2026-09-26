/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The frame: one simulation-and-render step, the loop that repeats it, and the
 * context both are expressed in.
 *
 * The session owns the loop's *state* - `running`, `rafId`, `_lastTs`, and the
 * `_appliedViewport` triple the camera is diffed against; this module owns the
 * transitions, the same way `./navigation.js` owns focus transitions and
 * `./pointer.js` owns gesture ones. Free functions taking the session first.
 *
 * The order inside `tick` is the whole of it: the camera is advanced and
 * published *before* the context is built, so every consumer of that frame -
 * traits, the render gating, the cursors - reads one camera rather than two.
 * `regraph` sits here for the same reason: it is a render pass over the graph,
 * expressed in the same context a frame is, just not driven by the clock.
 */
import { renderSessionCursors } from './cursors.js';
import { FRAME_MS, frameDelta } from '../core/frame.js';

/**
 * The clock lives in the core frame (`../core/frame.js`): the two constants
 * and `frameDelta`, which reads and writes the session's `_lastTs` exactly as
 * it always did. Re-exported under their old names.
 */
export { FRAME_MS, MAX_FRAME_DELTA_MS, frameDelta } from '../core/frame.js';

/** Start the animation loop; a session already running is left alone. */
export function start(session) {
  if (session.running) return;
  session.running = true;
  session._lastTs = null;
  if (typeof requestAnimationFrame !== 'undefined') {
    session.rafId = requestAnimationFrame(session._loop);
  }
}

/** Stop the animation loop and cancel the frame already asked for. */
export function stop(session) {
  session.running = false;
  if (session.rafId && typeof cancelAnimationFrame !== 'undefined') {
    cancelAnimationFrame(session.rafId);
    session.rafId = null;
  }
}

/** The per-frame context handed to every trait, render pass, and cursor. */
export function frameContext(session) {
  return {
    session,
    viewport: session.viewport,
    hostRect: session._hostRect,
    svgLayer: session.svgLayerElement,
    overlay: session.overlayElement,
    focusedPin: session.focusedPin,
    pinMap: session.pinManager.pins,
    // The render root's participation test travels with the frame: a trait
    // that resolves Pins of its own (a connector reaching for its targets)
    // applies the same rule the renderer does.
    participates: session._participates
  };
}

/**
 * Execute one simulation & render frame.
 * `dt` is expressed in reference frames (1 = one 60Hz frame).
 */
export function tick(session, dt = 1) {
  // 1. Advance camera animation (real milliseconds), then publish the result
  //    so the frame's context and the render gating agree on one camera.
  session.viewport.update(dt * FRAME_MS);
  syncViewportVersion(session);

  const context = frameContext(session);

  // 2. Advance particle physics
  session.particleEngine.tick(dt);

  // 3. Step Pin traits & hierarchy
  session.pinManager.tickAll(dt, context);

  // 4. Conjugate render pass (structure -> batched reads -> writes), including
  //    the canvas plane transform and the per-trait global SVG groups.
  session.renderer.frame(context);

  // 5. Cursors, in screen space on top of everything. Runs after the frame so
  //    it sees final geometry, and while the frame's dirt is still readable.
  renderSessionCursors(session, context);
}

/**
 * Tell the renderer the camera moved, by comparing the live viewport triple
 * against the one last handed over. Pan, zoom, and animation steps all land
 * here, so no call site has to remember to invalidate.
 *
 * A camera move is also the cheapest reliable moment to re-read the host box:
 * it is rare, and every screen-space projection downstream depends on it.
 *
 * @returns {boolean} true when the camera had in fact moved
 */
export function syncViewportVersion(session) {
  const { x, y, scale } = session.viewport;
  const applied = session._appliedViewport;

  if (applied && applied.x === x && applied.y === y && applied.scale === scale) {
    return false;
  }

  session._appliedViewport = { x, y, scale };
  session._refreshHostRect();
  session.renderer.bumpViewportVersion();
  return true;
}

/**
 * Re-run a trait across the graph: apply `fn` to every Pin carrying `traitName`,
 * then re-render it. The manager's trait index is the lookup - the registry holds
 * definitions only, never live instances.
 *
 * @returns {Pin[]} the Pins that were regraphed
 */
export function regraph(session, traitName, fn) {
  const pins = session.pinManager.getPinsByTrait(traitName);
  if (pins.length === 0) return pins;

  const context = frameContext(session);
  for (const pin of pins) {
    if (typeof fn === 'function') fn(pin);
    pin.render(context);
  }

  return pins;
}

/** One turn of the loop: tick this frame, then ask for the next. */
export function loopStep(session, timestamp) {
  if (!session.running) return;
  session.tick(frameDelta(session, timestamp));
  if (typeof requestAnimationFrame !== 'undefined') {
    session.rafId = requestAnimationFrame(session._loop);
  }
}
