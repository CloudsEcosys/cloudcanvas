/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * ARCHITECTURE.md's file tree is generated from the code (`scripts/tree.js`):
 * it must be current, and a summary is the first sentence of a file's header.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { summaryOf, withTree } from '../../scripts/tree.js';

const DOC = fileURLToPath(new URL('../../ARCHITECTURE.md', import.meta.url));

test('tree - ARCHITECTURE.md carries the current file tree (node scripts/tree.js --write)', () => {
  const doc = readFileSync(DOC, 'utf8');
  assert.equal(withTree(doc), doc);
});

test('tree - a summary is the first sentence of the header prose, the byline skipped', () => {
  const source = '/**\n * Written by Richard Christopher, Copyright 2026 NeoTec, LLC\n *\n * drag: a press moves\n * the blit. More here.\n *\n * Detail.\n */';
  assert.equal(summaryOf(source), 'drag: a press moves the blit');
  assert.equal(summaryOf('export const x = 1;'), '');
});
