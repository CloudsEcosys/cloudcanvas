/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Main library entry point.
 *
 * Named exports only. There is deliberately no default aggregate: keeping one
 * would mean maintaining a second, hand-written copy of this list that silently
 * drifts every time a symbol is added. Consumers use
 * `import * as CloudCanvas from 'cloudcanvas'` for a namespace object.
 *
 * The list below is grouped in three tiers, and the banners are the map:
 *   START HERE  - the four names a first canvas is built from
 *   EVERYDAY    - what an application reaches for once it has a session
 *   ADVANCED    - the pieces `CloudCanvasSession` already wires for you
 */

import { CloudCanvasSession } from './engine/session.js';

/* ==========================================================================
 * START HERE - a canvas, a Pin, and the event they speak.
 * ========================================================================== */

/**
 * Convenience factory function to instantiate a canvas runtime session.
 * The one call every CloudCanvas application starts with.
 */
export function createCanvasSession(options = {}) {
  return new CloudCanvasSession(options);
}

export { CloudCanvasSession } from './engine/session.js';
export { Pin } from './pins/pin.js';
export { PinEvent } from './pins/traits.js';

/* ==========================================================================
 * EVERYDAY - traits, components, templates and theming.
 * ========================================================================== */

/* ---- everyday: trait composition ---- */
export {
  PinTrait,
  DisplayTrait,
  DraggableTrait,
  SelectableTrait,
  PhysicsTrait,
  GRAB_HANDLE_CLASS,
  rotatePin,
  ResizableTrait,
  resizePin,
  MIN_RESIZE,
  RESIZE_DIRECTIONS,
  RESIZE_HANDLE_ATTR,
  RESIZE_HANDLE_CLASS,
  ConnectableTrait,
  FocussableTrait,
  ScopeTrait,
  TransmitterTrait,
  SvgStateTrait,
  SVG_STATE_WRAPPER_CLASS,
  SVG_STATE_HOST_CLASS,
  SVG_STATE_PATH_CLASS,
  PIN_SIGNAL_TYPES,
  emitPinSignal,
  TraitRegistry,
  traitRegistry
} from './pins/traits.js';

/* ---- everyday: vectorization & geometry processing ---- */
export {
  simplifyPoints,
  vectorizeStroke,
  vectorizeContour,
  normalizePathTopology
} from './graphics/vectorizer.js';

/* ---- everyday: move a live Pin between scopes (nest / detach) ---- */
export { reparentPin } from './pins/reparent.js';

/**
 * Per-Pin appearance overrides: the sanctioned mutator for one Pin's own root
 * box (corner radius, surface colour, bevel, padding, flow placement) and the
 * single table that is both its allow-list and an editor's field source. The
 * map helpers are what serialization round-trips these through.
 */
export {
  BEVEL_PRESETS,
  STYLE_PROPERTIES,
  applyPinStyleMap,
  clearPinStyle,
  getPinStyle,
  isStyleProperty,
  pinStyleMap,
  setPinStyle,
  stylePropertyInfo
} from './pins/pin-style.js';

/**
 * In-place reordering for flow containers (`pin.layout` is 'row' / 'column' /
 * 'grid'): `reorderChild` is the ordering primitive, `insertionSiblingFor` turns
 * a drop point into the sibling to insert before. Both sit beside `reparentPin`
 * because a reorder is the same drag gesture staying inside its own flow parent.
 */
export { reorderChild, insertionSiblingFor } from './pins/reparent.js';

/**
 * Pin-to-Pin reactions: "when Pin A emits signal X, run action Y on Pin B",
 * wired with no code. `ActionRegistry` is the open, `TraitRegistry`-shaped set of
 * what a reaction can *do* (each action declaring the parameters an editor renders
 * fields for); `attachReactions` starts a runner that rides the existing
 * `pinManager.onSignal` surface, and `reactionsFor` is where a session's bindings
 * live so a serializer or an editor can reach the same store the runner reads.
 */
export {
  ActionRegistry,
  actionRegistry,
  registerBuiltinActions,
  PARAM_CONTROLS,
  showClientToast
} from './pins/reaction-actions.js';
export {
  ReactionStore,
  ReactionRunner,
  attachReactions,
  detachReactions,
  reactionsFor
} from './pins/reactions.js';

/* ---- everyday: how a container lays its children out ---- */
export {
  LAYOUT_MODES,
  LAYOUT_CLASS,
  FLOW_CHILD_CLASS,
  LAYOUT_GAP_PROPERTY
} from './pins/pin.js';

/* ---- everyday: the reload lifecycle a scope's children wake through ---- */
export {
  DORMANT_CLASS,
  RELOAD_STRATEGIES,
  RELOAD_MODES,
  normalizeReloadStrategy,
  resolveReloadMode,
  resolveRenderMode,
  wakesWithParent
} from './pins/reload.js';
export { CHILDREN_ERROR_EVENT } from './pins/children-loader.js';

/**
 * Lazy offload is the reload lifecycle's orthogonal counterpart, decided by the
 * camera rather than by the scope tree: `offload: true` on a Pin opts it in, and
 * `offloadMargin` - per Pin, or session-wide - is the clearance it keeps before
 * leaving the document. Both are options rather than symbols; the default margin
 * is the one value worth reading back, exactly as `MIN_RESIZE` is.
 */
export { DEFAULT_OFFLOAD_MARGIN } from './engine/offload.js';

/* ---- everyday: component authoring ---- */
export { CLS, HTML_KEY, PRESERVE_TYPE } from './pins/traits/display-templates.js';

/**
 * The component-authoring surface: the writes a `{ build, update }` template
 * mutates through, the keyed-list reconciler, and the one call that turns a
 * template pair into a registered Pin type.
 */
export { defineComponent } from './pins/traits/define-component.js';
export {
  definePrototype,
  createReactiveState,
  compileBlueprint
} from './pins/traits.js';
export {
  KEY_ATTR,
  makeElement,
  makeTextNode,
  reconcileKeyedList,
  setAttr,
  setSlot,
  setText,
  setVisible
} from './pins/traits/template-kit.js';

/* ---- everyday: group & subtree operations ---- */
export {
  serializeGroup,
  saveGroup,
  loadGroup,
  listGroupKeys,
  deleteGroup,
  instantiateGroup,
  GROUP_STORAGE_PREFIX
} from './pins/group.js';

/* ---- everyday: theming and the style discipline gate ---- */
export {
  CANVAS_DEFAULT_CSS,
  applyTheme,
  injectCanvasStyles,
  injectSessionStyles,
  LIGHT_THEME
} from './graphics/styles.js';
export { STYLE_RULES, checkStyleDiscipline } from './graphics/style-gates.js';

/**
 * The design-token catalogue: a JS-readable map of every `--cc-*` token to its
 * category and purpose, so a component author or an appearance editor can
 * enumerate what exists instead of grepping the stylesheet.
 */
export {
  TOKENS,
  TOKEN_CATEGORY,
  TOKEN_NAMES,
  TOKEN_PREFIX,
  isToken,
  tokensInCategory,
  lightThemeValue
} from './graphics/tokens.js';

/**
 * `h()`: the namespace-aware HTML+SVG element factory a `build` pass constructs
 * its subtree with. Re-exported top-level because it is build-loop infrastructure
 * every component and every global-render trait reaches for.
 */
export { h, SVG_NS, SVG_TAGS } from './graphics/primitives/element.js';

/**
 * The colour maths is top-level, not just inside the `primitives` namespace: a
 * consumer picking a readable foreground for their own surface needs these two
 * far more often than they need an SVG generator.
 */
export {
  compositeOver,
  contrastTextFor,
  relativeLuminance
} from './graphics/primitives/contrast.js';

export * as styles from './graphics/styles.js';
export * as primitives from './graphics/primitives/primitives.js';

/* ---- everyday: cursors (the session builds the three built-ins for you) ---- */
export {
  CURSOR_ACTIVATED,
  CURSOR_CAPABILITY,
  CURSOR_FOCUS,
  CURSOR_LAYER_CLASS,
  CURSOR_PIN_ID,
  CURSOR_SELECTED,
  CURSOR_TRAIT_NAMES,
  CursorTrait,
  CursorFocusTrait,
  CursorSelectedTrait,
  CursorActivatedTrait,
  createCursorLayer,
  createCursorPin,
  registerCursorTraits,
  renderCursors,
  screenBoundsOf
} from './pins/cursor.js';

/* ---- everyday: the right-click menu, and the commands on it ---- */

/**
 * The canvas menu is a registry, exactly like traits are: `registerMenuItem`
 * adds a command, `when(session, context)` decides whether it applies to the
 * click, and `action(session, context)` runs it. Naming another command as
 * `parent` nests this one under it, which turns that command into a submenu
 * trigger - derived, never flagged, and so composable to any depth. The z-order
 * pair is exported beside them because they are the one built-in command a
 * consumer is likely to want on a button of their own as well.
 *
 * All six class names are exported, because styling the menu means styling the
 * flyout panels and the trigger caret too.
 */
export {
  MENU_CLASS,
  MENU_FLYOUT_CLASS,
  MENU_GROUP_CLASS,
  MENU_ITEM_ATTR,
  MENU_ITEM_CLASS,
  MENU_ITEM_SUBMENU_CLASS,
  MenuRegistry,
  bringToFront,
  closeContextMenu,
  isContextMenuOpen,
  menuItemsFor,
  menuRegistry,
  registerMenuItem,
  sendToBack,
  unregisterMenuItem
} from './engine/context-menu.js';

/* ---- everyday: placement, adoption, and the well a scroller opts into ---- */
export { place } from './engine/placement.js';
export { droppablePinAt } from './engine/hit-test.js';

/**
 * Adoption: DOM that already exists becomes live Pins, re-created by nobody.
 * `HYDRATE_SELECTOR` is the marker `hydrate` scans for, exported so the markup
 * writes the attribute the scanner actually reads.
 */
export { HYDRATE_SELECTOR, adopt, hydrate } from './engine/hydrate.js';

/**
 * The attribute an element inside the canvas opts into native scrolling with.
 * Public because a consumer marking their own scroll well should write the
 * selector the wheel router actually reads, not a copy of it.
 */
export { SCROLL_REGION_SELECTOR } from './engine/pointer.js';

/* ==========================================================================
 * ADVANCED - the engine underneath. A `CloudCanvasSession` constructs, wires
 * and tears down everything below; reach in only when you are building your
 * own host or driving a piece of the engine standalone.
 * ========================================================================== */

/* ---- advanced: engine parts a session owns for you ---- */
export {
  Viewport,
  EASINGS,
  DEFAULT_EASING,
  prefersReducedMotion
} from './engine/viewport.js';
export { ConjugateRenderer, MOVING_CLASS, MOVING_IDLE_FRAMES } from './engine/renderer.js';
export { PinManager } from './pins/manager.js';
export { PinSignalBus } from './pins/pin-signals.js';
export { ParticleEngine } from './particles/engine.js';
export { PinParticle } from './particles/pin-particle.js';

/* ---- advanced: custom host authors (rarely needed with CloudCanvasSession) ---- */
export {
  KEY_BINDINGS,
  PAN_STEP_PX,
  PAN_SHIFT_MULTIPLIER,
  ZOOM_STEP,
  bindKeyboard,
  unbindKeyboard,
  ensureVisible,
  readingOrder
} from './engine/keyboard.js';
export {
  DEFAULT_HOST_LABEL,
  LIVE_REGION_CLASS,
  announce,
  applyHostAria,
  mountAnnouncer,
  unmountAnnouncer
} from './engine/announcer.js';
export {
  DRAG_CHAIN_CLASS,
  ELEVATED_CLASS,
  setElevationChain
} from './engine/elevation.js';
