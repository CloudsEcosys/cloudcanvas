/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The timeline's keys on a bar. While a bar is picked up they are the move's
 * (`./move.js`). Otherwise Up and Down go to the bar before and after, Home and
 * End to the first and last, Space picks the bar up.
 */
import { setTabStop } from '../roving.js';
import { BAR, bars, pickUp, pickupKey } from './move.js';
import { select } from './select.js';

function walk(tl, bar, event) {
  const nodes = bars(tl);
  const index = nodes.indexOf(bar);
  const to = { ArrowUp: index - 1, ArrowDown: index + 1, Home: 0, End: nodes.length - 1 }[event.key];
  if (to === undefined) return false;
  event.preventDefault();
  const next = nodes[Math.max(0, Math.min(nodes.length - 1, to))];
  tl.state.focusId = next.getAttribute('data-ui-id');
  setTabStop(nodes, next);
  next.focus();
  select(tl, tl.state.focusId);
  return true;
}

function onKeyDown(tl, event) {
  const bar = event.target.closest?.(BAR);
  if (!bar) return;
  if (tl.state.pending?.keyboard) { pickupKey(tl, event); return; }
  if (event.key === ' ') {
    event.preventDefault();
    if (!event.repeat) pickUp(tl, bar);
    return;
  }
  walk(tl, bar, event);
}

/** Wire the keys on the timeline's sheet. */
export function bindKeys(tl) {
  tl.life.on(tl.sheet, 'keydown', (event) => onKeyDown(tl, event));
  tl.life.on(tl.sheet, 'keyup', (event) => { if (event.key === ' ' && event.target.closest?.(BAR)) event.preventDefault(); });
}
