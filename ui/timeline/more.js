/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The timeline's "more" button (`../item-more.js`): one, in the track of the selected bar's row, after the bar, its
 * link handle and the title drawn beside it, drawn only while the host takes a menu and nothing is in hand (a bar being
 * moved or resized, a span being drawn, a link being dragged). It stands beyond the bar's right end - the sheet moves a
 * title drawn beside the bar past it - so it covers neither the title nor a handle, and the row's own end stays the
 * bar's.
 */
import { MORE_CLASS, belowMore, isMore, moreButton, nameMore } from '../item-more.js';
import { TL } from './model.js';
import { bars } from './move.js';

/** The geometry a bar is placed by; the button takes the same, so it stands where the bar ends. */
const PLACE = Object.freeze(['--timeline-x', '--timeline-w']);

/** Put the button after the selected bar, or take it away. */
export function syncMore(tl) {
  const id = tl.state.selectedId;
  const bar = id !== null && typeof tl.callbacks.onMenu === 'function' && !tl.busy() ? bars(tl).find((node) => node.getAttribute('data-ui-id') === id) : null;
  if (!bar) {
    tl.more?.remove();
    return;
  }
  tl.more ??= moreButton(tl.doc, `${TL}-more`);
  nameMore(tl.more, tl.labels.more, tl.byId.get(id).title);
  tl.more.setAttribute('data-more-for', id);
  tl.more.classList.toggle('is-point', bar.classList.contains('is-point'));
  for (const name of PLACE) tl.more.style.setProperty(name, bar.style.getPropertyValue(name));
  const track = bar.parentElement;
  if (tl.more.parentElement !== track) track.append(tl.more);
}

/** A press on the button: the menu of the bar it stands by, under it. True when it was the button's. */
export function pressMore(tl, target) {
  if (!isMore(target)) return false;
  const button = target.closest(`.${MORE_CLASS}`);
  tl.callbacks.onMenu?.(button.getAttribute('data-more-for'), belowMore(button));
  return true;
}
