/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The core frame, observed at the DOM prototypes: reads before writes, an
 * idle root writes nothing and asks for no frame, ports run in the write
 * phase with their context, and `tick` hooks run in their phase.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { blit, type } from '../../core/index.js';
import { stateOf } from '../../core/state.js';
import { loopStep, runFrame, frameDelta, FRAME_MS, MAX_FRAME_DELTA_MS } from '../../core/frame.js';
import { installDomSpy } from '../helpers/dom-spy.js';
import { resetDocument } from '../helpers/dom.js';

const CARD_HTML = '<h3 data-slot="title"></h3><div data-scope></div>';

/**
 * A root with a nested scene, and a stubbed `requestAnimationFrame` so frames
 * run only when the test says so. The stub counts requests.
 */
function scene(t) {
  const requests = [];
  const realRaf = globalThis.requestAnimationFrame;
  globalThis.requestAnimationFrame = (fn) => { requests.push(fn); return requests.length; };
  t.after(() => { globalThis.requestAnimationFrame = realRaf; resetDocument(); });

  const host = document.createElement('div');
  host.style.width = '1024px';
  host.style.height = '768px';
  document.body.appendChild(host);

  type('frame-card', { html: CARD_HTML, defaults: { w: 200, h: 100 } });
  const app = blit(host);
  const card = app.blit({ type: 'frame-card', x: 10, y: 10, fill: { title: 'Root' } });
  const kid = card.blit({ type: 'frame-card', x: 20, y: 20, fill: { title: 'Kid' } });
  return { app, card, kid, root: stateOf(host).root, requests };
}

/** Assert that no read follows the first write. */
function assertReadsBeforeWrites(entries) {
  const firstWrite = entries.findIndex((entry) => entry.kind === 'write');
  assert.ok(firstWrite >= 0, 'the frame wrote nothing');
  const lateReads = entries.slice(firstWrite).filter((entry) => entry.kind === 'read');
  assert.deepEqual(lateReads, [], 'a layout read happened after the first write');
}

test('frame - every layout read precedes the first write; the plane transform is last', (t) => {
  const { root, requests } = scene(t);
  assert.equal(requests.length, 1, 'building the scene asked for exactly one frame');

  const spy = installDomSpy();
  t.after(spy.restore);
  root.loop(16);

  const entries = spy.entries.slice();
  assert.equal(entries[0].kind, 'read');
  assert.equal(entries[0].name, 'getBoundingClientRect');
  assert.ok(entries.some((entry) => entry.kind === 'read' && entry.name === 'offsetWidth'));
  assert.ok(entries.some((entry) => entry.kind === 'read' && entry.name === 'offsetLeft'), 'the scope offset was not read');
  assertReadsBeforeWrites(entries);

  const writes = entries.filter((entry) => entry.kind === 'write').map((entry) => entry.name);
  assert.equal(writes[writes.length - 1], 'style.transform', 'the plane transform is the last write');
  assert.equal(root.plane.style.transform, 'translate3d(0.00px, 0.00px, 0.00px)');
});

test('frame - the plane composites while the camera moves, and refocuses once it rests', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { root } = scene(t);
  root.loop(16);
  assert.equal(root.plane.style.willChange, 'transform', 'a moving camera keeps the plane one layer');
  t.mock.timers.tick(149);
  root.loop(32);
  assert.equal(root.plane.style.willChange, 'transform', 'not before it has rested');
  t.mock.timers.tick(1);
  root.loop(48);
  assert.equal(root.plane.style.willChange, '', 'at rest the hint goes, so the plane redraws sharp at its scale');
});

test('frame - a settled root makes zero writes, zero reads, and requests no frame', (t) => {
  const { root, requests, card } = scene(t);
  root.loop(16);
  root.loop(32);
  // The first frame wrote sizes, so the second re-measured; both asked for another.
  const asked = requests.length;

  const spy = installDomSpy();
  t.after(spy.restore);
  for (let frame = 0; frame < 5; frame += 1) {
    loopStep(root, 48 + frame * 16);
    assert.deepEqual(spy.entries, [], `frame ${frame} touched the DOM`);
  }
  assert.equal(requests.length, asked, 'an idle root asked for a frame');
  assert.equal(root.rafId, null);
  assert.equal(root._lastTs, null, 'the clock is reset when the loop goes idle');

  // Waking: one set, one request, one frame with one transform write, idle again.
  card.set({ x: 15 });
  assert.equal(requests.length, asked + 1);
  spy.clear();
  loopStep(root, 200);
  assert.deepEqual(spy.writes().map((entry) => entry.name), ['style.transform']);
  assert.deepEqual(spy.reads(), []);
  assert.equal(requests.length, asked + 1, 'a frame with nothing left asked for another');
});

test('frame - fill and data writes land at once and queue one re-measure, no late reads', (t) => {
  const { root, card } = scene(t);
  root.loop(16);
  root.loop(32);
  const spy = installDomSpy();
  t.after(spy.restore);

  card.set({ fill: { title: 'Changed' }, tone: 'warm' });
  assert.deepEqual(spy.writes().map((entry) => entry.name), ['textContent', 'setAttribute']);

  spy.clear();
  runFrame(root, 1);
  assert.ok(spy.reads().every((entry) => entry.name.startsWith('offset')));
  assert.ok(spy.reads().length > 0, 'the content change queued no measurement');
  assert.deepEqual(spy.writes(), []);
  assertReadsBeforeWrites([...spy.reads(), { kind: 'write' }]);
});

test('frame - a custom port runs in the write phase with {changed, first, camera}', (t) => {
  const { app, root } = scene(t);
  const calls = [];
  const port = (b, ctx) => calls.push({ b, changed: Array.from(ctx.changed), first: ctx.first, camera: ctx.camera });

  const drawn = app.blit({ port, x: 1, y: 2, tone: 'x' });
  // Built detached: the port already ran once, with no camera and everything changed.
  assert.equal(calls.length, 1);
  assert.equal(calls[0].b, drawn);
  assert.equal(calls[0].first, true);
  assert.equal(calls[0].camera, null);
  assert.deepEqual(calls[0].changed.sort(), ['port', 'tone', 'x', 'y']);
  assert.equal(drawn.el.style.transform, '', 'the default port did not run alongside a custom one');

  drawn.set({ x: 3, tone: 'y', w: 40 });
  assert.equal(calls.length, 1, 'an attached blit waits for the frame');
  const spy = installDomSpy();
  t.after(spy.restore);
  runFrame(root, 1);

  assert.equal(calls.length, 2);
  assert.equal(calls[1].first, false);
  assert.equal(calls[1].camera, root.camera);
  assert.deepEqual(calls[1].changed.sort(), ['tone', 'w', 'x']);
  assert.ok(root.measure.has(stateOf(drawn.el)), 'a written size is re-read next frame');
  assert.deepEqual(spy.writes().filter((entry) => entry.target === 'div' && entry.name !== 'style.transform'), []);
});

test('frame - a port that throws is dropped for the default port; the frame and the next ones go on', (t) => {
  const { app, root } = scene(t);
  const broken = app.blit({ x: 1, y: 2 });
  const fine = app.blit({ x: 5, y: 6 });
  broken.set({ port: () => { throw new Error('not a port'); } });
  fine.set({ x: 7 });
  assert.doesNotThrow(() => runFrame(root, 1));
  assert.equal(broken.el.style.transform, 'translate3d(1.00px, 2.00px, 0.00px)', 'painted by the default port');
  assert.equal(fine.el.style.transform, 'translate3d(7.00px, 6.00px, 0.00px)', 'the rest of the frame ran');
  assert.equal(broken.spec.port, undefined, 'the broken port is gone');
  broken.set({ x: 3 });
  runFrame(root, 1);
  assert.equal(broken.el.style.transform, 'translate3d(3.00px, 2.00px, 0.00px)');
});

test('frame - a blit removed after it was queued, even mid write phase, is not painted', (t) => {
  const { app, root } = scene(t);
  const painted = [];
  let doomed = null;
  const remover = app.blit({ x: 1, port: () => { painted.push('remover'); if (doomed) doomed.remove(); } });
  doomed = app.blit({ x: 2, port: () => painted.push('doomed') });

  // Both queued, remover first: its port takes doomed out of the pass it is in.
  painted.length = 0;
  runFrame(root, 1);
  assert.deepEqual(painted, ['remover']);
  assert.equal(doomed.el.isConnected, false);

  // Removed behind the handle's back by a read hook: skipped as well.
  const loose = app.blit({ x: 3, port: () => painted.push('loose') });
  app.tick(() => loose.el.remove(), 'read');
  painted.length = 0;
  runFrame(root, 1);
  assert.deepEqual(painted, []);
  assert.equal(root.dirty.size, 0);
  assert.equal(remover.el.isConnected, true);
});

test('tick - hooks run in their phase, receive the frame context, and come off', (t) => {
  const { app, root, requests } = scene(t);
  root.loop(16);
  root.loop(32);
  const order = [];
  const asked = requests.length;

  const offRead = app.tick((ctx) => order.push(['read', ctx.dt, ctx.camera === root.camera, ctx.hostRect]), 'read');
  app.tick(() => order.push(['write']));
  assert.equal(requests.length, asked + 1, 'a new hook asks for a frame');
  assert.throws(() => app.tick(() => {}, 'paint'), /unknown phase "paint"/);
  assert.throws(() => app.tick('fn'), /expected a function/);

  runFrame(root, 0.5);
  assert.deepEqual(order, [['read', 0.5, true, root.hostRect], ['write']]);

  offRead();
  order.length = 0;
  runFrame(root, 1);
  assert.deepEqual(order, [['write']]);
});

test('clock - frameDelta is the rAF-timestamp delta in reference frames, capped, on any clock', () => {
  const clock = { _lastTs: null };
  assert.equal(frameDelta(clock, 100), 1);
  assert.equal(clock._lastTs, 100);
  assert.equal(frameDelta(clock, 100 + FRAME_MS), 1);
  assert.equal(frameDelta(clock, 90), 0);
  assert.equal(frameDelta(clock, 5000), MAX_FRAME_DELTA_MS / FRAME_MS);
  assert.equal(frameDelta(clock, NaN), 1);
  assert.equal(clock._lastTs, null);
});
