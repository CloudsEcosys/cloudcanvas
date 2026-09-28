/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Menu panel placement: a point anchor clamps inside the host (or opens upward
 * when there is no room below); a box anchor opens beside its trigger.
 */

const NO_INSETS = Object.freeze({ top: 0, right: 0, bottom: 0, left: 0 });


/**
 * Place a panel in overlay coordinates (client minus the host's cached origin)
 * and fit it in the host. A point anchor (the click) is clamped back inside by
 * its overhang, never past the near edge. A box anchor (a trigger) opens on its
 * committed side and flips only for the first flyout (`allowFlip`); failing
 * both it clamps on that side, since reversing would land on its own ancestors.
 * @returns {'left'|'right'|null} the side a box took
 */
export function placeInHost(m, element, anchor) {
  const hostRect = m.root.hostRect;
  // Insets: edges an app floats chrome over (a status bar, a toolbar) are not the menu's to use.
  const inset = (typeof m.insets === 'function' ? m.insets() : m.insets) || NO_INSETS;
  // `|| 0`: a synthetic event without coordinates opens at the host's corner, never at `NaNpx`.
  const hostLeft = (hostRect.left || 0) + (inset.left || 0);
  const hostTop = (hostRect.top || 0) + (inset.top || 0);
  const hostRight = (hostRect.left || 0) + (hostRect.width || 0) - (inset.right || 0);
  const hostBottom = (hostRect.top || 0) + (hostRect.height || 0) - (inset.bottom || 0);
  const box = anchor.mode === 'box';
  element.style.top = `${(box ? anchor.rect.top : (Number(anchor.y) || 0)) - hostTop}px`;
  element.style.left = `${(box ? anchor.rect.right : (Number(anchor.x) || 0)) - hostLeft}px`;

  const measured = element.getBoundingClientRect();
  const side = box ? placeBoxHorizontally(element, anchor, measured.width, hostLeft, hostRight) : null;
  if (!box) clampFarEdge(element, 'left', measured.right, hostRight);
  if (!placeAbove(element, anchor, measured, hostTop, hostBottom)) clampFarEdge(element, 'top', measured.bottom, hostBottom);
  return side;
}

/** A point-anchored panel with no room below opens upward, so it never covers where it was opened. */
function placeAbove(element, anchor, box, hostTop, hostBottom) {
  if (anchor.mode === 'box' || box.bottom <= hostBottom) return false;
  const above = (parseFloat(element.style.top) || 0) - box.height;
  if (above < 0 || box.height > (Number(anchor.y) || 0) - hostTop) return false;
  element.style.top = `${above}px`;
  return true;
}

/** Fit a flyout beside its trigger on the committed side, else (first flyout only) the other, else clamp. */
function placeBoxHorizontally(element, anchor, panelWidth, hostLeft, hostRight) {
  const { rect, preferSide, allowFlip } = anchor;
  const fits = { right: rect.right + panelWidth <= hostRight, left: rect.left - panelWidth >= hostLeft };
  const at = { right: rect.right - hostLeft, left: (rect.left - panelWidth) - hostLeft };
  const order = allowFlip ? [preferSide, 'left', 'right'] : [preferSide];
  const side = order.find((each) => fits[each]);
  if (side) {
    element.style.left = `${at[side]}px`;
    return side;
  }
  element.style.left = `${preferSide === 'left' ? 0 : Math.max(0, (hostRight - hostLeft) - panelWidth)}px`;
  return preferSide;
}

/** Pull a far edge back inside the host by its overhang, never past the near edge. */
function clampFarEdge(element, styleProp, boxFar, hostFar) {
  const over = boxFar - hostFar;
  if (over > 0) element.style[styleProp] = `${Math.max(0, parseFloat(element.style[styleProp]) - over)}px`;
}

