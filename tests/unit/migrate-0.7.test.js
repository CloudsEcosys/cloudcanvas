/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The 0.6 -> 0.7 migration scanner (`scripts/migrate-0.7.js`): every subpath that
 * moved to `cloudcanvas-lib` is found with its 0.7 specifier, `cloudcanvas/lib`
 * becomes the lib root, and the core's own entries report nothing.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MOVED, movedSpecifier, scanSource } from '../../scripts/migrate-0.7.js';

const MANIFEST = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));

test('migrate-0.7 - each moved import is found, with its 0.7 specifier beside it', () => {
  const source = [
    "import { drag } from 'cloudcanvas/drag';",
    'import { createKit } from "cloudcanvas/lib";',
    "import { harness } from 'cloudcanvas/ui/testing';",
    "const { gpu } = await import(`cloudcanvas/gpu`);",
    "import 'cloudcanvas/defaults'; import { pan } from 'cloudcanvas/pan';"
  ].join('\n');
  const hits = scanSource(source);
  assert.deepEqual(hits.map(({ line, from, to }) => [line, from, to]), [
    [1, 'cloudcanvas/drag', 'cloudcanvas-lib/drag'],
    [2, 'cloudcanvas/lib', 'cloudcanvas-lib'],
    [3, 'cloudcanvas/ui/testing', 'cloudcanvas-lib/ui/testing'],
    [4, 'cloudcanvas/gpu', 'cloudcanvas-lib/gpu'],
    [5, 'cloudcanvas/defaults', 'cloudcanvas-lib/defaults'],
    [5, 'cloudcanvas/pan', 'cloudcanvas-lib/pan']
  ]);
});

test('migrate-0.7 - the core entries, lib specifiers and look-alikes report nothing', () => {
  const clean = [
    "import { blit, type } from 'cloudcanvas';",
    "import { stateOf } from 'cloudcanvas/kernel';",
    "import { applyTheme } from 'cloudcanvas/theme';",
    "import { drag } from 'cloudcanvas-lib/drag';",
    "import { thing } from 'cloudcanvas/dragon';",
    "// see cloudcanvas/drag in the changelog"
  ].join('\n');
  assert.deepEqual(scanSource(clean), []);
});

test('migrate-0.7 - no moved subpath is still a core entry', () => {
  for (const name of MOVED) assert.equal(MANIFEST.exports[`./${name}`], undefined, name);
  assert.equal(movedSpecifier('lib'), 'cloudcanvas-lib');
  assert.equal(movedSpecifier('panel'), 'cloudcanvas-lib/panel');
});
