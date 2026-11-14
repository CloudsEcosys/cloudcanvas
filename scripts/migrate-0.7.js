#!/usr/bin/env node
/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The 0.6 -> 0.7 migration guide as a scanner: every import of a subpath that
 * moved from `cloudcanvas` to `cloudcanvas-lib`, with its 0.7 specifier beside it.
 *
 *   node scripts/migrate-0.7.js src/            one line per hit, then a count per move
 *   node scripts/migrate-0.7.js src/ --json     the hits as JSON
 *
 * In 0.7 `cloudcanvas` is the core alone (`blit`, `type`, `/core`, `/kernel`,
 * `/log`, `/theme`, `/tokens`, `/primitives`, `/element`, `/vectorizer`); every
 * add-on, the UI kit, the widgets, the board and the add-on CSS moved to
 * `cloudcanvas-lib`, same subpath names, and `cloudcanvas/lib` became the
 * package root. The move table is the CHANGELOG's 0.7.0 migration table. It
 * reports rather than rewrites, like `migrate-0.5.js`. Exit code 1 when anything
 * was found, so it can gate a CI step.
 */
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { filesUnder } from './migrate-0.5.js';

/** The 0.6 subpaths that moved to `cloudcanvas-lib` under the same name. */
export const MOVED = /* @__PURE__ */ Object.freeze([
  'drag', 'select', 'resize', 'focus', 'physics', 'connect', 'svg-state', 'cursors', 'pan', 'keyboard',
  'menu', 'announce', 'observe', 'motion', 'types', 'widget', 'keyed-list', 'style', 'layout', 'edit',
  'place', 'history', 'reactions', 'lazy', 'offload', 'gpu', 'orbit', 'mesh', 'svg-path', 'sprites',
  'text', 'video', 'own-canvas', 'xml', 'html-canvas', 'panel',
  'ui', 'forms', 'display', 'components', 'archetypes', 'sandbox', 'defaults', 'graphics'
]);

/** A quoted `cloudcanvas/<moved>[/<rest>]` or `cloudcanvas/lib` specifier. */
const SPECIFIER = new RegExp(`(['"\`])cloudcanvas/(lib|${MOVED.join('|')})((?:/[\\w./-]*)?)\\1`, 'g');

/** The 0.7 form of a moved 0.6 specifier: `cloudcanvas/lib` is the lib root, the rest keep their path. */
export function movedSpecifier(subpath, rest = '') {
  return subpath === 'lib' ? `cloudcanvas-lib${rest}` : `cloudcanvas-lib/${subpath}${rest}`;
}

/** The hits in one source text. @returns {Array<{line: number, text: string, from: string, to: string}>} */
export function scanSource(source) {
  const hits = [];
  source.split('\n').forEach((text, index) => {
    for (const [, , subpath, rest] of text.matchAll(SPECIFIER)) {
      hits.push({ line: index + 1, text: text.trim(), from: `cloudcanvas/${subpath}${rest}`, to: movedSpecifier(subpath, rest) });
    }
  });
  return hits;
}

/** Scan paths; print a report (or JSON). @returns {number} the hit count */
export function run(targets, { json = false, write = (line) => process.stdout.write(`${line}\n`) } = {}) {
  const all = [];
  for (const target of targets) {
    for (const file of filesUnder(target)) {
      for (const hit of scanSource(fs.readFileSync(file, 'utf8'))) all.push({ file, ...hit });
    }
  }
  if (json) {
    write(JSON.stringify(all, null, 2));
    return all.length;
  }
  for (const hit of all) write(`${hit.file}:${hit.line}  ${hit.text}\n    -> '${hit.to}'`);
  const perMove = new Map();
  for (const { from, to } of all) perMove.set(from, { to, count: (perMove.get(from)?.count ?? 0) + 1 });
  write(`\n${all.length} import(s) of a subpath that moved to cloudcanvas-lib`);
  for (const [from, { to, count }] of [...perMove].sort((a, b) => b[1].count - a[1].count)) {
    write(`  ${String(count).padStart(5)}  ${from} -> ${to}`);
  }
  return all.length;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const targets = args.filter((arg) => !arg.startsWith('--'));
  if (targets.length === 0) {
    process.stderr.write('usage: node scripts/migrate-0.7.js <file-or-dir>... [--json]\n');
    process.exit(2);
  }
  process.exit(run(targets, { json: args.includes('--json') }) > 0 ? 1 : 0);
}
