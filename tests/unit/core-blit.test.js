/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The core handle: identity, `set()` routing, the DOM-derived hierarchy, the
 * spec round trip, text-only fill, native events, and removal. The event order
 * and cancel cases ported from `transmit-characterization.test.js` and
 * `transmit-event.test.js` (ledger: tests/fixtures/test-ledger.json).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { blit, type } from '../../core/index.js';
import { stateOf } from '../../core/state.js';
import { runFrame } from '../../core/frame.js';
import { resetDocument, setElementOffset } from '../helpers/dom.js';

const CARD_HTML = '<h3 data-slot="title"></h3><p data-slot="body"></p><div data-scope></div>';

/** A root over a fresh host, with the `card` type defined once. */
function scene(t) {
  const host = document.createElement('div');
  host.id = 'app';
  document.body.appendChild(host);
  t.after(resetDocument);

  type('core-card', { html: CARD_HTML, defaults: { w: 240, h: 160 } });
  const app = blit('#app');
  return { host, app, root: stateOf(host).root };
}

test('identity - the same element always answers with the same handle', (t) => {
  const { host, app } = scene(t);

  assert.equal(blit('#app'), app);
  assert.equal(blit(host), app);

  const card = app.blit({ x: 1, y: 2 });
  assert.equal(blit(card.el), card);
  assert.equal(card.el.getAttribute('data-blit'), '');
  assert.equal(host.getAttribute('data-blit'), '');
});

test('set - placement is queued to the port, fill is text, the rest is data-*', (t) => {
  const { app, root } = scene(t);
  const card = app.blit({ type: 'core-card', x: 100, y: 100, fill: { title: 'Hi', body: 'text' } });
  const title = card.el.querySelector('[data-slot="title"]');

  card.set({ x: 200, fill: { title: 'Moved' }, tone: 'warm', selectableText: true });

  // Immediate: fill and data-*. Queued: placement.
  assert.equal(title.textContent, 'Moved');
  assert.equal(card.el.getAttribute('data-tone'), 'warm');
  assert.equal(card.el.getAttribute('data-selectable-text'), 'true');
  assert.match(card.el.style.transform, /translate3d\(100\.00px, 100\.00px/);
  assert.equal(card.x, 200);

  runFrame(root, 1);
  assert.match(card.el.style.transform, /translate3d\(200\.00px, 100\.00px/);
  assert.equal(card.el.style.width, '240px');
  assert.equal(card.el.style.height, '160px');

  card.set({ tone: null });
  assert.equal(card.el.hasAttribute('data-tone'), false);
});

test('set - a bad placement or an unknown slot throws, and a root has no placement', (t) => {
  const { app } = scene(t);
  const card = app.blit({ type: 'core-card' });

  assert.throws(() => card.set({ x: 'ten' }), /x=ten is not a number/);
  assert.throws(() => card.set({ fill: { nope: 'x' } }), /no slot "nope"/);
  assert.throws(() => card.set({ fill: 'text' }), /fill must be an object/);
  assert.throws(() => app.set({ x: 10 }), /a root has no placement/);
  assert.throws(() => card.set(null), /expected an object/);
});

test('potential - a detached blit applies writes immediately', (t) => {
  scene(t);
  const loose = blit(document.createElement('div'));

  loose.set({ x: 5, y: 6, w: 50 });
  assert.match(loose.el.style.transform, /translate3d\(5\.00px, 6\.00px/);
  assert.equal(loose.el.style.width, '50px');
  assert.equal(loose.parent, null);
  assert.throws(() => loose.view(loose), /potential blit has no root/);
  assert.throws(() => loose.tick(() => {}), /potential blit has no root/);
});

test('hierarchy - parent and blits are read from the DOM, never stored', (t) => {
  const { app, root } = scene(t);
  const a = app.blit({ type: 'core-card', x: 0, y: 0 });
  const b = app.blit({ x: 10, y: 10 });

  assert.equal(a.parent, app);
  assert.deepEqual(app.blits, [a, b]);
  assert.equal(a.el.parentElement, root.plane);

  // A child moved by hand is answered by the tree it is now in.
  b.el.remove();
  a.el.querySelector('[data-scope]').appendChild(b.el);
  assert.equal(b.parent, a);
  assert.deepEqual(app.blits, [a]);
  assert.deepEqual(a.blits, [b]);
});

test('bounds - local placement summed over every ancestor blit, plus each scope container\'s offset', (t) => {
  const { app, root } = scene(t);
  const outer = app.blit({ type: 'core-card', x: 100, y: 50, w: 400, h: 300 });
  const inner = outer.blit({ type: 'core-card', x: 20, y: 30, w: 200, h: 100 });
  const leaf = inner.blit({ x: 5, y: 6, w: 10, h: 12 });
  setElementOffset(outer.el.querySelector('[data-scope]'), 0, 40);
  setElementOffset(inner.el.querySelector('[data-scope]'), 0, 40);
  runFrame(root, 1);

  assert.deepEqual(outer.bounds, { x: 100, y: 50, w: 400, h: 300 });
  assert.deepEqual(inner.bounds, { x: 120, y: 120, w: 200, h: 100 });
  assert.deepEqual(leaf.bounds, { x: 125, y: 166, w: 10, h: 12 });
  assert.equal(leaf.parent, inner);
});

test('scope - a child lands in the parent type\'s [data-scope], else in the parent element', (t) => {
  const { app } = scene(t);
  const card = app.blit({ type: 'core-card', x: 100, y: 100 });
  const kid = card.blit({ x: 10, y: 10 });
  const grandkid = kid.blit({ x: 1, y: 1 });

  assert.equal(kid.el.parentElement, card.el.querySelector('[data-scope]'));
  assert.equal(grandkid.el.parentElement, kid.el);
  assert.equal(kid.parent, card);
  assert.equal(grandkid.parent, kid);
  assert.deepEqual(card.blits, [kid]);
  assert.deepEqual(kid.bounds, { x: 110, y: 110, w: 0, h: 0 });
  assert.deepEqual(grandkid.bounds, { x: 111, y: 111, w: 0, h: 0 });
});

test('fill - text only: a hostile string lands as text, never as markup', (t) => {
  const { app } = scene(t);
  const card = app.blit({ type: 'core-card' });
  const hostile = '<img src=x onerror="window.__pwned = true">';

  card.set({ fill: { title: hostile } });

  const title = card.el.querySelector('[data-slot="title"]');
  assert.equal(title.textContent, hostile);
  assert.equal(card.el.querySelector('img'), null);
  assert.equal(title.innerHTML, '&lt;img src=x onerror="window.__pwned = true"&gt;');
  assert.equal(globalThis.__pwned, undefined);

  // A nested blit's slots are its own: the parent's fill cannot reach them.
  const kid = card.blit({ type: 'core-card', fill: { title: 'Kid' } });
  card.set({ fill: { title: 'Parent' } });
  assert.equal(kid.el.querySelector('[data-slot="title"]').textContent, 'Kid');
});

test('spec - a plain object that round-trips through blit()', (t) => {
  const { app } = scene(t);
  const card = app.blit({ type: 'core-card', x: 100, y: 100, z: 2, tone: 'warm', fill: { title: 'Hi', body: 'text' } });

  assert.deepEqual(card.spec, {
    type: 'core-card', tone: 'warm', x: 100, y: 100, z: 2, w: 240, h: 160, fill: { title: 'Hi', body: 'text' }
  });

  const copy = app.blit(card.spec);
  assert.notEqual(copy, card);
  assert.deepEqual(copy.spec, card.spec);
  assert.equal(copy.el.querySelector('[data-slot="body"]').textContent, 'text');

  // A bare blit has no slots and no declared size: the spec says only what is set.
  assert.deepEqual(app.blit({ x: 1, y: 2 }).spec, { x: 1, y: 2 });
});

test('scan - existing [data-blit] descendants are picked up with their data-* spec', (t) => {
  const host = document.createElement('div');
  host.innerHTML = '<section data-blit data-x="60" data-y="80" data-w="320" data-kind="note">'
    + '<h2>Authored</h2><div data-blit data-x="24" data-y="28"><p>Nested</p></div></section>'
    + '<p id="stray">Left alone</p>';
  document.body.appendChild(host);
  t.after(resetDocument);

  const app = blit(host);
  const [section] = app.blits;
  const [nested] = section.blits;

  assert.equal(app.blits.length, 1);
  assert.equal(section.el.parentElement, stateOf(host).root.plane, 'a top-level blit moved onto the plane');
  assert.equal(nested.el.parentElement, section.el, 'a nested blit stays where it was written');
  assert.deepEqual(section.spec, { kind: 'note', x: 60, y: 80, w: 320 });
  assert.deepEqual(nested.bounds, { x: 84, y: 108, w: 0, h: 0 });
  assert.equal(section.el.hasAttribute('data-x'), false, 'placement left the attributes');
  assert.equal(host.querySelector('#stray').parentElement, host, 'unmarked markup is untouched');
  assert.equal(section.el.querySelector('h2').textContent, 'Authored');
});

test('emit - a native CustomEvent bubbles from child to root with {payload, source}', (t) => {
  const { app, host } = scene(t);
  const card = app.blit({ type: 'core-card' });
  const kid = card.blit({ x: 0, y: 0 });
  const seen = [];

  const offCard = card.on('select', (event) => seen.push(['card', event.detail]));
  app.on('select', (event) => seen.push(['app', event.detail]));
  const event = kid.emit('select', { id: 7 });

  assert.ok(event instanceof CustomEvent);
  assert.equal(event.bubbles, true);
  assert.equal(event.target, kid.el);
  assert.deepEqual(seen.map(([who]) => who), ['card', 'app']);
  assert.deepEqual(seen[0][1], { payload: { id: 7 }, source: kid });
  assert.deepEqual(kid.emit('ping').detail, { payload: null, source: kid });

  offCard();
  seen.length = 0;
  kid.emit('select');
  assert.deepEqual(seen.map(([who]) => who), ['app']);

  // Cancelling is native too.
  host.addEventListener('veto', (e) => e.preventDefault(), { once: true });
  assert.equal(kid.emit('veto').defaultPrevented, true);
});

test('emit - through nested blits: each node\'s listeners in order, the origin as target, then the next node up', (t) => {
  const { app, host } = scene(t);
  const grandparent = app.blit({ id: 'gp' });
  const parent = grandparent.blit({ id: 'p' });
  const child = parent.blit({ id: 'c' });
  const log = [];
  for (const b of [child, parent, grandparent, app]) {
    for (const name of ['one', 'two']) {
      b.on('sig', (event) => log.push([b.el.id, name, event.target.id, event.currentTarget.id, event.eventPhase]));
    }
  }
  const event = child.emit('sig', { v: 1 });
  assert.deepEqual(log.map(([at, name]) => `${at}:${name}`), [
    'c:one', 'c:two', 'p:one', 'p:two', 'gp:one', 'gp:two', 'app:one', 'app:two'
  ]);
  assert.ok(log.every(([at, , , current]) => at === current), 'currentTarget was not the listening node');
  assert.ok(log.every(([, , target]) => target === 'c'), 'a listener saw another node as the origin');
  assert.deepEqual(log.map(([, , , , phase]) => phase), [2, 2, 3, 3, 3, 3, 3, 3]);
  assert.equal(event.target, child.el, 'after the walk the event still names its origin');
  assert.equal(event.detail.source, child);
  assert.equal(event.currentTarget, null);
  assert.equal(host.contains(child.el), true);
});

test('emit - stopPropagation at a nested blit spares its ancestors; preventDefault bubbles on and is read back by the emitter', (t) => {
  const { app } = scene(t);
  const parent = app.blit({ id: 'p' });
  const child = parent.blit({ id: 'c' });
  const seen = [];
  app.on('sig', () => seen.push('host'));
  parent.on('sig', () => seen.push('p'));
  const offStop = child.on('sig', (event) => { seen.push('c'); event.stopPropagation(); });
  child.emit('sig');
  assert.deepEqual(seen, ['c']);

  offStop();
  seen.length = 0;
  parent.on('sig', (event) => event.preventDefault());
  const vetoed = child.emit('sig', 2);
  assert.deepEqual(seen, ['p', 'host'], 'a cancel stopped the bubble');
  assert.equal(vetoed.defaultPrevented, true);

  seen.length = 0;
  assert.equal(app.emit('other').defaultPrevented, false, 'an uncancelled event read back as cancelled');
});

test('remove - the element and everything inside it leave the document and the frame', (t) => {
  const { app, root } = scene(t);
  const card = app.blit({ type: 'core-card', x: 1, y: 1 });
  const kid = card.blit({ x: 2, y: 2 });
  runFrame(root, 1);

  kid.set({ x: 3 });
  assert.ok(root.dirty.has(stateOf(kid.el)), 'the child was queued');
  card.remove();

  assert.equal(card.el.isConnected, false);
  assert.equal(card.parent, null);
  assert.deepEqual(app.blits, []);
  assert.equal(root.dirty.size, 0, 'a removed subtree is forgotten by the frame');
  assert.equal(root.measure.size, 0);
  // The handle survives: the element can be re-homed and is the same blit.
  assert.equal(blit(card.el), card);
});
