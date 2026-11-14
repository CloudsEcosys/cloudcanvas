/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The public surface of `index.js`, frozen as a fixture: exactly
 * `blit` and `type`, every add-on on its own subpath.
 *
 * Every name exported from the entry point is a commitment to consumers. A
 * refactor that drops one, or a feature that quietly adds one, should fail here
 * rather than surface in someone else's import. The fixture is the sorted list
 * of export names; changing it is a deliberate act, done by re-running with
 * `UPDATE_API_SNAPSHOT=1`, and the resulting diff is reviewed like any other.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as api from '../../index.js';

const FIXTURE = fileURLToPath(new URL('../fixtures/public-api.json', import.meta.url));
const UPDATE_HINT = 'To change the public API deliberately, run: UPDATE_API_SNAPSHOT=1 npm run test:unit';

test('index.js exports exactly the names in tests/fixtures/public-api.json', () => {
  const actual = Object.keys(api).sort();

  if (process.env.UPDATE_API_SNAPSHOT === '1') {
    writeFileSync(FIXTURE, `${JSON.stringify(actual, null, 2)}\n`);
  }

  const expected = JSON.parse(readFileSync(FIXTURE, 'utf8'));
  const added = actual.filter((name) => !expected.includes(name));
  const removed = expected.filter((name) => !actual.includes(name));

  assert.deepEqual(
    actual,
    expected,
    `Public API drifted from snapshot. Added: [${added.join(', ')}] Removed: [${removed.join(', ')}]. ${UPDATE_HINT}`
  );
  assert.deepEqual(expected, ['blit', 'type'], 'the entry grew past the core: an add-on belongs on its own subpath');
  assert.equal(typeof api.blit.use, 'function');
});
