/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Badge: a count beside something, such as unread messages or open alerts.
 *
 *   const badge = createBadge(host);
 *   badge.update({ count: 120, label: '{count} unread' });  // shows "99+", says "120 unread"
 *
 * THE EYE GETS A FIGURE, THE EAR GETS THE COUNT. The figure is capped (`max`,
 * 99 by default, shown as "99+") and hidden from assistive technology; beside
 * it, visually hidden, is the whole count through `label` - a string with
 * `{count}`, or a function of the count. A zero count hides the badge unless
 * `showZero`; `dot: true` draws a bare marker whose meaning is still spoken.
 * `tone` is success, warning or danger; anything else is the accent. The badge
 * is quiet by default - a count that ticks is not an interruption - and
 * `live: true` makes its changes polite announcements.
 */
import { SR_ONLY_CLASS, createLife, documentOf, el, textNode, writeText } from './dom.js';
import { injectUiStyles } from './styles.js';

const CLASS = 'cloudcanvas-ui-badge';

/** The largest figure shown when the model names no cap. */
const DEFAULT_MAX = 99;

/** The tones the kit sheet colours; any other is the accent. */
const TONES = /* @__PURE__ */ new Set(['success', 'warning', 'danger']);

/** `count` as a whole, non-negative number, or null when it is no number at all. */
function wholeCount(count) {
  const value = Number(count);
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : null;
}

/**
 * The figure a badge shows: a whole, non-negative count, capped as "max+".
 * @param {number} count
 * @param {number} [max=99] a cap below 1, or no number, is the default
 * @returns {string} '' for a count that is not a finite number
 */
export function formatCount(count, max = DEFAULT_MAX) {
  const whole = wholeCount(count);
  if (whole === null) return '';
  const limit = Number(max);
  const cap = Number.isFinite(limit) && limit >= 1 ? Math.floor(limit) : DEFAULT_MAX;
  return whole > cap ? `${cap}+` : String(whole);
}

/** The spoken text for `count`: `label` as a function, a `{count}` template, or the bare number. */
export function countLabel(label, count) {
  if (typeof label === 'function') return String(label(count) ?? '');
  if (typeof label === 'string' && label !== '') return label.replaceAll('{count}', String(count));
  return String(count);
}

/** The badge's nodes, hidden until a model gives it a count: a figure for the eye, a sentence for the ear. */
function badgeNodes(doc) {
  const root = el(doc, 'span', { className: CLASS, attrs: { hidden: true } });
  const figure = el(doc, 'span', { className: `${CLASS}-figure`, attrs: { 'aria-hidden': 'true' } });
  const spoken = el(doc, 'span', { className: SR_ONLY_CLASS });
  root.append(figure, spoken);
  return { root, figure: textNode(doc, figure), spoken: textNode(doc, spoken) };
}

/** A live badge is a polite status; a quiet one carries no role at all. */
function writeLive(root, live) {
  if (live) {
    root.setAttribute('role', 'status');
    root.setAttribute('aria-live', 'polite');
  } else {
    root.removeAttribute('role');
    root.removeAttribute('aria-live');
  }
}

function writeBadge(nodes, model) {
  const count = wholeCount(model.count) ?? 0;
  const shown = count > 0 || model.showZero === true;
  const dot = model.dot === true;
  nodes.root.hidden = !shown;
  nodes.root.classList.toggle('is-dot', dot);
  if (TONES.has(model.tone)) nodes.root.setAttribute('data-tone', model.tone);
  else nodes.root.removeAttribute('data-tone');
  writeText(nodes.figure, dot ? '' : formatCount(count, model.max));
  writeText(nodes.spoken, shown ? countLabel(model.label, count) : '');
}

/**
 * @param {HTMLElement} host
 * @returns {{update(model: {count?: number, max?: number, label?: string|((count: number) => string),
 *   showZero?: boolean, dot?: boolean, tone?: 'success'|'warning'|'danger', live?: boolean}): void, destroy(): void}}
 */
export function createBadge(host) {
  const doc = documentOf(host);
  injectUiStyles(doc);
  const life = createLife();
  const nodes = badgeNodes(doc);
  host.append(nodes.root);
  return {
    update(model = {}) {
      if (life.dead) return;
      writeLive(nodes.root, model.live === true);
      writeBadge(nodes, model);
    },
    destroy() {
      if (life.destroy()) nodes.root.remove();
    }
  };
}
