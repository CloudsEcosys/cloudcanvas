/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * `data-*` <-> spec: coercion by declared kind, the two casings, attribute
 * writes and removals, JSON trait values from untrusted HTML, and
 * `readAttributes` under a caller's own prefix and kinds.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SPEC_KINDS, camelCase, coerce, decodeAttribute, kebabCase, readAttributes, readSpec, writeAttribute
} from '../../core/spec.js';
import { blit } from '../../core/index.js';
import { setLogSink } from '../../log.js';
import { coreScene } from '../helpers/core-scene.js';
import { formatTransform3D } from '../../core/port.js';
import { frameDelta, FRAME_MS } from '../../core/frame.js';

function element(attributes) {
  const el = document.createElement('div');
  for (const [name, value] of Object.entries(attributes)) el.setAttribute(name, value);
  return el;
}

test('readSpec - placement is numeric, markers are skipped, everything else is a string', () => {
  const el = element({ 'data-blit': '', 'data-blit-root': '', 'data-x': '40', 'data-w': '1.5', 'data-type': '3d', 'data-selectable-text': 'true', 'data-id': '42' });
  assert.deepEqual(readSpec(el), { x: 40, w: 1.5, type: '3d', selectableText: 'true', id: '42' });
});

test('coerce - a placement key that is not a number throws by attribute name', () => {
  for (const value of ['forty', '', '   ', '12px']) {
    assert.throws(() => coerce('x', value, 'data-x', SPEC_KINDS), /blit: data-x=/, `accepted "${value}"`);
  }
  assert.equal(coerce('tone', '12px', 'data-tone', SPEC_KINDS), '12px');
  assert.equal(coerce('flag', 'true', 'data-flag', { numeric: new Set(), boolean: new Set(['flag']), label: 'x' }), true);
  assert.equal(coerce('flag', 'yes', 'data-flag', { numeric: new Set(), boolean: new Set(['flag']), label: 'x' }), 'yes');
  assert.equal(SPEC_KINDS.label, 'blit');
});

test('casing - the two conversions are inverses', () => {
  assert.equal(camelCase('selectable-text'), 'selectableText');
  assert.equal(kebabCase('selectableText'), 'selectable-text');
  assert.equal(kebabCase(camelCase('a-b-c')), 'a-b-c');
});

test('writeAttribute - stringifies, and null takes the attribute off', () => {
  const el = element({});
  writeAttribute(el, 'selectableText', true);
  writeAttribute(el, 'count', 3);
  assert.equal(el.getAttribute('data-selectable-text'), 'true');
  assert.equal(el.getAttribute('data-count'), '3');
  writeAttribute(el, 'count', null);
  assert.equal(el.hasAttribute('data-count'), false);
  writeAttribute(el, 'count', undefined);
  assert.equal(el.hasAttribute('data-count'), false);
});

test('readAttributes - a caller\'s own prefix, skip set and kinds', () => {
  const el = element({ 'data-cc-mark': '', 'data-cc-x': '40', 'data-cc-draggable': 'false', 'data-cc-id': '42' });
  const kinds = { numeric: new Set(['x']), boolean: new Set(['draggable']), label: 'custom' };
  assert.deepEqual(readAttributes(el, 'data-cc-', new Set(['data-cc-mark']), kinds), { x: 40, draggable: false, id: '42' });
  assert.throws(() => readAttributes(element({ 'data-cc-x': 'nope' }), 'data-cc-', new Set(), kinds), /custom: data-cc-x=/);
  assert.deepEqual(readAttributes(el, 'data-cc-', new Set(['data-cc-mark']), SPEC_KINDS), { x: 40, draggable: 'false', id: '42' });
});

test('port - formatTransform3D and the frame clock', () => {
  assert.equal(formatTransform3D(1, 2), 'translate3d(1.00px, 2.00px, 0.00px)');
  assert.equal(formatTransform3D(1, 2, 3, 0.5), 'translate3d(1.00px, 2.00px, 3.00px) scale(0.5000)');

  const clock = { _lastTs: null };
  assert.equal(frameDelta(clock, 100), 1);
  assert.equal(clock._lastTs, 100);
  assert.equal(frameDelta(clock, 100 + FRAME_MS * 2), 2);
});

/** Every warning logged while the test runs. */
function warnings(t) {
  const records = [];
  const previous = setLogSink((record) => records.push(record), { level: 'warn' });
  t.after(() => setLogSink(previous));
  return records;
}

/** A named trait that records the options each start receives. */
const probed = [];
blit.use({ specProbe: (b, options) => { probed.push(options); } });

test('decodeAttribute - malformed JSON warns by attribute name and reads as undefined, never throws', (t) => {
  const records = warnings(t);
  for (const value of ['{bad', '[1,', '{"a":}', '{}}', '[\'x\']']) {
    assert.equal(decodeAttribute(value, 'data-style'), undefined, `"${value}" was not ignored`);
  }
  assert.equal(records.length, 5);
  assert.ok(records.every(({ level, message }) => level === 'warn' && message.includes('data-style')));
  assert.deepEqual(decodeAttribute('{"color":"red"}'), { color: 'red' });
  assert.equal(decodeAttribute(''), true);
  assert.equal(decodeAttribute('row'), 'row');
});

test('decodeAttribute - prototype keys are dropped at every depth, with a warning', (t) => {
  const records = warnings(t);
  const value = decodeAttribute('{"__proto__":{"polluted":1},"a":{"constructor":{"prototype":{"x":1}},"b":2}}', 'data-style');
  assert.deepEqual(Object.keys(value), ['a']);
  assert.deepEqual(Object.keys(value.a), ['b']);
  assert.equal(Object.getPrototypeOf(value), Object.prototype);
  assert.equal({}.polluted, undefined, 'Object.prototype was polluted');
  assert.equal(Object.assign({}, value).polluted, undefined, 'a merge reached a prototype');
  assert.equal(records.length, 3, 'one warning per dropped key');
});

test('decodeAttribute - huge input: a large valid value parses, a deep or huge broken one is ignored', (t) => {
  const records = warnings(t);
  const wide = decodeAttribute(JSON.stringify(Array.from({ length: 200000 }, (_, index) => index)));
  assert.equal(wide.length, 200000);
  assert.equal(decodeAttribute('['.repeat(1000000)), undefined, 'an unterminated deep array was not ignored');
  assert.equal(decodeAttribute(`{"a":"${'x'.repeat(2000000)}`), undefined, 'a huge unterminated string was not ignored');
  assert.equal(records.length, 2);
  assert.ok(records.every(({ message }) => message.length < 200), 'the warning echoed the huge input');
});

test('decodeAttribute - authored HTML with a malformed trait value still makes its blit; that trait is ignored', (t) => {
  const records = warnings(t);
  probed.length = 0;
  const { app } = coreScene(t, '<div id="bad" data-blit data-spec-probe="{oops"></div><div id="good" data-blit data-spec-probe=\'{"n":1}\'></div>');
  const bad = app.find('bad');
  assert.ok(bad, 'the blit with the malformed value was not made');
  assert.deepEqual(probed, [{ n: 1 }], 'the malformed value reached its trait, or the good one did not');
  assert.equal('specProbe' in bad.spec, false, 'the malformed value was serialised');
  assert.deepEqual(app.find('good').spec.specProbe, { n: 1 });
  assert.equal(bad.el.getAttribute('data-spec-probe'), '{oops', 'the authored attribute was rewritten');
  assert.ok(records.some(({ message }) => message.includes('data-spec-probe')));
});
