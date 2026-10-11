/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Timeline: a Gantt of bars on a shared date axis, grouped into sections.
 *
 *   const timeline = createTimeline(host, {
 *     onActivate: (id) => open(id),
 *     onChange: (id, { start, end }) => reschedule(id, start, end),
 *     onGutter: (px) => remember(px)
 *   });
 *   timeline.update({ scale: 'week', items: [{ id: 'a', title: 'Draft', start: '2026-09-28', end: '2026-10-02', group: 'Writing' }] });
 *
 * Items are plain: `{id, title, start, end?, milestone?, group?, groupId?, status?, tone?, progress?, depends?, movable?}`.
 * No `end` (or `milestone: true`) draws a milestone. `status` is words, or
 * `{label, tone}` with a tone of success, warning, danger or muted. Nothing is
 * applied by the kit: it draws the model and reports.
 *
 * EVERY BAR AND MILESTONE DRAWS ITS TITLE: inside the bar when it is wide
 * enough, else beside it; the full title is its tooltip and leads its name.
 * The name gives the first and the LAST day the bar covers ("Oct 1 to Oct 3");
 * what `onChange` reports as its end is the midnight after that day.
 * The column of titles at the left (the gutter) is resized by the separator on
 * the axis' corner (`onGutter(px)`; the model's `gutter` restores it). The
 * scale (day | week | month) is kept between updates; a model `scale` that
 * changes wins. A redraw keeps focus on the bar, the heading or the separator
 * that held it and scrolls nothing.
 *
 * A BAR IS DRAWN AT LEAST 1.25REM WIDE: one that lasts less (half an hour, a day
 * on the month scale) is drawn at that width, starting where it starts, and its
 * name says `shown wider than it lasts`; `onChange` reports its true times. Under
 * a finger it has a 44px grab area of padding round it, and the handles at its
 * ends give way to its body when it is too short for three targets.
 *
 * A ROW'S LABEL BELONGS TO ITS BAR: a press on the label beside a bar is a
 * press on that bar, and `itemIdOf` answers with the bar's item for either.
 *
 * A GROUP MAY BE AN ITEM. `group` is the name consecutive items are headed
 * by, or `{id, label, collapsed}` for a group that stands for an item - the
 * parent its bars belong to. That heading is a button: pressed as a bar is
 * (`onActivate(id)`), carrying the group's id. Two groups of one name and
 * different ids are two groups.
 *
 * THE AXIS REACHES WHERE THE READER CAN LOOK. It covers the items and today, a
 * sheet's width of days beyond them on each side, and more each time the reader
 * scrolls near either end: a span (`onCreate({groupId, start, end})`) is dragged
 * across the empty part of any row, a group's heading included - folded or
 * not - on any day the axis shows, whatever is on the row. See `./reach.js`.
 *
 * THE DAYS ON SCREEN are said to a host that fetches what it draws:
 * `onWindow({from, to})`, the first and the last day (day keys, both on screen)
 * right of the gutter, once the sheet is drawn and again about 150ms after a
 * scroll, a zoom, a change of scale or a resize has settled and moved them.
 * See `./window.js`.
 *
 * THE ROWS ARE A TREEGRID: a heading is a row of level 1, a bar's row level 2
 * under it. `selectedId` marks the item that is selected, on its bar and on a
 * heading that stands for it: for the eye and for assistive technology
 * (`aria-current`). The arrows and a press move the selection; the model's
 * replaces it when the model changes it. The hint under the toolbar says what
 * the selection can do. The timeline has no motion, so a reader who asked for
 * less gets none.
 */
import { createLiveRegion, say } from '../../addons/announce.js';
import { CONTROL_ATTR } from '../../addons/trait.js';
import { button, createLife, documentOf, el, textNode, uniqueId, writeText } from '../dom.js';
import { injectUiStyles } from '../styles.js';
import { toDate } from '../calendar/dates.js';
import { applyGutter } from './gutter.js';
import { bindTimeline } from './interact.js';
import { TL, TIMELINE_SCALES, normalizeItems, widthOf, xOf } from './model.js';
import { drawLinks, linksLayer } from './links.js';
import { domainOf, viewAfter, viewBefore } from './reach.js';
import { axisNode, describeItem, rowsNode } from './rows.js';
import { paint } from './select.js';

/** The timeline's default words. */
export const TIMELINE_LABELS = /* @__PURE__ */ Object.freeze({
  scale: 'Zoom', day: 'Days', week: 'Weeks', month: 'Months', today: 'Today', done: 'done', milestone: 'milestone',
  gutter: 'Resize the title column', moved: 'Moved', notMoved: 'Not moved.', cancelled: 'Move cancelled.',
  pickedUp: 'Picked up {title}. Left and Right move it a day, Shift resizes, Space drops it, Escape cancels.',
  hintNone: 'Select a bar to see what it can do', hintCreate: 'drag on a row to add one', hintOpen: 'Enter opens',
  hintMove: 'drag to move', hintResize: 'drag an edge to resize', hintKeys: 'Alt+arrows move a day, Alt+Shift+arrows resize',
  hintLink: 'drag the dot to link', hintDelete: 'Delete removes', hintAdd: '+ adds one here', hintFold: 'Space folds',
  hintUnlink: 'Delete removes the link', clamped: 'shown wider than it lasts', link: 'Drag to another bar to link them', dependsOn: 'depends on', collapse: 'Collapse {group}', expand: 'Expand {group}', hidden: '{count} hidden'
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

/** What holds focus in the sheet before a redraw: a bar, the heading of a group that stands for an item (by its id), or the separator. */
function heldFocus(tl) {
  const held = tl.sheet.contains(tl.doc.activeElement) ? tl.doc.activeElement : null;
  return { bar: Boolean(held?.closest(`.${TL}-bar`)), gutter: Boolean(held?.closest(`.${TL}-gutter-handle`)),
    groupId: held?.closest(`.${TL}-group-label`)?.getAttribute('data-ui-id') ?? null };
}

/** The heading drawn for the group `groupId`, or null: a group that has gone, or none asked for. */
function headingOf(tl, groupId) {
  if (groupId === null) return null;
  return Array.from(tl.sheet.querySelectorAll(`.${TL}-group-label`)).find((node) => node.getAttribute('data-ui-id') === groupId) ?? null;
}

/** The items as drawn: the one in hand at the times it is held at. */
function drawnItems(state) {
  const { pending } = state;
  return pending ? state.items.map((item) => (item.id === pending.id ? { ...item, ...pending.times } : item)) : state.items;
}

function gridNode(tl, items) {
  const { state } = tl;
  const grid = el(tl.doc, 'div', { className: `${TL}-grid` });
  grid.style.setProperty('--timeline-width', `${widthOf(tl.domain, state.scale)}px`);
  const now = el(tl.doc, 'div', { className: `${TL}-now`, attrs: { 'aria-hidden': 'true' } });
  now.style.setProperty('--timeline-x', `${xOf(state.now, tl.domain, state.scale)}px`);
  grid.append(axisNode(tl), linksLayer(tl), rowsNode(tl, items), now);
  return grid;
}

function render(tl) {
  const { state } = tl;
  const view = viewBefore(tl);
  tl.domain = state.pending?.domain ?? domainOf(tl);
  // Every bar and heading is redrawn: a draw that names no focus of its own (a host update, a pointer drag) keeps it on
  // what held it. A heading and the separator have it back; a bar's - and a heading's whose group has gone - is the tab
  // stop's to take, as 'keep', not true: `writeTabStops` returns such a focus without scrolling.
  const held = heldFocus(tl);
  tl.drawing = true;
  tl.sheet.replaceChildren(gridNode(tl, drawnItems(state)));
  viewAfter(tl, view);
  drawLinks(tl);
  const heading = headingOf(tl, held.groupId);
  if (!tl.focusAfter && !heading && (held.bar || held.groupId !== null)) tl.focusAfter = 'keep';
  writeScales(tl);
  writeText(tl.rangeText, `${tl.format.format(tl.domain.start)} – ${tl.format.format(tl.domain.end)}`);
  tl.writeTabStops();
  paint(tl);
  heading?.focus({ preventScroll: true });
  if (held.gutter) tl.gutterNode?.focus({ preventScroll: true });
  tl.drawing = false;
  tl.windowMoved();
}

function writeFormats(tl, locale) {
  tl.locale = locale;
  tl.format = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' });
  tl.tickFormats = { day: new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric' }),
    week: tl.format, month: new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' }) };
}

/** Take what the model says that the reader may also change - the selection, the gutter - only when the model changed it. */
function adopt(tl, model) {
  const { seen, state } = tl;
  const selectedId = model.selectedId ?? null;
  if (selectedId !== seen.selectedId) {
    seen.selectedId = selectedId;
    state.selectedId = selectedId;
    state.selectedLink = null;
  }
  const gutter = Number.isFinite(model.gutter) ? model.gutter : null;
  if (gutter !== seen.gutter) {
    seen.gutter = gutter;
    if (gutter !== null) applyGutter(tl, gutter);
  }
}

function applyModel(tl, model) {
  const { state } = tl;
  if (model.scale !== tl.lastScale && Object.hasOwn(TIMELINE_SCALES, model.scale)) state.scale = model.scale;
  tl.lastScale = model.scale;
  state.items = normalizeItems(model.items ?? []);
  tl.byId = new Map(state.items.map((item) => [item.id, item]));
  tl.groups = new Map(state.items.filter((item) => item.groupId !== null).map((item) => [item.groupId, item.collapsed]));
  state.now = toDate(model.now) ?? new Date();
  if (model.locale !== tl.locale || !tl.format) writeFormats(tl, model.locale);
  tl.root.setAttribute('aria-label', String(model.label ?? 'Timeline'));
  adopt(tl, model);
}

/** Say on the root which gestures the host takes, so the sheet shows their affordances and cursors. */
function markAbilities(root, callbacks) {
  for (const [name, callback] of [['data-can-move', 'onChange'], ['data-can-create', 'onCreate'], ['data-can-link', 'onLink'],
    ['data-can-fold', 'onToggleGroup'], ['data-can-unlink', 'onUnlink']]) {
    if (typeof callbacks[callback] === 'function') root.setAttribute(name, '');
  }
}

function timelineState(doc, life, root, callbacks) {
  return { doc, life, root, callbacks, id: uniqueId(TL), labels: { ...TIMELINE_LABELS, ...callbacks.labels }, format: null, lastScale: undefined,
    byId: new Map(), groups: new Map(), seen: { selectedId: undefined, gutter: undefined }, reach: { before: 0, after: 0 },
    state: { scale: 'week', items: [], now: new Date(), pending: null, creating: null, linking: null, focusId: null, selectedId: null, selectedLink: null, gutter: null } };
}

/**
 * @param {HTMLElement} host
 * @param {{onActivate?: (id: string) => void, onChange?: (id: string, times: {start: Date, end: Date|null}) => void,
 *   onScale?: (scale: string) => void, onGutter?: (px: number) => void, onWindow?: (days: {from: string, to: string}) => void,
 *   labels?: Partial<typeof TIMELINE_LABELS>}} [callbacks]
 * @returns {{update(model: {label?: string, scale?: string, now?: Date|string, locale?: string, selectedId?: string|null, gutter?: number,
 *   items?: Array<{id: string, title?: string, start: Date|string, end?: Date|string, milestone?: boolean,
 *   group?: string|{id?: string, label?: string, collapsed?: boolean}, groupId?: string, status?: string|{label: string, tone?: string},
 *   tone?: string, progress?: number, depends?: string[], movable?: boolean}>}): void, destroy(): void}}
 */
export function createTimeline(host, callbacks = {}) {
  const doc = documentOf(host);
  injectUiStyles(doc);
  const life = createLife();
  // A control (`data-cc-control`): the canvas under the page leaves this view's drags to it, so a host marks nothing.
  const root = el(doc, 'div', { className: TL, attrs: { role: 'region', [CONTROL_ATTR]: true } });
  markAbilities(root, callbacks);
  const tl = timelineState(doc, life, root, callbacks);
  root.append(toolbar(tl));
  tl.hint = el(doc, 'p', { className: `${TL}-hint` });
  tl.hintText = textNode(doc, tl.hint);
  tl.sheet = el(doc, 'div', { className: `${TL}-sheet` });
  root.append(tl.hint, tl.sheet);
  tl.region = createLiveRegion(root);
  tl.say = (text) => say(tl.region, text);
  tl.render = () => render(tl);
  tl.paint = () => paint(tl);
  tl.busy = () => Boolean(tl.state.pending || tl.state.creating || tl.state.linking);
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
      if (!tl.busy()) tl.render();
    },
    destroy() {
      if (life.destroy()) root.remove();
    }
  };
}
