/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Timeline: a Gantt of bars on a shared date axis, grouped into sections.
 *
 *   const timeline = createTimeline(host, {
 *     onActivate: (id) => open(id),
 *     onChange: (id, { start, end }) => reschedule(id, start, end)
 *   });
 *   timeline.update({ scale: 'week', items: [{ id: 'a', title: 'Draft', start: '2026-09-28', end: '2026-10-02', group: 'Writing' }] });
 *
 * Items are plain: `{id, title, start, end?, group?, tone?, progress?, movable?}`.
 * No `end` draws a milestone. Drag a bar to move it, drag its end handle to
 * change its length; both snap to whole days and are reported through
 * `onChange`, never applied. Keyboard: Up/Down between bars, Enter opens,
 * Space picks up, Left/Right move a day (Shift resizes), Space or Enter drops,
 * Escape puts it back. The scale (day | week | month) is kept between updates;
 * a model `scale` that changes wins. A redraw keeps focus on the bar or the
 * heading that held it and scrolls nothing; only the timeline's own keyboard
 * moves bring the view along.
 *
 * A ROW'S LABEL BELONGS TO ITS BAR: a press on the label beside a bar is a
 * press on that bar, and `itemIdOf` answers with the bar's item for either.
 *
 * A GROUP MAY BE AN ITEM. `group` is the name consecutive items are headed
 * by, or `{id, label}` for a group that stands for an item - the parent its
 * bars belong to. That heading is a button: a tab stop of its own, pressed as
 * a bar is (`onActivate(id)`), carrying the group's id. Two groups of one
 * name and different ids are two groups.
 *
 * `selectedId` marks the item a host has selected, on its bar and on a
 * heading that stands for it: for the eye and for assistive technology
 * (`aria-current`). Focus is not moved; the tab stop rests there until the
 * keys place it.
 */
import { createLiveRegion, say } from '../../addons/announce.js';
import { button, createLife, documentOf, el, markSelected, textNode, writeText } from '../dom.js';
import { injectUiStyles } from '../styles.js';
import { toDate } from '../calendar/dates.js';
import { TIMELINE_SCALES, barOf, domainFor, normalizeItems, tickDates, widthOf, xOf } from './model.js';
import { bindTimeline } from './interact.js';

export const TL = 'cloudcanvas-ui-timeline';

/** The timeline's default words. */
export const TIMELINE_LABELS = /* @__PURE__ */ Object.freeze({
  scale: 'Zoom', day: 'Days', week: 'Weeks', month: 'Months', today: 'Today', done: 'done', milestone: 'milestone'
});

function toolbar(tl) {
  const bar = el(tl.doc, 'div', { className: `${TL}-toolbar` });
  tl.scaleGroup = el(tl.doc, 'div', { className: `${TL}-scales`, attrs: { role: 'group', 'aria-label': tl.labels.scale } });
  const today = button(tl.doc, { className: `${TL}-today`, label: tl.labels.today, signal: tl.life.signal, onClick: () => tl.scrollToNow() });
  const range = el(tl.doc, 'span', { className: `${TL}-range` });
  tl.rangeText = textNode(tl.doc, range);
  bar.append(tl.scaleGroup, today, range);
  return bar;
}

/** How a bar reads to a screen reader. */
export function describeItem(tl, item) {
  const date = (value) => tl.format.format(value);
  const when = item.end ? `${date(item.start)} to ${date(item.end)}` : `${date(item.start)}, ${tl.labels.milestone}`;
  const done = item.progress === null ? '' : `, ${Math.round(item.progress * 100)}% ${tl.labels.done}`;
  return `${item.title}, ${when}${done}`;
}

function barNode(tl, item) {
  const { doc } = tl;
  const geometry = barOf(item, tl.domain, tl.state.scale);
  const node = el(doc, 'button', { className: `${TL}-bar`, attrs: { type: 'button', tabindex: '-1', 'data-ui-id': item.id,
    'aria-label': describeItem(tl, item), 'data-tone': item.tone || null, 'data-movable': item.movable ? 'true' : null } });
  node.classList.toggle('is-point', geometry.point);
  node.classList.toggle('is-grabbed', tl.state.pending?.id === item.id);
  markSelected(node, item.id === tl.state.selectedId);
  node.style.setProperty('--timeline-x', `${geometry.left}px`);
  node.style.setProperty('--timeline-w', `${geometry.width}px`);
  if (item.progress !== null) node.style.setProperty('--timeline-progress', String(item.progress));
  if (!geometry.point) node.append(el(doc, 'span', { className: `${TL}-bar-title`, text: item.title }));
  if (item.movable && !geometry.point) node.append(el(doc, 'span', { className: `${TL}-handle`, attrs: { 'aria-hidden': 'true' } }));
  return node;
}

/** A row: the bar on its track, and beside it the bar's name again, for the eye - a part of the same item, which says so. */
function rowNode(tl, item) {
  const row = el(tl.doc, 'div', { className: `${TL}-row`, attrs: { 'data-row-id': item.id } });
  const track = el(tl.doc, 'div', { className: `${TL}-track` });
  track.append(barNode(tl, item));
  row.append(el(tl.doc, 'div', { className: `${TL}-label`, text: item.title, attrs: { 'aria-hidden': 'true', 'data-ui-for': item.id } }), track);
  return row;
}

/** The heading of `item`'s group: its name, or - for a group that stands for an item - a button that is that item's face. */
function groupNode(tl, item) {
  const heading = el(tl.doc, 'div', { className: `${TL}-group`, attrs: { role: 'heading', 'aria-level': '3' } });
  if (item.groupId === null) {
    heading.textContent = item.group;
    return heading;
  }
  const face = el(tl.doc, 'button', { className: `${TL}-group-label`, text: item.group, attrs: { type: 'button', 'data-ui-id': item.groupId } });
  markSelected(face, item.groupId === tl.state.selectedId);
  heading.append(face);
  return heading;
}

function axisNode(tl) {
  const axis = el(tl.doc, 'div', { className: `${TL}-axis`, attrs: { 'aria-hidden': 'true' } });
  axis.append(el(tl.doc, 'div', { className: `${TL}-corner` }));
  const ticks = el(tl.doc, 'div', { className: `${TL}-ticks` });
  const format = tl.tickFormats[tl.state.scale];
  for (const date of tickDates(tl.domain, tl.state.scale)) {
    const tick = el(tl.doc, 'div', { className: `${TL}-tick`, text: format.format(date) });
    tick.style.setProperty('--timeline-x', `${xOf(date, tl.domain, tl.state.scale)}px`);
    ticks.append(tick);
  }
  axis.append(ticks);
  return axis;
}

function rowsNode(tl, items) {
  const rows = el(tl.doc, 'div', { className: `${TL}-rows`, attrs: { role: 'list' } });
  let last = { group: '', groupId: null };
  for (const item of items) {
    // A new heading where the group changes: its name, or the item it stands for.
    if (item.group && (item.group !== last.group || item.groupId !== last.groupId)) rows.append(groupNode(tl, item));
    last = item;
    const row = rowNode(tl, item);
    row.setAttribute('role', 'listitem');
    rows.append(row);
  }
  return rows;
}

/**
 * The scale buttons are built once (the set of scales never changes) and only their words and pressed state are
 * rewritten, so the one just activated keeps focus.
 */
function writeScales(tl) {
  if (!tl.scaleGroup.firstChild) {
    tl.scaleGroup.append(...Object.keys(TIMELINE_SCALES).map((scale) => button(tl.doc, {
      className: `${TL}-scale`, label: '', signal: tl.life.signal, attrs: { 'data-scale': scale }, onClick: () => tl.setScale(scale)
    })));
  }
  for (const node of tl.scaleGroup.children) {
    const scale = node.getAttribute('data-scale');
    writeText(node.firstChild, tl.labels[scale]);
    node.setAttribute('aria-pressed', String(scale === tl.state.scale));
  }
}

/** What holds focus in the sheet before a redraw: a bar, or the heading of a group that stands for an item - by that group's id. */
function heldFocus(tl) {
  const held = tl.sheet.contains(tl.doc.activeElement) ? tl.doc.activeElement : null;
  return { bar: Boolean(held?.closest(`.${TL}-bar`)), groupId: held?.closest(`.${TL}-group-label`)?.getAttribute('data-ui-id') ?? null };
}

/** The heading drawn for the group `groupId`, or null: a group that has gone, or none asked for. */
function headingOf(tl, groupId) {
  if (groupId === null) return null;
  return Array.from(tl.sheet.querySelectorAll(`.${TL}-group-label`)).find((node) => node.getAttribute('data-ui-id') === groupId) ?? null;
}

function render(tl) {
  const { state } = tl;
  const items = state.pending ? state.items.map((item) => (item.id === state.pending.id ? { ...item, ...state.pending.times } : item)) : state.items;
  tl.domain = state.pending?.domain ?? domainFor(state.items, state.scale, state.now);
  const grid = el(tl.doc, 'div', { className: `${TL}-grid` });
  grid.style.setProperty('--timeline-width', `${widthOf(tl.domain, state.scale)}px`);
  const now = el(tl.doc, 'div', { className: `${TL}-now`, attrs: { 'aria-hidden': 'true' } });
  now.style.setProperty('--timeline-x', `${xOf(state.now, tl.domain, state.scale)}px`);
  grid.append(axisNode(tl), rowsNode(tl, items), now);
  // Every bar and heading is redrawn: a draw that names no focus of its own (a host update, a pointer drag) keeps it on
  // what held it. A heading has it back; a bar's - and a heading's whose group has gone - is the tab stop's to take, as
  // 'keep', not true: `writeTabStops` returns such a focus without scrolling.
  const held = heldFocus(tl);
  tl.sheet.replaceChildren(grid);
  const heading = headingOf(tl, held.groupId);
  if (!tl.focusAfter && !heading && (held.bar || held.groupId !== null)) tl.focusAfter = 'keep';
  writeScales(tl);
  writeText(tl.rangeText, `${tl.format.format(tl.domain.start)} – ${tl.format.format(tl.domain.end)}`);
  tl.writeTabStops();
  heading?.focus({ preventScroll: true });
}

function applyModel(tl, model) {
  const { state } = tl;
  if (model.scale !== tl.lastScale && Object.hasOwn(TIMELINE_SCALES, model.scale)) state.scale = model.scale;
  tl.lastScale = model.scale;
  state.items = normalizeItems(model.items ?? []);
  state.selectedId = model.selectedId ?? null;
  state.now = toDate(model.now) ?? new Date();
  if (model.locale !== tl.locale || !tl.format) {
    tl.locale = model.locale;
    tl.format = new Intl.DateTimeFormat(model.locale, { month: 'short', day: 'numeric' });
    tl.tickFormats = { day: new Intl.DateTimeFormat(model.locale, { weekday: 'short', day: 'numeric' }),
      week: tl.format, month: new Intl.DateTimeFormat(model.locale, { month: 'short', year: 'numeric' }) };
  }
  tl.root.setAttribute('aria-label', String(model.label ?? 'Timeline'));
}

/**
 * @param {HTMLElement} host
 * @param {{onActivate?: (id: string) => void, onChange?: (id: string, times: {start: Date, end: Date|null}) => void,
 *   onScale?: (scale: string) => void, labels?: Partial<typeof TIMELINE_LABELS>}} [callbacks]
 * @returns {{update(model: {label?: string, scale?: string, now?: Date|string, locale?: string, selectedId?: string|null,
 *   items?: Array<{id: string, title?: string, start: Date|string, end?: Date|string, group?: string|{id?: string, label?: string},
 *   tone?: string, progress?: number, movable?: boolean}>}): void, destroy(): void}}
 */
export function createTimeline(host, callbacks = {}) {
  const doc = documentOf(host);
  injectUiStyles(doc);
  const life = createLife();
  const root = el(doc, 'div', { className: TL, attrs: { role: 'region' } });
  const tl = { doc, life, root, callbacks, labels: { ...TIMELINE_LABELS, ...callbacks.labels }, format: null, lastScale: undefined,
    state: { scale: 'week', items: [], now: new Date(), pending: null, focusId: null, selectedId: null } };
  root.append(toolbar(tl));
  tl.sheet = el(doc, 'div', { className: `${TL}-sheet` });
  root.append(tl.sheet);
  tl.region = createLiveRegion(root);
  tl.say = (text) => say(tl.region, text);
  tl.render = () => render(tl);
  tl.describe = (item) => describeItem(tl, item);
  tl.setScale = (scale) => { tl.state.scale = scale; tl.render(); callbacks.onScale?.(scale); };
  tl.scrollToNow = () => {
    const x = xOf(tl.state.now, tl.domain, tl.state.scale);
    tl.sheet.scrollLeft = Math.max(0, x - tl.sheet.clientWidth / 2);
  };
  bindTimeline(tl);
  host.append(root);
  return {
    update(model = {}) {
      if (life.dead) return;
      applyModel(tl, model);
      if (!tl.state.pending) tl.render();
    },
    destroy() {
      if (life.destroy()) root.remove();
    }
  };
}

