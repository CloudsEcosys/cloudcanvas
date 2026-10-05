/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * What the timeline does with a click, a key or a drag. A move in progress is
 * `state.pending` (`{id, original, times, resize, domain}`); the axis is frozen
 * at its `domain` while it lasts, so the bar moves under the pointer rather
 * than the axis moving under the bar.
 */
import { trackDrag } from '../drag.js';
import { setTabStop } from '../roving.js';
import { TIMELINE_SCALES, shiftItem } from './model.js';

const BAR = '.cloudcanvas-ui-timeline-bar';

function bars(tl) {
  return Array.from(tl.sheet.querySelectorAll(BAR));
}

function itemById(tl, id) {
  return tl.state.items.find((item) => item.id === id) ?? null;
}

/**
 * One tab stop, and the focus the draw owes (`tl.focusAfter`): `true` is the timeline's own (a pick-up, a step, a
 * drop), a plain focus() the view follows; `'keep'` returns a focus the draw found on a bar, and scrolls nothing.
 */
function writeTabStops(tl) {
  const nodes = bars(tl);
  const current = nodes.find((node) => node.getAttribute('data-ui-id') === tl.state.focusId) ?? nodes[0] ?? null;
  tl.state.focusId = current?.getAttribute('data-ui-id') ?? null;
  setTabStop(nodes, current);
  if (tl.focusAfter && current) current.focus(tl.focusAfter === 'keep' ? { preventScroll: true } : undefined);
  tl.focusAfter = false;
}

function startMove(tl, id, { keyboard, resize }) {
  const item = itemById(tl, id);
  if (!item?.movable) return false;
  const original = { start: item.start, end: item.end };
  tl.state.pending = { id, keyboard, resize, original, times: original, days: 0, domain: tl.domain };
  if (keyboard) tl.say(`Picked up ${item.title}. Left and Right move it a day, Shift resizes, Space drops it, Escape cancels.`);
  return true;
}

function finishMove(tl, drop) {
  const pending = tl.state.pending;
  tl.state.pending = null;
  tl.focusAfter = pending.keyboard;
  const same = (a, b) => (a?.getTime() ?? null) === (b?.getTime() ?? null);
  const moved = !same(pending.times.start, pending.original.start) || !same(pending.times.end, pending.original.end);
  if (drop && moved) {
    tl.callbacks.onChange?.(pending.id, { ...pending.times });
    tl.say(`Moved: ${tl.describe({ ...itemById(tl, pending.id), ...pending.times })}.`);
  } else if (pending.keyboard) {
    tl.say(drop ? 'Not moved.' : 'Move cancelled.');
  }
  tl.render();
}

function stepMove(tl, days, resize) {
  const pending = tl.state.pending;
  pending.times = shiftItem(pending.times, days, resize);
  tl.focusAfter = true;
  tl.render();
  tl.say(tl.describe({ ...itemById(tl, pending.id), ...pending.times }));
}

function onKeyDown(tl, event) {
  const bar = event.target.closest?.(BAR);
  if (!bar) return;
  const pending = tl.state.pending;
  if (pending?.keyboard) {
    if (event.repeat && (event.key === ' ' || event.key === 'Enter')) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') stepMove(tl, event.key === 'ArrowRight' ? 1 : -1, event.shiftKey);
    else if (event.key === ' ' || event.key === 'Enter') finishMove(tl, true);
    else if (event.key === 'Escape' || event.key === 'Tab') finishMove(tl, false);
    else return;
    if (event.key !== 'Tab') event.preventDefault();
    return;
  }
  if (event.key === ' ') {
    event.preventDefault();
    if (!event.repeat && startMove(tl, bar.getAttribute('data-ui-id'), { keyboard: true, resize: false })) { tl.focusAfter = true; tl.render(); }
    return;
  }
  const nodes = bars(tl);
  const index = nodes.indexOf(bar);
  const to = { ArrowUp: index - 1, ArrowDown: index + 1, Home: 0, End: nodes.length - 1 }[event.key];
  if (to === undefined) return;
  event.preventDefault();
  const next = nodes[Math.max(0, Math.min(nodes.length - 1, to))];
  tl.state.focusId = next.getAttribute('data-ui-id');
  setTabStop(nodes, next);
  next.focus();
}

function bindDrag(tl) {
  trackDrag(tl.life, tl.sheet, {
    selector: `${BAR}[data-movable]`,
    canStart: () => !tl.state.pending,
    onStart(bar, point, pressTarget) {
      const resize = Boolean(pressTarget?.closest?.('.cloudcanvas-ui-timeline-handle'));
      if (startMove(tl, bar.getAttribute('data-ui-id'), { keyboard: false, resize })) tl.state.pending.originX = point.x;
    },
    onMove(point) {
      const pending = tl.state.pending;
      if (!pending) return;
      const days = Math.round((point.x - pending.originX) / TIMELINE_SCALES[tl.state.scale].perDay);
      if (days === pending.days) return;
      pending.days = days;
      pending.times = shiftItem(pending.original, days, pending.resize);
      tl.render();
    },
    onEnd(point) {
      if (tl.state.pending) finishMove(tl, point !== null);
    }
  });
}

/** Wire clicks, keys and drags on the timeline sheet. */
export function bindTimeline(tl) {
  tl.writeTabStops = () => writeTabStops(tl);
  tl.life.on(tl.sheet, 'click', (event) => {
    const bar = event.target.closest?.(BAR);
    if (bar && !tl.state.pending) tl.callbacks.onActivate?.(bar.getAttribute('data-ui-id'));
  });
  tl.life.on(tl.sheet, 'keydown', (event) => onKeyDown(tl, event));
  tl.life.on(tl.sheet, 'keyup', (event) => { if (event.key === ' ' && event.target.closest?.(BAR)) event.preventDefault(); });
  tl.life.on(tl.sheet, 'focusin', (event) => {
    const bar = event.target.closest?.(BAR);
    if (bar && !tl.state.pending) tl.state.focusId = bar.getAttribute('data-ui-id');
  });
  bindDrag(tl);
}
