#!/usr/bin/env node
/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The file tree in ARCHITECTURE.md, generated from the code: every source file
 * of the core, each with the first sentence of its own header comment. The tree
 * sits between `<!-- tree -->` markers. The add-ons, the library and the site
 * document their own trees (cloudcanvas-lib, cloudcanvas-site).
 *
 *   node scripts/tree.js            print the tree
 *   node scripts/tree.js --write    rewrite it into ARCHITECTURE.md
 *   node scripts/tree.js --check    exit 1 when ARCHITECTURE.md's copy is stale
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOC = path.join(ROOT, 'ARCHITECTURE.md');
const START = '<!-- tree -->';
const END = '<!-- /tree -->';

/** The trees documented, in order, each under its heading; directories never walked. */
const TREES = Object.freeze([{ dir: '.', title: 'cloudcanvas' }]);
const SKIP = new Set(['node_modules', 'dist', 'scripts', 'tests']);

/** A source file's summary: the first sentence of the header comment's prose, one line. */
export function summaryOf(source) {
  const header = /^\s*\/\*\*([\s\S]*?)\*\//.exec(source);
  if (!header) return '';
  const lines = header[1].split('\n').map((line) => line.replace(/^\s*\*\s?/, '').trim());
  const prose = [];
  for (const line of lines) {
    if (/^(CloudCanvas - NeoTec|Written by Richard Christopher)/.test(line)) continue;
    if (line === '') { if (prose.length > 0) break; continue; }
    prose.push(line);
  }
  const text = prose.join(' ').replace(/\s+/g, ' ');
  const sentence = /^(.*?\.)(\s|$)/.exec(text);
  return (sentence ? sentence[1] : text).replace(/[.:]$/, '');
}

/** Every `.js` file under `dir`, sorted, as repo-relative paths. */
function sourcesUnder(dir) {
  const out = [];
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (SKIP.has(entry.name) || entry.name.startsWith('.')) continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.js')) out.push(path.relative(ROOT, full));
    }
  };
  walk(path.join(ROOT, dir));
  return out;
}

/** The tree as markdown: one list per top-level tree, a line per file. */
export function renderTree() {
  const sections = TREES.map(({ dir, title }) => {
    const lines = sourcesUnder(dir).map((file) => {
      const summary = summaryOf(fs.readFileSync(path.join(ROOT, file), 'utf8'));
      return `- \`${file}\`${summary ? ` - ${summary}` : ''}`;
    });
    return `### \`${title}\`\n\n${lines.join('\n')}`;
  });
  return `${START}\n${sections.join('\n\n')}\n${END}`;
}

/** ARCHITECTURE.md with its tree replaced by the current one. */
export function withTree(doc, tree = renderTree()) {
  const start = doc.indexOf(START);
  const end = doc.indexOf(END);
  if (start === -1 || end === -1) throw new Error(`ARCHITECTURE.md has no ${START} ... ${END} block`);
  return doc.slice(0, start) + tree + doc.slice(end + END.length);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const flag = process.argv[2];
  const doc = fs.readFileSync(DOC, 'utf8');
  if (flag === '--write') fs.writeFileSync(DOC, withTree(doc));
  else if (flag === '--check') {
    if (withTree(doc) !== doc) {
      process.stderr.write('ARCHITECTURE.md: the file tree is stale; run node scripts/tree.js --write\n');
      process.exit(1);
    }
  } else process.stdout.write(`${renderTree()}\n`);
}
