/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * What the timeline does with a click or a key. A press on a bar, on the label
 * beside it or on a heading that stands for an item opens that item: each says
 * which item it belongs to (`itemIdOf`). The moves are `./move.js`, the keys
 * `./keys.js`, the gutter `./gutter.js`.
 */
import { itemIdOf, itemNodeOf } from '../dom.js';
import { setTabStop } from '../roving.js';
import { bindGutter } from './gutter.js';
import { TL } from './model.js';
import { bindKeys } from './keys.js';
import { BAR, bars, bindMove } from './move.js';
import { select } from './select.js';

/**
 * One tab stop among the bars - where the keys placed it, else on the selected bar, else on the first - and the focus the
 * draw owes (`tl.focusAfter`): `true` is the timeline's own (a pick-up, a step, a drop), a plain focus() the view
 * follows; `'keep'` returns a focus the draw found on a bar, and scrolls nothing.
 */
function writeTabStops(tl) {
  const nodes = bars(tl);
  const barOf = (id) => nodes.find((node) => node.getAttribute('data-ui-id') === id);
  const current = barOf(tl.state.focusId) ?? barOf(tl.state.selectedId) ?? nodes[0] ?? null;
  tl.state.focusId = current?.getAttribute('data-ui-id') ?? null;
  setTabStop(nodes, current);
  if (tl.focusAfter && current) current.focus(tl.focusAfter === 'keep' ? { preventScroll: true } : undefined);
  tl.focusAfter = false;
}

function onClick(tl, event) {
  const part = itemNodeOf(event.target, tl.sheet);
  if (!part || tl.state.pending) return;
  const id = itemIdOf(part);
  select(tl, id);
  tl.callbacks.onActivate?.(id);
}

function onFocusIn(tl, event) {
  const face = event.target.closest?.(`${BAR}, .${TL}-group-label`);
  if (!face || tl.state.pending || tl.drawing) return;
  const id = face.getAttribute('data-ui-id');
  if (face.matches(BAR)) tl.state.focusId = id;
  select(tl, id);
}

/** Wire clicks, keys and drags on the timeline sheet. */
export function bindTimeline(tl) {
  tl.writeTabStops = () => writeTabStops(tl);
  tl.life.on(tl.sheet, 'click', (event) => onClick(tl, event));
  tl.life.on(tl.sheet, 'focusin', (event) => onFocusIn(tl, event));
  bindKeys(tl);
  bindMove(tl);
  bindGutter(tl);
}
