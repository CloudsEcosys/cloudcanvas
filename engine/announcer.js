/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The legacy session's accessibility surface, on the add-ons: the host's
 * application identity is the keyboard add-on's (`applyApplicationRole` - it
 * ships only with a host that gives every key back), the polite live region
 * and `say` are the announce add-on's.
 *
 * What stays here is Pin-shaped: the decorative layers taken out of the tree
 * (the SVG connectors, the focus veil, the cursor overlay), a Pin's spoken name,
 * and the messages the session's own transitions say - focus, the edit lock, a
 * lazy scope's provisioning. The session keeps the region as `_liveRegion` and
 * what it wrote on the host as `_hostAriaAttributes`.
 */
import { applyApplicationRole, removeAttributes } from '../addons/keyboard.js';
import { createLiveRegion, say } from '../addons/announce.js';

export { DEFAULT_HOST_LABEL, HOST_ROLE, HOST_ROLEDESCRIPTION } from '../addons/keyboard.js';
export { LIVE_REGION_CLASS } from '../addons/announce.js';

function hideFromAssistiveTech(element) {
  if (!element || typeof element.setAttribute !== 'function') return false;
  element.setAttribute('aria-hidden', 'true');
  return true;
}

/**
 * Write the host's role and name where the author has not, and hide the
 * drawing layers: they project Pins already in the tree, or show nothing.
 * @returns {boolean} true when the host was labelled
 */
export function applyHostAria(session) {
  const host = session ? session.hostElement : null;
  if (!host) return false;

  session._hostAriaAttributes = applyApplicationRole(host, session.options?.label || undefined);
  hideFromAssistiveTech(session.svgLayerElement);
  hideFromAssistiveTech(session.focusVeilElement);
  const overlay = session.overlayElement;
  hideFromAssistiveTech(overlay && typeof overlay.querySelector === 'function'
    ? overlay.querySelector('svg.cloudcanvas-cursor-layer') : null);
  return true;
}

/** Take back exactly the host attributes `applyHostAria` wrote. @returns {boolean} one was removed */
export function removeHostAria(session) {
  if (!session) return false;
  const host = session.hostElement;
  const written = session._hostAriaAttributes;
  session._hostAriaAttributes = null;
  if (!host || !written || written.length === 0 || typeof host.removeAttribute !== 'function') return false;

  removeAttributes(host, written);
  return true;
}

/** Create the session's live region in the host, replacing any earlier one. @returns {Element|null} */
export function mountAnnouncer(session) {
  if (!session || !session.hostElement) return null;
  unmountAnnouncer(session);
  session._liveRegion = createLiveRegion(session.hostElement);
  return session._liveRegion;
}

/** Remove the live region; the session keeps working without one. */
export function unmountAnnouncer(session) {
  const region = session ? session._liveRegion : null;
  if (!region) return false;
  region.remove();
  session._liveRegion = null;
  return true;
}

/** Say something, politely. @returns {boolean} true when the region's text changed */
export function announce(session, text) {
  return say(session ? session._liveRegion : null, text);
}

/** A Pin's spoken name: its title, falling back to the id that always exists. */
export function titleOf(pin) {
  if (!pin) return '';
  const title = pin.contents ? pin.contents.get('title') : null;
  if (typeof title === 'string' && title.trim() !== '') return title.trim();
  if (typeof title === 'number' && Number.isFinite(title)) return String(title);
  return pin.id;
}

/** Announce a focus transition, including the one back to nothing. */
export function announceFocus(session, pin) {
  return announce(session, pin ? `Focused ${titleOf(pin)}` : 'Focus cleared');
}

/** Announce a Pin entering (`editing` true) or leaving its edit lock. */
export function announceEdit(session, pin, editing) {
  if (!session || !pin) return false;
  const label = titleOf(pin);
  return announce(session, editing ? `Editing ${label}` : `Finished editing ${label}`);
}

/** Announce a lazy scope's provider run: the loader never rejects, so its flag tells failure from empty. */
export function announceProvision(session, pin, created) {
  if (!session || !pin) return false;
  if (!pin._childrenLoaded) return announce(session, 'Failed to load items');
  return announce(session, `${created.length} items loaded`);
}
