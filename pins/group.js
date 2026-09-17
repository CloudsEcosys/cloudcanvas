/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Group & Subtree Operations:
 * Subtree serialization, group templating, and instant canvas instantiation.
 *
 * Enables any Pin (leaf, section, or parent) and its full recursive child hierarchy
 * to be captured, persisted in localStorage, and stamped back onto the canvas plane.
 */

export const GROUP_STORAGE_PREFIX = 'cloudcanvas-group:';

/**
 * Storage guard matching CloudCanvas persistence conventions.
 */
function storage() {
  if (typeof localStorage === 'undefined') return null;
  return localStorage;
}

/**
 * Serialize a single Pin and its full recursive child hierarchy.
 *
 * @param {Pin} rootPin
 * @returns {object} JSON-safe snapshot of the pin and its subtree
 */
export function serializeGroup(rootPin) {
  if (!rootPin || typeof rootPin !== 'object') {
    throw new TypeError('serializeGroup: a valid Pin instance is required');
  }

  function serializeNode(pin) {
    const contents = {};
    if (pin.contents instanceof Map) {
      for (const [k, v] of pin.contents.entries()) {
        if (v !== undefined && typeof v !== 'function') {
          contents[k] = v;
        }
      }
    }

    const traitNames = pin.traits instanceof Map
      ? Array.from(pin.traits.keys())
      : [];

    const children = pin.children instanceof Set || Array.isArray(pin.children)
      ? Array.from(pin.children).filter(c => !c.utility).map(serializeNode)
      : [];

    return {
      type: pin.type || (pin.displayTrait ? pin.displayTrait.name : 'card'),
      x: pin.x || 0,
      y: pin.y || 0,
      width: pin.particle ? pin.particle.width : pin.width,
      height: pin.particle ? pin.particle.height : pin.height,
      layout: pin.layout || 'free',
      layoutGap: pin.layoutGap !== undefined ? pin.layoutGap : null,
      chrome: pin.chrome !== undefined ? pin.chrome : true,
      bordered: pin.bordered !== undefined ? pin.bordered : true,
      contents,
      traitNames,
      children
    };
  }

  return serializeNode(rootPin);
}

/**
 * Save a group definition to localStorage under a named preset.
 *
 * @param {Pin} rootPin
 * @param {string} name
 * @returns {object|null}
 */
export function saveGroup(rootPin, name) {
  if (typeof name !== 'string' || name.trim().length === 0) {
    throw new TypeError('saveGroup: a non-empty name is required');
  }
  const store = storage();
  const data = serializeGroup(rootPin);
  if (store) {
    store.setItem(`${GROUP_STORAGE_PREFIX}${name.trim()}`, JSON.stringify(data));
  }
  return data;
}

/**
 * Load a saved group definition from localStorage.
 *
 * @param {string} name
 * @returns {object|null}
 */
export function loadGroup(name) {
  const store = storage();
  if (!store) return null;
  const raw = store.getItem(`${GROUP_STORAGE_PREFIX}${name.trim()}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * List all saved group names in localStorage.
 *
 * @returns {string[]}
 */
export function listGroupKeys() {
  const store = storage();
  if (!store) return [];
  const keys = [];
  for (let i = 0; i < store.length; i++) {
    const k = store.key(i);
    if (k && k.startsWith(GROUP_STORAGE_PREFIX)) {
      keys.push(k.slice(GROUP_STORAGE_PREFIX.length));
    }
  }
  return keys.sort();
}

/**
 * Delete a saved group from localStorage.
 *
 * @param {string} name
 * @returns {boolean}
 */
export function deleteGroup(name) {
  const store = storage();
  if (!store) return false;
  const key = `${GROUP_STORAGE_PREFIX}${name.trim()}`;
  if (store.getItem(key) === null) return false;
  store.removeItem(key);
  return true;
}

/**
 * Instantiate a saved group back onto the canvas plane.
 *
 * @param {CloudCanvasSession} session
 * @param {object} groupData serialized group object
 * @param {object} [options] placement overrides { x, y, parent }
 * @returns {Pin} root Pin of the newly stamped group
 */
export function instantiateGroup(session, groupData, options = {}) {
  if (!session || typeof session.createPin !== 'function') {
    throw new TypeError('instantiateGroup: a valid CloudCanvasSession is required');
  }
  if (!groupData || typeof groupData !== 'object') {
    throw new TypeError('instantiateGroup: invalid group data');
  }

  function spawnNode(nodeData, parentPin = null, isRoot = false) {
    const posX = isRoot && options.x !== undefined ? options.x : nodeData.x;
    const posY = isRoot && options.y !== undefined ? options.y : nodeData.y;
    const targetParent = isRoot && options.parent !== undefined ? options.parent : parentPin;

    const pinConfig = {
      type: nodeData.type,
      x: posX,
      y: posY,
      contents: { ...(nodeData.contents || {}) },
      parent: targetParent
    };

    if (nodeData.width) pinConfig.width = nodeData.width;
    if (nodeData.height) pinConfig.height = nodeData.height;
    if (nodeData.chrome !== undefined) pinConfig.chrome = nodeData.chrome;
    if (nodeData.bordered !== undefined) pinConfig.bordered = nodeData.bordered;

    const pin = session.createPin(pinConfig);

    // Apply layout if defined
    if (nodeData.layout) pin.layout = nodeData.layout;
    if (nodeData.layoutGap !== undefined && nodeData.layoutGap !== null) {
      pin.layoutGap = nodeData.layoutGap;
    }

    // Attach non-default traits
    if (Array.isArray(nodeData.traitNames)) {
      for (const t of nodeData.traitNames) {
        if (!pin.traits.has(t)) {
          try {
            pin.addTrait(t);
          } catch {
            // Skip unknown/unregistered trait gracefully
          }
        }
      }
    }

    // Recursively instantiate children inside this Pin's scope
    if (Array.isArray(nodeData.children)) {
      for (const childData of nodeData.children) {
        spawnNode(childData, pin, false);
      }
    }

    return pin;
  }

  return spawnNode(groupData, null, true);
}
