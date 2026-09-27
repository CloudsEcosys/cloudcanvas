/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The session on the core frame (`../core/frame.js`): the root it runs on, the
 * passes it adds to the renderer's (`./passes.js`), the context every pass is
 * expressed in, and the start/stop of the one loop.
 *
 * The session contributes three passes and one busy rule: physics and trait
 * ticks in the read phase (before measurement), cursors last in the write phase
 * (on top of final geometry), and a live physics drift as a reason to keep
 * running. Everything else - waking on an edit, a move, a camera flight - is the
 * core's `schedule`, reached through the renderer's `wake` and the camera's
 * `onWake`. `regraph` sits here too: a render pass over the graph, expressed in
 * the frame's context, just not driven by the clock.
 */
import { renderSessionCursors } from './cursors.js';
import { createRoot, measureBlits, paintBlits, runFrame, schedule } from '../core/frame.js';
import { pinOf } from '../pins/pin-hierarchy.js';

/**
 * The session's frame root: its viewport is the camera, and it is born stopped
 * so a session constructed without a container renders only by hand until mount.
 * It is a core root too (`./host.js` adopts it onto the host at mount), so a core
 * blit made inside it is measured and painted by the core's own passes, first in
 * their phases as on a `blit('#app')` root (`../core/root.js`).
 */
export function createSessionFrame(session) {
  const root = createRoot({ camera: session.viewport, running: false });
  root.demoted = new Set();
  root.hooks.read.add(() => measureBlits(root));
  root.hooks.write.add(() => paintBlits(root));
  return root;
}

/** The passes the session threads into the renderer's registration (`./passes.js`). */
export function sessionPasses(session) {
  return {
    context: () => frameContext(session),
    read: [
      (ctx) => stepPhysics(session, ctx.dt),
      (ctx) => tickPins(session.pinManager, ctx.dt, session.renderer.context)
    ],
    write: [() => renderSessionCursors(session, session.renderer.context)],
    busy: [() => hasLiveMotion(session)]
  };
}

/** Start the loop; a session already running is left alone. */
export function start(session) {
  const root = session._frame;
  if (root.running) return;
  root.running = true;
  root._lastTs = null;
  // A freshly mounted session always has work; the loop idles once it settles.
  schedule(root);
}

/** Stop the loop and cancel the frame already asked for. */
export function stop(session) {
  const root = session._frame;
  root.running = false;
  if (root.rafId !== null && typeof cancelAnimationFrame !== 'undefined') {
    cancelAnimationFrame(root.rafId);
  }
  root.rafId = null;
}

/** Execute one frame by hand. `dt` is in reference frames (1 = one 60Hz frame). */
export function tick(session, dt = 1) {
  return runFrame(session._frame, dt);
}

/** The per-frame context handed to every trait, render pass, and cursor. */
export function frameContext(session) {
  return {
    session,
    viewport: session.viewport,
    hostRect: session.getHostRect(),
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

/** Tick every root Pin, utility Pins included; each ticks its own active children. */
function tickPins(manager, dt, context) {
  for (const pin of manager.pins.values()) {
    if (!pin.parent) pin.tick(dt, context);
  }
}

/**
 * Advance physics. A particle about to move (unpinned, with velocity) marks its
 * Pin for placement first, so the write phase places exactly the Pins that moved.
 */
function stepPhysics(session, dt) {
  const engine = session.particleEngine;
  for (const particle of engine.pins.values()) {
    if (particle.pinned || (particle.vx === 0 && particle.vy === 0)) continue;
    const pin = pinOf(particle.element);
    if (pin) session.renderer.invalidate(pin, 'placement');
  }
  engine.tick(dt);
}

/** True when an awake, unpinned physics Pin is drifting and so owes a frame. */
function hasLiveMotion(session) {
  for (const pin of session.pinManager.indexedByCapability('floatable')) {
    if (pin.active && pin.particle && !pin.particle.pinned) return true;
  }
  return false;
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
