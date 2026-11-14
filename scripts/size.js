/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Bundle-size report and regression gate. Nothing is written to `dist/`; each
 * entry is bundled in memory with the same esbuild options `scripts/build.js`
 * ships with, then measured minified and gzip -9.
 *
 * The fixed rows below, then one row per public entry, each answering a
 * different question:
 *
 *   full     `cloudcanvas` (`index.js`) as a whole: the core.
 *   minimal  the README quick start: one root, one blit - what a consumer
 *            pays after tree-shaking for the smallest real application.
 *   bare     a side-effect-only import - what cannot be shaken out at all (0).
 *   <entry>  each public subpath entry (`./entries.js`: `core`, `kernel`,
 *            `log`, `theme`, ...) with all its exports kept - what that import
 *            costs on its own, the core code it reaches included.
 *
 * The add-on rows (`minimal+drag`, `defaults`, ...) are cloudcanvas-lib's.
 *
 *   node scripts/size.js            print the table
 *   node scripts/size.js --check    exit 1 if any row grew past the baseline, or
 *                                   the rows and the baseline name different entries
 *   node scripts/size.js --update   rewrite `scripts/size-baseline.json`
 *
 * Single dependency: esbuild, a devDependency.
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';
import { ROOT, publicEntries } from './entries.js';

const ENTRY = path.join(ROOT, 'index.js');
const BASELINE = path.join(ROOT, 'scripts/size-baseline.json');

/** Mirrors `scripts/build.js`; minified and held in memory. */
const SHARED = {
  bundle: true,
  format: 'esm',
  minify: true,
  write: false,
  platform: 'browser',
  target: ['es2022'],
  charset: 'utf8',
  logLevel: 'silent'
};

/** The quick start: one root, one placed blit. */
const MINIMAL_SOURCE = `
import { blit } from './index.js';
blit('#app').blit({ x: 100, y: 100 });
`;

/** The rows, in report order: the fixed questions, then each public entry. */
const ROWS = [
  { name: 'full', entryPoints: [ENTRY] },
  { name: 'minimal', stdin: MINIMAL_SOURCE },
  { name: 'bare', stdin: `import './index.js';` },
  ...publicEntries().map(({ name, file }) => ({ name, entryPoints: [path.join(ROOT, file)] }))
];

async function measureRow(row) {
  const options = row.stdin
    ? { stdin: { contents: row.stdin, resolveDir: ROOT, loader: 'js' } }
    : { entryPoints: row.entryPoints };

  const result = await esbuild.build({ ...SHARED, ...options });
  const bytes = result.outputFiles[0].contents;

  return {
    name: row.name,
    min: bytes.length,
    gzip: zlib.gzipSync(bytes, { level: 9 }).length
  };
}

function kib(bytes) {
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

function printTable(rows) {
  console.log(`\nCloudCanvas size - esbuild ${esbuild.version}`);
  console.log(`${'entry'.padEnd(12)}${'min'.padStart(12)}${'gzip'.padStart(12)}`);
  for (const row of rows) {
    console.log(`${row.name.padEnd(12)}${kib(row.min).padStart(12)}${kib(row.gzip).padStart(12)}`);
  }
}

function readBaseline() {
  if (!fs.existsSync(BASELINE)) {
    throw new Error(`No baseline at ${path.relative(ROOT, BASELINE)}; run with --update first`);
  }
  return JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
}

function writeBaseline(rows) {
  const baseline = Object.fromEntries(rows.map(({ name, min, gzip }) => [name, { min, gzip }]));
  fs.writeFileSync(BASELINE, `${JSON.stringify(baseline, null, 2)}\n`);
  console.log(`\nBaseline written to ${path.relative(ROOT, BASELINE)}`);
}

/**
 * One line per failure; an empty list is a pass. A metric that grew fails, and
 * so does a row the baseline does not know or a baseline row nothing measures:
 * the gate covers exactly the entries there are. `--update` ratchets both.
 * @param {Array<{name: string, min: number, gzip: number}>} rows
 * @param {Record<string, {min: number, gzip: number}>} baseline
 * @returns {string[]}
 */
export function findFailures(rows, baseline) {
  const failures = [];
  for (const row of rows) {
    const base = baseline[row.name];
    if (!base) failures.push(`${row.name}: no baseline row`);
    else failures.push(...growthOf(row, base));
  }
  const measured = new Set(rows.map(({ name }) => name));
  for (const name of Object.keys(baseline)) {
    if (!measured.has(name)) failures.push(`${name}: baseline row with no entry`);
  }
  return failures;
}

/** One line per metric of `row` that grew past `base`. */
function growthOf(row, base) {
  return ['min', 'gzip']
    .filter((metric) => row[metric] > base[metric])
    .map((metric) => `${row.name} ${metric}: ${base[metric]} -> ${row[metric]} (+${row[metric] - base[metric]} B)`);
}

function check(rows) {
  const failures = findFailures(rows, readBaseline());
  if (failures.length === 0) {
    console.log('\nSize check passed: every entry has a baseline row and none grew.');
    return;
  }
  console.error(`\nSize check failed:\n  ${failures.join('\n  ')}`);
  console.error('Intentional? Re-run with --update.');
  process.exitCode = 1;
}

async function main() {
  const flag = process.argv[2];
  const rows = [];
  for (const row of ROWS) rows.push(await measureRow(row));

  printTable(rows);
  if (flag === '--check') check(rows);
  else if (flag === '--update') writeBaseline(rows);
  else if (flag !== undefined) throw new Error(`Unknown flag ${flag}; expected --check or --update`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    if (Array.isArray(error.errors) && error.errors.length > 0) {
      console.error(esbuild.formatMessagesSync(error.errors, { kind: 'error', color: true }).join('\n'));
    } else {
      console.error(error.message ?? error);
    }
    process.exitCode = 1;
  });
}
