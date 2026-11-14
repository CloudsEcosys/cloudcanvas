#!/usr/bin/env node
/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The 0.4 -> 0.5 migration guide as a scanner: every use of the removed 0.4 API
 * in a codebase, with its 0.5 form beside it.
 *
 *   node scripts/migrate-0.5.js src/            one line per hit, then a count per rule
 *   node scripts/migrate-0.5.js src/ --json     the hits as JSON
 *
 * It reports rather than rewrites: most of these changes carry a decision (a
 * contents key moves under the widget's key, a trait gets options, a session
 * becomes a board), so a blind rewrite would be wrong more often than right. The
 * rule table is the CHANGELOG's 0.5.0 migration table. Exit code 1 when anything
 * was found, so it can gate a CI step.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** `[pattern, 0.5 form]`, most specific first; the first pattern that matches a line claims it. */
export const RULES = Object.freeze([
  [/\bcreateCanvasSession\s*\(/, "const app = blit(host) (cloudcanvas), or createBoard(host) (cloudcanvas/sandbox)"],
  [/\.createPin\s*\(/, 'parent.blit({ id, type, x, y, w, h, [type]: contents, drag, select, ... })'],
  [/\.getPin\s*\(/, 'app.find(id)'],
  [/\.removePin\s*\(/, 'b.remove()'],
  [/\bgetRootPins\s*\(/, 'app.blits'],
  [/\b(getAllPins|allPins)\s*\(/, 'allBlits(app) (cloudcanvas/sandbox)'],
  [/\bpinManager\.onSignal\s*\(/, "app.on(type, listener): every blit event bubbles to the host"],
  [/\bnew PinEvent\s*\(|\.transmit\s*\(/, 'b.emit(type, payload): a bubbling, cancelable CustomEvent'],
  [/\.setContents\s*\(/, 'setContents(b, patch) (cloudcanvas/widget)'],
  [/\.setContent\s*\(/, 'setContent(b, key, value) (cloudcanvas/widget)'],
  [/\.contents\.(get|has)\s*\(/, 'contentOf(b)[key] (cloudcanvas/widget)'],
  [/\.clearContents\s*\(/, "b.set({ [contentKeyOf(b)]: true })"],
  [/\bdefineComponent\s*\(|\bdefinePrototype\s*\(|\bmakeRegistrar\s*\(/, 'widget({ name, html, keys, bind, render }) (cloudcanvas/widget)'],
  [/\b(setDisplayTrait|rebuildDisplay)\s*\(/, 'retype(b, name) (cloudcanvas/sandbox); a widget re-binds on every write'],
  [/\.displayTrait\b/, "b.el.getAttribute('data-type')"],
  [/\btraitRegistry\b/, 'blit.use({ name: traitFn })'],
  [/\b(Draggable|Selectable|Resizable|Focussable|Connectable|Physics|SvgState)Trait\b/, 'the drag / select / resize / focus / connect / physics / svgState add-ons, as spec keys'],
  [/\.(addTrait|replaceTrait)\s*\(/, 'b.set({ name: options })'],
  [/\.removeTrait\s*\(/, 'b.set({ name: false })'],
  [/\.setPosition\s*\(/, 'b.set({ x, y, z })'],
  [/\bresizePin\s*\(/, 'b.set({ w, h })'],
  [/\breparentPin\s*\(/, 'move(b, parent) (cloudcanvas/place)'],
  [/\breorderChild\s*\(/, 'reorder(b, before) (cloudcanvas/layout)'],
  [/\.getGlobalBounds\s*\(/, 'b.bounds'],
  [/\b(pushFocus|focusPin)\s*\(|\bsession\.focus\s*\(/, 'go(app, b, { promote }) (cloudcanvas/history)'],
  [/\bpopFocus\s*\(/, 'back(app) (cloudcanvas/history)'],
  [/\bzoomToFit\s*\(/, 'app.view(b), or cameraOf(app).fit(box, rect) (cloudcanvas/sandbox)'],
  [/\b(beginEdit|endEdit)\s*\(/, 'begin(b, node) / end(b) (cloudcanvas/edit)'],
  [/\b(setPinStyle|getPinStyle|clearPinStyle|applyPinStyleMap)\b/, 'setStyle / getStyle / styleMap, or b.set({ style }) (cloudcanvas/style)'],
  [/\b(attachReactions|reactionsFor)\b/, 'app.set({ reactions: true }); reactionsOf(app) (cloudcanvas/reactions)'],
  [/\bPIN_SIGNAL_TYPES\b/, 'SIGNALS (cloudcanvas/reactions)'],
  [/\.(layout|layoutGap)\s*=[^=]/, 'b.set({ layout, gap })'],
  [/\.(chrome|bordered)\s*=[^=]/, 'b.set({ chrome: false }) / b.set({ bordered: false })'],
  [/\.selected\s*=[^=]/, 'setSelected(b, value) (cloudcanvas/select)'],
  [/\b(serializeSession|deserializeSession|clearSession|autoSaveSession)\b/, 'serializeBoard / deserializeBoard / clearBoard / autoSaveBoard (cloudcanvas/sandbox)'],
  [/\b(particle|getPrimaryVector|setVectors?|addVector)\b/, 'b.x / b.y, or a contents key'],
  [/\bdata-pin-id\b/, 'the element id: b.el.id'],
  [/\bcloudcanvas-pin-(?!content\b)[a-z]/, 'cloudcanvas-card-<same>: the display widgets\' CLS (cloudcanvas/types)'],
  [/\bcloudcanvas-pin\b/, '[data-blit]']
]);

/** Directories never walked. */
const SKIP = new Set(['node_modules', '.git', 'dist', 'build', 'coverage']);

/** Every `.js`/`.mjs`/`.ts`/`.html` file under `target` (or `target` itself). */
export function filesUnder(target, out = []) {
  const stat = fs.statSync(target);
  if (stat.isFile()) return /\.(m?js|ts|html)$/.test(target) ? [...out, target] : out;
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const next = path.join(target, entry.name);
    if (entry.isDirectory()) filesUnder(next, out);
    else if (/\.(m?js|ts|html)$/.test(entry.name)) out.push(next);
  }
  return out;
}

/** The hits in one source text. @returns {Array<{line: number, text: string, rule: number, replacement: string}>} */
export function scanSource(source) {
  const hits = [];
  source.split('\n').forEach((text, index) => {
    const rule = RULES.findIndex(([pattern]) => pattern.test(text));
    if (rule !== -1) hits.push({ line: index + 1, text: text.trim(), rule, replacement: RULES[rule][1] });
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
  for (const hit of all) write(`${hit.file}:${hit.line}  ${hit.text}\n    -> ${hit.replacement}`);
  const perRule = new Map();
  for (const hit of all) perRule.set(hit.rule, (perRule.get(hit.rule) ?? 0) + 1);
  write(`\n${all.length} use(s) of the 0.4 API`);
  for (const [rule, count] of [...perRule].sort((a, b) => b[1] - a[1])) write(`  ${String(count).padStart(5)}  ${RULES[rule][1]}`);
  return all.length;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const targets = args.filter((arg) => !arg.startsWith('--'));
  if (targets.length === 0) {
    process.stderr.write('usage: node scripts/migrate-0.5.js <file-or-dir>... [--json]\n');
    process.exit(2);
  }
  process.exit(run(targets, { json: args.includes('--json') }) > 0 ? 1 : 0);
}
