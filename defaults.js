/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The defaults (`cloudcanvas/defaults`): everything the engine used to register
 * on import, installed here, once, on import of this module. The registries
 * are empty on construction; the legacy entry (`./index.js`) imports this
 * module, so `cloudcanvas` behaves as it always has. The core
 * (`./core/index.js`, `cloudcanvas/next`) never reaches it.
 *
 * The trait and menu defaults are installed as providers, so each registry's
 * `clear()` restores them.
 */
import { BUILT_IN_MENU_ITEMS, menuRegistry } from './engine/context-menu.js';
import { registerCursorTraits } from './pins/cursor.js';
import { actionRegistry, registerBuiltinActions } from './pins/reaction-actions.js';
import { DisplayTrait } from './pins/traits/display.js';
import { PRESERVE_TYPE } from './pins/traits/display-templates.js';
import { ConnectableTrait, ScopeTrait, TransmitterTrait } from './pins/traits/graph.js';
import { DraggableTrait, FocussableTrait, PhysicsTrait, SelectableTrait } from './pins/traits/interaction.js';
import { traitRegistry } from './pins/traits/registry.js';
import { ResizableTrait } from './pins/traits/resizable.js';
import { SvgStateTrait } from './pins/traits/svg-state.js';

/** The display types; `PRESERVE_TYPE` renders nothing, so adopted markup survives every frame. */
const DISPLAY_TYPES = Object.freeze(['card', 'vector-pointer', 'media', 'raw', PRESERVE_TYPE]);

/** The behaviour traits, by registry name. */
const BEHAVIOUR_TRAITS = Object.freeze([
  ['draggable', DraggableTrait],
  ['selectable', SelectableTrait],
  // Opt-in, unlike the two above: holding the trait *is* the resize toggle.
  ['resizable', ResizableTrait],
  ['physics', PhysicsTrait],
  ['connectable', ConnectableTrait],
  ['focussable', FocussableTrait],
  ['scope', ScopeTrait],
  ['transmitter', TransmitterTrait],
  ['svg-state', SvgStateTrait]
]);

/**
 * Put the 14 built-in trait definitions on `registry`, a `DisplayTrait` per
 * display type, then the behaviours; a name already there is kept.
 * @param {import('./pins/traits/registry.js').TraitRegistry} registry
 */
export function installBuiltinTraits(registry) {
  for (const displayType of DISPLAY_TYPES) {
    if (!registry.has(displayType)) {
      registry.register(displayType, DisplayTrait, { name: displayType, displayType });
    }
  }
  for (const [name, ctor] of BEHAVIOUR_TRAITS) {
    if (!registry.has(name)) registry.register(name, ctor);
  }
  return registry;
}

/** Put the built-in menu commands on `registry`; an id already there is kept. */
export function installBuiltinMenuItems(registry) {
  for (const item of BUILT_IN_MENU_ITEMS) {
    if (!registry.has(item.id)) registry.register(item);
  }
  return registry;
}

traitRegistry.registerDefaults(installBuiltinTraits);
traitRegistry.registerDefaults(registerCursorTraits);
registerBuiltinActions(actionRegistry);
menuRegistry.registerDefaults(installBuiltinMenuItems);
