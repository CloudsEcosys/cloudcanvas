/** Written by Richard Christopher, Copyright 2026 NeoTec, LLC */
import test from 'node:test';
import assert from 'node:assert/strict';
import { blit, type } from '../../index.js';
let sequence = 0;

/** Native component lifetime is the trait cleanup, not a retired display-runtime hook. */
function fixture(t) {
  const host = document.createElement('div'); document.body.append(host);
  const root = blit(host), calls = [], key = `disposalProbe${++sequence}`;
  blit.use({ [key]: (view, options) => {
    calls.push(['mount', options.label]);
    return () => calls.push(['dispose', options.label]);
  } });
  const view = root.blit({ [key]: { label: 'first' } });
  t.after(() => root.remove());
  return { root, view, calls, key };
}

test('component disposal: changing trait contents disposes the previous lifetime before mounting the next', (t) => {
  const { view, calls, key } = fixture(t);
  view.set({ [key]: { label: 'second' } });
  assert.deepEqual(calls, [['mount', 'first'], ['dispose', 'first'], ['mount', 'second']]);
});

test('component disposal: switching a trait off cleans once; removing its scene does not clean it twice', (t) => {
  const { view, calls, key } = fixture(t);
  view.set({ [key]: false }); view.set({ [key]: false }); view.remove();
  assert.deepEqual(calls, [['mount', 'first'], ['dispose', 'first']]);
});

test('component disposal: removing a scene cleans its own lifetime once', (t) => {
  const { view, calls } = fixture(t);
  view.remove(); view.remove();
  assert.deepEqual(calls, [['mount', 'first'], ['dispose', 'first']]);
});

test('component disposal: removing a root cleans every component under it', (t) => {
  const { root, calls, key } = fixture(t);
  root.blit({ [key]: { label: 'second' } }); root.remove();
  assert.deepEqual(calls.filter(([kind]) => kind === 'dispose').map(([, label]) => label).sort(), ['first', 'second']);
});

test('component disposal: type-owned anonymous traits clean up when their instance is removed', (t) => {
  const { root } = fixture(t), disposed = [];
  type('disposal-fixture', { html: '<span>Native component</span>', with: [() => () => disposed.push('disposed')] });
  const view = root.blit({ type: 'disposal-fixture' });
  view.remove();
  assert.deepEqual(disposed, ['disposed']);
});
