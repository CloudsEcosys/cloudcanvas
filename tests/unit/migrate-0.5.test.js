/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The 0.4 -> 0.5 migration scanner (`scripts/migrate-0.5.js`): each rule finds
 * its 0.4 form and names the 0.5 one, the first matching rule claims a line, and
 * blit-era code reports nothing.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { RULES, scanSource } from '../../scripts/migrate-0.5.js';

test('migrate-0.5 - each 0.4 form is found, with its 0.5 form beside it', () => {
  const source = [
    "const session = createCanvasSession({ container: host });",
    "const card = session.createPin({ type: 'card', contents: { title: 'Hi' } });",
    "card.setContent('title', 'Hello');",
    "card.transmit(new PinEvent('press'));",
    "reparentPin(card, parent);",
    "session.pushFocus(card, { promote: true });",
    ".cloudcanvas-pin-title { color: red; }",
    "host.querySelector('.cloudcanvas-pin-content');"
  ].join('\n');
  const hits = scanSource(source);
  assert.deepEqual(hits.map((hit) => hit.line), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.match(hits[6].replacement, /cloudcanvas-card-/);
  assert.match(hits[7].replacement, /\[data-blit\]/);
  assert.match(hits[0].replacement, /blit\(host\)/);
  assert.match(hits[1].replacement, /parent\.blit/);
  assert.match(hits[2].replacement, /setContent\(b, key, value\)/);
  assert.match(hits[3].replacement, /b\.emit/);
  assert.match(hits[4].replacement, /move\(b, parent\)/);
  assert.match(hits[5].replacement, /go\(app, b/);
});

test('migrate-0.5 - blit-era code reports nothing; every rule carries a replacement', () => {
  const clean = [
    "const app = blit('#app');",
    "const card = app.blit({ id: 'c', type: 'card', card: { title: 'Hi' }, drag: true });",
    "setContent(card, 'title', 'Hello');",
    "card.emit('press');"
  ].join('\n');
  assert.deepEqual(scanSource(clean), []);
  for (const [pattern, replacement] of RULES) {
    assert.ok(pattern instanceof RegExp);
    assert.ok(replacement.length > 0);
  }
});
