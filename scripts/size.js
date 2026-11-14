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
 *   node scripts/size.js --check    exit 1 if any row grew past the baseline
 *   node scripts/size.js --update   rewrite `scripts/size-baseline.json`
 *
 * Single dependency: esbuild, a devDependency.
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
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
 * One line per metric that grew; an empty list is a pass. A row the baseline
 * does not know yet cannot have grown: it is reported, and `--update` ratchets it.
 */
function findGrowth(rows, baseline) {
  const growth = [];
  for (const row of rows) {
    const base = baseline[row.name];
    if (!base) {
      console.warn(`${row.name}: no baseline yet; run with --update to ratchet it`);
      continue;
    }
    for (const metric of ['min', 'gzip']) {
      if (row[metric] > base[metric]) {
        growth.push(`${row.name} ${metric}: ${base[metric]} -> ${row[metric]} (+${row[metric] - base[metric]} B)`);
      }
    }
  }
  return growth;
}

function check(rows) {
  const growth = findGrowth(rows, readBaseline());
  if (growth.length === 0) {
    console.log('\nSize check passed: no row grew.');
    return;
  }
  console.error(`\nSize check failed:\n  ${growth.join('\n  ')}`);
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

main().catch((error) => {
  if (Array.isArray(error.errors) && error.errors.length > 0) {
    console.error(esbuild.formatMessagesSync(error.errors, { kind: 'error', color: true }).join('\n'));
  } else {
    console.error(error.message ?? error);
  }
  process.exitCode = 1;
});
