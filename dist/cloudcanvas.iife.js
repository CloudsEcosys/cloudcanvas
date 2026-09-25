/*!
 * CloudCanvas v0.4.0 - Minimalist client-side GUI framework treating HTML elements as canvas pins
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 * MIT License. https://github.com/NeoTecDigital/cloudcanvas#readme
 */
var CloudCanvas = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // index.js
  var index_exports = {};
  __export(index_exports, {
    ActionRegistry: () => ActionRegistry,
    BEVEL_PRESETS: () => BEVEL_PRESETS,
    CANVAS_DEFAULT_CSS: () => CANVAS_DEFAULT_CSS,
    CHILDREN_ERROR_EVENT: () => CHILDREN_ERROR_EVENT,
    CLS: () => CLS,
    CONTROL_SELECTOR: () => CONTROL_SELECTOR,
    CURSOR_ACTIVATED: () => CURSOR_ACTIVATED,
    CURSOR_CAPABILITY: () => CURSOR_CAPABILITY,
    CURSOR_FOCUS: () => CURSOR_FOCUS,
    CURSOR_LAYER_CLASS: () => CURSOR_LAYER_CLASS,
    CURSOR_PIN_ID: () => CURSOR_PIN_ID,
    CURSOR_SELECTED: () => CURSOR_SELECTED,
    CURSOR_TRAIT_NAMES: () => CURSOR_TRAIT_NAMES,
    CloudCanvasSession: () => CloudCanvasSession,
    ConjugateRenderer: () => ConjugateRenderer,
    ConnectableTrait: () => ConnectableTrait,
    CursorActivatedTrait: () => CursorActivatedTrait,
    CursorFocusTrait: () => CursorFocusTrait,
    CursorSelectedTrait: () => CursorSelectedTrait,
    CursorTrait: () => CursorTrait,
    DEFAULT_EASING: () => DEFAULT_EASING,
    DEFAULT_HOST_LABEL: () => DEFAULT_HOST_LABEL,
    DEFAULT_OFFLOAD_MARGIN: () => DEFAULT_OFFLOAD_MARGIN,
    DORMANT_CLASS: () => DORMANT_CLASS,
    DRAG_CHAIN_CLASS: () => DRAG_CHAIN_CLASS,
    DisplayTrait: () => DisplayTrait,
    DraggableTrait: () => DraggableTrait,
    EASINGS: () => EASINGS,
    ELEVATED_CLASS: () => ELEVATED_CLASS,
    FLOW_CHILD_CLASS: () => FLOW_CHILD_CLASS,
    FocussableTrait: () => FocussableTrait,
    GRAB_HANDLE_CLASS: () => GRAB_HANDLE_CLASS,
    GROUP_STORAGE_PREFIX: () => GROUP_STORAGE_PREFIX,
    HTML_KEY: () => HTML_KEY,
    HYDRATE_SELECTOR: () => HYDRATE_SELECTOR,
    KEY_ATTR: () => KEY_ATTR,
    KEY_BINDINGS: () => KEY_BINDINGS,
    LAYOUT_CLASS: () => LAYOUT_CLASS,
    LAYOUT_GAP_PROPERTY: () => LAYOUT_GAP_PROPERTY,
    LAYOUT_MODES: () => LAYOUT_MODES,
    LIGHT_THEME: () => LIGHT_THEME,
    LIVE_REGION_CLASS: () => LIVE_REGION_CLASS,
    MENU_CLASS: () => MENU_CLASS,
    MENU_FLYOUT_CLASS: () => MENU_FLYOUT_CLASS,
    MENU_GROUP_CLASS: () => MENU_GROUP_CLASS,
    MENU_HOVER_OPEN_MS: () => MENU_HOVER_OPEN_MS,
    MENU_ITEM_ATTR: () => MENU_ITEM_ATTR,
    MENU_ITEM_CLASS: () => MENU_ITEM_CLASS,
    MENU_ITEM_SUBMENU_CLASS: () => MENU_ITEM_SUBMENU_CLASS,
    MIN_RESIZE: () => MIN_RESIZE,
    MOVING_CLASS: () => MOVING_CLASS,
    MOVING_IDLE_FRAMES: () => MOVING_IDLE_FRAMES,
    MenuRegistry: () => MenuRegistry,
    PAN_SHIFT_MULTIPLIER: () => PAN_SHIFT_MULTIPLIER,
    PAN_STEP_PX: () => PAN_STEP_PX,
    PARAM_CONTROLS: () => PARAM_CONTROLS,
    PIN_SIGNAL_TYPES: () => PIN_SIGNAL_TYPES,
    PRESERVE_TYPE: () => PRESERVE_TYPE,
    ParticleEngine: () => ParticleEngine,
    PhysicsTrait: () => PhysicsTrait,
    Pin: () => Pin,
    PinEvent: () => PinEvent,
    PinManager: () => PinManager,
    PinParticle: () => PinParticle,
    PinSignalBus: () => PinSignalBus,
    PinTrait: () => PinTrait,
    RELOAD_MODES: () => RELOAD_MODES,
    RELOAD_STRATEGIES: () => RELOAD_STRATEGIES,
    RESIZE_DIRECTIONS: () => RESIZE_DIRECTIONS,
    RESIZE_HANDLE_ATTR: () => RESIZE_HANDLE_ATTR,
    RESIZE_HANDLE_CLASS: () => RESIZE_HANDLE_CLASS,
    ReactionRunner: () => ReactionRunner,
    ReactionStore: () => ReactionStore,
    ResizableTrait: () => ResizableTrait,
    SCROLL_REGION_SELECTOR: () => SCROLL_REGION_SELECTOR,
    STYLE_PROPERTIES: () => STYLE_PROPERTIES,
    STYLE_RULES: () => STYLE_RULES,
    SVG_NS: () => SVG_NS,
    SVG_STATE_HOST_CLASS: () => SVG_STATE_HOST_CLASS,
    SVG_STATE_PATH_CLASS: () => SVG_STATE_PATH_CLASS,
    SVG_STATE_WRAPPER_CLASS: () => SVG_STATE_WRAPPER_CLASS,
    SVG_TAGS: () => SVG_TAGS,
    ScopeTrait: () => ScopeTrait,
    SelectableTrait: () => SelectableTrait,
    SvgStateTrait: () => SvgStateTrait,
    TOKENS: () => TOKENS,
    TOKEN_CATEGORY: () => TOKEN_CATEGORY,
    TOKEN_NAMES: () => TOKEN_NAMES,
    TOKEN_PREFIX: () => TOKEN_PREFIX,
    TraitRegistry: () => TraitRegistry,
    TransmitterTrait: () => TransmitterTrait,
    Viewport: () => Viewport,
    ZOOM_STEP: () => ZOOM_STEP,
    actionRegistry: () => actionRegistry,
    adopt: () => adopt,
    announce: () => announce,
    applyHostAria: () => applyHostAria,
    applyPinStyleMap: () => applyPinStyleMap,
    applyTheme: () => applyTheme,
    attachReactions: () => attachReactions,
    bindKeyboard: () => bindKeyboard,
    bringToFront: () => bringToFront,
    checkStyleDiscipline: () => checkStyleDiscipline,
    clearPinStyle: () => clearPinStyle,
    closeContextMenu: () => closeContextMenu,
    compileBlueprint: () => compileBlueprint,
    compositeOver: () => compositeOver,
    contrastTextFor: () => contrastTextFor,
    createCanvasSession: () => createCanvasSession,
    createCursorLayer: () => createCursorLayer,
    createCursorPin: () => createCursorPin,
    createReactiveState: () => createReactiveState,
    defineComponent: () => defineComponent,
    definePrototype: () => definePrototype,
    deleteGroup: () => deleteGroup,
    detachReactions: () => detachReactions,
    droppablePinAt: () => droppablePinAt,
    emitPinSignal: () => emitPinSignal,
    ensureVisible: () => ensureVisible,
    getPinStyle: () => getPinStyle,
    h: () => h,
    hydrate: () => hydrate,
    injectCanvasStyles: () => injectCanvasStyles,
    injectSessionStyles: () => injectSessionStyles,
    insertionSiblingFor: () => insertionSiblingFor,
    instantiateGroup: () => instantiateGroup,
    isContextMenuOpen: () => isContextMenuOpen,
    isControlTarget: () => isControlTarget,
    isStyleProperty: () => isStyleProperty,
    isToken: () => isToken,
    lightThemeValue: () => lightThemeValue,
    listGroupKeys: () => listGroupKeys,
    loadGroup: () => loadGroup,
    makeElement: () => makeElement,
    makeTextNode: () => makeTextNode,
    menuItemsFor: () => menuItemsFor,
    menuRegistry: () => menuRegistry,
    mountAnnouncer: () => mountAnnouncer,
    normalizePathTopology: () => normalizePathTopology,
    normalizeReloadStrategy: () => normalizeReloadStrategy,
    pinStyleMap: () => pinStyleMap,
    place: () => place,
    prefersReducedMotion: () => prefersReducedMotion,
    primitives: () => primitives_exports,
    reactionsFor: () => reactionsFor,
    readingOrder: () => readingOrder,
    reconcileKeyedList: () => reconcileKeyedList,
    registerBuiltinActions: () => registerBuiltinActions,
    registerCursorTraits: () => registerCursorTraits,
    registerMenuItem: () => registerMenuItem,
    relativeLuminance: () => relativeLuminance,
    renderCursors: () => renderCursors,
    reorderChild: () => reorderChild,
    reparentPin: () => reparentPin,
    resizePin: () => resizePin,
    resolveReloadMode: () => resolveReloadMode,
    resolveRenderMode: () => resolveRenderMode,
    rotatePin: () => rotatePin,
    saveGroup: () => saveGroup,
    screenBoundsOf: () => screenBoundsOf,
    sendToBack: () => sendToBack,
    serializeGroup: () => serializeGroup,
    setAttr: () => setAttr,
    setElevationChain: () => setElevationChain,
    setPinStyle: () => setPinStyle,
    setSlot: () => setSlot,
    setText: () => setText,
    setVisible: () => setVisible,
    showClientToast: () => showClientToast,
    simplifyPoints: () => simplifyPoints,
    stylePropertyInfo: () => stylePropertyInfo,
    styles: () => styles_exports,
    tokensInCategory: () => tokensInCategory,
    traitRegistry: () => traitRegistry,
    unbindKeyboard: () => unbindKeyboard,
    unionBounds: () => unionBounds,
    unmountAnnouncer: () => unmountAnnouncer,
    unregisterMenuItem: () => unregisterMenuItem,
    vectorizeContour: () => vectorizeContour,
    vectorizeStroke: () => vectorizeStroke,
    wakesWithParent: () => wakesWithParent
  });

  // graphics/styles.js
  var styles_exports = {};
  __export(styles_exports, {
    BASE_STYLE_ID: () => BASE_STYLE_ID,
    CANVAS_DEFAULT_CSS: () => CANVAS_DEFAULT_CSS,
    LIGHT_THEME: () => LIGHT_THEME,
    SESSION_STYLE_ATTR: () => SESSION_STYLE_ATTR,
    TOKEN_PREFIX: () => TOKEN_PREFIX,
    applyTheme: () => applyTheme,
    formatTransform3D: () => formatTransform3D,
    injectCanvasStyles: () => injectCanvasStyles,
    injectSessionStyles: () => injectSessionStyles
  });

  // graphics/styles-css.js
  var CANVAS_DEFAULT_CSS = `
/* ------------------ HOST ------------------ */

.cloudcanvas-host {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  user-select: none;
  touch-action: none;
  background-color: var(--cc-bg, #0f1117);
  background-image: radial-gradient(
    circle at var(--cc-grid-dot-size, 1px) var(--cc-grid-dot-size, 1px),
    var(--cc-grid-dot, rgba(255, 255, 255, 0.12)) var(--cc-grid-dot-size, 1px),
    transparent 0
  );
  background-size: var(--cc-grid-size, 24px) var(--cc-grid-size, 24px);
  font-family: var(--cc-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
  font-size: var(--cc-type-md, 13px);
  color: var(--cc-text, #e2e8f0);
}

/* The host is a single tab stop and pins are roving targets (keyboard nav lands
   with 4b); both show the same ring, and only for keyboard focus. */
.cloudcanvas-host:focus-visible,
.cloudcanvas-pin:focus-visible {
  outline: var(--cc-focus-ring-width, 2px) solid var(--cc-focus-ring, var(--cc-accent, #38bdf8));
  outline-offset: var(--cc-focus-ring-offset, 2px);
}

/* ------------------ LAYERS ------------------ */

/* The layer carries the camera transform, exactly like the plane, so a connector
   drawn in canvas coordinates lands on the Pins it joins at every zoom. Stroke
   width is kept honest by \`vector-effect: non-scaling-stroke\` on the paths;
   dash *length* still scales with zoom, which is the documented tradeoff. */
.cloudcanvas-svg-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: visible;
  transform-origin: 0 0;
  z-index: var(--cc-z-svg, 10);
}

.cloudcanvas-plane {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform-origin: 0 0;
  will-change: transform;
  pointer-events: none;
  z-index: var(--cc-z-plane, 20);
}

.cloudcanvas-overlay-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: var(--cc-z-overlay, 30);
}

/* The focus veil dims everything outside the focused subtree. It lives inside
   the plane, so it is bounded in *canvas* space rather than screen space: the
   huge negative inset is what keeps it covering the visible box at any pan or
   zoom the camera can reach. A theme that sets \`--cc-focus-veil: transparent\`
   disables it without touching the element. */
.cloudcanvas-focus-veil {
  position: absolute;
  inset: -100000px;
  pointer-events: none;
  opacity: 0;
  background: var(--cc-focus-veil, rgba(8, 10, 16, 0.45));
  transition: opacity 0.25s ease;
  z-index: var(--cc-z-veil, 900);
}

.cloudcanvas-focus-veil.is-active {
  opacity: 1;
}

/* ------------------ PIN SHELL ------------------ */

.cloudcanvas-pin {
  position: absolute;
  top: 0;
  left: 0;
  display: inline-block;
  pointer-events: auto;
  box-sizing: border-box;
  transform-origin: 0 0;
  cursor: grab;
  transition: box-shadow 0.15s ease, border-color 0.15s ease, opacity 0.2s ease;
}

/* A compositor hint is a promise to keep a layer alive, so it is worth making
   only while a Pin is actually moving. The renderer adds this on the frame it
   writes a new transform and sweeps it once the Pin has been still for ~30
   frames; a canvas of a thousand stationary Pins costs zero layers. */
.cloudcanvas-pin.cc-moving {
  will-change: transform;
}

.cloudcanvas-pin:hover {
  border-color: var(--cc-card-border-hover, rgba(255, 255, 255, 0.18));
  box-shadow: var(--cc-shadow-2, 0 12px 32px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.09));
}

.cloudcanvas-pin:active {
  cursor: grabbing;
}

.cloudcanvas-pin.is-selected {
  outline: var(--cc-focus-ring-width, 2px) solid var(--cc-accent, #38bdf8);
  outline-offset: var(--cc-focus-ring-offset, 2px);
}

.cloudcanvas-pin.is-focused {
  box-shadow: var(
    --cc-shadow-focus,
    0 0 0 2px var(--cc-focus, #833446),
    0 10px 30px var(--cc-focus-glow, rgba(131, 52, 70, 0.35))
  ) !important;
}

/*
 * Stacking is a property of a *chain*, not of one element: a nested Pin cannot
 * paint above a root Pin unless every scope between them is raised too, because
 * each ancestor's z-index opens a stacking context its descendants are trapped
 * in. \`setElevationChain\` (src/engine/elevation.js) walks the parent chain and
 * these two rules are what it writes - no \`!important\` anywhere, so a consumer
 * theme can still redefine the layering through the tokens.
 */
.cloudcanvas-pin.cc-elevated {
  z-index: var(--cc-z-elevated, 1000);
}

.cloudcanvas-pin.is-dragging,
.cloudcanvas-pin.cc-dragging {
  z-index: var(--cc-z-drag, 1100);
}

.cloudcanvas-pin.is-dragging {
  cursor: grabbing;
  box-shadow: var(--cc-shadow-2, 0 12px 32px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.09));
}

/* Applied by the renderer to a sleeping persistent (or provisioned lazy) Pin:
   mounted, so its subtree and cached geometry survive, but out of layout - the
   renderer's read phase skips it and reuses the size measured while awake. */
.cloudcanvas-pin.is-dormant {
  display: none;
}

.cloudcanvas-pin-content {
  position: relative;
}

/*
 * Display templates build every optional section up front and toggle it with the
 * hidden property. Host stylesheets routinely give those sections a display
 * value (.cloudcanvas-pin-header { display: flex }), which outranks the
 * user-agent [hidden] rule - so the framework states the intent explicitly.
 */
.cloudcanvas-pin-content [hidden] {
  display: none !important;
}

/* Opt-in via the \`selectableText\` Pin option; the drag gesture stands down
   inside the content node so a pointer press can place a caret instead. */
.cloudcanvas-pin.is-selectable-text .cloudcanvas-pin-content {
  user-select: text;
  -webkit-user-select: text;
  cursor: auto;
}

/* ...with the header row kept back as the drag handle, since the shell's own
   padding is too small a target to move a card by (see \`isTextRegionTarget\`
   in src/pins/pin-element.js, which draws the same line). */
.cloudcanvas-pin.is-selectable-text .cloudcanvas-pin-header {
  user-select: none;
  -webkit-user-select: none;
  cursor: grab;
}

/* ------------------ SCOPE ------------------ */

/*
 * Every Pin carries a scope container, whether or not it will ever hold a child.
 * An empty one must therefore cost nothing at all - no box, no border, no gap -
 * or a plain card would render with a dashed well hanging off the bottom of it.
 * So the resting state is *absent*, and the well is a state the renderer grants:
 * \`cc-populated\` is written only when a live child is actually inside, together
 * with the measured \`min-height\` that makes the clipped box the right size
 * (see \`ScopeWellPass\` in \`src/engine/scope-well.js\`).
 */
.cloudcanvas-pin-scope {
  position: relative;
  width: 100%;
  display: none;
  min-height: 0;
  margin: 0;
}

.cloudcanvas-pin-scope.cc-populated {
  display: block;
  /* Stated, not inherited: the renderer writes a min-height measured from child
     offsets, which are relative to this element's *content* box, so the box
     model here cannot be left to whatever the host page declares. */
  box-sizing: border-box;
  margin-top: var(--cc-space-2, 8px);
  min-height: var(--cc-scope-min-height, 40px);
  border-radius: var(--cc-radius-sm, 6px);
  background: var(--cc-scope-bg, rgba(0, 0, 0, 0.2));
  /* An outline rather than a border, for the same reason: a border would eat
     two pixels out of the content box under \`border-box\` and clip the last row
     of every well by exactly its own width. An outline occupies no layout. */
  outline: 1px dashed var(--cc-scope-border, rgba(255, 255, 255, 0.15));
  outline-offset: -1px;
  /* The well is a *frame*: a child that runs past it is clipped rather than
     escaping over its siblings. Measured min-height is what keeps that honest. */
  overflow: var(--cc-scope-overflow, hidden);
}

/* ------------------ CHILD LAYOUT (Sprint 8.2) ------------------ */

/*
 * A container Pin opts its scope well into flex/grid flow through \`pin.layout\`
 * ('row' | 'column' | 'grid'); 'free' is the default and carries no class at all,
 * so a plain card's children stay absolutely positioned exactly as before. The
 * three classes live on the scope well - layout is about how a Pin arranges *its
 * children*, not how the Pin itself sits - and are compounded onto \`cc-populated\`
 * so an empty well still costs nothing (it stays \`display: none\` until a live
 * child grants it the box, above). Compounded, they also outrank \`cc-populated\`'s
 * own \`display: block\` on specificity, so the flow display wins without \`!important\`.
 *
 * Every mode reads one \`--cc-layout-gap\` custom property (written by the \`gap\`
 * option); its fallback is the sheet's standard spacing token, so a container with
 * no gap set still spaces its children sensibly. Grid is deliberately minimal for
 * v1: auto-placed cells in a single implicit column flow, no template control.
 *
 * Every mode also states its cross-axis alignment, and this is not cosmetic. A
 * flow container decides where its children *sit*; it never decides how big they
 * are - a Pin's size is its own, set on the Pin and measured back into its
 * particle. The browser's default (\`align-items: stretch\`, and \`justify-items\`
 * too on a grid) would size them instead, and the measurement pass would then
 * write that imposed size back into the particle as if the Pin had asked for it:
 * a Row would silently overwrite every child's height, a Column and a Grid its
 * width. So each mode pins its start edge explicitly.
 */
.cloudcanvas-pin-scope.cc-populated.is-layout-row {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: var(--cc-layout-gap, var(--cc-space-2, 8px));
}

.cloudcanvas-pin-scope.cc-populated.is-layout-column {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--cc-layout-gap, var(--cc-space-2, 8px));
}

.cloudcanvas-pin-scope.cc-populated.is-layout-grid {
  display: grid;
  grid-auto-flow: row;
  align-items: start;
  justify-items: start;
  /* A template-less grid is a single column - indistinguishable from a column
     flex. One knob keeps v1 an actual grid without a template editor: the whole
     column track list is a single custom property, defaulting to as many equal
     min-120px columns as the well is wide enough to hold. A consumer overrides
     the entire template through \`--cc-grid-columns\`; finer per-track control is a
     documented v2. */
  grid-template-columns: var(--cc-grid-columns, repeat(auto-fill, minmax(120px, 1fr)));
  gap: var(--cc-layout-gap, var(--cc-space-2, 8px));
}

/*
 * A flow child's position comes entirely from its parent's flex/grid flow, so it
 * drops out of absolute positioning. \`position: relative\` rather than \`static\`
 * deliberately: z-index is inert on a static box, and both \`is-dragging\` and
 * \`cc-elevated\` raise a child through z-index, so a reorder drag would stop
 * elevating under \`static\`. \`top/left: auto\` neutralises the shell's \`top/left: 0\`;
 * the renderer stops writing this child a transform (\`_applyPosition\`) and the
 * stale one is cleared as the class goes on (\`syncFlowChild\` in pin-element.js).
 */
.cloudcanvas-pin.is-flow-child {
  position: relative;
  top: auto;
  left: auto;
}

/* ------------------ PRIMITIVE SURFACES ------------------ */

.cloudcanvas-primitive-card {
  padding: var(--cc-space-3, 12px) var(--cc-space-4, 16px);
  background: var(--cc-card-bg, rgba(30, 41, 59, 0.85));
  backdrop-filter: blur(var(--cc-card-blur, 12px));
  -webkit-backdrop-filter: blur(var(--cc-card-blur, 12px));
  border: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-radius: var(--cc-radius-md, 10px);
  box-shadow: var(--cc-shadow-1, 0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06));
  color: inherit;
  /* A readable measure for cards that size themselves. A Pin built with an
     explicit \`width\` clears this inline (see \`createDefaultElement\`), so the
     clamp never fights an author who already stated the width they wanted. */
  max-width: var(--cc-card-max-width, 340px);
}

.cloudcanvas-primitive-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--cc-space-1, 4px);
  padding: var(--cc-space-1, 4px) var(--cc-space-2, 8px);
  border-radius: var(--cc-radius-pill, 9999px);
  background: var(--cc-badge-bg, rgba(56, 189, 248, 0.15));
  color: var(--cc-badge-text, #38bdf8);
  border: 1px solid var(--cc-badge-border, rgba(56, 189, 248, 0.3));
  font-size: var(--cc-type-sm, 12px);
  font-weight: var(--cc-weight-semibold, 600);
  line-height: 1;
  white-space: nowrap;
}

/* ------------------ DISPLAY TEMPLATES ------------------ */

.cloudcanvas-pin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--cc-space-3, 12px);
  margin-bottom: var(--cc-space-2, 8px);
}

.cloudcanvas-pin-title {
  font-size: var(--cc-type-lg, 15px);
  font-weight: var(--cc-weight-semibold, 600);
  color: var(--cc-text, #e2e8f0);
  line-height: 1.25;
}

.cloudcanvas-pin-badge-slot {
  display: inline-flex;
  align-items: center;
  flex: none;
}

.cloudcanvas-pin-body {
  font-size: var(--cc-type-md, 13px);
  color: var(--cc-text-muted, #94a3b8);
  line-height: 1.45;
}

.cloudcanvas-pin-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--cc-space-2, 8px);
  margin-top: var(--cc-space-3, 12px);
  font-size: var(--cc-type-xs, 11px);
  color: var(--cc-text-muted, #94a3b8);
}

/* The one text run in the footer that had no line-height of its own, so it
   inherited whatever the host page's body copy declared and the footer row's
   height moved with it. 1.45 is the sheet's body ratio; a single-line ellipsised
   run needs a stated one exactly as much as a wrapping paragraph does. */
.cloudcanvas-pin-author {
  font-size: var(--cc-type-xs, 11px);
  line-height: 1.45;
  color: var(--cc-text-muted, #94a3b8);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cloudcanvas-pin-action-btn {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: var(--cc-control-min, 28px);
  padding: var(--cc-space-1, 4px) var(--cc-space-2, 8px);
  background: var(--cc-btn-bg, rgba(56, 189, 248, 0.12));
  border: 1px solid var(--cc-btn-border, rgba(56, 189, 248, 0.35));
  border-radius: var(--cc-radius-sm, 6px);
  color: var(--cc-btn-text, #7dd3fc);
  font-family: inherit;
  font-size: var(--cc-type-xs, 11px);
  font-weight: var(--cc-weight-medium, 500);
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.cloudcanvas-pin-action-btn:hover {
  background: var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22));
  border-color: var(--cc-accent, #38bdf8);
}

/* A coarse pointer gets the full 44px target without changing the desktop look. */
@media (pointer: coarse) {
  .cloudcanvas-pin-action-btn {
    min-height: var(--cc-control-min-coarse, 44px);
  }
}

.cloudcanvas-pin-media {
  display: block;
  width: 100%;
  max-height: var(--cc-media-max-height, 120px);
  object-fit: cover;
  border-radius: var(--cc-radius-sm, 6px);
  background: var(--cc-scope-bg, rgba(0, 0, 0, 0.2));
}

.cloudcanvas-pin-caption {
  margin: var(--cc-space-2, 8px) 0 0;
  font-size: var(--cc-type-xs, 11px);
  color: var(--cc-text-muted, #94a3b8);
  line-height: 1.35;
}

/* The vector-pointer body: needle on the left, gauge column filling the rest. */
.cloudcanvas-pin-gauge-row {
  display: flex;
  align-items: center;
  gap: var(--cc-space-3, 12px);
  padding: var(--cc-space-1, 4px) 0;
}

.cloudcanvas-pin-needle-slot {
  display: flex;
  align-items: center;
  flex: none;
}

.cloudcanvas-pin-gauge {
  flex: 1;
  min-width: 0;
}

.cloudcanvas-pin-label {
  margin-bottom: var(--cc-space-1, 4px);
  font-size: var(--cc-type-xs, 11px);
  color: var(--cc-text-muted, #94a3b8);
}

.cloudcanvas-pin-meter-slot {
  display: block;
}

/* ------------------ CONTEXT MENU ------------------ */

/* The canvas's own right-click menu (src/engine/context-menu.js). It lives in
   the overlay - the one layer that draws in screen space - which is why it is
   positioned from the click's host-relative coordinates and needs its pointer
   events back: the overlay itself is inert.
   Every value chains through a part token to a foundation one, so a theme that
   restyles cards restyles the menu with them and nothing new has to be named. */
.cloudcanvas-context-menu {
  position: absolute;
  min-width: var(--cc-menu-min-width, 168px);
  padding: var(--cc-space-1, 4px);
  background: var(--cc-menu-bg, var(--cc-card-bg, rgba(30, 41, 59, 0.85)));
  border: 1px solid var(--cc-menu-border, var(--cc-card-border, rgba(255, 255, 255, 0.1)));
  border-radius: var(--cc-radius-md, 10px);
  box-shadow: var(--cc-shadow-2, 0 12px 32px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.09));
  backdrop-filter: blur(var(--cc-card-blur, 12px));
  -webkit-backdrop-filter: blur(var(--cc-card-blur, 12px));
  font-size: var(--cc-type-md, 13px);
  color: var(--cc-text, #e2e8f0);
  pointer-events: auto;
  user-select: none;
  z-index: var(--cc-z-menu, 1200);
}

/* Closed is the resting state, and the attribute has to outrank the display
   above - which it does on specificity alone, so no \`!important\` is needed. */
.cloudcanvas-context-menu[hidden] {
  display: none;
}

/* Groups are the only structure: consecutive ones are told apart by a rule
   rather than a separator element nobody can label. */
.cloudcanvas-context-menu-group + .cloudcanvas-context-menu-group {
  margin-top: var(--cc-space-1, 4px);
  padding-top: var(--cc-space-1, 4px);
  border-top: 1px solid var(--cc-menu-border, var(--cc-card-border, rgba(255, 255, 255, 0.1)));
}

.cloudcanvas-context-menu-item {
  display: block;
  width: 100%;
  min-height: var(--cc-control-min, 28px);
  padding: var(--cc-space-1, 4px) var(--cc-space-3, 12px);
  background: var(--cc-menu-item-bg, transparent);
  border: 0;
  border-radius: var(--cc-radius-sm, 6px);
  color: inherit;
  font-family: inherit;
  font-size: inherit;
  text-align: left;
  white-space: nowrap;
  cursor: pointer;
}

.cloudcanvas-context-menu-item:hover,
.cloudcanvas-context-menu-item:focus-visible {
  background: var(--cc-menu-item-bg-hover, var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22)));
}

@media (pointer: coarse) {
  .cloudcanvas-context-menu-item {
    min-height: var(--cc-control-min-coarse, 44px);
  }
}

/* ------------------ BORDER TOGGLE & RESIZE HANDLES ------------------ */

/*
 * \`bordered: false\` (or \`pin.bordered = false\` at any time) withholds the card's
 * border and nothing else. Finer-grained than \`chrome: false\`, which takes the
 * whole card - surface, padding, radius, shadow, border - away at once for a
 * component that draws its own.
 *
 * \`border-color: transparent\` rather than \`border: none\`, deliberately. The card
 * is \`box-sizing: border-box\`, but that only makes a *specified* width include
 * its border: a card that sizes itself to its content has none, so dropping the
 * border shrinks it by 2px in each axis, and dropping it from an explicitly
 * sized one moves the content box out by the same amount. Keeping the border and
 * making it invisible costs one paint and moves nothing at all.
 *
 * The \`:hover\` pairing is not redundant: \`.cloudcanvas-pin:hover\` above sets a
 * border colour at equal specificity, so the plain selector alone would win or
 * lose on source order.
 */
.cloudcanvas-pin.is-borderless,
.cloudcanvas-pin.is-borderless:hover {
  border-color: transparent;
}

/*
 * Resize handles, appended by \`ResizableTrait\` (src/pins/traits/resizable.js).
 *
 * Direct children of the Pin's root element, outside the content node, so a
 * content re-render never takes them away. Each carries \`data-cc-control\`, which
 * is what makes the pointer router decline the deferred capture and
 * \`DraggableTrait\` stand down on it (\`CONTROL_SELECTOR\`, src/pins/pin-element.js).
 *
 * Visibility is the \`hidden\` property, written by the trait - so no \`display\` is
 * declared here, and the user-agent \`[hidden]\` rule keeps working on a page that
 * never loaded this stylesheet. The reset below only defends it from a host
 * sheet that gives every div a display value.
 */
.cloudcanvas-resize-handle {
  position: absolute;
  box-sizing: border-box;
  width: var(--cc-resize-handle-size, 10px);
  height: var(--cc-resize-handle-size, 10px);
  border-radius: var(--cc-radius-sm, 6px);
  background: var(--cc-resize-handle-bg, var(--cc-accent, #38bdf8));
  box-shadow: var(--cc-resize-handle-ring, 0 0 0 1px rgba(8, 10, 16, 0.65));
  z-index: var(--cc-z-drag, 1100);
  touch-action: none;
}

.cloudcanvas-resize-handle[hidden] {
  display: none !important;
}

/* A coarse pointer gets a target it can actually hit. */
@media (pointer: coarse) {
  .cloudcanvas-resize-handle {
    width: var(--cc-resize-handle-size-coarse, 20px);
    height: var(--cc-resize-handle-size-coarse, 20px);
  }
}

/*
 * One rule per direction: where the handle sits on the box, and what the pointer
 * says it will do. The \`translate\` is what centres it *on* the edge rather than
 * inside it, so the affordance straddles the boundary it moves.
 */
.cloudcanvas-resize-handle[data-cc-resize-handle="nw"] {
  top: 0;
  left: 0;
  transform: translate(-50%, -50%);
  cursor: nwse-resize;
}

.cloudcanvas-resize-handle[data-cc-resize-handle="n"] {
  top: 0;
  left: 50%;
  transform: translate(-50%, -50%);
  cursor: ns-resize;
}

.cloudcanvas-resize-handle[data-cc-resize-handle="ne"] {
  top: 0;
  right: 0;
  transform: translate(50%, -50%);
  cursor: nesw-resize;
}

.cloudcanvas-resize-handle[data-cc-resize-handle="w"] {
  top: 50%;
  left: 0;
  transform: translate(-50%, -50%);
  cursor: ew-resize;
}

.cloudcanvas-resize-handle[data-cc-resize-handle="e"] {
  top: 50%;
  right: 0;
  transform: translate(50%, -50%);
  cursor: ew-resize;
}

.cloudcanvas-resize-handle[data-cc-resize-handle="sw"] {
  bottom: 0;
  left: 0;
  transform: translate(-50%, 50%);
  cursor: nesw-resize;
}

.cloudcanvas-resize-handle[data-cc-resize-handle="s"] {
  bottom: 0;
  left: 50%;
  transform: translate(-50%, 50%);
  cursor: ns-resize;
}

.cloudcanvas-resize-handle[data-cc-resize-handle="se"] {
  bottom: 0;
  right: 0;
  transform: translate(50%, 50%);
  cursor: nwse-resize;
}

/* A resize is a drag of the box: it clears its neighbours the same way, and the
   grab cursor must not fight the direction cursor under the pointer. */
.cloudcanvas-pin.is-resizing {
  z-index: var(--cc-z-drag, 1100);
  cursor: default;
}

/* ---- CHROMELESS GRAB HANDLE ---- */

/*
 * The drag affordance for a chromeless control, appended by \`DraggableTrait\`
 * (src/pins/traits/interaction.js). With \`chrome: false\` the Pin's own surface is
 * often a real control - a \`<button>\`, an \`<input>\` - that the drag correctly
 * declines (\`CONTROL_SELECTOR\`), so this small grip at the corner is the one
 * thing left to grab by.
 *
 * The mirror image of the resize handles above: a direct child of the root so it
 * rides the Pin's transform and a content re-render never removes it, but
 * deliberately *not* \`data-cc-control\` - initiating a drag is its whole purpose.
 * \`translate(-50%, -50%)\` straddles the top-left corner so the grip sits over the
 * boundary rather than inside the control's hit area. Visibility is the \`hidden\`
 * property, written by the trait on selection - so no \`display\` is declared here
 * and the user-agent \`[hidden]\` rule holds on a page with no framework CSS.
 *
 * The whole background - the grip dots over a fill - lives inside the token's
 * fallback, so a theme replaces the entire look with one \`--cc-grab-handle-bg\`
 * and the sheet still reads a single token.
 */
.cloudcanvas-grab-handle {
  position: absolute;
  top: 0;
  left: 0;
  box-sizing: border-box;
  width: var(--cc-grab-handle-size, 12px);
  height: var(--cc-grab-handle-size, 12px);
  transform: translate(-50%, -50%);
  border-radius: var(--cc-radius-sm, 6px);
  background: var(--cc-grab-handle-bg, radial-gradient(var(--cc-grab-handle-dot, rgba(255, 255, 255, 0.7)) 0.75px, transparent 1px) 0 0 / 4px 4px, var(--cc-grab-handle-fill, rgba(30, 41, 59, 0.92)));
  box-shadow: var(--cc-grab-handle-ring, 0 0 0 1px rgba(8, 10, 16, 0.65));
  cursor: grab;
  z-index: var(--cc-z-drag, 1100);
  touch-action: none;
}

.cloudcanvas-grab-handle:active {
  cursor: grabbing;
}

.cloudcanvas-grab-handle[hidden] {
  display: none !important;
}

/* A coarse pointer gets a target it can actually hit. */
@media (pointer: coarse) {
  .cloudcanvas-grab-handle {
    width: var(--cc-grab-handle-size-coarse, 20px);
    height: var(--cc-grab-handle-size-coarse, 20px);
  }
}

/* ------------------ SVG STATE & 3D INTERPOLATION ------------------ */

.cloudcanvas-svg-state-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
  pointer-events: none;
  transform-style: preserve-3d;
}

.cloudcanvas-svg-state-host {
  width: 100%;
  height: 100%;
  display: block;
  overflow: visible;
  pointer-events: none;
  transform-style: preserve-3d;
  transform-origin: center center;
}

.cloudcanvas-svg-state-path {
  vector-effect: non-scaling-stroke;
  transform-box: fill-box;
  transform-origin: center center;
}

/* ------------------ UTILITY ------------------ */

/* Announcement target for assistive technology: in the accessibility tree,
   out of the visual one. */
.cloudcanvas-live-region {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

@media (prefers-reduced-motion: reduce) {
  .cloudcanvas-pin,
  .cloudcanvas-focus-veil {
    transition: none;
  }

  /* The SVG generators carry their own inline transitions. */
  .cloudcanvas-pin-needle-slot svg,
  .cloudcanvas-pin-meter-slot *,
  .cloudcanvas-svg-state-path,
  .cloudcanvas-svg-state-host {
    transition: none !important;
  }
}
`;

  // graphics/theme.js
  var TOKEN_PREFIX = "--cc-";
  var LIGHT_THEME = Object.freeze({
    "--cc-bg": "#f4f5f7",
    "--cc-grid-dot": "rgba(15, 23, 42, 0.14)",
    "--cc-text": "#1e293b",
    "--cc-text-muted": "#64748b",
    "--cc-accent": "#0284c7",
    "--cc-focus": "#9f3a52",
    "--cc-focus-glow": "rgba(159, 58, 82, 0.25)",
    "--cc-focus-veil": "rgba(241, 245, 249, 0.55)",
    "--cc-card-bg": "rgba(255, 255, 255, 0.92)",
    "--cc-card-border": "rgba(15, 23, 42, 0.12)",
    "--cc-card-border-hover": "rgba(15, 23, 42, 0.2)",
    "--cc-scope-bg": "rgba(15, 23, 42, 0.05)",
    "--cc-scope-border": "rgba(15, 23, 42, 0.15)",
    "--cc-badge-bg": "rgba(2, 132, 199, 0.1)",
    "--cc-badge-text": "#0369a1",
    // Generated badges compute their own text colour against the *dark* card and
    // write it inline, where no host-level token can reach it. This is the token
    // that can (see `BADGE_TEXT_OVERRIDE_TOKEN` in primitives.js): on a light card
    // every tint at the badge's fill alpha composites to a pale surface, so one
    // dark foreground - the theme's own text colour - clears 4.5:1 across the
    // whole tint range where the dark-card computation scored ~1.15:1.
    "--cc-badge-text-override": "#1e293b",
    "--cc-badge-border": "rgba(2, 132, 199, 0.3)",
    "--cc-btn-bg": "rgba(2, 132, 199, 0.08)",
    "--cc-btn-bg-hover": "rgba(2, 132, 199, 0.16)",
    "--cc-btn-border": "rgba(2, 132, 199, 0.35)",
    "--cc-btn-text": "#0369a1",
    "--cc-meter-track": "rgba(15, 23, 42, 0.08)",
    "--cc-meter-end": "#db2777",
    "--cc-connector": "rgba(2, 132, 199, 0.55)",
    // Read by the cursor traits (`src/pins/cursor.js`), which build SVG attributes
    // rather than matching a stylesheet rule.
    "--cc-cursor-focus": "#9f3a52",
    "--cc-cursor-selected": "#0284c7",
    "--cc-cursor-activated": "#059669",
    // The reticle *caption* is text, not a marker, so it is not the reticle
    // colour: #9f3a52 on a light canvas reads at 4.1:1 and the dark default's
    // #833446 measured 2.29:1. Stated here rather than left to the
    // `var(--cc-text)` fallback so a theme that moves body text without moving
    // the caption still has a knob for it.
    "--cc-cursor-label": "#1e293b",
    "--cc-shadow-1": "0 2px 8px rgba(15, 23, 42, 0.1), 0 1px 2px rgba(15, 23, 42, 0.08)",
    "--cc-shadow-2": "0 12px 28px rgba(15, 23, 42, 0.18)"
  });
  function applyTheme(hostElement, vars) {
    const style = hostElement ? hostElement.style : null;
    if (!style) return null;
    if (vars === null || vars === void 0) {
      clearTheme(style);
      return hostElement;
    }
    for (const [name, value] of Object.entries(vars)) {
      if (!name.startsWith(TOKEN_PREFIX)) continue;
      if (value === null || value === void 0) style.removeProperty(name);
      else style.setProperty(name, String(value));
    }
    return hostElement;
  }
  function clearTheme(style) {
    const names = [];
    for (let i = 0; i < style.length; i += 1) {
      const name = style.item(i);
      if (name && name.startsWith(TOKEN_PREFIX)) names.push(name);
    }
    for (const name of names) style.removeProperty(name);
  }

  // graphics/styles.js
  var BASE_STYLE_ID = "cloudcanvas-styles";
  var SESSION_STYLE_ATTR = "data-cc-session";
  function injectCanvasStyles(customCSS = "") {
    if (typeof document === "undefined") return null;
    let styleEl = document.getElementById(BASE_STYLE_ID);
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = BASE_STYLE_ID;
      styleEl.textContent = CANVAS_DEFAULT_CSS;
      document.head.appendChild(styleEl);
    }
    if (customCSS) injectSessionStyles(customCSS);
    return styleEl;
  }
  function injectSessionStyles(css) {
    if (typeof document === "undefined") return null;
    if (typeof css !== "string" || css.trim() === "") return null;
    const styleEl = document.createElement("style");
    styleEl.setAttribute(SESSION_STYLE_ATTR, "");
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
    return styleEl;
  }
  function formatTransform3D(x, y, z = 0, scale = 1) {
    if (scale === 1) {
      return `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(2)}px)`;
    }
    return `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(2)}px) scale(${scale.toFixed(4)})`;
  }

  // engine/viewport.js
  var EASINGS = Object.freeze({
    linear: (t) => t,
    "ease-out-cubic": (t) => 1 - Math.pow(1 - t, 3),
    "ease-in-out": (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  });
  var DEFAULT_EASING = "ease-out-cubic";
  var REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
  function resolveEasing(easing) {
    if (typeof easing === "function") return easing;
    if (typeof easing === "string" && Object.prototype.hasOwnProperty.call(EASINGS, easing)) {
      return EASINGS[easing];
    }
    return EASINGS[DEFAULT_EASING];
  }
  function interpolateScale(startScale, targetScale, ease) {
    if (startScale === targetScale) return targetScale;
    if (startScale <= 0 || targetScale <= 0) {
      return startScale + (targetScale - startScale) * ease;
    }
    return startScale * Math.pow(targetScale / startScale, ease);
  }
  function fitTarget(viewport, bounds, hostRect, options) {
    const padding = options.padding !== void 0 ? Number(options.padding) : 60;
    const hostW = hostRect.width || 800;
    const hostH = hostRect.height || 600;
    const bWidth = Math.max(bounds.width || bounds.maxX - bounds.minX || 100, 40);
    const bHeight = Math.max(bounds.height || bounds.maxY - bounds.minY || 80, 40);
    const bCenterX = bounds.centerX !== void 0 ? bounds.centerX : bounds.minX + bWidth / 2;
    const bCenterY = bounds.centerY !== void 0 ? bounds.centerY : bounds.minY + bHeight / 2;
    const availW = Math.max(hostW - padding * 2, 100);
    const availH = Math.max(hostH - padding * 2, 100);
    const scale = Math.min(
      viewport.maxScale,
      Math.max(viewport.minScale, Math.min(availW / bWidth, availH / bHeight, options.maxZoom || 2.5))
    );
    return {
      x: hostW / 2 - bCenterX * scale,
      y: hostH / 2 - bCenterY * scale,
      scale
    };
  }
  function applyCameraTarget(viewport, target, options) {
    if (options.immediate) {
      viewport.x = target.x;
      viewport.y = target.y;
      viewport.scale = target.scale;
      viewport.stopAnimation();
      return;
    }
    const duration = options.duration !== void 0 ? Number(options.duration) : 400;
    viewport.animateTo(target.x, target.y, target.scale, { duration, easing: options.easing });
  }
  function normalizeBox(bounds) {
    if (!bounds || typeof bounds !== "object") {
      throw new TypeError("zoomToFit: bounds must be a box object");
    }
    const minX = firstFinite(bounds.minX, bounds.x, bounds.left);
    const minY = firstFinite(bounds.minY, bounds.y, bounds.top);
    const width = firstFinite(bounds.width, difference(bounds.maxX, minX), difference(bounds.right, minX));
    const height = firstFinite(bounds.height, difference(bounds.maxY, minY), difference(bounds.bottom, minY));
    if (minX === null || minY === null || width === null || height === null) {
      throw new TypeError("zoomToFit: bounds needs {minX,minY,maxX,maxY}, {x,y,width,height} or a DOMRect");
    }
    return {
      minX,
      minY,
      maxX: minX + width,
      maxY: minY + height,
      width,
      height,
      centerX: minX + width / 2,
      centerY: minY + height / 2
    };
  }
  function firstFinite(...values) {
    for (const value of values) {
      const parsed = Number(value);
      if (value !== null && value !== void 0 && Number.isFinite(parsed)) return parsed;
    }
    return null;
  }
  function difference(far, near) {
    if (far === void 0 || far === null || near === null) return void 0;
    return Number(far) - near;
  }
  var reducedMotionState = null;
  function reducedMotionCache() {
    if (reducedMotionState) return reducedMotionState;
    const state = { matches: false, query: null, onChange: null };
    reducedMotionState = state;
    if (typeof globalThis.matchMedia !== "function") return state;
    let query = null;
    try {
      query = globalThis.matchMedia(REDUCED_MOTION_QUERY);
    } catch {
      return state;
    }
    if (!query) return state;
    state.query = query;
    state.matches = Boolean(query.matches);
    state.onChange = (event) => {
      state.matches = Boolean(event && "matches" in event ? event.matches : query.matches);
    };
    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", state.onChange);
    } else if (typeof query.addListener === "function") {
      query.addListener(state.onChange);
    }
    return state;
  }
  function prefersReducedMotion() {
    return reducedMotionCache().matches;
  }
  var Viewport = class {
    constructor(options = {}) {
      this.x = Number(options.x) || 0;
      this.y = Number(options.y) || 0;
      this.scale = Number(options.scale) || 1;
      this.minScale = Number(options.minScale) || 0.1;
      this.maxScale = Number(options.maxScale) || 8;
      this.animation = null;
    }
    /**
     * Pan the viewport by a delta (dx, dy) in screen pixels
     */
    panBy(dx, dy) {
      this.stopAnimation();
      this.x += Number(dx);
      this.y += Number(dy);
    }
    /**
     * Pan directly to a specific offset
     */
    panTo(x, y) {
      this.stopAnimation();
      this.x = Number(x);
      this.y = Number(y);
    }
    /**
     * Set absolute zoom level clamped between minScale and maxScale
     */
    setZoom(scale) {
      this.stopAnimation();
      this.scale = Math.min(this.maxScale, Math.max(this.minScale, Number(scale)));
    }
    /**
     * Zoom centered at a specific focal point (e.g. cursor or pinch center)
     */
    zoomAt(factor, focalX = 0, focalY = 0) {
      this.stopAnimation();
      const oldScale = this.scale;
      const newScale = Math.min(this.maxScale, Math.max(this.minScale, oldScale * factor));
      if (newScale === oldScale) return;
      this.x = focalX - (focalX - this.x) / oldScale * newScale;
      this.y = focalY - (focalY - this.y) / oldScale * newScale;
      this.scale = newScale;
    }
    /**
     * Frame a box: the one camera fit, under the name that says what it does.
     *
     * Two things it gives a caller beyond the raw fit:
     *
     *   - the box may be written any of the three ways a box is written in this
     *     codebase (`{minX,minY,maxX,maxY}`, `{x,y,width,height}`, a DOMRect-like
     *     `{left,top,right,bottom}`), because the caller computing a union of Pin
     *     bounds should not have to know which one the camera prefers
     *   - it returns the camera it resolved, so a caller can frame a box without
     *     waiting for the animation to tell them where it went
     *
     * The session-level ergonomics (`session.zoomToFit()` over a set of Pins, or
     * over everything) live at the session layer and call through to here.
     *
     * @param {{minX?: number, minY?: number, maxX?: number, maxY?: number,
     *          x?: number, y?: number, width?: number, height?: number,
     *          left?: number, top?: number, right?: number, bottom?: number}} bounds
     * @param {{width: number, height: number}} [hostRect]
     * @param {object} [options]
     * @param {number} [options.padding=60] screen-pixel clearance on every side
     * @param {number} [options.maxZoom=2.5] ceiling on the resolved scale, so
     *        framing one small Pin does not fill the host with it
     * @param {boolean} [options.immediate] jump instead of animating
     * @param {number} [options.duration=400] animation length in milliseconds
     * @param {((t: number) => number)|string} [options.easing]
     * @returns {{x: number, y: number, scale: number}} the resolved camera
     * @throws {TypeError} when `bounds` describes no box at all
     */
    zoomToFit(bounds, hostRect = { width: 800, height: 600 }, options = {}) {
      const target = fitTarget(this, normalizeBox(bounds), hostRect, options);
      applyCameraTarget(this, target, options);
      return target;
    }
    /**
     * @deprecated since 0.3.0 - use {@link Viewport#zoomToFit}. Removed in 0.4.0.
     *
     * Identical maths through the identical choke point, with the same arguments;
     * `zoomToFit` additionally reads all three box shapes and returns the camera
     * it resolved. One behavioural difference comes with the alias: a box that
     * describes no box at all now throws a `TypeError` instead of quietly flying
     * the camera to the origin.
     *
     * @param {object} bounds
     * @param {{width: number, height: number}} [hostRect]
     * @param {object} [options]
     * @returns {{x: number, y: number, scale: number}} the resolved camera
     */
    focusOn(bounds, hostRect = { width: 800, height: 600 }, options = {}) {
      return this.zoomToFit(bounds, hostRect, options);
    }
    /**
     * Animate viewport parameters smoothly.
     *
     * Single choke point for every animated camera move (zoomToFit, reset, ...),
     * so reduced-motion handling applies uniformly: when the user prefers
     * reduced motion the viewport jumps to the targets and `onComplete` fires
     * synchronously, leaving no active animation.
     *
     * @param {number} targetX
     * @param {number} targetY
     * @param {number} targetScale
     * @param {object} [options]
     * @param {number} [options.duration=400] Animation length in milliseconds.
     * @param {((t: number) => number)|string} [options.easing='ease-out-cubic']
     *        Easing function, or a name from {@link EASINGS}. Unknown names fall
     *        back to {@link DEFAULT_EASING} rather than throwing.
     * @param {Function} [options.onComplete]
     */
    animateTo(targetX, targetY, targetScale, options = {}) {
      const onComplete = typeof options.onComplete === "function" ? options.onComplete : null;
      if (prefersReducedMotion()) {
        this.animation = null;
        this.x = Number(targetX);
        this.y = Number(targetY);
        this.scale = Number(targetScale);
        if (onComplete) onComplete();
        return;
      }
      this.animation = {
        startX: this.x,
        startY: this.y,
        startScale: this.scale,
        targetX,
        targetY,
        targetScale,
        duration: options.duration || 400,
        easing: resolveEasing(options.easing),
        elapsed: 0,
        onComplete
      };
    }
    /**
     * Stop active camera animation
     */
    stopAnimation() {
      this.animation = null;
    }
    get isAnimating() {
      return Boolean(this.animation);
    }
    /**
     * Advance animation frame
     */
    update(dtMs = 16) {
      const animation = this.animation;
      if (!animation) return;
      animation.elapsed += dtMs;
      const t = Math.min(1, animation.elapsed / animation.duration);
      if (t >= 1) {
        this.x = animation.targetX;
        this.y = animation.targetY;
        this.scale = animation.targetScale;
        this.animation = null;
        if (animation.onComplete) animation.onComplete();
        return;
      }
      const ease = animation.easing(t);
      this.x = animation.startX + (animation.targetX - animation.startX) * ease;
      this.y = animation.startY + (animation.targetY - animation.startY) * ease;
      this.scale = interpolateScale(animation.startScale, animation.targetScale, ease);
    }
    /**
     * Transform screen coordinates (e.g. MouseEvent clientX, clientY) to Canvas coordinates
     */
    screenToCanvas(screenX, screenY, hostRect = { left: 0, top: 0 }) {
      const relX = screenX - (hostRect.left || 0);
      const relY = screenY - (hostRect.top || 0);
      return {
        x: (relX - this.x) / this.scale,
        y: (relY - this.y) / this.scale
      };
    }
    /**
     * Transform Canvas coordinates to Screen coordinates
     */
    canvasToScreen(canvasX, canvasY, hostRect = { left: 0, top: 0 }) {
      return {
        x: canvasX * this.scale + this.x + (hostRect.left || 0),
        y: canvasY * this.scale + this.y + (hostRect.top || 0)
      };
    }
    /**
     * Produce the CSS transform string for the viewport plane
     */
    getTransformString() {
      return formatTransform3D(this.x, this.y, 0, this.scale);
    }
    /**
     * Reset viewport to default origin and scale
     */
    reset(options = {}) {
      if (options.animate || options.duration && !options.immediate) {
        this.animateTo(0, 0, 1, { duration: options.duration || 350, easing: options.easing });
      } else {
        this.stopAnimation();
        this.x = 0;
        this.y = 0;
        this.scale = 1;
      }
    }
  };

  // particles/pin-particle.js
  var PinParticle = class {
    constructor(options = {}) {
      this.id = options.id || `pin_${Math.random().toString(36).slice(2, 9)}`;
      this.x = Number(options.x) || 0;
      this.y = Number(options.y) || 0;
      this.z = Number(options.z) || 0;
      this.vx = Number(options.vx) || 0;
      this.vy = Number(options.vy) || 0;
      this.width = Number(options.width) || 0;
      this.height = Number(options.height) || 0;
      this.mass = Number(options.mass) > 0 ? Number(options.mass) : 1;
      this.friction = options.friction !== void 0 ? Number(options.friction) : 0.92;
      this.pinned = Boolean(options.pinned);
      this.metadata = options.metadata || {};
      if (Array.isArray(options.vectors)) {
        this.vectors = options.vectors.map((v) => Number(v) || 0);
      } else if (options.vector !== void 0) {
        this.vectors = [Number(options.vector) || 0];
      } else {
        this.vectors = [];
      }
    }
    /**
     * Add a float vector (gradient/magnitude/pointer) to the Pin's vector list
     */
    addVector(value) {
      const floatVal = Number(value) || 0;
      this.vectors.push(floatVal);
      return floatVal;
    }
    /**
     * Set the entire vector list
     */
    setVectors(vectorList) {
      if (Array.isArray(vectorList)) {
        this.vectors = vectorList.map((v) => Number(v) || 0);
      } else {
        this.vectors = [];
      }
    }
    /**
     * Replace the vector at `index`.
     *
     * Bounds-checked rather than permissive: writing past the end would leave a
     * sparse array whose holes read back as `undefined` through `getVector`, and
     * every consumer here treats a vector list as a dense list of floats. An index
     * outside the list is therefore a no-op the caller can detect.
     *
     * @param {number} index position in the vector list
     * @param {number} value the new float value
     * @returns {number|null} the written value, or null when the index is out of range
     */
    setVector(index, value) {
      if (!Number.isInteger(index) || index < 0 || index >= this.vectors.length) {
        return null;
      }
      const floatVal = Number(value) || 0;
      this.vectors[index] = floatVal;
      return floatVal;
    }
    /**
     * Retrieve all associated vectors
     */
    getVectors() {
      return [...this.vectors];
    }
    /**
     * Retrieve a specific vector by index
     */
    getVector(index = 0) {
      return this.vectors[index] !== void 0 ? this.vectors[index] : 0;
    }
    /**
     * Retrieve the primary vector (index 0)
     */
    getPrimaryVector() {
      return this.getVector(0);
    }
    /**
     * Compute overall vector magnitude (L2 Euclidean norm or absolute value)
     */
    getMagnitude() {
      if (this.vectors.length === 0) return 0;
      if (this.vectors.length === 1) return Math.abs(this.vectors[0]);
      let sumSq = 0;
      for (const v of this.vectors) {
        sumSq += v * v;
      }
      return Math.sqrt(sumSq);
    }
    /**
     * Retrieve the directional gradient (defaults to primary vector or average gradient)
     */
    getGradient() {
      if (this.vectors.length === 0) return 0;
      if (this.vectors.length === 1) return this.vectors[0];
      const sum = this.vectors.reduce((acc, v) => acc + v, 0);
      return sum / this.vectors.length;
    }
    /**
     * Remove a vector by index
     */
    removeVector(index) {
      if (index >= 0 && index < this.vectors.length) {
        return this.vectors.splice(index, 1)[0];
      }
      return null;
    }
    /**
     * Clear all associated vectors
     */
    clearVectors() {
      this.vectors = [];
    }
    /**
     * Apply an instantaneous force vector to the Pin
     */
    applyForce(fx, fy) {
      if (this.pinned) return;
      this.vx += fx / this.mass;
      this.vy += fy / this.mass;
    }
    /**
     * Explicitly set the position of the Pin
     */
    setPosition(x, y, z = this.z) {
      this.x = Number(x);
      this.y = Number(y);
      this.z = Number(z);
    }
    /**
     * Explicitly set the velocity of the Pin
     */
    setVelocity(vx, vy) {
      if (this.pinned) return;
      this.vx = Number(vx);
      this.vy = Number(vy);
    }
    /**
     * Set dimensions for bounds and spatial queries
     */
    setSize(width, height) {
      this.width = Math.max(0, Number(width));
      this.height = Math.max(0, Number(height));
    }
    /**
     * Advance physics / motion state by dt, expressed in reference frames
     * (1 = one 60Hz frame). Damping is exponentiated by dt so the decay curve is
     * identical regardless of how the elapsed time is subdivided.
     */
    update(dt = 1) {
      if (this.pinned) {
        this.vx = 0;
        this.vy = 0;
        return;
      }
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      const damping = Math.pow(this.friction, dt);
      this.vx *= damping;
      this.vy *= damping;
      if (Math.abs(this.vx) < 1e-3) this.vx = 0;
      if (Math.abs(this.vy) < 1e-3) this.vy = 0;
    }
    /**
     * Compute bounding box in canvas space
     */
    getBounds() {
      return {
        minX: this.x,
        minY: this.y,
        maxX: this.x + this.width,
        maxY: this.y + this.height,
        width: this.width,
        height: this.height,
        centerX: this.x + this.width / 2,
        centerY: this.y + this.height / 2
      };
    }
    /**
     * Euclidean distance to another Pin or coordinate {x, y}
     */
    distanceTo(target) {
      const dx = this.x - target.x;
      const dy = this.y - target.y;
      return Math.hypot(dx, dy);
    }
  };
  function particleFromOptions(id, options = {}) {
    if (options.particle instanceof PinParticle) return options.particle;
    const particle = new PinParticle({
      id,
      x: options.x || 0,
      y: options.y || 0,
      z: options.z || 0,
      pinned: options.pinned !== void 0 ? options.pinned : true,
      mass: options.mass || 1,
      friction: options.friction !== void 0 ? options.friction : 0.92,
      vectors: options.vectors,
      vector: options.vector,
      metadata: options.metadata || {}
    });
    if (options.width !== void 0 || options.height !== void 0) {
      particle.setSize(
        options.width !== void 0 ? options.width : particle.width,
        options.height !== void 0 ? options.height : particle.height
      );
    }
    return particle;
  }

  // particles/engine.js
  var ParticleEngine = class {
    constructor() {
      this.pins = /* @__PURE__ */ new Map();
      this.tickListeners = /* @__PURE__ */ new Set();
      this.forceFields = [];
    }
    /**
     * Register a new or existing Pin particle in the engine
     */
    addPin(pinOrConfig) {
      const pin = pinOrConfig instanceof PinParticle ? pinOrConfig : new PinParticle(pinOrConfig);
      this.pins.set(pin.id, pin);
      return pin;
    }
    /**
     * Remove a Pin particle by its ID
     */
    removePin(id) {
      return this.pins.delete(id);
    }
    /**
     * Retrieve a Pin particle by ID
     */
    getPin(id) {
      return this.pins.get(id);
    }
    /**
     * Retrieve all active Pin particles
     */
    getAllPins() {
      return Array.from(this.pins.values());
    }
    /**
     * Add a custom force field function: (pin, dt) => void
     */
    addForceField(fieldFn) {
      if (typeof fieldFn === "function") {
        this.forceFields.push(fieldFn);
      }
    }
    /**
     * Apply an instantaneous global force to all unpinned Pins
     */
    applyGlobalForce(fx, fy) {
      for (const pin of this.pins.values()) {
        pin.applyForce(fx, fy);
      }
    }
    /**
     * Run one simulation step
     */
    tick(dt = 1) {
      if (this.forceFields.length > 0) {
        for (const pin of this.pins.values()) {
          if (!pin.pinned) {
            for (const field of this.forceFields) {
              field(pin, dt);
            }
          }
        }
      }
      for (const pin of this.pins.values()) {
        pin.update(dt);
      }
      for (const listener of this.tickListeners) {
        listener(this.pins, dt);
      }
    }
    /**
     * Subscribe to simulation ticks
     */
    onTick(listener) {
      this.tickListeners.add(listener);
      return () => this.tickListeners.delete(listener);
    }
    /**
     * Find all Pins whose bounds intersect a circular radius around (x, y)
     */
    queryRadius(x, y, radius) {
      const rSq = radius * radius;
      const results = [];
      for (const pin of this.pins.values()) {
        const bounds = pin.getBounds();
        const clampedX = Math.max(bounds.minX, Math.min(x, bounds.maxX));
        const clampedY = Math.max(bounds.minY, Math.min(y, bounds.maxY));
        const dx = x - clampedX;
        const dy = y - clampedY;
        if (dx * dx + dy * dy <= rSq) {
          results.push(pin);
        }
      }
      return results;
    }
    /**
     * Find all Pins whose bounds intersect the given bounding box
     */
    queryBox(minX, minY, maxX, maxY) {
      const results = [];
      for (const pin of this.pins.values()) {
        const bounds = pin.getBounds();
        const intersects = bounds.minX <= maxX && bounds.maxX >= minX && bounds.minY <= maxY && bounds.maxY >= minY;
        if (intersects) {
          results.push(pin);
        }
      }
      return results;
    }
    /**
     * Clear all Pins, listeners, and force fields
     */
    clear() {
      this.pins.clear();
      this.tickListeners.clear();
      this.forceFields = [];
    }
  };

  // pins/reload.js
  var DORMANT_CLASS = "is-dormant";
  var RELOAD_STRATEGIES = Object.freeze({
    ACTIVE: "active",
    PERSISTENT: "persistent",
    LAZY: "lazy"
  });
  var RELOAD_VALUES = new Set(Object.values(RELOAD_STRATEGIES));
  var RELOAD_MODES = Object.freeze({
    MOUNTED: "mounted",
    DORMANT: "dormant",
    UNMOUNTED: "unmounted"
  });
  function normalizeReloadStrategy(value, fallback = RELOAD_STRATEGIES.ACTIVE) {
    if (value === void 0 || value === null) return fallback;
    if (!RELOAD_VALUES.has(value)) {
      throw new TypeError(
        `Unknown reload strategy "${value}"; expected one of ${Array.from(RELOAD_VALUES).join(", ")}`
      );
    }
    return value;
  }
  function reloadFromOptions(options = {}) {
    if (options.reload !== void 0 && options.reload !== null) {
      return normalizeReloadStrategy(options.reload);
    }
    if (options.lazy !== void 0) {
      return options.lazy ? RELOAD_STRATEGIES.LAZY : RELOAD_STRATEGIES.ACTIVE;
    }
    return RELOAD_STRATEGIES.ACTIVE;
  }
  function resolveReloadMode(pin) {
    return resolveRenderMode(pin, true);
  }
  function resolveRenderMode(pin, participating = true) {
    if (!pin) return RELOAD_MODES.UNMOUNTED;
    if (pin._offloadDormant) return RELOAD_MODES.UNMOUNTED;
    if (participating && pin.active) return RELOAD_MODES.MOUNTED;
    switch (pin.reload) {
      case RELOAD_STRATEGIES.PERSISTENT:
        return RELOAD_MODES.DORMANT;
      case RELOAD_STRATEGIES.LAZY:
        return pin._provisioned ? RELOAD_MODES.DORMANT : RELOAD_MODES.UNMOUNTED;
      default:
        return RELOAD_MODES.UNMOUNTED;
    }
  }
  function wakesWithParent(pin) {
    return pin.reload !== RELOAD_STRATEGIES.LAZY || Boolean(pin._provisioned);
  }

  // engine/mounting.js
  var MAX_DEPTH = 4096;
  function mountPin(pin, planeElement) {
    if (!pin.element) return false;
    const container = pin.parent ? pin.parent.getOrCreateScopeElement() : planeElement;
    if (!container) return false;
    if (pin.element.parentNode !== container) {
      container.appendChild(pin.element);
    }
    return true;
  }
  function detachPin(pin) {
    if (!pin.element || !pin.element.parentNode) return false;
    pin.element.parentNode.removeChild(pin.element);
    return true;
  }
  function setDormant(pin, dormant) {
    const classList = pin.element ? pin.element.classList : null;
    if (!classList) return false;
    if (dormant) classList.add(DORMANT_CLASS);
    else classList.remove(DORMANT_CLASS);
    return true;
  }
  function isDormant(pin) {
    const classList = pin.element ? pin.element.classList : null;
    return Boolean(classList && classList.contains(DORMANT_CLASS));
  }
  function flushStructure(renderer) {
    if (renderer.dirtyStructure.size === 0) return 0;
    const pending = byDepth(renderer.dirtyStructure);
    renderer.dirtyStructure.clear();
    let mounted = 0;
    for (const pin of pending) {
      if (!renderer.activeSet.has(pin)) continue;
      const mode = resolveRenderMode(pin, renderer.participates(pin));
      renderer._frameDirty.add(pin);
      if (applyMode(renderer, pin, mode)) mounted += 1;
      if (mode === RELOAD_MODES.MOUNTED) {
        renderer.dirtyContent.add(pin);
        if (pin.element) renderer.measureQueue.add(pin);
      }
    }
    return mounted;
  }
  function applyMode(renderer, pin, mode) {
    if (!pin.element) {
      renderer.liveSet.delete(pin);
      return false;
    }
    if (mode === RELOAD_MODES.UNMOUNTED) {
      renderer.liveSet.delete(pin);
      setDormant(pin, false);
      cancelDragFor(renderer, pin);
      detachPin(pin);
      return false;
    }
    const mounted = mountPin(pin, renderer.planeElement);
    if (mode === RELOAD_MODES.DORMANT) {
      renderer.liveSet.delete(pin);
      setDormant(pin, true);
      return mounted;
    }
    setDormant(pin, false);
    renderer.liveSet.add(pin);
    return mounted;
  }
  function cancelDragFor(renderer, pin) {
    const session = renderer.session;
    if (!session || session.activeDragPin !== pin) return false;
    if (typeof session.cancelDrag !== "function") return false;
    session.cancelDrag();
    return true;
  }
  function byDepth(pins) {
    const ordered = Array.from(pins);
    const depths = /* @__PURE__ */ new Map();
    for (const pin of ordered) {
      depths.set(pin, depthOf(pin));
    }
    return ordered.sort((a, b) => depths.get(a) - depths.get(b));
  }
  function depthOf(pin) {
    let depth = 0;
    let node = pin.parent;
    while (node && depth < MAX_DEPTH) {
      depth += 1;
      node = node.parent;
    }
    return depth;
  }
  var RenderRootScope = class {
    constructor() {
      this.pin = null;
      this._chain = null;
    }
    /**
     * Promote a Pin, or restore the whole canvas with `null`.
     *
     * @returns {boolean} true when the root actually changed
     */
    set(pin = null) {
      const next = pin || null;
      if (next === this.pin) return false;
      this.pin = next;
      this._chain = next ? /* @__PURE__ */ new Set([next, ...next.ancestors()]) : null;
      if (next) {
        for (const ancestor of next.ancestors().reverse()) ancestor.activate();
        next.activate();
      }
      return true;
    }
    /** Whether the current root lets a Pin take part in rendering at all. */
    allows(pin) {
      if (!this.pin || !pin) return true;
      if (this._chain.has(pin)) return true;
      let node = pin.parent;
      for (let depth = 0; node && depth < MAX_DEPTH; depth += 1) {
        if (node === this.pin) return true;
        node = node.parent;
      }
      return false;
    }
    /** Root-first trail to the promoted Pin, or [] at the canvas root. */
    breadcrumb() {
      return this.pin ? this.pin.breadcrumb() : [];
    }
    clear() {
      this.pin = null;
      this._chain = null;
    }
  };

  // graphics/primitives/primitives.js
  var primitives_exports = {};
  __export(primitives_exports, {
    BADGE_SURFACE: () => BADGE_SURFACE,
    BADGE_TEXT_OVERRIDE_TOKEN: () => BADGE_TEXT_OVERRIDE_TOKEN,
    FOCUS_LABEL_COLOR: () => FOCUS_LABEL_COLOR,
    connectorPathData: () => connectorPathData,
    contrastTextFor: () => contrastTextFor,
    createBadgeSVG: () => createBadgeSVG,
    createConnectorPathSVG: () => createConnectorPathSVG,
    createFocusCursorSVG: () => createFocusCursorSVG,
    createFrustumProjectionSVG: () => createFrustumProjectionSVG,
    createGradientMeterSVG: () => createGradientMeterSVG,
    createMinimalAVIFDataURI: () => createMinimalAVIFDataURI,
    createPinIconSVG: () => createPinIconSVG,
    createPlaceholderDataURI: () => createPlaceholderDataURI,
    createVectorPointerSVG: () => createVectorPointerSVG,
    relativeLuminance: () => relativeLuminance,
    safeColor: () => safeColor,
    safeNumber: () => safeNumber,
    safeUrl: () => safeUrl
  });

  // graphics/primitives/contrast.js
  var HEX_CHANNELS = /^#([0-9a-f]{3,8})$/i;
  var TEXT_LIGHT = "#f8fafc";
  var TEXT_DARK = "#0b1220";
  var LUMA_R = 0.2126;
  var LUMA_G = 0.7152;
  var LUMA_B = 0.0722;
  function hexChannels(value) {
    if (typeof value !== "string") return null;
    const match = HEX_CHANNELS.exec(value.trim());
    if (!match) return null;
    const digits = match[1];
    const short = digits.length === 3 || digits.length === 4;
    if (!short && digits.length !== 6 && digits.length !== 8) return null;
    const read = (index) => short ? parseInt(digits[index].repeat(2), 16) : parseInt(digits.slice(index * 2, index * 2 + 2), 16);
    return { r: read(0), g: read(1), b: read(2) };
  }
  function channelLuminance(value) {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }
  function relativeLuminance(color) {
    const channels = hexChannels(color);
    if (!channels) return Number.NaN;
    return LUMA_R * channelLuminance(channels.r) + LUMA_G * channelLuminance(channels.g) + LUMA_B * channelLuminance(channels.b);
  }
  function ratioBetween(a, b) {
    const lighter = Math.max(a, b);
    const darker = Math.min(a, b);
    return (lighter + 0.05) / (darker + 0.05);
  }
  function contrastTextFor(color, light = TEXT_LIGHT, dark = TEXT_DARK) {
    const background = relativeLuminance(color);
    if (!Number.isFinite(background)) return light;
    const onLight = ratioBetween(background, relativeLuminance(light));
    const onDark = ratioBetween(background, relativeLuminance(dark));
    return onLight >= onDark ? light : dark;
  }
  function compositeOver(color, alpha, base) {
    const top = hexChannels(color);
    const bottom = hexChannels(base);
    if (!top || !bottom) return base;
    const mix = (a, b) => Math.round(a * alpha + b * (1 - alpha));
    const hex = (value) => value.toString(16).padStart(2, "0");
    return `#${hex(mix(top.r, bottom.r))}${hex(mix(top.g, bottom.g))}${hex(mix(top.b, bottom.b))}`;
  }

  // graphics/primitives/primitives.js
  var HTML_ENTITIES = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  };
  function escapeText(value) {
    if (value === void 0 || value === null) return "";
    return String(value).replace(/[&<>"']/g, (char) => HTML_ENTITIES[char]);
  }
  var MAX_COLOR_LENGTH = 64;
  var COLOR_HEX = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
  var COLOR_FUNCTION = /^(?:rgb|rgba|hsl|hsla)\([0-9.,%/\s+-]+\)$/i;
  var COLOR_IDENT = /^[a-z0-9_,()\- ]+$/i;
  var COLOR_VAR = /^var\(\s*--[a-z0-9_-]+\s*(?:,\s*([^;"'<>]*?)\s*)?\)$/i;
  var DEFAULT_COLOR = "#38bdf8";
  function isSafeColor(value) {
    if (typeof value !== "string") return false;
    const text = value.trim();
    if (text === "" || text.length > MAX_COLOR_LENGTH) return false;
    if (COLOR_HEX.test(text) || COLOR_FUNCTION.test(text) || COLOR_IDENT.test(text)) return true;
    const varMatch = COLOR_VAR.exec(text);
    if (!varMatch) return false;
    return varMatch[1] === void 0 || isSafeColor(varMatch[1]);
  }
  function safeColor(value, fallback = DEFAULT_COLOR) {
    if (isSafeColor(value)) return value.trim();
    if (isSafeColor(fallback)) return fallback.trim();
    return DEFAULT_COLOR;
  }
  function safeNumber(value, fallback = 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
    return Number.isFinite(fallback) ? fallback : 0;
  }
  var URL_CONTROL_CHARS = /[\u0000-\u0020\u007F]/g;
  var URL_SCHEME = /^([a-z][a-z0-9+.-]*):/i;
  var DATA_IMAGE_PREFIX = /^data:image\//i;
  function safeUrl(value, fallback = "") {
    if (typeof value !== "string") return fallback;
    const text = value.trim();
    if (text === "") return fallback;
    const scheme = URL_SCHEME.exec(text.replace(URL_CONTROL_CHARS, ""));
    if (!scheme) return text;
    const protocol = scheme[1].toLowerCase();
    if (protocol === "http" || protocol === "https") return text;
    if (protocol === "data" && DATA_IMAGE_PREFIX.test(text)) return text;
    return fallback;
  }
  function createPinIconSVG(options = {}) {
    const color = safeColor(options.color, "#38bdf8");
    const size = safeNumber(options.size || 20, 20);
    return `
<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="cloudcanvas-svg-pin">
  <circle cx="12" cy="12" r="9" fill="${color}" fill-opacity="0.2" stroke="${color}" stroke-width="2"/>
  <circle cx="12" cy="12" r="3.5" fill="${color}"/>
</svg>`.trim();
  }
  function createVectorPointerSVG(vectorValue, options = {}) {
    const rawAngle = options.angle !== void 0 ? options.angle : (safeNumber(vectorValue, 0) || 0) * (options.isRadians ? 180 / Math.PI : 1);
    const angleDeg = safeNumber(rawAngle, 0);
    const color = safeColor(options.color, "#38bdf8");
    const size = safeNumber(options.size || 24, 24);
    return `
<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="transform: rotate(${angleDeg.toFixed(1)}deg); transform-origin: center; transition: transform 0.2s ease;">
  <line x1="12" y1="20" x2="12" y2="4" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
  <polyline points="7,9 12,4 17,9" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="12" cy="20" r="2.5" fill="${color}"/>
</svg>`.trim();
  }
  function createGradientMeterSVG(val, min = 0, max = 100, options = {}) {
    const value = safeNumber(val, 0);
    const low = safeNumber(min, 0);
    const high = safeNumber(max, 100);
    const span = high - low;
    const percent = span === 0 ? 0 : Math.min(100, Math.max(0, (value - low) / span * 100));
    const color = safeColor(options.color, "#6366f1");
    const height = safeNumber(options.height || 6, 6);
    return `
<div style="width: 100%; height: ${height}px; background: var(--cc-meter-track, rgba(255,255,255,0.1)); border-radius: var(--cc-radius-pill, 9999px); overflow: hidden; position: relative;">
  <div style="width: ${percent.toFixed(1)}%; height: 100%; background: linear-gradient(90deg, ${color}, var(--cc-meter-end, #ec4899)); border-radius: var(--cc-radius-pill, 9999px); transition: width 0.3s ease;"></div>
</div>`.trim();
  }
  function connectorPathData(fromX, fromY, toX, toY) {
    const x1 = safeNumber(fromX, 0);
    const y1 = safeNumber(fromY, 0);
    const x2 = safeNumber(toX, 0);
    const y2 = safeNumber(toY, 0);
    const dx = (x2 - x1) * 0.5;
    return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
  }
  function createConnectorPathSVG(fromX, fromY, toX, toY, options = {}) {
    const stroke = safeColor(options.stroke, "var(--cc-connector, rgba(56, 189, 248, 0.6))");
    const strokeWidth = safeNumber(options.strokeWidth || 2, 2);
    const d = connectorPathData(fromX, fromY, toX, toY);
    return `
<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-dasharray="${options.dashed ? "6,4" : "none"}" vector-effect="non-scaling-stroke" />
  `.trim();
  }
  var SIX_DIGIT_HEX = /^#[0-9a-f]{6}$/i;
  var BADGE_SURFACE = "#1e293b";
  var BADGE_TEXT_OVERRIDE_TOKEN = "--cc-badge-text-override";
  var BADGE_BG_ALPHA = 64;
  var BADGE_BORDER_ALPHA = 102;
  var LEGACY_BG_ALPHA = 38;
  var LEGACY_BORDER_ALPHA = 77;
  function alphaSuffix(byte) {
    return byte.toString(16).padStart(2, "0");
  }
  function createBadgeSVG(label, color = "#38bdf8", options = {}) {
    const tint = safeColor(color, "#38bdf8");
    const known = SIX_DIGIT_HEX.test(tint);
    const surface = safeColor(options.surface, BADGE_SURFACE);
    const bgAlpha = known ? BADGE_BG_ALPHA : LEGACY_BG_ALPHA;
    const borderAlpha = known ? BADGE_BORDER_ALPHA : LEGACY_BORDER_ALPHA;
    const text = known ? contrastTextFor(compositeOver(tint, bgAlpha / 255, surface)) : tint;
    return `
<span class="cloudcanvas-primitive-badge" style="color: var(${BADGE_TEXT_OVERRIDE_TOKEN}, ${text}); --cc-badge-border: ${tint}${alphaSuffix(borderAlpha)}; --cc-badge-bg: ${tint}${alphaSuffix(bgAlpha)};">
  <span style="width: var(--cc-badge-dot, 6px); height: var(--cc-badge-dot, 6px); border-radius: 50%; background: ${tint};"></span>
  ${escapeText(label)}
</span>`.trim();
  }
  var FRUSTUM_SEGMENT_LERP = 0.35;
  function frustumSpike(ax, ay, bx, by, half) {
    const dx = bx - ax;
    const dy = by - ay;
    const length = Math.hypot(dx, dy);
    if (!(length > 0)) return "";
    const tipX = ax + dx * FRUSTUM_SEGMENT_LERP;
    const tipY = ay + dy * FRUSTUM_SEGMENT_LERP;
    const nx = -dy / length * half;
    const ny = dx / length * half;
    return `M ${(ax + nx).toFixed(1)} ${(ay + ny).toFixed(1)} L ${tipX.toFixed(1)} ${tipY.toFixed(1)} L ${(ax - nx).toFixed(1)} ${(ay - ny).toFixed(1)} Z`;
  }
  function createFrustumProjectionSVG(parentBounds, targetBounds, options = {}) {
    const stroke = safeColor(options.stroke, "#833446");
    const half = safeNumber(options.strokeWidth || 3, 3) / 2;
    const opacity = safeNumber(options.opacity !== void 0 ? options.opacity : 0.85, 0.85);
    const px = safeNumber(parentBounds.minX, 0);
    const py = safeNumber(parentBounds.minY, 0);
    const pr = safeNumber(parentBounds.maxX, 0);
    const pb = safeNumber(parentBounds.maxY, 0);
    const tx = safeNumber(targetBounds.minX, 0);
    const ty = safeNumber(targetBounds.minY, 0);
    const tr = safeNumber(targetBounds.maxX, 0);
    const tb = safeNumber(targetBounds.maxY, 0);
    const spikes = [
      frustumSpike(px, py, tx, ty, half),
      frustumSpike(pr, py, tr, ty, half),
      frustumSpike(pr, pb, tr, tb, half),
      frustumSpike(px, pb, tx, tb, half)
    ].filter(Boolean).join(" ");
    return `
<g class="cloudcanvas-frustum-projection" opacity="${opacity}">
  <path d="${spikes}" fill="${stroke}" stroke="none" />
</g>`.trim();
  }
  var FOCUS_LABEL_COLOR = "var(--cc-cursor-label, var(--cc-text, #e2e8f0))";
  function createFocusCursorSVG(targetBounds, options = {}) {
    const color = safeColor(options.color, "#9f3a52");
    const labelColor = safeColor(options.labelColor, FOCUS_LABEL_COLOR);
    const cornerSize = safeNumber(options.cornerSize || 16, 16);
    const pad = safeNumber(options.padding || 8, 8);
    const minX = safeNumber(targetBounds.minX, 0);
    const minY = safeNumber(targetBounds.minY, 0);
    const x = minX - pad;
    const y = minY - pad;
    const w = safeNumber(targetBounds.maxX, 0) - minX + pad * 2;
    const h2 = safeNumber(targetBounds.maxY, 0) - minY + pad * 2;
    const path = `
    M ${x} ${y + cornerSize} L ${x} ${y} L ${x + cornerSize} ${y}
    M ${x + w - cornerSize} ${y} L ${x + w} ${y} L ${x + w} ${y + cornerSize}
    M ${x + w} ${y + h2 - cornerSize} L ${x + w} ${y + h2} L ${x + w - cornerSize} ${y + h2}
    M ${x + cornerSize} ${y + h2} L ${x} ${y + h2} L ${x} ${y + h2 - cornerSize}
  `.trim();
    return `
<g class="cloudcanvas-focus-cursor">
  <path d="${path}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
  ${options.label ? `
    <text class="cloudcanvas-focus-cursor-label" x="${x + w / 2}" y="${y - 8}" text-anchor="middle" fill="${labelColor}" font-size="11" font-weight="600" font-family="sans-serif">${escapeText(options.label)}</text>
  ` : ""}
</g>`.trim();
  }
  var PLACEHOLDER_SVG = "<svg xmlns='http://www.w3.org/2000/svg' width='64' height='48' viewBox='0 0 64 48'><rect width='64' height='48' rx='4' fill='#1e293b'/><circle cx='20' cy='16' r='5' fill='#475569'/><path d='M8 40l14-16 10 11 8-7 16 12z' fill='#334155'/></svg>";
  var PLACEHOLDER_DATA_URI = `data:image/svg+xml,${encodeURIComponent(PLACEHOLDER_SVG)}`;
  function createPlaceholderDataURI() {
    return PLACEHOLDER_DATA_URI;
  }
  function createMinimalAVIFDataURI() {
    return createPlaceholderDataURI();
  }

  // pins/traits/template-kit.js
  var KEY_ATTR = "data-cc-key";
  function makeElement(tag, className) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    return element;
  }
  function makeTextNode(parent) {
    const node = document.createTextNode("");
    parent.appendChild(node);
    return node;
  }
  function setText(node, value) {
    const text = value === void 0 || value === null ? "" : String(value);
    if (node.data !== text) node.data = text;
  }
  function setVisible(element, visible2) {
    const hidden = !visible2;
    if (element.hidden !== hidden) element.hidden = hidden;
  }
  function setAttr(element, name, value, cache, key) {
    if (cache[key] === value) return;
    cache[key] = value;
    element.setAttribute(name, value);
  }
  function setSlot(slot, markup, cache, key, signature) {
    if (cache[key] === signature) return;
    cache[key] = signature;
    slot.innerHTML = markup;
  }
  function defaultKey(item, index) {
    if (item && typeof item === "object") {
      if (item.id !== void 0 && item.id !== null) return item.id;
      if (item.key !== void 0 && item.key !== null) return item.key;
    }
    return index;
  }
  function firstKeyed(container) {
    let node = container.firstElementChild;
    while (node && !node.hasAttribute(KEY_ATTR)) node = node.nextElementSibling;
    return node;
  }
  function nextKeyed(node) {
    let next = node ? node.nextElementSibling : null;
    while (next && !next.hasAttribute(KEY_ATTR)) next = next.nextElementSibling;
    return next;
  }
  function indexByKey(container) {
    const existing = /* @__PURE__ */ new Map();
    for (let node = firstKeyed(container); node; node = nextKeyed(node)) {
      const key = node.getAttribute(KEY_ATTR);
      if (!existing.has(key)) existing.set(key, node);
    }
    return existing;
  }
  function reconcileKeyedList(container, items, options = {}) {
    if (!container || typeof container.insertBefore !== "function") return [];
    if (typeof options.create !== "function") {
      throw new TypeError("reconcileKeyedList: options.create must be a function");
    }
    const keyOf = typeof options.key === "function" ? options.key : defaultKey;
    const update = typeof options.update === "function" ? options.update : null;
    const existing = indexByKey(container);
    const nodes = [];
    let cursor = firstKeyed(container);
    let index = 0;
    for (const item of items || []) {
      const key = String(keyOf(item, index));
      const node = existing.get(key) || createKeyed(options.create, item, index, key);
      existing.delete(key);
      if (update) update(node, item, index);
      if (node === cursor) cursor = nextKeyed(cursor);
      else container.insertBefore(node, cursor);
      nodes.push(node);
      index += 1;
    }
    for (const leftover of existing.values()) leftover.remove();
    return nodes;
  }
  function createKeyed(create, item, index, key) {
    const node = create(item, index);
    if (!node || typeof node.setAttribute !== "function") {
      throw new TypeError(`reconcileKeyedList: create() returned no element for key "${key}"`);
    }
    node.setAttribute(KEY_ATTR, key);
    return node;
  }

  // pins/traits/display-templates.js
  var CLS = Object.freeze({
    HEADER: "cloudcanvas-pin-header",
    TITLE: "cloudcanvas-pin-title",
    BADGE_SLOT: "cloudcanvas-pin-badge-slot",
    BODY: "cloudcanvas-pin-body",
    GAUGE_ROW: "cloudcanvas-pin-gauge-row",
    FOOTER: "cloudcanvas-pin-footer",
    AUTHOR: "cloudcanvas-pin-author",
    ACTION_BTN: "cloudcanvas-pin-action-btn",
    NEEDLE_SLOT: "cloudcanvas-pin-needle-slot",
    GAUGE: "cloudcanvas-pin-gauge",
    LABEL: "cloudcanvas-pin-label",
    METER_SLOT: "cloudcanvas-pin-meter-slot",
    MEDIA: "cloudcanvas-pin-media",
    CAPTION: "cloudcanvas-pin-caption"
  });
  var HTML_KEY = "html";
  var PRESERVE_TYPE = "preserve";
  var HTML_OVERRIDABLE = /* @__PURE__ */ new Set(["card", "raw"]);
  var ACCENT = "#38bdf8";
  var MEDIA_BADGE_COLOR = "#eab308";
  var METER_MIN = 0;
  var METER_MAX = 100;
  var NEEDLE_SIZE = 36;
  function readBadge(value, fallbackColor) {
    if (value === void 0 || value === null) return { text: "", color: fallbackColor };
    if (typeof value === "object") {
      return {
        text: value.text === void 0 || value.text === null ? "" : String(value.text),
        color: safeColor(value.color, fallbackColor)
      };
    }
    return { text: String(value), color: fallbackColor };
  }
  function updateBadgeSlot(slot, text, color, cache) {
    setSlot(slot, text ? createBadgeSVG(text, color) : "", cache, "badge", `${text}|${color}`);
    setVisible(slot, Boolean(text));
  }
  function buildHeader() {
    const header = makeElement("div", CLS.HEADER);
    const title = makeElement("div", CLS.TITLE);
    const titleText = makeTextNode(title);
    const badgeSlot = makeElement("span", CLS.BADGE_SLOT);
    header.appendChild(title);
    header.appendChild(badgeSlot);
    return { header, titleText, badgeSlot };
  }
  function buildHtml(pin, contentEl) {
    contentEl.replaceChildren();
    return { mode: "html", htmlTarget: contentEl };
  }
  function updateHtml(pin, contents, bindings, cache) {
    const value = contents.get(HTML_KEY);
    const markup = value === void 0 || value === null ? "" : String(value);
    if (cache.html === markup) return;
    cache.html = markup;
    bindings.htmlTarget.innerHTML = markup;
  }
  function buildCard(pin, contentEl) {
    const { header, titleText, badgeSlot } = buildHeader();
    const body = makeElement("div", CLS.BODY);
    const bodyText = makeTextNode(body);
    const footer = makeElement("div", CLS.FOOTER);
    const author = makeElement("span", CLS.AUTHOR);
    const authorText = makeTextNode(author);
    const actionButton = makeElement("button", CLS.ACTION_BTN);
    const actionText = makeTextNode(actionButton);
    actionButton.setAttribute("type", "button");
    footer.appendChild(author);
    footer.appendChild(actionButton);
    contentEl.replaceChildren(header, body, footer);
    return { mode: "card", titleText, badgeSlot, body, bodyText, footer, authorText, actionButton, actionText };
  }
  function updateCard(pin, contents, bindings, cache) {
    setText(bindings.titleText, contents.get("title") || "Pin");
    const badge = readBadge(contents.get("badge"), ACCENT);
    updateBadgeSlot(bindings.badgeSlot, badge.text, badge.color, cache);
    const body = contents.get("body") || "";
    setText(bindings.bodyText, body);
    setVisible(bindings.body, body !== "");
    const author = contents.get("author") || "";
    setText(bindings.authorText, author);
    const action = contents.get("actionText") || "";
    setText(bindings.actionText, action);
    setAttr(bindings.actionButton, "data-action", action, cache, "action");
    setVisible(bindings.actionButton, action !== "");
    setVisible(bindings.footer, author !== "" || action !== "");
  }
  function buildVectorPointer(pin, contentEl) {
    const { header, titleText, badgeSlot } = buildHeader();
    const body = makeElement("div", `${CLS.BODY} ${CLS.GAUGE_ROW}`);
    const needleSlot = makeElement("div", CLS.NEEDLE_SLOT);
    const gauge = makeElement("div", CLS.GAUGE);
    const label = makeElement("div", CLS.LABEL);
    const labelText = makeTextNode(label);
    const meterSlot = makeElement("div", CLS.METER_SLOT);
    gauge.appendChild(label);
    gauge.appendChild(meterSlot);
    body.appendChild(needleSlot);
    body.appendChild(gauge);
    contentEl.replaceChildren(header, body);
    return { mode: "vector-pointer", titleText, badgeSlot, needleSlot, labelText, meterSlot };
  }
  function updateVectorPointer(pin, contents, bindings, cache) {
    const angle = contents.has("angle") ? Number(contents.get("angle")) : pin.particle.getPrimaryVector();
    const magnitude = contents.has("magnitude") ? Number(contents.get("magnitude")) : pin.magnitude;
    const color = safeColor(contents.get("color"), ACCENT);
    setText(bindings.titleText, contents.get("title") || "Vector Pointer");
    updateBadgeSlot(bindings.badgeSlot, `${angle.toFixed(0)}°`, color, cache);
    setSlot(
      bindings.needleSlot,
      createVectorPointerSVG(angle, { color, size: NEEDLE_SIZE }),
      cache,
      "needle",
      `${angle}|${color}`
    );
    setText(bindings.labelText, contents.get("label") || `Mag: ${magnitude.toFixed(1)}`);
    setSlot(
      bindings.meterSlot,
      createGradientMeterSVG(magnitude, METER_MIN, METER_MAX, { color }),
      cache,
      "meter",
      `${magnitude}|${color}`
    );
  }
  function buildMedia(pin, contentEl) {
    const { header, titleText, badgeSlot } = buildHeader();
    const body = makeElement("div", CLS.BODY);
    const image = makeElement("img", CLS.MEDIA);
    const caption = makeElement("p", CLS.CAPTION);
    const captionText = makeTextNode(caption);
    body.appendChild(image);
    body.appendChild(caption);
    contentEl.replaceChildren(header, body);
    return { mode: "media", titleText, badgeSlot, image, caption, captionText };
  }
  function updateMedia(pin, contents, bindings, cache) {
    setText(bindings.titleText, contents.get("title") || "Media");
    const badge = readBadge(contents.get("badge") || "AVIF", MEDIA_BADGE_COLOR);
    updateBadgeSlot(bindings.badgeSlot, badge.text, badge.color, cache);
    setAttr(bindings.image, "src", safeUrl(contents.get("src"), createPlaceholderDataURI()), cache, "src");
    setAttr(bindings.image, "alt", contents.get("alt") || "Media Primitive", cache, "alt");
    const caption = contents.get("caption") || "";
    setText(bindings.captionText, caption);
    setVisible(bindings.caption, caption !== "");
  }
  function buildPreserve() {
    return { mode: PRESERVE_TYPE };
  }
  function updatePreserve() {
  }
  var DISPLAY_TEMPLATES = {
    card: { build: buildCard, update: updateCard },
    "vector-pointer": { build: buildVectorPointer, update: updateVectorPointer },
    media: { build: buildMedia, update: updateMedia },
    raw: { build: buildHtml, update: updateHtml },
    [PRESERVE_TYPE]: { build: buildPreserve, update: updatePreserve }
  };
  var HTML_TEMPLATE = { build: buildHtml, update: updateHtml };
  var DEFAULT_TEMPLATE = DISPLAY_TEMPLATES.card;
  function usesHtmlOverride(displayType, contents) {
    if (displayType === "raw") return true;
    return HTML_OVERRIDABLE.has(displayType) && contents.has(HTML_KEY);
  }

  // pins/pin-element.js
  var PIN_CLASS = "cloudcanvas-pin";
  var CARD_CLASS = "cloudcanvas-primitive-card";
  var CONTENT_CLASS = "cloudcanvas-pin-content";
  var SCOPE_CLASS = "cloudcanvas-pin-scope";
  var SCOPE_POPULATED_CLASS = "cc-populated";
  var SELECTABLE_TEXT_CLASS = "is-selectable-text";
  var BORDERLESS_CLASS = "is-borderless";
  var LAYOUT_MODES = Object.freeze({
    FREE: "free",
    ROW: "row",
    COLUMN: "column",
    GRID: "grid"
  });
  var LAYOUT_VALUES = new Set(Object.values(LAYOUT_MODES));
  var LAYOUT_CLASS = Object.freeze({
    row: "is-layout-row",
    column: "is-layout-column",
    grid: "is-layout-grid"
  });
  var FLOW_CHILD_CLASS = "is-flow-child";
  var LAYOUT_GAP_PROPERTY = "--cc-layout-gap";
  var CONTROL_ATTR = "data-cc-control";
  var ORIGIN = Object.freeze({ x: 0, y: 0 });
  var PIN_ARIA = Object.freeze({
    role: "group",
    "aria-roledescription": "pin"
  });
  function createDefaultElement(pin, options = {}) {
    if (typeof document === "undefined") return null;
    if (pin.utility) return null;
    const div = document.createElement("div");
    div.id = pin.id;
    div.className = rootClassName(options);
    if (options.width !== void 0) {
      div.style.width = `${options.width}px`;
      div.style.maxWidth = "none";
    }
    if (options.height !== void 0) div.style.height = `${options.height}px`;
    return div;
  }
  function rootClassName(options) {
    if (options.className) return `${PIN_CLASS} ${options.className}`;
    const chromeless = options.chrome === false || options.className === "";
    return chromeless ? PIN_CLASS : `${PIN_CLASS} ${CARD_CLASS}`;
  }
  function setupElement(pin) {
    if (!pin.element) return;
    if (pin.element.classList) pin.element.classList.add(PIN_CLASS);
    if (pin.element.setAttribute) {
      pin.element.setAttribute("data-pin-id", pin.id);
      applyPinAria(pin.element);
    }
    if (pin.selectableText && pin.element.classList) {
      pin.element.classList.add(SELECTABLE_TEXT_CLASS);
    }
    setBordered(pin, pin.bordered);
    syncChrome(pin);
    buildElementStructure(pin);
    syncLayout(pin);
    pin.syncDimensions();
  }
  function setBordered(pin, bordered) {
    pin._bordered = bordered !== false;
    if (pin.element && pin.element.classList) {
      pin.element.classList.toggle(BORDERLESS_CLASS, !pin._bordered);
    }
    return pin._bordered;
  }
  function syncChrome(pin) {
    if (pin.element && pin.element.classList) {
      pin._chrome = pin.element.classList.contains(CARD_CLASS);
    }
    return pin._chrome !== false;
  }
  function setChrome(pin, chrome) {
    const next = chrome !== false;
    const changed = pin._chrome !== next;
    pin._chrome = next;
    if (pin.element && pin.element.classList) {
      pin.element.classList.toggle(CARD_CLASS, next);
      if (changed) pin.invalidate("content");
    }
    return next;
  }
  function setLayout(pin, layout) {
    const next = normalizeLayout(layout);
    const changed = (pin._layout || LAYOUT_MODES.FREE) !== next;
    pin._layout = next;
    writeLayoutClass(pin, next);
    if (changed) {
      for (const child of pin.children) syncFlowChild(child);
      if (pin.element) pin.invalidate("content");
      if (pin._renderer && pin._renderer.scopeWells) pin._renderer.scopeWells.invalidate(pin);
    }
    return next;
  }
  function normalizeLayout(value) {
    if (value === void 0 || value === null) return LAYOUT_MODES.FREE;
    if (!LAYOUT_VALUES.has(value)) {
      throw new TypeError(
        `Pin layout: unknown mode "${value}"; expected one of ${Array.from(LAYOUT_VALUES).join(", ")}`
      );
    }
    return value;
  }
  function writeLayoutClass(pin, layout) {
    const scope = pin.scopeElement;
    if (!scope || !scope.classList) return false;
    for (const cls of Object.values(LAYOUT_CLASS)) scope.classList.remove(cls);
    if (layout !== LAYOUT_MODES.FREE) scope.classList.add(LAYOUT_CLASS[layout]);
    return true;
  }
  function syncLayout(pin) {
    const layout = pin._layout || LAYOUT_MODES.FREE;
    writeLayoutClass(pin, layout);
    writeLayoutGap(pin, pin._layoutGap);
    return layout;
  }
  function setLayoutGap(pin, gap) {
    const value = gap === null || gap === void 0 ? NaN : Number(gap);
    pin._layoutGap = Number.isFinite(value) && value >= 0 ? value : null;
    writeLayoutGap(pin, pin._layoutGap);
    return pin._layoutGap;
  }
  function writeLayoutGap(pin, gap) {
    const scope = pin.scopeElement;
    if (!scope || !scope.style) return false;
    if (Number.isFinite(gap) && gap >= 0) {
      scope.style.setProperty(LAYOUT_GAP_PROPERTY, `${gap}px`);
    } else {
      scope.style.removeProperty(LAYOUT_GAP_PROPERTY);
    }
    return true;
  }
  function syncFlowChild(pin) {
    if (!pin) return false;
    const parent = pin.parent;
    const isFlow = Boolean(parent && parent.layout && parent.layout !== LAYOUT_MODES.FREE);
    const classList = pin.element ? pin.element.classList : null;
    const was = classList ? classList.contains(FLOW_CHILD_CLASS) : false;
    if (classList) classList.toggle(FLOW_CHILD_CLASS, isFlow);
    if (was === isFlow) return isFlow;
    if (isFlow) {
      if (pin.element && pin.element.style) pin.element.style.transform = "";
    } else {
      pin._flowOrigin = null;
    }
    if (pin._renderer && typeof pin._renderer.clearAppliedPosition === "function") {
      pin._renderer.clearAppliedPosition(pin);
      if (isFlow && typeof pin._renderer.enqueueMeasure === "function") {
        pin._renderer.enqueueMeasure(pin);
      }
    } else if (!isFlow) {
      pin.renderPosition();
    }
    return isFlow;
  }
  function isTextRegionTarget(target) {
    if (!target || typeof target.closest !== "function") return false;
    const content = target.closest(`.${CONTENT_CLASS}`);
    if (!content) return false;
    if (target.closest(`.${CLS.HEADER}`)) return false;
    const pinElement = content.parentElement;
    return Boolean(
      pinElement && pinElement.classList && pinElement.classList.contains(SELECTABLE_TEXT_CLASS)
    );
  }
  var CONTROL_SELECTOR = [
    "button",
    "a[href]",
    "input",
    "select",
    "textarea",
    "label",
    '[contenteditable=""]',
    '[contenteditable="true"]',
    `[${CONTROL_ATTR}]`
  ].join(", ");
  function isControlTarget(target) {
    if (!target || typeof target.closest !== "function") return false;
    return Boolean(target.closest(CONTROL_SELECTOR));
  }
  function applyPinAria(element) {
    if (typeof element.hasAttribute !== "function") return;
    if (!element.hasAttribute("tabindex")) element.setAttribute("tabindex", "-1");
    for (const [name, value] of Object.entries(PIN_ARIA)) {
      if (!element.hasAttribute(name)) element.setAttribute(name, value);
    }
  }
  function buildElementStructure(pin) {
    if (!pin.element || typeof document === "undefined") return null;
    if (pin.contentElement && pin.scopeElement) return pin.contentElement;
    let content = directChildByClass(pin, CONTENT_CLASS);
    let scope = directChildByClass(pin, SCOPE_CLASS);
    if (!content) {
      content = document.createElement("div");
      content.className = CONTENT_CLASS;
    }
    if (!scope) {
      scope = document.createElement("div");
      scope.className = SCOPE_CLASS;
    }
    for (const node of Array.from(pin.element.childNodes)) {
      if (node === content || node === scope) continue;
      content.appendChild(node);
    }
    pin.element.appendChild(content);
    pin.element.appendChild(scope);
    pin.contentElement = content;
    pin.scopeElement = scope;
    return content;
  }
  function directChildByClass(pin, className) {
    const children = pin.element ? pin.element.children : null;
    if (!children) return null;
    for (const node of children) {
      if (node.classList && node.classList.contains(className)) return node;
    }
    return null;
  }
  function mountInto(pin, parentContainer) {
    if (!parentContainer || !pin.element) return;
    if (pin.element.parentNode !== parentContainer) {
      parentContainer.appendChild(pin.element);
    }
    pin.syncDimensions();
    pin.render();
  }
  function unmountElement(pin) {
    if (pin.element && pin.element.parentNode) {
      pin.element.parentNode.removeChild(pin.element);
    }
  }
  function applyReloadMode(pin) {
    if (!pin.element) return false;
    const mode = resolveReloadMode(pin);
    const classList = pin.element.classList || null;
    if (mode === RELOAD_MODES.UNMOUNTED) {
      if (classList) classList.remove(DORMANT_CLASS);
      pin.unmount();
      return syncScopeWells(pin);
    }
    if (classList) {
      if (mode === RELOAD_MODES.DORMANT) classList.add(DORMANT_CLASS);
      else classList.remove(DORMANT_CLASS);
    }
    const container = reloadContainer(pin);
    if (container && pin.element.parentNode !== container) {
      if (mode === RELOAD_MODES.DORMANT) container.appendChild(pin.element);
      else pin.mount(container);
    }
    return syncScopeWells(pin);
  }
  function syncScopeWells(pin) {
    syncScopePopulation(pin);
    syncScopePopulation(pin.parent);
    return true;
  }
  function syncScopePopulation(pin) {
    const scope = pin ? pin.scopeElement : null;
    if (!scope || !scope.classList) return false;
    let populated = false;
    for (const node of scope.children) {
      if (node.classList && !node.classList.contains(DORMANT_CLASS)) {
        populated = true;
        break;
      }
    }
    scope.classList.toggle(SCOPE_POPULATED_CLASS, populated);
    return populated;
  }
  function reloadContainer(pin) {
    if (pin.parent) return pin.parent.getOrCreateScopeElement();
    if (pin.element && pin.element.parentNode) return pin.element.parentNode;
    return pin._manager ? pin._manager.container : null;
  }
  function syncDimensions(pin) {
    if (!pin.element) return false;
    if (pin._renderer) {
      pin._renderer.enqueueMeasure(pin);
      return false;
    }
    return pin.measureLayout();
  }
  function measureLayout(pin) {
    if (!pin.element) return false;
    const width = pin.element.offsetWidth;
    const height = pin.element.offsetHeight;
    if (width > 0 && height > 0) {
      pin.particle.setSize(width, height);
      captureFlowOrigin(pin);
    }
    captureScopeOffset(pin);
    return true;
  }
  function captureScopeOffset(pin) {
    if (!pin.scopeElement) return;
    pin._scopeOffset.x = Number(pin.scopeElement.offsetLeft) || 0;
    pin._scopeOffset.y = Number(pin.scopeElement.offsetTop) || 0;
  }
  function captureFlowOrigin(pin) {
    const parent = pin.parent;
    const isFlow = Boolean(parent && parent.layout && parent.layout !== LAYOUT_MODES.FREE);
    if (!isFlow) {
      pin._flowOrigin = null;
      return;
    }
    if (!pin._flowOrigin) pin._flowOrigin = { x: 0, y: 0 };
    pin._flowOrigin.x = Number(pin.element.offsetLeft) || 0;
    pin._flowOrigin.y = Number(pin.element.offsetTop) || 0;
  }
  function localOrigin(pin) {
    return pin._flowOrigin || pin.particle;
  }
  function globalBoundsOf(pin) {
    const local = pin.particle.getBounds();
    const origin = localOrigin(pin);
    let gx = origin.x;
    let gy = origin.y;
    let curr = pin.parent;
    for (let depth = 0; curr && depth < MAX_DEPTH; depth += 1) {
      const offset = curr._scopeOffset || ORIGIN;
      const pos = localOrigin(curr);
      gx += pos.x + offset.x;
      gy += pos.y + offset.y;
      curr = curr.parent;
    }
    return {
      minX: gx,
      minY: gy,
      maxX: gx + local.width,
      maxY: gy + local.height,
      width: local.width,
      height: local.height,
      centerX: gx + local.width / 2,
      centerY: gy + local.height / 2
    };
  }
  function scopeOriginOf(pin) {
    const bounds = globalBoundsOf(pin);
    const offset = pin._scopeOffset || ORIGIN;
    return { x: bounds.minX + offset.x, y: bounds.minY + offset.y };
  }
  function writeTransform(pin) {
    if (!pin.element || !pin.element.style) return;
    pin.element.style.transform = formatTransform3D(
      pin.particle.x,
      pin.particle.y,
      pin.particle.z
    );
  }

  // pins/traits/base.js
  var DEFAULT_EVENT_TYPE = "message";
  var PinEvent = class extends CustomEvent {
    constructor(type, options = {}) {
      const payload = options.payload !== void 0 ? options.payload : options.data !== void 0 ? options.data : null;
      const extraDetail = options.detail && typeof options.detail === "object" ? options.detail : null;
      super(type || DEFAULT_EVENT_TYPE, {
        bubbles: options.bubbles !== void 0 ? Boolean(options.bubbles) : true,
        cancelable: true,
        detail: {
          ...extraDetail || {},
          payload,
          source: options.source || options.target || null
        }
      });
      this.timestamp = options.timestamp || Date.now();
    }
    get payload() {
      return this.detail ? this.detail.payload : void 0;
    }
    /** Legacy alias for `defaultPrevented`; a cancelled event stops bubbling. */
    get cancelled() {
      return this.defaultPrevented;
    }
  };
  var PIN_SIGNAL_TYPES = Object.freeze([
    "activate",
    "deactivate",
    "select",
    "destroy",
    "drag:start",
    "drag:end",
    "resize:start",
    "resize:end",
    "edit",
    "press"
  ]);
  function emitPinSignal(pin, type, payload = null) {
    if (!pin || typeof pin.dispatchEvent !== "function") return false;
    pin.dispatchEvent(new PinEvent(type, { source: pin, payload, bubbles: false }));
    return true;
  }
  var PinTrait = class {
    constructor(options = {}, fixed = {}) {
      if (fixed.name && options.name && options.name !== fixed.name) {
        throw new Error(
          `PinTrait: "${fixed.name}" is a fixed trait name and cannot be renamed to "${options.name}"`
        );
      }
      this.name = fixed.name || options.name || this.constructor.name.toLowerCase().replace(/trait$/, "");
      this.capabilities = /* @__PURE__ */ new Set([
        ...fixed.capabilities || [],
        ...options.capabilities || []
      ]);
      this.options = options;
      if (typeof options.onAttach === "function") this.onAttach = options.onAttach;
      if (typeof options.onDetach === "function") this.onDetach = options.onDetach;
      if (typeof options.onTick === "function") this.onTick = options.onTick;
      if (typeof options.onRender === "function") this.onRender = options.onRender;
      if (typeof options.onGlobalBuild === "function") this.onGlobalBuild = options.onGlobalBuild;
      if (typeof options.onGlobalUpdate === "function") this.onGlobalUpdate = options.onGlobalUpdate;
      if (typeof options.onActivate === "function") this.onActivate = options.onActivate;
      if (typeof options.onDeactivate === "function") this.onDeactivate = options.onDeactivate;
      if (typeof options.onFocus === "function") this.onFocus = options.onFocus;
      if (typeof options.onUnfocus === "function") this.onUnfocus = options.onUnfocus;
      if (typeof options.onTransmit === "function") this.onTransmit = options.onTransmit;
      if (typeof options.onPointerDown === "function") this.onPointerDown = options.onPointerDown;
      if (typeof options.onPointerMove === "function") this.onPointerMove = options.onPointerMove;
      if (typeof options.onPointerUp === "function") this.onPointerUp = options.onPointerUp;
      if (typeof options.onAction === "function") this.onAction = options.onAction;
    }
    hasCapability(cap) {
      return this.capabilities.has(cap);
    }
    onAttach(pin) {
    }
    onDetach(pin) {
    }
    onTick(pin, dt, context) {
    }
    onRender(pin, contents, element, context) {
    }
    /**
     * Build a global-render trait's persistent SVG subtree, once.
     *
     * The counterpart of a `DisplayTrait`'s `build`, at the group level: the SVG
     * group layer (`../../engine/svg-groups.js`) hands over the trait's own
     * `<g data-trait>` the first time the group is drawn, and this constructs
     * whatever lives inside it - with `h()` (`../../graphics/primitives/element.js`),
     * never `innerHTML` - and returns the live node bindings the update pass writes
     * through. It is called exactly once per group; every subsequent draw is an
     * `onGlobalUpdate`. A trait with no persistent structure returns the bindings
     * it wants to keep (often just `{ host }`).
     *
     * @param {Element} host the trait's `<g>`, already in the SVG layer
     * @param {Pin[]} pins the participating carriers
     * @param {object} context the frame context
     * @returns {object} bindings passed to every {@link onGlobalUpdate}
     */
    onGlobalBuild(host, pins, context) {
      return { host };
    }
    /**
     * Mutate a global-render trait's subtree on a frame its inputs moved.
     *
     * The counterpart of a `DisplayTrait`'s `update`: it runs only when the layer's
     * dirty gate fired (a carrier moved, the trait bumped its `revision`, a
     * dependency changed), and mutates the nodes `onGlobalBuild` returned - through
     * the diffing kit (`setAttr`, `reconcileKeyedList`) so an unchanged node is
     * never rewritten. An idle frame never reaches here at all.
     *
     * @param {object} bindings whatever {@link onGlobalBuild} returned
     * @param {Pin[]} pins the participating carriers
     * @param {object} context the frame context
     */
    onGlobalUpdate(bindings, pins, context) {
    }
    /**
     * Pins this trait's global render reads but does not carry.
     *
     * The SVG group layer redraws a trait when a *carrier* changed; anything else
     * the output is anchored to is invisible to it. A trait that draws to other
     * Pins declares them here and the layer folds them into the same dirty test.
     *
     * Called at most once per Pin per frame, only when no cheaper gate already
     * fired. Return the same array each call (refilled in place) or `null`.
     *
     * @returns {Pin[]|null}
     */
    collectRenderDependencies(pin, context) {
      return null;
    }
    onActivate(pin, context) {
    }
    onDeactivate(pin, context) {
    }
    onFocus(pin, session) {
    }
    onUnfocus(pin, session) {
    }
    onTransmit(pin, event, context) {
    }
    onPointerDown(pin, event, session) {
    }
    onPointerMove(pin, event, session) {
    }
    onPointerUp(pin, event, session) {
    }
  };

  // pins/pin-lifecycle.js
  function initReloadState(pin, options, reload) {
    pin.reload = reload;
    pin.active = options.active !== void 0 ? Boolean(options.active) : reload !== RELOAD_STRATEGIES.LAZY;
    pin.isFocused = false;
    pin._provisioned = pin.active && reload === RELOAD_STRATEGIES.LAZY;
    pin._childrenLoaded = false;
    pin._childrenLoading = null;
    pin.loadChildren = typeof options.loadChildren === "function" ? options.loadChildren : null;
    pin.offload = Boolean(options.offload);
    pin.offloadMargin = typeof options.offloadMargin === "number" ? options.offloadMargin : null;
    pin._offloadDormant = false;
  }
  function activate(pin, context) {
    if (pin.active) return;
    pin.active = true;
    if (pin.reload === RELOAD_STRATEGIES.LAZY) pin._provisioned = true;
    for (const trait of pin.traits.values()) {
      if (typeof trait.onActivate === "function") {
        trait.onActivate(pin, context);
      }
    }
    for (const child of pin.children) {
      if (wakesWithParent(child)) {
        child.activate(context);
      }
    }
    pin._reconcile();
    if (!pin._renderer) pin.render(context);
    provisionChildren(pin, context);
    emitPinSignal(pin, "activate");
  }
  function deactivate(pin, context) {
    if (!pin.active) return;
    pin.active = false;
    for (const trait of pin.traits.values()) {
      if (typeof trait.onDeactivate === "function") {
        trait.onDeactivate(pin, context);
      }
    }
    for (const child of pin.children) {
      child.deactivate(context);
    }
    pin._reconcile();
    emitPinSignal(pin, "deactivate");
  }
  function provisionChildren(pin, context) {
    if (pin.reload !== RELOAD_STRATEGIES.LAZY) return null;
    if (!pin._manager || typeof pin._manager.loadChildrenFor !== "function") return null;
    return pin._manager.loadChildrenFor(pin, context);
  }
  function unload(pin) {
    const removed = pin._manager && typeof pin._manager.removeSubtreeChildren === "function" ? pin._manager.removeSubtreeChildren(pin) : destroyChildren(pin);
    pin._childrenLoaded = false;
    pin._childrenLoading = null;
    pin._provisioned = false;
    pin._reconcile();
    return removed;
  }
  function destroyChildren(pin) {
    const children = Array.from(pin.children);
    for (const child of children) {
      child.destroy();
    }
    pin.children.clear();
    return children.length;
  }
  function reconcile(pin) {
    if (pin._renderer) {
      pin._renderer.reconcile(pin);
      return false;
    }
    return applyReloadMode(pin);
  }
  function setFocused(pin, focused, session) {
    pin.isFocused = Boolean(focused);
    if (pin.element && pin.element.classList) {
      if (pin.isFocused) pin.element.classList.add("is-focused");
      else pin.element.classList.remove("is-focused");
    }
    for (const trait of pin.traits.values()) {
      if (pin.isFocused && typeof trait.onFocus === "function") {
        trait.onFocus(pin, session);
      } else if (!pin.isFocused && typeof trait.onUnfocus === "function") {
        trait.onUnfocus(pin, session);
      }
    }
    if (!pin.isFocused) return;
    pin.activate(session);
    provisionChildren(pin, session);
    for (const child of pin.children) {
      if (wakesWithParent(child)) child.activate(session);
    }
  }
  function destroy(pin) {
    pin.endEdit();
    emitPinSignal(pin, "destroy");
    if (pin.parent) {
      pin.parent.children.delete(pin);
      pin.parent = null;
    }
    for (const child of Array.from(pin.children)) {
      child.destroy();
    }
    pin.children.clear();
    for (const trait of pin.traits.values()) {
      if (typeof trait.onDetach === "function") trait.onDetach(pin);
    }
    pin.traits.clear();
    if (pin._renderer) pin._renderer.forget(pin);
    pin.unmount();
    if (pin._manager) pin._manager.reindexPin(pin);
    return pin;
  }

  // pins/traits/display.js
  var DisplayTrait = class extends PinTrait {
    constructor(options = {}) {
      super(options, {
        name: options.name || "display",
        capabilities: ["renderable"]
      });
      this.displayType = options.displayType || "card";
      this.allowedKeys = options.allowedKeys ? new Set(options.allowedKeys) : null;
      this.customRenderer = typeof options.render === "function" ? options.render : null;
      this.customTemplate = typeof options.build === "function" && typeof options.update === "function" ? { build: options.build, update: options.update } : null;
    }
    validate(contentsMap) {
      if (!contentsMap || !(contentsMap instanceof Map)) {
        return { valid: false, error: "Contents must be an instance of Map" };
      }
      if (this.allowedKeys) {
        for (const key of contentsMap.keys()) {
          if (!this.allowedKeys.has(key)) {
            return { valid: false, error: `Key "${key}" not permitted for DisplayTrait "${this.name}"` };
          }
        }
      }
      return { valid: true };
    }
    /**
     * Render this Pin's contents into its content element.
     *
     * @param {Pin} pin
     * @param {Map<string, *>} contents
     * @param {Element} element the Pin's `.cloudcanvas-pin-content` node
     * @returns {Object|*} the Pin's display state, or the custom renderer's return value
     */
    onRender(pin, contents, element, context) {
      if (!element) return null;
      if (!this.customTemplate && this.customRenderer) {
        return this.customRenderer(pin, contents, element, context);
      }
      const template = this._templateFor(contents);
      const state = this._ensureBuilt(pin, contents, element, template);
      template.update(pin, contents, state.bindings, state.cache);
      return state;
    }
    /** The template this render pass must run: custom pair, markup override, or type table. */
    _templateFor(contents) {
      if (this.customTemplate) return this.customTemplate;
      if (usesHtmlOverride(this.displayType, contents)) return HTML_TEMPLATE;
      return DISPLAY_TEMPLATES[this.displayType] || DEFAULT_TEMPLATE;
    }
    /**
     * Return the Pin's display state, building the subtree first when it is missing
     * or no longer describes what this render needs.
     *
     * A rebuild is triggered by exactly three transitions: no state yet, a display
     * type swap, and the `html` override appearing or disappearing (which is a
     * different subtree shape, not a different value). The content element is
     * compared too, so bindings can never address a replaced node.
     */
    _ensureBuilt(pin, contents, element, template) {
      const signature = this._signature(contents);
      const state = pin._display;
      if (state && state.type === signature && state.element === element) {
        return state;
      }
      const built = {
        type: signature,
        element,
        bindings: template.build(pin, element),
        cache: {}
      };
      pin._display = built;
      return built;
    }
    /** Identity of the built subtree: display type plus markup-override mode. */
    _signature(contents) {
      const base = this.customTemplate ? `custom:${this.name}` : this.displayType;
      return usesHtmlOverride(this.displayType, contents) && !this.customTemplate ? `${base}+html` : base;
    }
    /**
     * Throw away the built subtree so the next render rebuilds it from scratch.
     *
     * The rebuild in `_ensureBuilt` fires on a *signature* change - a type swap or
     * the html override appearing - because those are the only structure changes the
     * built-in templates have: a card is always title-over-body, whatever the values.
     * A `defineComponent` template whose `build` reads the content *shape* (the
     * slotted type builds one region per slot, one line per field) has a fourth kind
     * of change the signature cannot see, since the trait name it keys on is fixed.
     * This is the deliberate escape hatch for exactly that: after rewriting such a
     * Pin's contents to a different shape, discarding the build is what makes the
     * next frame lay out the new regions instead of writing into the old ones.
     *
     * Owned here rather than reached at from outside because `pin._display` is this
     * trait's private render state; `Pin.rebuildDisplay` is the public spelling.
     */
    discardBuild(pin) {
      if (pin && pin._display) pin._display = null;
    }
  };

  // pins/reparent.js
  function reparentPin(pin, newParent, position = {}) {
    if (!pin || newParent === pin) return null;
    if (newParent && descendsFrom(newParent, pin)) return null;
    const oldParent = pin.parent || null;
    if (newParent === oldParent && !newParent) return null;
    const corner2 = pin.getGlobalBounds();
    const canvasX = Number.isFinite(position.x) ? position.x : corner2.minX;
    const canvasY = Number.isFinite(position.y) ? position.y : corner2.minY;
    if (newParent) {
      newParent.addChild(pin);
      settleNewWell(pin, newParent);
      const origin = scopeOriginOf(newParent);
      pin.setPosition(canvasX - origin.x, canvasY - origin.y, pin.z);
    } else {
      if (oldParent) oldParent.removeChild(pin);
      pin.setPosition(canvasX, canvasY, pin.z);
      pin._reconcile();
    }
    notifyOldWell(pin, oldParent);
    return pin;
  }
  function settleNewWell(pin, newParent) {
    const scope = newParent.getOrCreateScopeElement();
    if (!scope || !pin.element) return;
    if (pin.element.parentNode !== scope) scope.appendChild(pin.element);
    syncScopePopulation(newParent);
    captureScopeOffset(newParent);
  }
  function reorderChild(container, pin, beforeSibling = null) {
    if (!container || !pin || pin === beforeSibling) return null;
    if (pin.parent !== container || !container.children.has(pin)) return null;
    if (beforeSibling && !container.children.has(beforeSibling)) return null;
    reorderChildrenSet(container, pin, beforeSibling);
    reorderChildElement(container, pin, beforeSibling);
    return pin;
  }
  function reorderChildrenSet(container, pin, beforeSibling) {
    const ordered = [];
    for (const child of container.children) {
      if (child === pin) continue;
      if (child === beforeSibling) ordered.push(pin);
      ordered.push(child);
    }
    if (!beforeSibling) ordered.push(pin);
    container.children.clear();
    for (const child of ordered) container.children.add(child);
  }
  function reorderChildElement(container, pin, beforeSibling) {
    const scope = container.scopeElement;
    if (!scope || !pin.element) return;
    const ref = beforeSibling && beforeSibling.element && beforeSibling.element.parentNode === scope ? beforeSibling.element : null;
    scope.insertBefore(pin.element, ref);
  }
  function insertionSiblingFor(container, pin, event) {
    const horizontal = container && container.layout === "row";
    const point = horizontal ? event && event.clientX : event && event.clientY;
    if (!Number.isFinite(point)) return null;
    for (const sibling of container.children) {
      if (sibling === pin || !sibling.element) continue;
      const rect = boundsOf(sibling.element);
      if (!rect) continue;
      const mid = horizontal ? (rect.left + rect.right) / 2 : (rect.top + rect.bottom) / 2;
      if (point < mid) return sibling;
    }
    return null;
  }
  function boundsOf(element) {
    if (!element || typeof element.getBoundingClientRect !== "function") return null;
    return element.getBoundingClientRect();
  }
  function descendsFrom(candidate, ancestor) {
    return typeof candidate.ancestors === "function" && candidate.ancestors().includes(ancestor);
  }
  function notifyOldWell(pin, oldParent) {
    if (!oldParent) return;
    const renderer = oldParent._renderer || pin._renderer || null;
    if (renderer && renderer.scopeWells) renderer.scopeWells.invalidate(oldParent);
    else syncScopePopulation(oldParent);
  }

  // engine/hit-test.js
  var PIN_SELECTOR = ".cloudcanvas-pin";
  function droppablePinAt(session, event, options = {}) {
    if (!session || !event) return null;
    const ignore = options.ignore || null;
    for (const element of elementStackAt(event)) {
      const pin = pinFromElement(session, element);
      if (!pin) continue;
      if (ignore && isSelfOrDescendant(pin, ignore)) continue;
      return pin;
    }
    return null;
  }
  function elementStackAt(event) {
    const x = event.clientX;
    const y = event.clientY;
    if (typeof document !== "undefined" && typeof document.elementsFromPoint === "function" && Number.isFinite(x) && Number.isFinite(y)) {
      const stack = document.elementsFromPoint(x, y);
      if (stack && stack.length) return stack;
    }
    return event.target ? [event.target] : [];
  }
  function pinFromElement(session, element) {
    if (!element || typeof element.closest !== "function") return null;
    const pinElement = element.closest(PIN_SELECTOR);
    const id = pinElement ? pinElement.getAttribute("data-pin-id") : null;
    return id ? session.getPin(id) : null;
  }
  function isSelfOrDescendant(pin, subject) {
    if (pin === subject) return true;
    return typeof pin.ancestors === "function" && pin.ancestors().includes(subject);
  }

  // pins/traits/interaction.js
  var CLICK_TRAVEL_PX = 5;
  var DRAG_THRESHOLD_PX = 3;
  var FocussableTrait = class extends PinTrait {
    constructor(options = {}) {
      super(options, {
        name: "focussable",
        capabilities: ["focussable", "zoom-target"]
      });
      this.padding = options.padding !== void 0 ? Number(options.padding) : 50;
      this.maxZoom = options.maxZoom !== void 0 ? Number(options.maxZoom) : 3;
      this.focusOnClick = Boolean(options.focusOnClick);
      this.promote = options.promote !== false;
      this._downX = null;
      this._downY = null;
    }
    /**
     * Record where the gesture started. The session routes pointer events to
     * traits, so focus-on-click needs no DOM listener of its own.
     */
    onPointerDown(pin, event) {
      this._downX = Number.isFinite(event?.clientX) ? event.clientX : null;
      this._downY = Number.isFinite(event?.clientY) ? event.clientY : null;
    }
    /** Focus the Pin when the pointer barely moved between down and up. */
    onPointerUp(pin, event, session) {
      const downX = this._downX;
      const downY = this._downY;
      this._downX = null;
      this._downY = null;
      if (!this.focusOnClick || !session) return;
      if (downX === null || downY === null) return;
      if (!Number.isFinite(event?.clientX) || !Number.isFinite(event?.clientY)) return;
      const dx = event.clientX - downX;
      const dy = event.clientY - downY;
      if (Math.hypot(dx, dy) < CLICK_TRAVEL_PX) {
        session.focus(pin, { promote: this.promote });
      }
    }
    onFocus(pin, session) {
      pin.activate(session ? session.getContext() : {});
    }
    onUnfocus(pin, session) {
    }
  };
  var GRAB_HANDLE_CLASS = "cloudcanvas-grab-handle";
  var DraggableTrait = class extends PinTrait {
    constructor(options = {}) {
      super(options, {
        name: "draggable",
        capabilities: ["interactive", "movable"]
      });
      this.dragging = false;
      this.dragOffset = { x: 0, y: 0 };
      this.reparentOnDrop = options.reparentOnDrop !== false;
      this._downX = null;
      this._downY = null;
      this._translating = false;
      this._grabHandle = null;
      this._onSelect = null;
    }
    /**
     * Start following the Pin's selection through the `select` signal - the exact
     * mechanism `ResizableTrait` uses - and reconcile the grab handle to the Pin's
     * current chrome and selection at once, so a trait added to an already
     * chromeless, already selected Pin shows its handle immediately.
     */
    onAttach(pin) {
      if (typeof pin.addEventListener === "function") {
        this._onSelect = () => this._syncGrabHandle(pin);
        pin.addEventListener("select", this._onSelect);
      }
      this._syncGrabHandle(pin);
    }
    /**
     * Re-run the grab handle's reconcile on every content render.
     *
     * This is the hook a *live* `chrome` toggle arrives through: the chrome setter
     * ends in `invalidate('content')`, so this fires afterwards and adds or removes
     * the handle to match. For a chromed Pin - almost all of them - it is a single
     * flag test and returns, building nothing.
     */
    onRender(pin) {
      this._syncGrabHandle(pin);
    }
    /**
     * Begin a drag - unless the press landed somewhere the platform owns.
     *
     * Two exemptions, drawn by the two predicates in `../pin-element.js` so the
     * pointer router and this trait can never disagree:
     *
     *   - `_ccTextRegion` is written by the pointer router (`TEXT_REGION_FLAG` in
     *     `src/engine/pointer.js`), which is the only layer that can see where in
     *     the document the press landed. Standing down leaves the press to the
     *     platform, so it places a caret and a drag across the text selects it.
     *   - a press on a real control (`isControlTarget`) is the page's: the card
     *     template ships an action button, and a button that moves the card it
     *     sits on is a button nobody can press. This is the same list the router
     *     declines to capture the pointer stream for.
     *
     * The Pin is still draggable by its chrome: the card's padding, its header
     * row, and every part of the shell outside the content node.
     */
    onPointerDown(pin, event, session) {
      if (event && event._ccTextRegion === true) return;
      if (isControlTarget(event ? event.target : null)) return;
      this.dragging = true;
      this._translating = false;
      this._downX = Number.isFinite(event?.clientX) ? event.clientX : null;
      this._downY = Number.isFinite(event?.clientY) ? event.clientY : null;
      if (pin.element && pin.element.classList) {
        pin.element.classList.add("is-dragging");
      }
      const hostRect = session.hostElement.getBoundingClientRect();
      const canvasPos = session.viewport.screenToCanvas(event.clientX, event.clientY, hostRect);
      this.dragOffset = {
        x: canvasPos.x - pin.particle.x,
        y: canvasPos.y - pin.particle.y
      };
    }
    /**
     * Follow the pointer, once it has actually gone somewhere.
     *
     * A press is never perfectly still - a mouse click carries a pixel or two of
     * wobble, and a touch carries more - so translating from the first move makes
     * every click nudge the card. Nothing moves until the press has travelled
     * more than {@link DRAG_THRESHOLD_PX}; after that the gate stays open for the
     * rest of the gesture, so a slow drag does not stutter back through it.
     */
    onPointerMove(pin, event, session) {
      if (!this.dragging) return;
      if (!this._translating && !this._passedThreshold(event)) return;
      if (!this._translating) {
        this._translating = true;
        emitPinSignal(pin, "drag:start", { x: pin.particle.x, y: pin.particle.y });
      }
      const hostRect = session.hostElement.getBoundingClientRect();
      const canvasPos = session.viewport.screenToCanvas(event.clientX, event.clientY, hostRect);
      pin.setPosition(
        canvasPos.x - this.dragOffset.x,
        canvasPos.y - this.dragOffset.y
      );
    }
    /**
     * Whether this move is far enough from the press to be a drag.
     *
     * A press with no recorded origin (a synthetic event carrying no coordinates)
     * is treated as having passed: the threshold exists to absorb wobble, not to
     * become a second way for a drag to be silently dropped.
     */
    _passedThreshold(event) {
      if (this._downX === null || this._downY === null) return true;
      if (!Number.isFinite(event?.clientX) || !Number.isFinite(event?.clientY)) return true;
      return Math.hypot(event.clientX - this._downX, event.clientY - this._downY) > DRAG_THRESHOLD_PX;
    }
    /**
     * End the gesture, and announce the drag if there was one.
     *
     * The signal is emitted last, after the Pin's final `setPosition` has already
     * been applied by the last move, so `detail.payload` is the position the Pin
     * actually came to rest at rather than one frame behind it.
     *
     * A missing event is the cancellation convention: `cancelDrag` and `onDetach`
     * both call this as `onPointerUp(pin)`, and a drag the platform took away is
     * not a drag the user finished.
     *
     * @param {Pin} pin
     * @param {PointerEvent} [event] absent when the drag was cancelled
     * @param {CloudCanvasSession} [session] absent on the cancellation path
     * @returns {boolean} true when `drag:end` was announced
     */
    onPointerUp(pin, event, session) {
      const translated = this._translating;
      this._downX = null;
      this._downY = null;
      this._translating = false;
      if (this.dragging) {
        this.dragging = false;
        if (pin.element && pin.element.classList) {
          pin.element.classList.remove("is-dragging");
        }
      }
      if (!translated) return false;
      this._resolveDrop(pin, event, session);
      return emitPinSignal(pin, "drag:end", {
        x: pin.particle.x,
        y: pin.particle.y,
        cancelled: event === void 0
      });
    }
    /**
     * Reparent the Pin when its release point lands in a different scope.
     *
     * The point handed to `reparentPin` is the Pin's own current canvas-space
     * top-left - the drag already moved it there - so a reparent keeps it exactly
     * where the user let go, with no visible jump. The same hit-test the Sandbox's
     * placement-time container drop uses (`droppablePinAt`) resolves the deepest
     * Pin under the release, skipping the dragged Pin's own subtree.
     *
     * `target === pin.parent` is the regression lock: an ordinary drag that ends
     * over empty root canvas (both null) or back inside its current parent does
     * nothing here, so it stays the plain move the last `onPointerMove` already
     * committed. A cancelled drag (no event) or one routed without a session -
     * `cancelDrag`, `onDetach` - never reparents: it was not a drop.
     *
     * One case intercepts the regression lock: a drop back inside a *flow* container
     * the Pin already belongs to is a reorder, not a no-op. See {@link _resolveReorder}.
     *
     * `reparentOnDrop: false` short-circuits the whole resolution: the Pin keeps
     * the parent and order it had, and the last `onPointerMove` is left as the only
     * effect of the drop - it moved, it did not nest.
     *
     * @returns {boolean} whether the Pin was reparented or reordered
     */
    _resolveDrop(pin, event, session) {
      if (event === void 0 || !session) return false;
      if (!this.reparentOnDrop) return false;
      const target = droppablePinAt(session, event, { ignore: pin });
      if (this._resolveReorder(pin, target, event)) return true;
      if (target === pin.parent) return false;
      const corner2 = pin.getGlobalBounds();
      reparentPin(pin, target, { x: corner2.minX, y: corner2.minY });
      return true;
    }
    /**
     * Reorder the Pin within its own flow container when the drop landed inside it.
     *
     * The trigger is narrow and deliberate: the Pin's parent must be a flow
     * container (`layout !== 'free'`) and the drop target must resolve to that same
     * container - either the well itself (dropped on open space, appended to the
     * end) or one of its direct children (a sibling, inserted before/after by the
     * drop point against that sibling's midpoint on the layout's main axis). A drop
     * that leaves the container falls through to the reparent path; a Pin in a free
     * container never reaches here, so ordinary dragging is untouched.
     *
     * @returns {boolean} whether the Pin was reordered
     */
    _resolveReorder(pin, target, event) {
      const container = pin.parent;
      if (!container || container.layout === "free") return false;
      if (target !== container && (!target || target.parent !== container)) return false;
      reorderChild(container, pin, insertionSiblingFor(container, pin, event));
      return true;
    }
    onDetach(pin) {
      this.onPointerUp(pin);
      if (this._onSelect && typeof pin.removeEventListener === "function") {
        pin.removeEventListener("select", this._onSelect);
      }
      this._onSelect = null;
      this._removeGrabHandle();
    }
    /* ------------------ CHROMELESS GRAB HANDLE ------------------ */
    /**
     * Bring the grab handle into line with the Pin's chrome, its surface and its
     * selection.
     *
     * Existence is gated on {@link _needsGrabHandle}: a chromeless Pin whose own
     * surface is a real control gets a handle, everything else has it removed from
     * the DOM outright (matching how `removeTrait` fully removes resize handles,
     * never just hides them). A chromeless *non*-control - a divider, a bare adopted
     * section - is already draggable by its whole surface and needs nothing. Once it
     * exists, visibility tracks selection through the same `hidden` property the
     * resize handles use.
     *
     * @returns {boolean} whether the handle is now visible
     */
    _syncGrabHandle(pin) {
      if (!this._needsGrabHandle(pin)) {
        this._removeGrabHandle();
        return false;
      }
      const handle = this._ensureGrabHandle(pin);
      if (!handle) return false;
      const visible2 = Boolean(pin.selected);
      handle.hidden = !visible2;
      return visible2;
    }
    /**
     * Whether this Pin needs a grab handle at all: chromeless, with a control for a
     * surface.
     *
     * The feature exists for exactly one situation - `chrome: false` and the Pin's
     * content is a real control (`<button>`, `<input>`, a `data-cc-control` widget)
     * that `onPointerDown` stands down on, leaving nothing to drag by. The control
     * is read as the content node's first element child, which is where every lib
     * widget builds it (`contentEl.replaceChildren(root)`); a chromed Pin, or a
     * chromeless one whose surface is ordinary markup, is draggable already and is
     * skipped. The framework's own root children - the resize handles, this handle -
     * are never mistaken for it, because it looks *inside* the content node only.
     *
     * @returns {boolean}
     */
    _needsGrabHandle(pin) {
      if (!pin || pin.chrome !== false || !pin.element) return false;
      const content = pin.contentElement;
      const surface = content ? content.firstElementChild : null;
      return Boolean(
        surface && typeof surface.matches === "function" && surface.matches(CONTROL_SELECTOR)
      );
    }
    /**
     * Build the handle once, as a direct child of the Pin's *root* - never the
     * content node a display trait rebuilds, and never carrying `data-cc-control`,
     * which is what leaves it a normal drag-initiating surface.
     *
     * @returns {Element|null} the handle, or null in headless mode
     */
    _ensureGrabHandle(pin) {
      if (this._grabHandle) return this._grabHandle;
      if (!pin.element || typeof document === "undefined") return null;
      const handle = document.createElement("div");
      handle.className = GRAB_HANDLE_CLASS;
      handle.setAttribute("aria-hidden", "true");
      handle.hidden = true;
      pin.element.appendChild(handle);
      this._grabHandle = handle;
      return handle;
    }
    /** Take the handle back out of the DOM; a chromed Pin carries none at all. */
    _removeGrabHandle() {
      if (!this._grabHandle) return;
      if (this._grabHandle.parentNode) {
        this._grabHandle.parentNode.removeChild(this._grabHandle);
      }
      this._grabHandle = null;
    }
  };
  var SelectableTrait = class extends PinTrait {
    constructor(options = {}) {
      super(options, {
        name: "selectable",
        capabilities: ["selectable", "focussable"]
      });
      this.selected = Boolean(options.selected);
    }
    onAttach(pin) {
      this.syncClass(pin);
    }
    /**
     * Deselect on the way out, so `removeTrait('selectable')` leaves no residue.
     *
     * Routed through `_apply` rather than clearing the class by hand, for the same
     * reason `DraggableTrait`/`ResizableTrait` route their detach cleanup through
     * `onPointerUp`: the change is announced only when there is genuine state to
     * unwind. A currently-selected Pin fires `select` false - which strips the
     * `is-selected` class *and* lets the selection cursor and any co-attached
     * `Draggable`/`Resizable` handles (which follow the same signal) stand down,
     * instead of being stranded on a Pin that is no longer selectable. An
     * already-deselected Pin is a silent no-op, exactly as `_apply` guarantees.
     */
    onDetach(pin) {
      this._apply(pin, false);
    }
    select(pin) {
      this._apply(pin, true);
    }
    deselect(pin) {
      this._apply(pin, false);
    }
    toggle(pin) {
      this._apply(pin, !this.selected);
      return this.selected;
    }
    /**
     * Set the flag, mirror it into the class list, and announce the change.
     *
     * The signal is what a session-level observer - the selection cursor - reads;
     * it carries the new state as its payload, so a deselect is as visible as a
     * select. An unchanged selection announces nothing.
     */
    _apply(pin, selected) {
      if (this.selected === selected) return false;
      this.selected = selected;
      this.syncClass(pin);
      return emitPinSignal(pin, "select", selected);
    }
    syncClass(pin) {
      if (pin.element && pin.element.classList) {
        if (this.selected) {
          pin.element.classList.add("is-selected");
        } else {
          pin.element.classList.remove("is-selected");
        }
      }
    }
  };
  var PhysicsTrait = class extends PinTrait {
    constructor(options = {}) {
      super(options, {
        name: "physics",
        capabilities: ["dynamic-physics", "floatable"]
      });
      this.floatDrift = options.floatDrift !== void 0 ? Boolean(options.floatDrift) : true;
      this.driftIntensity = options.driftIntensity !== void 0 ? Number(options.driftIntensity) : 0.4;
    }
    onAttach(pin) {
      pin.particle.pinned = false;
    }
    onDetach(pin) {
      pin.particle.pinned = true;
    }
    onTick(pin, dt) {
      if (this.floatDrift && !pin.particle.pinned && pin.active) {
        const primaryVec = pin.particle.getPrimaryVector();
        const time = Date.now() * 2e-3;
        const fx = Math.sin(time + pin.particle.x * 0.01 + primaryVec) * this.driftIntensity;
        const fy = Math.cos(time + pin.particle.y * 0.01 + primaryVec) * this.driftIntensity;
        pin.particle.applyForce(fx * dt, fy * dt);
      }
    }
  };
  function rotatePin(pin, deltaDeg) {
    const current = Number(pin.particle.getPrimaryVector()) || 0;
    const delta = Number(deltaDeg) || 0;
    const angle = ((current + delta) % 360 + 360) % 360;
    pin.setVectors([angle, pin.particle.getVector(1)]);
    pin.setContent("angle", angle);
    return angle;
  }

  // pins/traits/resizable.js
  var RESIZE_DIRECTIONS = Object.freeze(["n", "s", "e", "w", "ne", "nw", "se", "sw"]);
  var RESIZE_HANDLE_ATTR = "data-cc-resize-handle";
  var RESIZE_HANDLE_CLASS = "cloudcanvas-resize-handle";
  var RESIZING_CLASS = "is-resizing";
  var MIN_RESIZE = Object.freeze({ width: 40, height: 24 });
  var DIRECTION_AXES = Object.freeze({
    n: Object.freeze({ x: 0, y: -1 }),
    s: Object.freeze({ x: 0, y: 1 }),
    e: Object.freeze({ x: 1, y: 0 }),
    w: Object.freeze({ x: -1, y: 0 }),
    ne: Object.freeze({ x: 1, y: -1 }),
    nw: Object.freeze({ x: -1, y: -1 }),
    se: Object.freeze({ x: 1, y: 1 }),
    sw: Object.freeze({ x: -1, y: 1 })
  });
  var ResizableTrait = class extends PinTrait {
    constructor(options = {}) {
      super(options, {
        name: "resizable",
        capabilities: ["interactive", "resizable"]
      });
      this.directions = normalizeDirections(options.directions);
      this.minWidth = lowerBound(options.minWidth, MIN_RESIZE.width);
      this.minHeight = lowerBound(options.minHeight, MIN_RESIZE.height);
      this.maxWidth = upperBound(options.maxWidth, this.minWidth);
      this.maxHeight = upperBound(options.maxHeight, this.minHeight);
      this.alwaysVisibleHandles = Boolean(options.alwaysVisibleHandles);
      this.handles = /* @__PURE__ */ new Map();
      this.resizing = false;
      this._downX = null;
      this._downY = null;
      this._sizing = false;
      this._origin = null;
      this._downCanvas = null;
      this._direction = null;
      this._onSelect = null;
    }
    /* ------------------ LIFECYCLE ------------------ */
    /**
     * Build the handles and start following the Pin's selection through the
     * `select` signal (`SelectableTrait._apply` announces it on the Pin, which is
     * an EventTarget) - so nothing here polls.
     */
    onAttach(pin) {
      this._buildHandles(pin);
      this.syncHandles(pin);
      if (typeof pin.addEventListener !== "function") return;
      this._onSelect = () => this.syncHandles(pin);
      pin.addEventListener("select", this._onSelect);
    }
    /**
     * End any live gesture, drop the listener, and take the handles back out of
     * the DOM. `removeTrait('resizable')` must leave no residue at all.
     */
    onDetach(pin) {
      this.onPointerUp(pin);
      if (this._onSelect && typeof pin.removeEventListener === "function") {
        pin.removeEventListener("select", this._onSelect);
      }
      this._onSelect = null;
      for (const handle of this.handles.values()) {
        if (handle.parentNode) handle.parentNode.removeChild(handle);
      }
      this.handles.clear();
    }
    /**
     * Append one handle per direction, as a direct child of the Pin's *root*.
     *
     * Deliberately not the content node, whose subtree a display trait rebuilds -
     * a handle in there vanishes on the first display-type swap - and not the
     * scope container, which holds child Pins and is measured as a well.
     *
     * @returns {number} how many handles this Pin now has
     */
    _buildHandles(pin) {
      if (!pin.element || typeof document === "undefined") return 0;
      for (const direction of this.directions) {
        if (this.handles.has(direction)) continue;
        const handle = document.createElement("div");
        handle.className = RESIZE_HANDLE_CLASS;
        handle.setAttribute(RESIZE_HANDLE_ATTR, direction);
        handle.setAttribute(CONTROL_ATTR, "resize");
        handle.setAttribute("aria-hidden", "true");
        handle.hidden = true;
        pin.element.appendChild(handle);
        this.handles.set(direction, handle);
      }
      return this.handles.size;
    }
    /* ------------------ HANDLE VISIBILITY ------------------ */
    /**
     * Whether the handles should currently be showing: selected-only by default,
     * which is the convention every canvas editor teaches and what keeps an idle
     * canvas clean.
     *
     * A Pin built with `selectable: false` has no selection to follow and needs
     * `alwaysVisibleHandles: true` - a stated requirement rather than a special
     * case, because a trait that guessed here would flip its own answer the moment
     * a SelectableTrait was added after it.
     */
    handlesVisible(pin) {
      if (this.alwaysVisibleHandles || this.resizing) return true;
      return Boolean(pin && pin.selected);
    }
    /**
     * Mirror {@link handlesVisible} onto every handle, through the `hidden`
     * property rather than a class: `[hidden]` is a user-agent rule and the handle
     * declares no `display`, so this holds on a page with no framework CSS at all.
     *
     * @returns {boolean} whether the handles are now visible
     */
    syncHandles(pin) {
      const visible2 = this.handlesVisible(pin);
      for (const handle of this.handles.values()) {
        handle.hidden = !visible2;
      }
      return visible2;
    }
    /* ------------------ GESTURE ------------------ */
    /**
     * Arm a resize, if the press landed on one of *this* trait's handles.
     *
     * The origin box is taken at the press, not at the threshold crossing, for the
     * same reason `DraggableTrait` measures its drag offset there: a box that
     * starts growing from the crossing point lags the pointer by the travel
     * already spent getting there, forever.
     */
    onPointerDown(pin, event, session) {
      const direction = this._directionFor(event);
      if (!direction) return;
      this.resizing = true;
      this._sizing = false;
      this._direction = direction;
      this._downX = Number.isFinite(event?.clientX) ? event.clientX : null;
      this._downY = Number.isFinite(event?.clientY) ? event.clientY : null;
      this._downCanvas = canvasPointOf(session, event);
      this._origin = {
        x: pin.particle.x,
        y: pin.particle.y,
        width: pin.particle.width,
        height: pin.particle.height
      };
      if (pin.element && pin.element.classList) {
        pin.element.classList.add(RESIZING_CLASS);
      }
    }
    /**
     * Follow the pointer, once it has actually gone somewhere. Same threshold and
     * same one-way gate as a drag: nothing changes size until the press travels
     * more than {@link DRAG_THRESHOLD_PX}, and the gate then stays open for the
     * rest of the gesture so a slow resize does not stutter back through it.
     */
    onPointerMove(pin, event, session) {
      if (!this.resizing) return;
      if (!this._sizing && !this._passedThreshold(event)) return;
      if (!this._sizing) {
        this._sizing = true;
        emitPinSignal(pin, "resize:start", {
          width: this._origin.width,
          height: this._origin.height,
          direction: this._direction
        });
      }
      const delta = this._deltaFor(session, event);
      if (!delta) return;
      this._applyBox(pin, this._boxFor(delta));
    }
    /**
     * End the gesture, and announce the resize if there was one.
     *
     * A missing event is `DraggableTrait`'s cancellation convention: a gesture the
     * platform took away is not one the user finished.
     *
     * @param {Pin} pin
     * @param {PointerEvent} [event] absent when the resize was cancelled
     * @returns {boolean} true when `resize:end` was announced
     */
    onPointerUp(pin, event) {
      const resized = this._sizing;
      this._downX = null;
      this._downY = null;
      this._downCanvas = null;
      this._sizing = false;
      if (this.resizing) {
        this.resizing = false;
        this._direction = null;
        if (pin.element && pin.element.classList) {
          pin.element.classList.remove(RESIZING_CLASS);
        }
        this.syncHandles(pin);
      }
      this._origin = null;
      if (!resized) return false;
      return emitPinSignal(pin, "resize:end", {
        width: pin.particle.width,
        height: pin.particle.height,
        cancelled: event === void 0
      });
    }
    /* ------------------ GEOMETRY ------------------ */
    /**
     * The direction of the handle this event landed on, or null. Identity-checked
     * against this trait's own map, so a press on a *child* Pin's handle - a
     * descendant of this element too - resizes only the child it belongs to.
     */
    _directionFor(event) {
      const target = event ? event.target : null;
      if (!target || typeof target.closest !== "function") return null;
      const handle = target.closest(`[${RESIZE_HANDLE_ATTR}]`);
      if (!handle) return null;
      const direction = handle.getAttribute(RESIZE_HANDLE_ATTR);
      return this.handles.get(direction) === handle ? direction : null;
    }
    /**
     * Whether this move is far enough from the press to be a resize. A press with
     * no recorded origin (a synthetic event with no coordinates) is treated as
     * having passed, exactly as in `DraggableTrait`: the threshold absorbs wobble,
     * it is not a second way for a gesture to be dropped.
     */
    _passedThreshold(event) {
      if (this._downX === null || this._downY === null) return true;
      if (!Number.isFinite(event?.clientX) || !Number.isFinite(event?.clientY)) return true;
      return Math.hypot(event.clientX - this._downX, event.clientY - this._downY) > DRAG_THRESHOLD_PX;
    }
    /** Pointer travel since the press, in canvas units. */
    _deltaFor(session, event) {
      const point = canvasPointOf(session, event);
      if (!point || !this._downCanvas) return null;
      return { dx: point.x - this._downCanvas.x, dy: point.y - this._downCanvas.y };
    }
    /** The box this delta asks for, clamped, with the far edges held still. */
    _boxFor({ dx, dy }) {
      const axes = DIRECTION_AXES[this._direction];
      const origin = this._origin;
      const horizontal = resolveAxis(axes.x, origin.width, dx, this.minWidth, this.maxWidth, origin.x);
      const vertical = resolveAxis(axes.y, origin.height, dy, this.minHeight, this.maxHeight, origin.y);
      return {
        x: horizontal.origin,
        y: vertical.origin,
        width: horizontal.size,
        height: vertical.size
      };
    }
    /** Move and size the Pin, skipping the move when the origin did not change. */
    _applyBox(pin, box) {
      if (box.x !== pin.particle.x || box.y !== pin.particle.y) {
        pin.setPosition(box.x, box.y);
      }
      resizePin(pin, box.width, box.height);
      return box;
    }
  };
  function resizePin(pin, width, height) {
    writeElementSize(pin, width, height);
    pin.particle.setSize(width, height);
    pin.invalidate("content");
    return { width, height };
  }
  function writeElementSize(pin, width, height) {
    const style = pin.element ? pin.element.style : null;
    if (!style) return false;
    style.width = `${width}px`;
    style.height = `${height}px`;
    style.maxWidth = "none";
    return true;
  }
  function canvasPointOf(session, event) {
    if (!session || !session.hostElement || !session.viewport) return null;
    if (!Number.isFinite(event?.clientX) || !Number.isFinite(event?.clientY)) return null;
    const hostRect = session.hostElement.getBoundingClientRect();
    return session.viewport.screenToCanvas(event.clientX, event.clientY, hostRect);
  }
  function resolveAxis(axis, start2, delta, min, max, origin) {
    if (axis === 0) return { size: start2, origin };
    const size = clamp(start2 + axis * delta, min, max);
    return { size, origin: axis < 0 ? origin + (start2 - size) : origin };
  }
  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
  function normalizeDirections(value) {
    if (value === void 0 || value === null) return [...RESIZE_DIRECTIONS];
    if (!Array.isArray(value)) {
      throw new TypeError("ResizableTrait: `directions` must be an array of direction strings");
    }
    const chosen = [];
    for (const direction of value) {
      if (DIRECTION_AXES[direction] === void 0) {
        throw new Error(`ResizableTrait: unknown resize direction "${direction}"`);
      }
      if (!chosen.includes(direction)) chosen.push(direction);
    }
    if (chosen.length === 0) {
      throw new Error("ResizableTrait: `directions` cannot be empty");
    }
    return chosen;
  }
  function lowerBound(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : fallback;
  }
  function upperBound(value, lower) {
    const number = Number(value);
    if (!Number.isFinite(number)) return Infinity;
    return Math.max(number, lower);
  }

  // graphics/primitives/element.js
  var SVG_NS = "http://www.w3.org/2000/svg";
  var SVG_TAGS = /* @__PURE__ */ new Set([
    "svg",
    "g",
    "defs",
    "symbol",
    "use",
    "marker",
    "clipPath",
    "mask",
    "pattern",
    "path",
    "rect",
    "circle",
    "ellipse",
    "line",
    "polyline",
    "polygon",
    "text",
    "tspan",
    "textPath",
    "foreignObject",
    "linearGradient",
    "radialGradient",
    "stop",
    "filter",
    "feGaussianBlur",
    "feOffset",
    "feBlend",
    "feColorMatrix",
    "feMerge",
    "feMergeNode",
    "title",
    "desc",
    "image"
  ]);
  function createFor(tag) {
    return SVG_TAGS.has(tag) ? document.createElementNS(SVG_NS, tag) : document.createElement(tag);
  }
  function applyAttr(element, name, value) {
    if (value === null || value === void 0) return;
    if (name === "class" || name === "className") {
      element.setAttribute("class", String(value));
      return;
    }
    if (name === "style") {
      applyStyle(element, value);
      return;
    }
    if (name.length > 2 && name.startsWith("on") && typeof value === "function") {
      element.addEventListener(name.slice(2).toLowerCase(), value);
      return;
    }
    if (typeof value === "boolean") {
      if (value) element.setAttribute(name, "");
      else element.removeAttribute(name);
      return;
    }
    element.setAttribute(name, String(value));
  }
  function applyStyle(element, value) {
    if (typeof value === "string") {
      element.setAttribute("style", value);
      return;
    }
    if (value && typeof value === "object") {
      for (const [property, entry] of Object.entries(value)) {
        if (entry === null || entry === void 0) continue;
        element.style.setProperty(property, String(entry));
      }
    }
  }
  function appendChild(element, child) {
    if (child === null || child === void 0 || child === false || child === true) return;
    if (Array.isArray(child)) {
      for (const entry of child) appendChild(element, entry);
      return;
    }
    if (typeof child === "string" || typeof child === "number") {
      element.appendChild(document.createTextNode(String(child)));
      return;
    }
    if (child && typeof child.nodeType === "number") {
      element.appendChild(child);
    }
  }
  function h(tag, attrs, ...children) {
    const element = createFor(tag);
    if (attrs && typeof attrs === "object") {
      for (const [name, value] of Object.entries(attrs)) applyAttr(element, name, value);
    }
    for (const child of children) appendChild(element, child);
    return element;
  }

  // pins/traits/graph.js
  var TransmitterTrait = class extends PinTrait {
    constructor(options = {}) {
      super(options, {
        name: options.name || "transmitter",
        capabilities: ["transmitter", "event-emitter"]
      });
      this.listeners = /* @__PURE__ */ new Map();
      this.forwardToConnections = Boolean(options.forwardToConnections);
    }
    on(type, handler) {
      if (!this.listeners.has(type)) {
        this.listeners.set(type, /* @__PURE__ */ new Set());
      }
      this.listeners.get(type).add(handler);
      return () => this.off(type, handler);
    }
    off(type, handler) {
      const handlers = this.listeners.get(type);
      if (handlers) {
        handlers.delete(handler);
      }
    }
    emit(pin, typeOrEvent, payload) {
      const evt = typeOrEvent instanceof PinEvent ? typeOrEvent : new PinEvent(typeof typeOrEvent === "string" ? typeOrEvent : "message", { payload, target: pin });
      return pin.transmit(evt);
    }
    onTransmit(pin, event, context) {
      const type = event?.type || "message";
      const handlers = this.listeners.get(type);
      if (handlers) {
        for (const fn of handlers) {
          fn(event, pin, context);
        }
      }
      const wildcardHandlers = this.listeners.get("*");
      if (wildcardHandlers) {
        for (const fn of wildcardHandlers) {
          fn(event, pin, context);
        }
      }
      const pinMap = context?.pinMap || (pin._manager ? pin._manager.pins : null);
      if (this.forwardToConnections && pin.traits.has("connectable") && pinMap) {
        this._relayToConnections(pin, event, { ...context, pinMap });
      }
    }
    /**
     * Forward an event one hop along this pin's connections.
     *
     * Each hop carries a `detail.relayChain` of the pin ids already visited; a pin in
     * that chain is never forwarded to again, so mutual connections terminate instead
     * of recursing forever. Relayed events never bubble - the relay is the propagation.
     */
    _relayToConnections(pin, event, context) {
      const connTrait = pin.traits.get("connectable");
      const relayChain = [...event?.detail?.relayChain || [], pin.id];
      for (const targetId of connTrait.getConnections()) {
        if (relayChain.includes(targetId)) continue;
        const targetPin = context.pinMap.get(targetId);
        if (!targetPin || targetPin === pin) continue;
        targetPin.transmit(new PinEvent(event?.type, {
          payload: event?.payload,
          bubbles: false,
          source: pin,
          timestamp: event?.timestamp,
          detail: { relayChain, relayedBy: pin.id }
        }), context);
      }
    }
  };
  var ScopeTrait = class extends PinTrait {
    constructor(options = {}) {
      super(options, {
        name: "scope",
        capabilities: ["scope-container", "hierarchical-parent"]
      });
    }
    onAttach(pin) {
      pin.getOrCreateScopeElement();
    }
    onActivate(pin, context) {
      for (const child of pin.children) {
        if (!child.lazy) {
          child.activate(context);
        }
      }
    }
    onRender(pin, contents, element, context) {
      const scopeEl = pin.getOrCreateScopeElement();
      if (scopeEl) {
        scopeEl.setAttribute("data-scope-id", pin.id);
      }
    }
  };
  var ConnectableTrait = class extends PinTrait {
    constructor(options = {}) {
      super(options, {
        name: "connectable",
        capabilities: ["connectable", "graph-node", "global-render"]
      });
      this.connections = new Set(options.connections || options.targets || options.connectTo || []);
      this.stroke = options.stroke || "var(--cc-connector, rgba(56, 189, 248, 0.6))";
      this.strokeWidth = options.strokeWidth || 2;
      this.dashed = options.dashed !== void 0 ? options.dashed : true;
      this.revision = 0;
      this._dependencies = [];
    }
    connectTo(targetPinId) {
      const before = this.connections.size;
      this.connections.add(targetPinId);
      if (this.connections.size !== before) this.revision += 1;
    }
    disconnectFrom(targetPinId) {
      if (this.connections.delete(targetPinId)) this.revision += 1;
    }
    getConnections() {
      return Array.from(this.connections);
    }
    isConnectedTo(targetPinId) {
      return this.connections.has(targetPinId);
    }
    /**
     * The Pins at the far end of this Pin's connections.
     *
     * A connector is drawn between two boxes, but only one of them carries the
     * trait, so the SVG group layer's carrier scan cannot see the other move. A
     * target that is re-measured - a scope well growing around it after the first
     * paint, say - changes this connector's geometry and nothing else's, and this
     * is how the layer is told (see `SvgGroupLayer` dependency gate).
     *
     * @returns {Pin[]|null} the owned scratch list, valid until the next call
     */
    collectRenderDependencies(pin, context) {
      const pinMap = context ? context.pinMap : null;
      if (!pinMap || this.connections.size === 0) return null;
      const dependencies = this._dependencies;
      dependencies.length = 0;
      for (const targetId of this.connections) {
        const target = pinMap.get(targetId);
        if (target && target !== pin) dependencies.push(target);
      }
      return dependencies;
    }
    /**
     * The connector group's persistent container.
     *
     * There is no fixed structure to build - the paths come and go with the
     * connections - so the build pass only hands the host `<g>` forward. Every
     * actual `<path>` is created, moved and removed by the keyed reconcile in
     * {@link onGlobalUpdate}, which is where the build/update discipline lives for
     * a variable-length child list.
     */
    onGlobalBuild(host, pinsWithThisTrait, globalContext) {
      return { host };
    }
    /**
     * Reconcile one `<path>` per connection whose *both* endpoints take part in the
     * current render root.
     *
     * This replaces the old re-stringify: instead of rebuilding the group's markup
     * every dirty frame, the desired connectors are collected as keyed items and
     * `reconcileKeyedList` reuses the `<path>` already holding each source->target
     * key, creating one only for a genuinely new connection and removing the paths
     * whose connection is gone. A path that stayed has only its `d` and stroke
     * attributes re-set, and only when they moved.
     *
     * The layer has already filtered the source Pins it hands over; the targets are
     * resolved here, from the pin map, so the same participation test is applied
     * again - otherwise a promoted subtree would trail connectors out to Pins that
     * are no longer in the document.
     */
    onGlobalUpdate(bindings, pinsWithThisTrait, globalContext) {
      const host = bindings.host;
      const pinMap = globalContext.pinMap;
      if (!host) return;
      const participates = typeof globalContext.participates === "function" ? globalContext.participates : null;
      reconcileKeyedList(host, pinMap ? this._connectorItems(pinsWithThisTrait, pinMap, participates) : [], {
        key: (item) => item.key,
        create: () => h("path", { fill: "none", "vector-effect": "non-scaling-stroke" }),
        update: (node, item) => this._writeConnector(node, item)
      });
    }
    /**
     * The connectors to draw this frame, one item per participating source->target
     * pair, each carrying the geometry and the drawing Pin's own stroke options.
     *
     * A fresh array per dirty frame is deliberate: this runs only when the layer's
     * gate has already decided the group changed, never on an idle frame, so it is
     * off the allocation-free path the idle gate protects (unlike
     * `collectRenderDependencies`, which does run idle and refills in place).
     */
    _connectorItems(pinsWithThisTrait, pinMap, participates) {
      const items = [];
      for (const sourcePin of pinsWithThisTrait) {
        const connTrait = sourcePin.traits.get(this.name);
        if (!connTrait || connTrait.connections.size === 0) continue;
        const p1 = sourcePin.getGlobalBounds();
        for (const targetId of connTrait.connections) {
          const targetPin = pinMap.get(targetId);
          if (!targetPin) continue;
          if (participates && !participates(targetPin)) continue;
          const p2 = targetPin.getGlobalBounds();
          items.push({
            key: `${sourcePin.id}->${targetId}`,
            d: connectorPathData(p1.centerX, p1.centerY, p2.centerX, p2.centerY),
            stroke: safeColor(connTrait.stroke, "var(--cc-connector, rgba(56, 189, 248, 0.6))"),
            strokeWidth: safeNumber(connTrait.strokeWidth || 2, 2),
            dashed: connTrait.dashed
          });
        }
      }
      return items;
    }
    /**
     * Write one connector item into its `<path>`, each attribute only when it moved.
     *
     * The per-node cache is stamped on the element itself (`_ccConnector`), so it
     * survives the reconciler reusing, moving or reattaching the node and needs no
     * parallel map. `stroke-dasharray` is `none` for a solid connector - the same
     * value the string generator emitted - so the dashed/solid switch is a real
     * attribute change rather than a removed attribute.
     */
    _writeConnector(node, item) {
      const cache = node._ccConnector || (node._ccConnector = {});
      const dash = item.dashed ? "6,4" : "none";
      if (cache.d !== item.d) {
        cache.d = item.d;
        node.setAttribute("d", item.d);
      }
      if (cache.stroke !== item.stroke) {
        cache.stroke = item.stroke;
        node.setAttribute("stroke", item.stroke);
      }
      if (cache.strokeWidth !== item.strokeWidth) {
        cache.strokeWidth = item.strokeWidth;
        node.setAttribute("stroke-width", String(item.strokeWidth));
      }
      if (cache.dash !== dash) {
        cache.dash = dash;
        node.setAttribute("stroke-dasharray", dash);
      }
    }
  };

  // engine/motion-hint.js
  var MOVING_CLASS = "cc-moving";
  var MOVING_IDLE_FRAMES = 30;
  var MotionHintSet = class {
    constructor(idleFrames = MOVING_IDLE_FRAMES) {
      this.idleFrames = idleFrames;
      this._moving = /* @__PURE__ */ new Map();
    }
    get size() {
      return this._moving.size;
    }
    has(pin) {
      return this._moving.has(pin);
    }
    /** Promise the compositor a layer for as long as this Pin keeps moving. */
    mark(pin, frameCount) {
      if (!this._moving.has(pin) && pin.element && pin.element.classList) {
        pin.element.classList.add(MOVING_CLASS);
      }
      this._moving.set(pin, frameCount);
      return true;
    }
    /**
     * Withdraw the hint from every Pin that has been still long enough. Only Pins
     * that moved recently are visited, so a static canvas pays nothing for this.
     *
     * @returns {number} how many hints were withdrawn
     */
    sweep(frameCount) {
      if (this._moving.size === 0) return 0;
      let swept = 0;
      for (const [pin, lastFrame] of this._moving) {
        if (frameCount - lastFrame < this.idleFrames) continue;
        if (pin.element && pin.element.classList) pin.element.classList.remove(MOVING_CLASS);
        this._moving.delete(pin);
        swept += 1;
      }
      return swept;
    }
    delete(pin) {
      return this._moving.delete(pin);
    }
    clear() {
      this._moving.clear();
    }
  };

  // graphics/vectorizer.js
  function simplifyPoints(points, tolerance = 1.5) {
    if (!Array.isArray(points) || points.length <= 2) return points ? [...points] : [];
    if (tolerance <= 0) return [...points];
    const sqTolerance = tolerance * tolerance;
    function getSqSegDist(p, p1, p2) {
      let x = p1.x;
      let y = p1.y;
      let dx = p2.x - x;
      let dy = p2.y - y;
      if (dx !== 0 || dy !== 0) {
        const t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);
        if (t > 1) {
          x = p2.x;
          y = p2.y;
        } else if (t > 0) {
          x += dx * t;
          y += dy * t;
        }
      }
      dx = p.x - x;
      dy = p.y - y;
      return dx * dx + dy * dy;
    }
    function simplifyDPStep(pts, first, last, sqTol, simplified2) {
      let maxSqDist = sqTol;
      let index = -1;
      for (let i = first + 1; i < last; i += 1) {
        const sqDist = getSqSegDist(pts[i], pts[first], pts[last]);
        if (sqDist > maxSqDist) {
          index = i;
          maxSqDist = sqDist;
        }
      }
      if (index !== -1) {
        if (index - first > 1) simplifyDPStep(pts, first, index, sqTol, simplified2);
        simplified2.push(pts[index]);
        if (last - index > 1) simplifyDPStep(pts, index, last, sqTol, simplified2);
      }
    }
    const simplified = [points[0]];
    simplifyDPStep(points, 0, points.length - 1, sqTolerance, simplified);
    simplified.push(points[points.length - 1]);
    return simplified;
  }
  function vectorizeStroke(rawPoints, options = {}) {
    if (!Array.isArray(rawPoints) || rawPoints.length === 0) return "";
    const precision = typeof options.precision === "number" ? options.precision : 2;
    const fmt = (n2) => Number(n2).toFixed(precision);
    const normalized = [];
    for (const pt of rawPoints) {
      if (pt && typeof pt === "object") {
        const x = Number(pt.x !== void 0 ? pt.x : pt[0]);
        const y = Number(pt.y !== void 0 ? pt.y : pt[1]);
        if (Number.isFinite(x) && Number.isFinite(y)) {
          normalized.push({ x, y });
        }
      }
    }
    if (normalized.length === 0) return "";
    if (normalized.length === 1) {
      const p = normalized[0];
      return `M ${fmt(p.x)} ${fmt(p.y)} L ${fmt(p.x + 0.1)} ${fmt(p.y + 0.1)}`;
    }
    const tolerance = options.tolerance !== void 0 ? Number(options.tolerance) : 1.5;
    const points = tolerance > 0 && normalized.length > 2 ? simplifyPoints(normalized, tolerance) : normalized;
    if (points.length === 2) {
      const p0 = points[0];
      const p1 = points[1];
      return `M ${fmt(p0.x)} ${fmt(p0.y)} L ${fmt(p1.x)} ${fmt(p1.y)}`;
    }
    const closed = Boolean(options.closed);
    const tension = typeof options.smoothing === "number" ? options.smoothing : 0.25;
    const n = points.length;
    let d = `M ${fmt(points[0].x)} ${fmt(points[0].y)}`;
    const numSegments = closed ? n : n - 1;
    for (let i = 0; i < numSegments; i += 1) {
      const p0 = closed ? points[(i - 1 + n) % n] : i === 0 ? points[0] : points[i - 1];
      const p1 = points[i];
      const p2 = closed ? points[(i + 1) % n] : points[i + 1];
      const p3 = closed ? points[(i + 2) % n] : i + 2 < n ? points[i + 2] : p2;
      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;
      d += ` C ${fmt(cp1x)} ${fmt(cp1y)}, ${fmt(cp2x)} ${fmt(cp2y)}, ${fmt(p2.x)} ${fmt(p2.y)}`;
    }
    if (closed) d += " Z";
    return d;
  }
  function vectorizeContour(radii, cx = 100, cy = 100, options = {}) {
    if (!radii || radii.length < 3) return "";
    const n = radii.length;
    const points = [];
    const angleStep = Math.PI * 2 / n;
    for (let i = 0; i < n; i += 1) {
      const angle = i * angleStep;
      const r = Math.max(0, Number(radii[i]) || 0);
      points.push({
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle)
      });
    }
    return vectorizeStroke(points, {
      ...options,
      tolerance: 0,
      // Preserve exact radial angular resolution
      closed: true
    });
  }
  function normalizePathTopology(pathOrPoints, targetSegments = 16, options = {}) {
    const segCount = Math.max(4, Number(targetSegments) || 16);
    const cx = Number(options.cx !== void 0 ? options.cx : 100);
    const cy = Number(options.cy !== void 0 ? options.cy : 100);
    const rDefault = Number(options.defaultRadius || 50);
    if (Array.isArray(pathOrPoints) && pathOrPoints.length >= 3) {
      const resampled = [];
      const srcLen = pathOrPoints.length;
      for (let i = 0; i < segCount; i += 1) {
        const srcIdx = i / segCount * srcLen;
        const baseIdx = Math.floor(srcIdx);
        const frac = srcIdx - baseIdx;
        const p1 = pathOrPoints[baseIdx % srcLen];
        const p2 = pathOrPoints[(baseIdx + 1) % srcLen];
        resampled.push({
          x: p1.x + (p2.x - p1.x) * frac,
          y: p1.y + (p2.y - p1.y) * frac
        });
      }
      return vectorizeStroke(resampled, { ...options, tolerance: 0, closed: true });
    }
    if (typeof pathOrPoints === "string" && pathOrPoints.trim().length > 0) {
      const numbers = pathOrPoints.match(/-?\d+(?:\.\d+)?/g);
      if (numbers && numbers.length >= 6) {
        const parsedPoints = [];
        for (let i = 0; i < numbers.length - 1; i += 2) {
          parsedPoints.push({
            x: parseFloat(numbers[i]),
            y: parseFloat(numbers[i + 1])
          });
        }
        if (parsedPoints.length >= 3) {
          return normalizePathTopology(parsedPoints, segCount, options);
        }
      }
    }
    const radii = new Float32Array(segCount).fill(rDefault);
    return vectorizeContour(radii, cx, cy, options);
  }

  // pins/traits/svg-state.js
  var SVG_STATE_WRAPPER_CLASS = "cloudcanvas-svg-state-wrapper";
  var SVG_STATE_HOST_CLASS = "cloudcanvas-svg-state-host";
  var SVG_STATE_PATH_CLASS = "cloudcanvas-svg-state-path";
  var DEFAULT_TRANSITION_DURATION = 350;
  var DEFAULT_TRANSITION_EASING = "cubic-bezier(0.16, 1, 0.3, 1)";
  var SvgStateTrait = class extends PinTrait {
    constructor(options = {}) {
      super(options, {
        name: options.name || "svg-state",
        capabilities: ["svg-state", "renderable", "transformable-3d"]
      });
      this.viewBox = options.viewBox || "0 0 200 200";
      this.perspective = Number(options.perspective) || 800;
      this.rx = Number(options.rx) || 0;
      this.ry = Number(options.ry) || 0;
      this.rz = Number(options.rz) || 0;
      this.depth = Number(options.depth) || 0;
      this.duration = typeof options.duration === "number" ? options.duration : DEFAULT_TRANSITION_DURATION;
      this.easing = options.easing || DEFAULT_TRANSITION_EASING;
      this.normalizeSegments = typeof options.normalizeSegments === "number" ? options.normalizeSegments : 0;
      this.bindVector = typeof options.bindVector === "number" ? options.bindVector : null;
      this.states = /* @__PURE__ */ new Map();
      const rawStates = options.states && typeof options.states === "object" ? options.states : {};
      for (const [key, state] of Object.entries(rawStates)) {
        this.states.set(key, this._normalizeStateDef(state));
      }
      if (this.states.size === 0) {
        const defaultPath = this.normalizeSegments > 0 ? normalizePathTopology("", this.normalizeSegments, { cx: 100, cy: 100, defaultRadius: 50 }) : "M 100 50 A 50 50 0 1 0 100 150 A 50 50 0 1 0 100 50 Z";
        this.states.set("default", {
          d: defaultPath,
          fill: "var(--cc-surface-2, rgba(56, 189, 248, 0.15))",
          stroke: "var(--cc-accent, #38bdf8)",
          strokeWidth: 2,
          transform: "none"
        });
      }
      const stateKeys = Array.from(this.states.keys());
      this.currentState = options.initialState && this.states.has(options.initialState) ? options.initialState : stateKeys[0];
    }
    /**
     * Normalize an incoming state definition and pre-align path topology if requested.
     */
    _normalizeStateDef(state) {
      if (!state || typeof state !== "object") {
        return { d: "", fill: "none", stroke: "currentColor", strokeWidth: 2 };
      }
      let d = state.d || "";
      if (this.normalizeSegments > 0 && d) {
        d = normalizePathTopology(d, this.normalizeSegments, { cx: 100, cy: 100 });
      }
      return {
        d,
        fill: state.fill !== void 0 ? state.fill : "var(--cc-surface-2, rgba(56, 189, 248, 0.15))",
        stroke: state.stroke !== void 0 ? state.stroke : "var(--cc-accent, #38bdf8)",
        strokeWidth: state.strokeWidth !== void 0 ? state.strokeWidth : 2,
        strokeDasharray: state.strokeDasharray || "none",
        strokeDashoffset: state.strokeDashoffset !== void 0 ? state.strokeDashoffset : 0,
        opacity: state.opacity !== void 0 ? state.opacity : 1,
        transform: state.transform || "none",
        filter: state.filter || "",
        bloom: state.bloom !== void 0 ? state.bloom : false
      };
    }
    /**
     * Mount the 3D perspective wrapper and SVG element inside the Pin's content element.
     */
    onAttach(pin) {
      const content = pin.contentElement || (pin.getContentElement ? pin.getContentElement() : null);
      if (!content) return;
      const pathNode = h("path", {
        class: SVG_STATE_PATH_CLASS,
        "vector-effect": "non-scaling-stroke"
      });
      const defsNode = h("defs", {});
      const svgNode = h("svg", {
        class: SVG_STATE_HOST_CLASS,
        viewBox: this.viewBox,
        preserveAspectRatio: "xMidYMid meet"
      }, [defsNode, pathNode]);
      const wrapper = h("div", {
        class: SVG_STATE_WRAPPER_CLASS,
        style: `perspective: ${this.perspective}px; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; overflow: visible;`
      }, [svgNode]);
      content.appendChild(wrapper);
      const bindings = {
        wrapper,
        svg: svgNode,
        defs: defsNode,
        path: pathNode,
        cleanupTimer: null
      };
      pin._svgStateBindings = bindings;
      const onTransitionEnd = () => {
        this._clearCompositorHint(pin);
        pin.dispatchEvent(new PinEvent("svg:transitionend", {
          source: pin,
          payload: { state: this.currentState },
          detail: { state: this.currentState }
        }));
      };
      pathNode.addEventListener("transitionend", onTransitionEnd);
      bindings._onTransitionEnd = onTransitionEnd;
      this._applyStateToDOM(pin, this.currentState, true);
      this.setTransform3D(pin, { rx: this.rx, ry: this.ry, rz: this.rz, depth: this.depth });
    }
    /**
     * Teardown DOM and listeners on trait detach.
     */
    onDetach(pin) {
      const bindings = pin._svgStateBindings;
      if (!bindings) return;
      if (bindings.cleanupTimer) {
        clearTimeout(bindings.cleanupTimer);
        bindings.cleanupTimer = null;
      }
      if (bindings.path && bindings._onTransitionEnd) {
        bindings.path.removeEventListener("transitionend", bindings._onTransitionEnd);
      }
      if (bindings.wrapper && bindings.wrapper.parentNode) {
        bindings.wrapper.parentNode.removeChild(bindings.wrapper);
      }
      this._clearCompositorHint(pin);
      pin._svgStateBindings = null;
    }
    /**
     * Set 3D perspective orientation on the SVG host.
     */
    setTransform3D(pin, { rx, ry, rz, depth } = {}) {
      if (rx !== void 0) this.rx = Number(rx) || 0;
      if (ry !== void 0) this.ry = Number(ry) || 0;
      if (rz !== void 0) this.rz = Number(rz) || 0;
      if (depth !== void 0) this.depth = Number(depth) || 0;
      const bindings = pin._svgStateBindings;
      if (!bindings || !bindings.svg) return;
      const transform3d = `translateZ(${this.depth}px) rotateX(${this.rx}deg) rotateY(${this.ry}deg) rotateZ(${this.rz}deg)`;
      bindings.svg.style.transform = transform3d;
    }
    /**
     * Smoothly transition to a named vector state using CSS transitions and GPU compositing.
     *
     * @param {Pin} pin
     * @param {string} stateName Target state key
     * @param {Object} [options]
     * @param {number} [options.duration] Override transition duration
     * @param {string} [options.easing] Override transition easing
     * @param {boolean} [options.immediate=false] Skip transition if true
     * @returns {boolean} True if transition was initiated
     */
    transitionTo(pin, stateName, options = {}) {
      if (!this.states.has(stateName)) return false;
      const previousState = this.currentState;
      this.currentState = stateName;
      const immediate = options.immediate || prefersReducedMotion();
      this._applyStateToDOM(pin, stateName, immediate, options);
      const eventPayload = {
        from: previousState,
        to: stateName,
        state: this.states.get(stateName)
      };
      pin.dispatchEvent(new PinEvent("svg:statechange", {
        source: pin,
        payload: eventPayload,
        detail: eventPayload
      }));
      return true;
    }
    /**
     * Directly morph the current SVG path geometry with a new path string.
     */
    applyContour(pin, pathData, options = {}) {
      const bindings = pin._svgStateBindings;
      if (!bindings || !bindings.path) return;
      let d = pathData;
      if (this.normalizeSegments > 0) {
        d = normalizePathTopology(d, this.normalizeSegments, { cx: 100, cy: 100 });
      }
      const immediate = options.immediate || prefersReducedMotion();
      if (!immediate) {
        this._grantCompositorHint(pin);
      }
      bindings.path.setAttribute("d", d);
      bindings.path.style.d = `path("${d}")`;
    }
    /**
     * Apply a state's presentation properties to the DOM nodes.
     */
    _applyStateToDOM(pin, stateName, immediate = false, options = {}) {
      const bindings = pin._svgStateBindings;
      if (!bindings || !bindings.path) return;
      const state = this.states.get(stateName);
      if (!state) return;
      const path = bindings.path;
      const duration = typeof options.duration === "number" ? options.duration : this.duration;
      const easing = options.easing || this.easing;
      if (immediate) {
        path.style.transition = "none";
        this._clearCompositorHint(pin);
      } else {
        path.style.transition = `d ${duration}ms ${easing}, transform ${duration}ms ${easing}, fill ${duration}ms ease, stroke ${duration}ms ease, stroke-width ${duration}ms ease, filter ${duration}ms ease`;
        this._grantCompositorHint(pin);
        if (bindings.cleanupTimer) clearTimeout(bindings.cleanupTimer);
        bindings.cleanupTimer = setTimeout(() => {
          this._clearCompositorHint(pin);
          bindings.cleanupTimer = null;
        }, duration + 80);
      }
      if (state.d) {
        path.setAttribute("d", state.d);
        path.style.d = `path("${state.d}")`;
      }
      path.setAttribute("fill", state.fill);
      path.setAttribute("stroke", state.stroke);
      path.setAttribute("stroke-width", String(state.strokeWidth));
      path.setAttribute("stroke-dasharray", state.strokeDasharray);
      path.setAttribute("stroke-dashoffset", String(state.strokeDashoffset));
      path.setAttribute("opacity", String(state.opacity));
      if (state.transform && state.transform !== "none") {
        path.style.transform = state.transform;
      } else {
        path.style.transform = "";
      }
      let filterString = state.filter || "";
      if (state.bloom) {
        const bloomIntensity = typeof state.bloom === "number" ? state.bloom : 1;
        const bloomFilter = `drop-shadow(0 0 ${4 * bloomIntensity}px ${state.stroke}) drop-shadow(0 0 ${12 * bloomIntensity}px ${state.fill})`;
        filterString = filterString ? `${filterString} ${bloomFilter}` : bloomFilter;
      }
      path.style.filter = filterString;
    }
    /**
     * Grant GPU compositor layer hint to pin element.
     */
    _grantCompositorHint(pin) {
      if (pin.element && pin.element.classList) {
        pin.element.classList.add(MOVING_CLASS);
      }
    }
    /**
     * Retire GPU compositor layer hint from pin element to avoid VRAM leaks.
     */
    _clearCompositorHint(pin) {
      if (pin.element && pin.element.classList) {
        pin.element.classList.remove(MOVING_CLASS);
      }
    }
    /**
     * Frame tick handler: optionally maps bound particle vectors to 3D rotation or state.
     */
    onTick(pin, dt, context) {
      if (this.bindVector === null || !pin.particle || !pin.particle.vectors) return;
      const val = pin.particle.getVector(this.bindVector);
      if (typeof val === "number") {
        this.ry = val * 45 % 360;
        this.setTransform3D(pin, { ry: this.ry });
      }
    }
  };

  // pins/traits/registry.js
  function mergeOptions(defaults = {}, options = {}) {
    const merged = { ...defaults, ...options };
    if (Array.isArray(defaults.capabilities) || Array.isArray(options.capabilities)) {
      merged.capabilities = [
        ...defaults.capabilities || [],
        ...options.capabilities || []
      ];
    }
    return merged;
  }
  var TraitRegistry = class {
    constructor() {
      this._definitions = /* @__PURE__ */ new Map();
      this._defaultProviders = /* @__PURE__ */ new Set();
      this._initDefaults();
    }
    _initDefaults() {
      this.register("card", DisplayTrait, { name: "card", displayType: "card" });
      this.register("vector-pointer", DisplayTrait, { name: "vector-pointer", displayType: "vector-pointer" });
      this.register("media", DisplayTrait, { name: "media", displayType: "media" });
      this.register("raw", DisplayTrait, { name: "raw", displayType: "raw" });
      this.register(PRESERVE_TYPE, DisplayTrait, { name: PRESERVE_TYPE, displayType: PRESERVE_TYPE });
      this.register("draggable", DraggableTrait);
      this.register("selectable", SelectableTrait);
      this.register("resizable", ResizableTrait);
      this.register("physics", PhysicsTrait);
      this.register("connectable", ConnectableTrait);
      this.register("focussable", FocussableTrait);
      this.register("scope", ScopeTrait);
      this.register("transmitter", TransmitterTrait);
      this.register("svg-state", SvgStateTrait);
    }
    /**
     * Register a trait definition. Names are unique: re-registering an existing
     * name throws rather than silently replacing a definition other code depends on.
     *
     * @returns {TraitDefinition}
     */
    register(name, ctor, defaults = {}) {
      if (typeof name !== "string" || name.length === 0) {
        throw new Error("TraitRegistry.register: name must be a non-empty string");
      }
      if (typeof ctor !== "function") {
        throw new Error(`TraitRegistry.register: "${name}" requires a trait constructor`);
      }
      if (this._definitions.has(name)) {
        throw new Error(`TraitRegistry.register: "${name}" is already registered`);
      }
      const definition = { name, ctor, defaults };
      this._definitions.set(name, definition);
      return definition;
    }
    /**
     * Instantiate a registered trait. Each call returns a distinct instance.
     */
    create(name, options = {}) {
      const definition = this._definitions.get(name);
      if (!definition) {
        throw new Error(`Unknown trait: ${name}`);
      }
      return new definition.ctor(mergeOptions(definition.defaults, options));
    }
    /** The definition registered under `name`, or undefined. */
    get(name) {
      return this._definitions.get(name);
    }
    has(name) {
      return this._definitions.has(name);
    }
    unregister(name) {
      return this._definitions.delete(name);
    }
    /** @returns {TraitDefinition[]} */
    list() {
      return Array.from(this._definitions.values());
    }
    /**
     * Adopt an external provider of built-in definitions and run it now.
     * Providers are replayed by `clear()`, so what they register is a built-in in
     * every sense that matters.
     */
    registerDefaults(provider) {
      if (typeof provider !== "function") {
        throw new Error("TraitRegistry.registerDefaults: provider must be a function");
      }
      this._defaultProviders.add(provider);
      provider(this);
      return this;
    }
    /** Drop every custom definition and restore the built-in set. */
    clear() {
      this._definitions.clear();
      this._initDefaults();
      for (const provider of this._defaultProviders) {
        provider(this);
      }
    }
  };
  var traitRegistry = new TraitRegistry();

  // pins/traits/define-component.js
  function defineComponent(spec = {}) {
    const { name, build, update } = spec;
    if (typeof name !== "string" || name.length === 0) {
      throw new TypeError("defineComponent: name must be a non-empty string");
    }
    if (typeof build !== "function" || typeof update !== "function") {
      throw new TypeError(`defineComponent: "${name}" requires both build() and update()`);
    }
    const registry = spec.registry || traitRegistry;
    registry.register(name, DisplayTrait, traitDefaults(spec));
    return Object.freeze({
      name,
      createTrait: (options = {}) => registry.create(name, { ...options, ...identity(spec) })
    });
  }
  function identity(spec) {
    return { name: spec.name, build: spec.build, update: spec.update };
  }
  function traitDefaults(spec) {
    const defaults = {
      ...spec.defaults || {},
      name: spec.name,
      displayType: spec.defaults && spec.defaults.displayType || spec.name,
      build: spec.build,
      update: spec.update
    };
    if (spec.allowedKeys !== void 0) defaults.allowedKeys = spec.allowedKeys;
    if (spec.chrome !== void 0) defaults.chrome = spec.chrome;
    return defaults;
  }

  // pins/traits/blueprint-compiler.js
  function compileBlueprint(blueprint, componentName, actions = {}) {
    const bindingDescriptors = [];
    const rootSpecs = Array.isArray(blueprint[0]) && typeof blueprint[0][0] === "string" ? blueprint : [blueprint];
    function parseNode(spec, bindingsList, pin) {
      if (typeof spec === "string") {
        const textNode = document.createTextNode(spec);
        return textNode;
      }
      if (!Array.isArray(spec) || spec.length === 0) {
        throw new TypeError(`compileBlueprint: invalid node spec "${JSON.stringify(spec)}"`);
      }
      const [tagAndClass, propsOrChild, ...restChildren] = spec;
      const parts = (tagAndClass || "div").split(".");
      const tag = parts[0] || "div";
      const classNames = parts.slice(1);
      const el = document.createElement(tag);
      for (const c of classNames) {
        el.classList.add(`${componentName}-${c}`);
      }
      let props = {};
      let children = [];
      if (propsOrChild && typeof propsOrChild === "object" && !Array.isArray(propsOrChild)) {
        props = propsOrChild;
        children = restChildren;
      } else if (propsOrChild !== void 0) {
        children = [propsOrChild, ...restChildren];
      }
      if (props.attrs) {
        for (const [k, v] of Object.entries(props.attrs)) {
          if (typeof v === "string" && v.startsWith("$")) {
            const key = v.slice(1);
            const index = bindingsList.length;
            bindingsList.push(el);
            bindingDescriptors.push({ type: "attr", attrName: k, key, index });
          } else {
            el.setAttribute(k, String(v));
          }
        }
      }
      if (props.text !== void 0) {
        if (typeof props.text === "string" && props.text.startsWith("$")) {
          const key = props.text.slice(1);
          const textNode = document.createTextNode("");
          el.appendChild(textNode);
          const index = bindingsList.length;
          bindingsList.push(textNode);
          bindingDescriptors.push({ type: "text", key, index });
        } else {
          el.appendChild(document.createTextNode(String(props.text)));
        }
      }
      if (props.class !== void 0 && typeof props.class === "string" && props.class.startsWith("$")) {
        const key = props.class.slice(1);
        const index = bindingsList.length;
        bindingsList.push(el);
        bindingDescriptors.push({
          type: "class",
          key,
          baseClass: `${componentName}-${classNames[0] || "elem"}`,
          index
        });
      }
      if (props.style && typeof props.style === "object") {
        for (const [propName, propVal] of Object.entries(props.style)) {
          if (typeof propVal === "string" && propVal.startsWith("$")) {
            const key = propVal.slice(1);
            const index = bindingsList.length;
            bindingsList.push(el);
            bindingDescriptors.push({ type: "style", propName, key, index });
          } else {
            el.style.setProperty(propName, String(propVal));
          }
        }
      }
      if (props.value !== void 0 && typeof props.value === "string" && props.value.startsWith("$")) {
        const key = props.value.slice(1);
        const index = bindingsList.length;
        bindingsList.push(el);
        bindingDescriptors.push({ type: "value", key, index });
      }
      if (props.on && typeof props.on === "object") {
        for (const [eventName, actionName] of Object.entries(props.on)) {
          el.addEventListener(eventName, (event) => {
            event.stopPropagation();
            const fn = actions[actionName] || (pin ? pin[actionName] : null);
            if (typeof fn === "function") {
              fn(pin, event);
            }
          });
        }
      }
      for (const child of children) {
        if (Array.isArray(child)) {
          el.appendChild(parseNode(child, bindingsList, pin));
        } else if (typeof child === "string") {
          if (child.startsWith("$")) {
            const key = child.slice(1);
            const textNode = document.createTextNode("");
            el.appendChild(textNode);
            const index = bindingsList.length;
            bindingsList.push(textNode);
            bindingDescriptors.push({ type: "text", key, index });
          } else {
            el.appendChild(document.createTextNode(child));
          }
        }
      }
      return el;
    }
    const templateFactory = (pin) => {
      const bindings = [];
      let root;
      if (rootSpecs.length === 1) {
        root = parseNode(rootSpecs[0], bindings, pin);
      } else {
        root = document.createElement("div");
        root.classList.add(`${componentName}-container`);
        for (const spec of rootSpecs) {
          root.appendChild(parseNode(spec, bindings, pin));
        }
      }
      return { root, bindings };
    };
    return { templateFactory, bindingDescriptors };
  }

  // pins/traits/prototype.js
  var INJECTED_STYLES = /* @__PURE__ */ new Set();
  function coerceValue(rule, val, key, componentName) {
    if (val === void 0 || val === null) {
      return rule.default !== void 0 ? rule.default : rule.type === "number" ? 0 : rule.type === "boolean" ? false : "";
    }
    const type = rule.type || "text";
    if (type === "number") {
      const n = Number(val);
      if (!Number.isFinite(n)) {
        throw new TypeError(`[${componentName}] Property "${key}" must be a finite number, received "${val}"`);
      }
      if (rule.min !== void 0 && n < rule.min) return rule.min;
      if (rule.max !== void 0 && n > rule.max) return rule.max;
      return n;
    }
    if (type === "boolean" || type === "bool") {
      return Boolean(val);
    }
    if (type === "enum") {
      const str = String(val);
      if (Array.isArray(rule.values) && !rule.values.includes(str)) {
        return rule.default !== void 0 ? rule.default : rule.values[0];
      }
      return str;
    }
    if (type === "object" && typeof val === "object") {
      return val;
    }
    if ((type === "array" || type === "list") && Array.isArray(val)) {
      return val;
    }
    return String(val);
  }
  function createReactiveState(pin, schema, defaults, componentName) {
    return new Proxy({}, {
      get(_, prop) {
        if (typeof prop !== "string") return void 0;
        const rule = schema[prop];
        if (!rule) {
          return pin.contents.get(prop);
        }
        const val = pin.contents.get(prop);
        return val !== void 0 ? val : defaults[prop] !== void 0 ? defaults[prop] : void 0;
      },
      set(_, prop, value) {
        if (typeof prop !== "string") return false;
        const rule = schema[prop];
        if (!rule) {
          throw new Error(`[${componentName}] Cannot set undeclared property "${prop}" on prototype with rigid schema`);
        }
        const coerced = coerceValue(rule, value, prop, componentName);
        if (pin.contents.get(prop) === coerced) return true;
        pin.setContent(prop, coerced);
        return true;
      },
      has(_, prop) {
        return prop in schema || pin.contents.has(prop);
      },
      ownKeys(_) {
        return Array.from(/* @__PURE__ */ new Set([...Object.keys(schema), ...pin.contents.keys()]));
      },
      getOwnPropertyDescriptor(_, prop) {
        return {
          enumerable: true,
          configurable: true,
          writable: true,
          value: this.get(_, prop)
        };
      }
    });
  }
  function injectPrototypeStyles(name, styles) {
    if (typeof document === "undefined" || !styles) return;
    const styleId = `cc-proto-${name}`;
    if (INJECTED_STYLES.has(styleId) || document.getElementById(styleId)) {
      INJECTED_STYLES.add(styleId);
      return;
    }
    let cssText = "";
    if (typeof styles === "string") {
      cssText = styles;
    } else if (typeof styles === "object") {
      cssText = Object.entries(styles).map(([part, rules]) => `.${name}-${part} { ${rules} }`).join("\n");
    }
    if (cssText.trim()) {
      const styleEl = document.createElement("style");
      styleEl.id = styleId;
      styleEl.dataset.ccPrototype = name;
      styleEl.textContent = cssText;
      document.head.appendChild(styleEl);
      INJECTED_STYLES.add(styleId);
    }
  }
  function definePrototype(spec = {}) {
    const {
      name,
      schema = {},
      styles = null,
      blueprint,
      actions = {},
      traits = ["draggable", "selectable"],
      chrome = true
    } = spec;
    if (typeof name !== "string" || name.length === 0) {
      throw new TypeError("definePrototype: name must be a non-empty string");
    }
    if (!blueprint || !Array.isArray(blueprint)) {
      throw new TypeError(`definePrototype: "${name}" requires a valid blueprint array`);
    }
    const allowedKeys = Object.keys(schema);
    const defaults = {};
    for (const [k, rule] of Object.entries(schema)) {
      defaults[k] = rule.default !== void 0 ? rule.default : rule.type === "number" ? 0 : rule.type === "boolean" ? false : "";
    }
    injectPrototypeStyles(name, styles);
    const { templateFactory, bindingDescriptors } = compileBlueprint(blueprint, name, actions);
    const handle = defineComponent({
      name,
      chrome,
      allowedKeys: allowedKeys.length > 0 ? allowedKeys : void 0,
      build(pin, contentEl) {
        const { root, bindings } = templateFactory(pin);
        contentEl.replaceChildren(root);
        if (!pin.state) {
          pin.state = createReactiveState(pin, schema, defaults, name);
        }
        for (const [actionName, fn] of Object.entries(actions)) {
          pin[actionName] = (...args) => fn(pin, ...args);
        }
        if (!pin.emit) {
          pin.emit = (type, payload) => {
            pin.transmit(new PinEvent(type, { payload, source: pin, bubbles: true }));
          };
        }
        if (!pin.rotate) {
          pin.rotate = (deltaDeg) => rotatePin(pin, deltaDeg);
        }
        return { bindings, cache: /* @__PURE__ */ new Map() };
      },
      update(pin, contents, state) {
        if (!state || !state.bindings) return;
        const { bindings, cache } = state;
        for (let i = 0; i < bindingDescriptors.length; i++) {
          const desc = bindingDescriptors[i];
          const targetNode = bindings[desc.index];
          if (!targetNode) continue;
          const val = contents.get(desc.key) !== void 0 ? contents.get(desc.key) : defaults[desc.key];
          if (desc.type === "text") {
            const str = val === void 0 || val === null ? "" : String(val);
            if (targetNode.data !== str) {
              targetNode.data = str;
            }
          } else if (desc.type === "class") {
            const cls = val ? `${desc.baseClass}-${val}` : "";
            const prev = cache.get(desc.index);
            if (prev !== cls) {
              if (prev) targetNode.classList.remove(prev);
              if (cls) targetNode.classList.add(cls);
              cache.set(desc.index, cls);
            }
          } else if (desc.type === "attr") {
            const prev = cache.get(desc.index);
            if (prev !== val) {
              if (val === false || val === null || val === void 0) {
                targetNode.removeAttribute(desc.attrName);
              } else {
                targetNode.setAttribute(desc.attrName, String(val));
              }
              cache.set(desc.index, val);
            }
          } else if (desc.type === "style") {
            const prev = cache.get(desc.index);
            if (prev !== val) {
              targetNode.style.setProperty(desc.propName, String(val ?? ""));
              cache.set(desc.index, val);
            }
          } else if (desc.type === "value") {
            const str = String(val ?? "");
            if (targetNode.value !== str) {
              targetNode.value = str;
            }
          }
        }
      }
    });
    const prototype = {
      name,
      handle,
      schema: Object.freeze({ ...schema }),
      defaults: Object.freeze({ ...defaults }),
      create(session, options = {}) {
        const initialContents = {
          ...defaults,
          ...options.state || options.contents || {}
        };
        const pin = session.createPin({
          chrome,
          ...options,
          type: name,
          contents: initialContents
        });
        for (const trait of traits) {
          if (!pin.traits.has(trait)) {
            pin.addTrait(trait);
          }
        }
        return pin;
      },
      extend(childSpec = {}) {
        const mergedSchema = { ...schema, ...childSpec.schema || {} };
        const mergedStyles = childSpec.styles ? typeof styles === "object" && typeof childSpec.styles === "object" ? { ...styles, ...childSpec.styles } : `${styles || ""}
${childSpec.styles}` : styles;
        const mergedActions = { ...actions, ...childSpec.actions || {} };
        const mergedTraits = Array.from(/* @__PURE__ */ new Set([...traits, ...childSpec.traits || []]));
        return definePrototype({
          ...spec,
          ...childSpec,
          name: childSpec.name || `${name}-extended`,
          schema: mergedSchema,
          styles: mergedStyles,
          blueprint: childSpec.blueprint || blueprint,
          actions: mergedActions,
          traits: mergedTraits,
          chrome: childSpec.chrome !== void 0 ? childSpec.chrome : chrome
        });
      }
    };
    return prototype;
  }

  // pins/pin-traits.js
  function initTraits(pin, options) {
    if (pin.utility) {
      for (const trait of Array.isArray(options.traits) ? options.traits : []) {
        pin.addTrait(trait);
      }
      return;
    }
    if (options.type) {
      pin.addTrait(options.type);
    } else if (options.displayTrait) {
      pin.addTrait(options.displayTrait);
    } else {
      pin.addTrait(new DisplayTrait({ displayType: options.content ? "raw" : "card" }));
    }
    if (options.draggable !== false) {
      pin.addTrait(new DraggableTrait());
    }
    if (options.selectable !== false) {
      pin.addTrait(new SelectableTrait({ selected: options.selected }));
    }
    if (Array.isArray(options.traits)) {
      for (const trait of options.traits) {
        pin.addTrait(trait);
      }
    }
  }
  function describeValue(value) {
    if (value === null) return "null";
    if (Array.isArray(value)) return "an array";
    return typeof value;
  }
  function resolveTrait(pin, nameOrTrait, options) {
    if (nameOrTrait instanceof PinTrait) return nameOrTrait;
    if (typeof nameOrTrait !== "string") {
      throw new TypeError(
        `Pin "${pin.id}": expected a trait name or PinTrait instance, received ${describeValue(nameOrTrait)}`
      );
    }
    if (options instanceof PinTrait) {
      if (options.name !== nameOrTrait) {
        throw new Error(
          `Pin "${pin.id}": trait name "${nameOrTrait}" does not match the supplied instance "${options.name}"`
        );
      }
      return options;
    }
    return traitRegistry.create(nameOrTrait, options || {});
  }
  function addTrait(pin, nameOrTrait, options) {
    const trait = resolveTrait(pin, nameOrTrait, options);
    if (!trait) return null;
    if (pin.traits.has(trait.name)) {
      throw new Error(`Pin "${pin.id}" already has a trait named "${trait.name}"`);
    }
    pin.traits.set(trait.name, trait);
    try {
      if (typeof trait.onAttach === "function") {
        trait.onAttach(pin);
      }
    } catch (error) {
      pin.traits.delete(trait.name);
      throw error;
    }
    if (pin.element && pin.element.setAttribute) {
      pin.element.setAttribute(`data-trait-${trait.name}`, "true");
    }
    pin.invalidate("structure");
    if (pin._manager) pin._manager.reindexPin(pin);
    return trait;
  }
  function replaceTrait(pin, traitOrName, options) {
    const trait = resolveTrait(pin, traitOrName, options);
    if (!trait) return null;
    if (pin.traits.has(trait.name)) {
      pin.removeTrait(trait.name);
    }
    return pin.addTrait(trait);
  }
  function removeTrait(pin, traitName) {
    const trait = pin.traits.get(traitName);
    if (!trait) return false;
    if (typeof trait.onDetach === "function") {
      trait.onDetach(pin);
    }
    if (pin.element && pin.element.removeAttribute) {
      pin.element.removeAttribute(`data-trait-${traitName}`);
    }
    const removed = pin.traits.delete(traitName);
    pin.invalidate("structure");
    if (pin._manager) pin._manager.reindexPin(pin);
    return removed;
  }
  function getDisplayTrait(pin) {
    if (pin.primaryTrait && pin.traits.has(pin.primaryTrait.name)) {
      return pin.primaryTrait;
    }
    for (const trait of pin.traits.values()) {
      if (trait instanceof DisplayTrait || trait.hasCapability("renderable")) {
        return trait;
      }
    }
    return pin.traits.values().next().value || null;
  }
  function setDisplayTrait(pin, traitOrName, options) {
    const trait = resolveTrait(pin, traitOrName, options);
    const outgoing = displayTraits(pin);
    for (const existing of pin.traits.values()) {
      if (existing.name === trait.name && !outgoing.includes(existing)) {
        throw new Error(`Pin "${pin.id}" already has a trait named "${trait.name}"`);
      }
    }
    if (typeof pin.endEdit === "function") pin.endEdit();
    for (const existing of outgoing) {
      pin.removeTrait(existing.name);
    }
    try {
      pin.addTrait(trait);
    } catch (error) {
      for (const existing of outgoing) {
        pin.addTrait(existing);
      }
      throw error;
    }
    pin.primaryTrait = trait;
    return trait;
  }
  function displayTraits(pin) {
    const found = [];
    if (pin.primaryTrait && pin.traits.get(pin.primaryTrait.name) === pin.primaryTrait) {
      found.push(pin.primaryTrait);
    }
    for (const trait of pin.traits.values()) {
      if (found.includes(trait)) continue;
      if (trait instanceof DisplayTrait || trait.hasCapability("renderable")) {
        found.push(trait);
      }
    }
    return found;
  }

  // pins/pin-contents.js
  function initContents(pin, contentsInput) {
    if (!contentsInput) return;
    if (contentsInput instanceof Map) {
      for (const [key, value] of contentsInput.entries()) {
        pin.contents.set(key, value);
      }
      return;
    }
    if (Array.isArray(contentsInput)) {
      for (const item of contentsInput) {
        if (Array.isArray(item) && item.length === 2) {
          pin.contents.set(item[0], item[1]);
        }
      }
      return;
    }
    if (typeof contentsInput === "object") {
      for (const [key, value] of Object.entries(contentsInput)) {
        pin.contents.set(key, value);
      }
      return;
    }
    if (typeof contentsInput === "string") {
      pin.contents.set("html", contentsInput);
    }
  }
  function setContent(pin, key, objectOrValue) {
    pin.contents.set(key, objectOrValue);
    pin.invalidate("content");
  }
  function deleteContent(pin, key) {
    const deleted = pin.contents.delete(key);
    if (deleted) pin.invalidate("content");
    return deleted;
  }
  function clearContents(pin) {
    pin.contents.clear();
    pin.invalidate("content");
  }
  function setContents(pin, contentsMapOrObject) {
    const previous = new Map(pin.contents);
    pin._initContents(contentsMapOrObject);
    const error = validateContents(pin);
    if (error) {
      pin.contents = previous;
      throw new Error(error);
    }
    pin.invalidate("content");
  }
  function validateContents(pin) {
    const displayTrait = pin.getDisplayTrait();
    if (!displayTrait || !displayTrait.allowedKeys || typeof displayTrait.validate !== "function") {
      return null;
    }
    const result = displayTrait.validate(pin.contents);
    if (result && result.valid) return null;
    return result && result.error || `Contents rejected by trait "${displayTrait.name}"`;
  }

  // pins/pin-style.js
  var BEVEL_PRESETS = Object.freeze([
    { value: "", label: "None (default)" },
    {
      value: "0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.12), inset 0 -1px 0 rgba(0, 0, 0, 0.25)",
      label: "Raised"
    },
    {
      value: "inset 0 2px 4px rgba(0, 0, 0, 0.45), inset 0 -1px 0 rgba(255, 255, 255, 0.06)",
      label: "Inset (pressed)"
    },
    {
      value: "0 12px 32px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.12)",
      label: "Floating"
    }
  ]);
  var FONT_WEIGHTS = Object.freeze([
    { value: "", label: "(default)" },
    { value: "400", label: "Regular (400)" },
    { value: "500", label: "Medium (500)" },
    { value: "600", label: "Semibold (600)" },
    { value: "700", label: "Bold (700)" }
  ]);
  var FONT_FAMILIES = Object.freeze([
    { value: "", label: "(default)" },
    { value: 'var(--cc-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif)', label: "System" },
    { value: 'Georgia, "Times New Roman", serif', label: "Serif" },
    { value: "var(--cc-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace)", label: "Monospace" }
  ]);
  var TEXT_ALIGN = Object.freeze([
    { value: "", label: "(default)" },
    { value: "left", label: "Left" },
    { value: "center", label: "Center" },
    { value: "right", label: "Right" },
    { value: "justify", label: "Justify" }
  ]);
  var SELF_ALIGN = Object.freeze([
    { value: "start", label: "Start" },
    { value: "center", label: "Center" },
    { value: "end", label: "End" },
    { value: "stretch", label: "Stretch" }
  ]);
  var STYLE_PROPERTIES = Object.freeze([
    Object.freeze({ property: "color", label: "Text colour", control: "color", reflow: false }),
    Object.freeze({ property: "background-color", label: "Background", control: "color", reflow: false }),
    Object.freeze({ property: "border-radius", label: "Corner radius", control: "length", reflow: false }),
    Object.freeze({ property: "box-shadow", label: "Bevel / shadow", control: "select", options: BEVEL_PRESETS, reflow: false }),
    Object.freeze({ property: "padding", label: "Padding", control: "length", reflow: true }),
    Object.freeze({ property: "margin", label: "Margin", control: "length", reflow: true }),
    Object.freeze({ property: "font-size", label: "Font size", control: "length", reflow: true }),
    Object.freeze({ property: "font-weight", label: "Font weight", control: "select", options: FONT_WEIGHTS, reflow: true }),
    Object.freeze({ property: "font-family", label: "Font family", control: "select", options: FONT_FAMILIES, reflow: true }),
    Object.freeze({ property: "text-align", label: "Text align", control: "select", options: TEXT_ALIGN, reflow: false }),
    Object.freeze({ property: "align-self", label: "Align self", control: "presets", options: SELF_ALIGN, reflow: true, flowOnly: true }),
    Object.freeze({ property: "justify-self", label: "Justify self", control: "presets", options: SELF_ALIGN, reflow: true, flowOnly: true })
  ]);
  var ENTRY_BY_PROPERTY = new Map(STYLE_PROPERTIES.map((entry) => [entry.property, entry]));
  function isStyleProperty(property) {
    return ENTRY_BY_PROPERTY.has(property);
  }
  function stylePropertyInfo(property) {
    return ENTRY_BY_PROPERTY.get(property);
  }
  function requireEntry(property) {
    const entry = ENTRY_BY_PROPERTY.get(property);
    if (!entry) {
      throw new TypeError(
        `setPinStyle: "${property}" is not a styleable property; expected one of ${STYLE_PROPERTIES.map((e) => e.property).join(", ")}`
      );
    }
    return entry;
  }
  function styleOf(pin) {
    return pin && pin.element && pin.element.style ? pin.element.style : null;
  }
  function reflow(pin, entry) {
    if (entry.reflow && pin.element) pin.invalidate("content");
  }
  function setPinStyle(pin, property, value) {
    const entry = requireEntry(property);
    if (typeof value !== "string") {
      throw new TypeError(`setPinStyle: value for "${property}" must be a string`);
    }
    const trimmed = value.trim();
    const style = styleOf(pin);
    if (style) {
      if (trimmed === "") style.removeProperty(property);
      else style.setProperty(property, trimmed);
    }
    reflow(pin, entry);
    return style ? style.getPropertyValue(property) : trimmed;
  }
  function clearPinStyle(pin, property) {
    const entry = requireEntry(property);
    const style = styleOf(pin);
    if (style) style.removeProperty(property);
    reflow(pin, entry);
    return true;
  }
  function getPinStyle(pin, property) {
    requireEntry(property);
    const style = styleOf(pin);
    return style ? style.getPropertyValue(property) : "";
  }
  function pinStyleMap(pin) {
    const map = {};
    const style = styleOf(pin);
    if (!style) return map;
    for (const entry of STYLE_PROPERTIES) {
      const value = style.getPropertyValue(entry.property);
      if (value) map[entry.property] = value;
    }
    return map;
  }
  function applyPinStyleMap(pin, map) {
    if (!map || typeof map !== "object") return;
    for (const [property, value] of Object.entries(map)) {
      if (isStyleProperty(property) && typeof value === "string" && value !== "") {
        setPinStyle(pin, property, value);
      }
    }
  }

  // pins/pin-vectors.js
  function addVector(pin, value) {
    const added = pin.particle.addVector(value);
    pin.invalidate("content");
    return added;
  }
  function setVectors(pin, vectorList) {
    pin.particle.setVectors(vectorList);
    pin.invalidate("content");
  }
  function setVector(pin, index, value) {
    const written = pin.particle.setVector(index, value);
    if (written !== null) pin.invalidate("content");
    return written;
  }
  function removeVector(pin, index) {
    const removed = pin.particle.removeVector(index);
    if (removed !== null) pin.invalidate("content");
    return removed;
  }
  function clearVectors(pin) {
    pin.particle.clearVectors();
    pin.invalidate("content");
  }

  // pins/pin-edit.js
  var EDIT_SIGNAL = "edit";
  function initEditState(pin) {
    pin._editing = false;
    pin._editNode = null;
    pin._editDirty = false;
  }
  function beginEdit(pin, node = null) {
    if (pin._editing) return false;
    pin._editing = true;
    pin._editNode = node || null;
    pin._editDirty = false;
    emitPinSignal(pin, EDIT_SIGNAL, true);
    return true;
  }
  function endEdit(pin) {
    if (!pin._editing) return false;
    const owed = pin._editDirty;
    pin._editing = false;
    pin._editNode = null;
    pin._editDirty = false;
    if (owed) pin.invalidate("content");
    emitPinSignal(pin, EDIT_SIGNAL, false);
    return true;
  }
  function deferRender(pin) {
    if (!pin._editing) return false;
    pin._editDirty = true;
    return true;
  }

  // pins/pin-render.js
  var INVALIDATION_KINDS = /* @__PURE__ */ new Set(["content", "structure"]);
  function invalidate(pin, kind = "content") {
    if (!INVALIDATION_KINDS.has(kind)) {
      throw new TypeError(`Pin "${pin.id}": unknown invalidation kind "${kind}"`);
    }
    if (pin._renderer) {
      pin._renderer.invalidate(pin, kind);
      return;
    }
    pin._pendingInvalidations.add(kind);
    pin.render();
  }
  function takePendingInvalidations(pin) {
    const pending = Array.from(pin._pendingInvalidations);
    pin._pendingInvalidations.clear();
    return pending;
  }
  function tick(pin, dt = 1, context = {}) {
    if (!pin.active) return;
    for (const trait of pin.traits.values()) {
      if (typeof trait.onTick === "function") {
        trait.onTick(pin, dt, context);
      }
    }
    for (const child of pin.children) {
      child.tick(dt, context);
    }
  }
  function renderContent(pin, context = {}) {
    if (deferRender(pin)) return false;
    const target = pin.getContentElement();
    if (!target) return false;
    assertContentClass(target);
    writeAriaLabel(pin);
    for (const trait of pin.traits.values()) {
      if (typeof trait.onRender === "function") {
        trait.onRender(pin, pin.contents, target, context);
      }
    }
    return true;
  }
  function assertContentClass(target) {
    if (!target.classList || target.classList.contains(CONTENT_CLASS)) return false;
    target.classList.add(CONTENT_CLASS);
    return true;
  }
  function writeAriaLabel(pin) {
    if (!pin.element || typeof pin.element.setAttribute !== "function") return false;
    const title = pin.contents.get("title");
    const text = title === null || title === void 0 ? "" : String(title).trim();
    const label = text === "" ? pin.id : text;
    if (pin._ariaLabel === label) return false;
    pin._ariaLabel = label;
    pin.element.setAttribute("aria-label", label);
    return true;
  }
  function render(pin, context = {}) {
    if (!pin.active) {
      pin._reconcile();
      return;
    }
    if (pin.element) {
      pin.renderContent(context);
      pin.syncDimensions();
    }
    pin.renderPosition();
    if (pin.children.size > 0) renderChildren(pin, context);
  }
  function renderChildren(pin, context) {
    const scopeElement = pin.getOrCreateScopeElement();
    for (const child of pin.children) {
      if (resolveReloadMode(child) !== RELOAD_MODES.MOUNTED) {
        child._reconcile();
        continue;
      }
      if (scopeElement && child.element && child.element.parentNode !== scopeElement) {
        child.mount(scopeElement);
      }
      child.render(context);
    }
  }

  // pins/pin-scope.js
  function normalizeTransmitEvent(pin, event) {
    if (typeof event === "string") {
      return new PinEvent(event, { source: pin });
    }
    if (event instanceof PinEvent) {
      if (event.detail && !event.detail.source) event.detail.source = pin;
      return event;
    }
    if (typeof Event !== "undefined" && event instanceof Event) {
      return wrapForeignEvent(event);
    }
    if (event && typeof event === "object" && typeof event.type === "string") {
      return event;
    }
    return new PinEvent(DEFAULT_EVENT_TYPE, { payload: event, source: pin });
  }
  function wrapForeignEvent(event) {
    const detail = event.detail;
    let payload = null;
    if (detail && typeof detail === "object" && "payload" in detail) {
      payload = detail.payload;
    } else if (detail !== void 0 && detail !== null) {
      payload = detail;
    } else if (event.payload !== void 0) {
      payload = event.payload;
    }
    return new PinEvent(event.type, {
      payload,
      bubbles: event.bubbles !== false,
      source: event
    });
  }
  function transmit(pin, event, context = {}) {
    const evt = pin._normalizeTransmitEvent(event);
    const dispatchable = typeof Event !== "undefined" && evt instanceof Event;
    const results = [];
    const visited = /* @__PURE__ */ new Set();
    let node = pin;
    while (node && !visited.has(node)) {
      visited.add(node);
      for (const trait of node.traits.values()) {
        if (typeof trait.onTransmit === "function") {
          results.push(trait.onTransmit(node, evt, context));
        }
      }
      if (dispatchable) node.dispatchEvent(evt);
      if (!evt.bubbles || evt.cancelled || evt.cancelBubble) break;
      node = node.parent;
    }
    return results;
  }
  function ancestorsOf(pin) {
    const chain = [];
    let node = pin.parent;
    while (node && !chain.includes(node)) {
      chain.push(node);
      node = node.parent;
    }
    return chain;
  }
  function scopeTrait(pin, name) {
    for (const ancestor of pin.ancestors()) {
      const trait = ancestor.traits.get(name);
      if (trait) return trait;
    }
    return null;
  }
  function deriveFromScope(pin, traitName, key) {
    for (const ancestor of pin.ancestors()) {
      const trait = ancestor.traits.get(traitName);
      if (!trait) continue;
      if (trait[key] !== void 0) return trait[key];
      const fromOptions = trait.options ? trait.options[key] : void 0;
      if (fromOptions !== void 0) return fromOptions;
    }
    return void 0;
  }
  function addChild(pin, childPin) {
    if (childPin.parent && childPin.parent !== pin) {
      childPin.parent.removeChild(childPin);
    }
    childPin.parent = pin;
    pin.children.add(childPin);
    pin.getOrCreateScopeElement();
    childPin._offloadDormant = false;
    if (pin._renderer && !childPin._renderer) {
      pin._renderer.attach(childPin);
    }
    if (pin.active && wakesWithParent(childPin)) {
      childPin.activate();
    }
    syncFlowChild(childPin);
    childPin._reconcile();
    return childPin;
  }
  function removeChild(pin, childPin) {
    if (!pin.children.has(childPin)) return false;
    childPin.parent = null;
    pin.children.delete(childPin);
    syncFlowChild(childPin);
    childPin.unmount();
    return true;
  }

  // pins/pin.js
  var Pin = class _Pin extends EventTarget {
    constructor(options = {}) {
      super();
      this.id = options.id || `pin_${Math.random().toString(36).slice(2, 9)}`;
      this.utility = Boolean(options.utility);
      this.selectableText = Boolean(options.selectableText);
      this.bordered = options.bordered;
      this.chrome = options.chrome;
      this._initParticle(options);
      this.contents = /* @__PURE__ */ new Map();
      this._initContents(options.contents || options.content);
      this.traits = /* @__PURE__ */ new Map();
      this.parent = null;
      this.children = /* @__PURE__ */ new Set();
      this.contentElement = null;
      this.scopeElement = null;
      this._scopeOffset = { x: 0, y: 0 };
      this._flowOrigin = null;
      this._layoutGap = null;
      this.layout = options.layout;
      if (options.gap !== void 0) this.layoutGap = options.gap;
      this._renderer = null;
      this._manager = null;
      this._pendingInvalidations = /* @__PURE__ */ new Set();
      initEditState(this);
      initReloadState(this, options, reloadFromOptions(options));
      this.element = options.element || this._createDefaultElement(options);
      this._setupElement();
      this._initTraits(options);
      this.render();
    }
    /** Adopt the supplied spatial node, or build one (`../particles/pin-particle.js`). */
    _initParticle(options) {
      this.particle = particleFromOptions(this.id, options);
    }
    _initContents(contentsInput) {
      return initContents(this, contentsInput);
    }
    _initTraits(options) {
      return initTraits(this, options);
    }
    /* ------------------ ELEMENT STRUCTURE ------------------ */
    _createDefaultElement(options) {
      return createDefaultElement(this, options);
    }
    _setupElement() {
      return setupElement(this);
    }
    _buildElementStructure() {
      return buildElementStructure(this);
    }
    /* ------------------ OWNERSHIP ------------------ */
    /**
     * The session this Pin belongs to, or null when it belongs to none.
     *
     * Resolved through the manager rather than stored: registration with a manager
     * is the single fact that makes a Pin part of a session, so a Pin that was
     * never registered, was removed, or lives in a headless manager reports the
     * truth without anyone having to remember to clear a field.
     *
     * @returns {CloudCanvasSession|null}
     */
    get session() {
      return this._manager && this._manager.session || null;
    }
    /* ------------------ HIERARCHY & SCOPE API ------------------ */
    /** Add a child Pin into this Pin's internal scope (`./pin-scope.js`). */
    addChild(childPin) {
      if (!(childPin instanceof _Pin) || childPin === this) return null;
      return addChild(this, childPin);
    }
    /** Remove a child Pin from this Pin's internal scope. */
    removeChild(childPin) {
      return removeChild(this, childPin);
    }
    /**
     * @deprecated since 0.3.0 - iterate `pin.children`, or `Array.from(pin.children)`
     * for a snapshot. Removed in 0.4.0.
     */
    getChildren() {
      return Array.from(this.children);
    }
    /**
     * The persistent scope container for child Pins.
     * Built once with the rest of the element structure; this only rebuilds it for
     * Pins whose element appeared after construction.
     */
    getOrCreateScopeElement() {
      if (this.scopeElement) return this.scopeElement;
      this._buildElementStructure();
      return this.scopeElement;
    }
    /** The display-only content container (null in headless mode). */
    getContentElement() {
      if (this.contentElement) return this.contentElement;
      this._buildElementStructure();
      return this.contentElement;
    }
    /** Cumulative global bounding box, summed over the ancestor chain. */
    getGlobalBounds() {
      return globalBoundsOf(this);
    }
    /* ------------------ ACTIVATION & RELOAD API ------------------ */
    /** Compatibility alias for `reload === 'lazy'`. */
    get lazy() {
      return this.reload === RELOAD_STRATEGIES.LAZY;
    }
    set lazy(value) {
      this.reload = value ? RELOAD_STRATEGIES.LAZY : RELOAD_STRATEGIES.ACTIVE;
    }
    /** Wake this Pin and its subtree; provisions a lazy scope's children. */
    activate(context) {
      return activate(this, context);
    }
    /** Sleep this Pin and cascade to its subtree. */
    deactivate(context) {
      return deactivate(this, context);
    }
    /**
     * Drop everything the lazy provider produced and re-arm it.
     * @returns {number} how many child subtrees were destroyed
     */
    unload() {
      return unload(this);
    }
    /** Bring this Pin's DOM membership in line with its reload strategy. */
    _reconcile() {
      return reconcile(this);
    }
    /* ------------------ FOCUS API ------------------ */
    setFocused(focused, session) {
      return setFocused(this, focused, session);
    }
    /* ------------------ TRAIT MANAGEMENT API ------------------ */
    _resolveTrait(nameOrTrait, options) {
      return resolveTrait(this, nameOrTrait, options);
    }
    /**
     * Attach a trait, by name (built from the registry) or as an instance.
     * A Pin holds at most one trait per name - use `replaceTrait` to swap one out.
     *
     * `pin.traits` is the Map itself, and it is the read surface: `traits.get`,
     * `traits.has`, and iteration are the native spellings of every lookup this
     * class used to wrap.
     */
    addTrait(nameOrTrait, options) {
      return addTrait(this, nameOrTrait, options);
    }
    /** Swap a trait for a freshly resolved one of the same name. */
    replaceTrait(traitOrName, options) {
      return replaceTrait(this, traitOrName, options);
    }
    removeTrait(traitName) {
      return removeTrait(this, traitName);
    }
    /** @deprecated since 0.3.0 - use `pin.traits.get(name)`. Removed in 0.4.0. */
    getTrait(traitName) {
      return this.traits.get(traitName);
    }
    /** @deprecated since 0.3.0 - use `pin.traits.has(name)`. Removed in 0.4.0. */
    hasTrait(traitName) {
      return this.traits.has(traitName);
    }
    /** @deprecated since 0.3.0 - use `Array.from(pin.traits.values())`. Removed in 0.4.0. */
    getTraits() {
      return Array.from(this.traits.values());
    }
    /** The trait responsible for this Pin's display, or the first trait it has. */
    get displayTrait() {
      return getDisplayTrait(this);
    }
    /** The trait responsible for this Pin's display, or the first trait it has. */
    getDisplayTrait() {
      return getDisplayTrait(this);
    }
    /** Swap the Pin's display trait atomically; a failed swap is rolled back. */
    setDisplayTrait(traitOrName, options) {
      return setDisplayTrait(this, traitOrName, options);
    }
    /** @deprecated since 0.3.0 - use {@link Pin#displayTrait}. Removed in 0.4.0. */
    getType() {
      return this.getDisplayTrait();
    }
    /** @deprecated since 0.3.0 - use {@link Pin#setDisplayTrait}. Removed in 0.4.0. */
    setType(traitOrName, options) {
      return this.setDisplayTrait(traitOrName, options);
    }
    _displayTraits() {
      return displayTraits(this);
    }
    /* ------------------ CONTENTS MAP API (./pin-contents.js) ------------------ */
    /**
     * `pin.contents` is the Map itself, and it is the read surface: `contents.get`,
     * `contents.has`, and iteration need no wrapper. The writes below are not
     * wrappers - each one owes the renderer a frame, and that is what they are for.
     */
    setContent(key, objectOrValue) {
      return setContent(this, key, objectOrValue);
    }
    /** Merge contents in, enforcing the display trait's `allowedKeys` contract. */
    setContents(contentsMapOrObject) {
      return setContents(this, contentsMapOrObject);
    }
    deleteContent(key) {
      return deleteContent(this, key);
    }
    clearContents() {
      return clearContents(this);
    }
    /** @deprecated since 0.3.0 - use `pin.contents.get(key)`. Removed in 0.4.0. */
    getContent(key) {
      return this.contents.get(key);
    }
    /** @deprecated since 0.3.0 - use `pin.contents.has(key)`. Removed in 0.4.0. */
    hasContent(key) {
      return this.contents.has(key);
    }
    /** @deprecated since 0.3.0 - use `new Map(pin.contents)`. Removed in 0.4.0. */
    getAllContents() {
      return new Map(this.contents);
    }
    /* ------------------ APPEARANCE OVERRIDES API (./pin-style.js) ------------------ */
    /**
     * Override one appearance property on this Pin's own root box - its corner
     * radius, surface colour, bevel, padding, or flow placement. An allow-listed
     * CSS property written directly inline, where it outranks the stylesheet's
     * token default; an empty value clears it. Distinct from `contents` (what a
     * display trait renders) and from `chrome`/`bordered` (whole-card toggles).
     */
    setStyle(property, value) {
      return setPinStyle(this, property, value);
    }
    /** Drop one appearance override, restoring the stylesheet default. */
    clearStyle(property) {
      return clearPinStyle(this, property);
    }
    /** The override in force for a property, or '' when there is none. */
    getStyle(property) {
      return getPinStyle(this, property);
    }
    /** Every appearance override this Pin carries, as a plain object. */
    get styleOverrides() {
      return pinStyleMap(this);
    }
    /* ------------------ RENDERER INVALIDATION CONTRACT ------------------ */
    /**
     * Declare that this Pin needs work on the next frame.
     *
     * The public way to say "something changed that you cannot see from here" -
     * a trait holding external state, a component whose data arrived out of band.
     * Every content and structure write in the model ends in this call.
     *
     * With a renderer attached the request is queued and nothing touches the DOM;
     * otherwise the Pin renders synchronously and the kind is kept for replay when
     * a renderer eventually adopts it.
     *
     * @param {'content'|'structure'} [kind='content']
     * @throws {TypeError} on any other kind
     */
    invalidate(kind = "content") {
      return invalidate(this, kind);
    }
    /** @deprecated since 0.3.0 - use {@link Pin#invalidate}. Removed in 0.4.0. */
    _invalidate(kind = "content") {
      return this.invalidate(kind);
    }
    /** Invalidation kinds recorded before a renderer existed (replayed at attach). */
    takePendingInvalidations() {
      return takePendingInvalidations(this);
    }
    /**
     * Force this Pin's display to rebuild its subtree on the next render.
     *
     * The ordinary render path rebuilds only on a display-type swap or the `html`
     * override toggling (`./traits/display.js`), because those are the only shape
     * changes a built-in template has. A component whose `build` reads the content
     * *shape* - the slotted custom type lays out one region per slot - has no such
     * signal, so after its contents change shape a plain `setContents` would write
     * into a subtree built for the old shape. This discards that built subtree and
     * asks for a content frame, so the next render lays the new shape out.
     */
    rebuildDisplay() {
      const trait = this.getDisplayTrait();
      if (trait && typeof trait.discardBuild === "function") trait.discardBuild(this);
      return this.invalidate("content");
    }
    /* ------------------ VECTORS API (./pin-vectors.js) ------------------ */
    addVector(value) {
      return addVector(this, value);
    }
    setVectors(vectorList) {
      return setVectors(this, vectorList);
    }
    /** Replace one vector; an out-of-range index is a no-op returning null. */
    setVector(index, value) {
      return setVector(this, index, value);
    }
    removeVector(index) {
      return removeVector(this, index);
    }
    clearVectors() {
      return clearVectors(this);
    }
    /** L2 norm of the vector list; the absolute value of a single vector. */
    get magnitude() {
      return this.particle.getMagnitude();
    }
    /** Directional gradient: the single vector, or the mean of the list. */
    get gradient() {
      return this.particle.getGradient();
    }
    /** @deprecated since 0.3.0 - use `pin.particle.getVectors()`. Removed in 0.4.0. */
    getVectors() {
      return this.particle.getVectors();
    }
    /** @deprecated since 0.3.0 - use `pin.particle.getVector(index)`. Removed in 0.4.0. */
    getVector(index = 0) {
      return this.particle.getVector(index);
    }
    /** @deprecated since 0.3.0 - use `pin.particle.getPrimaryVector()`. Removed in 0.4.0. */
    getPrimaryVector() {
      return this.particle.getPrimaryVector();
    }
    /** @deprecated since 0.3.0 - use {@link Pin#magnitude}. Removed in 0.4.0. */
    getMagnitude() {
      return this.magnitude;
    }
    /** @deprecated since 0.3.0 - use {@link Pin#gradient}. Removed in 0.4.0. */
    getGradient() {
      return this.gradient;
    }
    /* ------------------ EDIT LOCK (./pin-edit.js) ------------------ */
    /**
     * Hold rendering off this Pin while its content is being edited in place.
     *
     * Idempotent. Renders requested in the meantime are deferred, not dropped:
     * `endEdit` replays exactly one of them, with whatever the contents finished
     * as.
     *
     * @param {Element|null} [node] the node holding the caret, kept for the caller
     * @returns {boolean} true when this call took the lock
     */
    beginEdit(node = null) {
      return beginEdit(this, node);
    }
    /** Release the edit lock and replay the render it deferred, if any. */
    endEdit() {
      return endEdit(this);
    }
    /** Whether an edit is currently holding rendering off this Pin. */
    get editing() {
      return this._editing === true;
    }
    /* ------------------ SPATIAL & STATE API ------------------ */
    /**
     * Move this Pin in canvas space.
     *
     * A method rather than three setters: the three coordinates are written
     * together, and a Pin that arrives at its destination one axis at a time is a
     * Pin that rendered somewhere it was never meant to be. Reads are per-axis
     * (`pin.x`, `pin.y`, `pin.z`), because a read commits to nothing.
     */
    setPosition(x, y, z = this.particle.z) {
      this.particle.setPosition(x, y, z);
      if (!this._renderer) this.renderPosition();
    }
    /** Canvas-space position, as the spatial node holds it. */
    get x() {
      return this.particle.x;
    }
    get y() {
      return this.particle.y;
    }
    get z() {
      return this.particle.z;
    }
    /** Whether the particle engine leaves this Pin exactly where it was put. */
    get pinned() {
      return this.particle.pinned;
    }
    set pinned(value) {
      this.particle.pinned = Boolean(value);
    }
    /** @deprecated since 0.3.0 - use {@link Pin#pinned}. Removed in 0.4.0. */
    setPinned(pinned) {
      this.pinned = pinned;
    }
    /** Selection state, owned by `SelectableTrait`; false without one. */
    get selected() {
      const sel = this.traits.get("selectable");
      return sel ? sel.selected : false;
    }
    set selected(value) {
      const sel = this.traits.get("selectable");
      if (!sel) return;
      if (value) sel.select(this);
      else sel.deselect(this);
    }
    /** @deprecated since 0.3.0 - use {@link Pin#selected}. Removed in 0.4.0. */
    setSelected(selected) {
      this.selected = selected;
    }
    /** Drag state, owned by `DraggableTrait`; false without one. */
    get dragging() {
      const drag = this.traits.get("draggable");
      return drag ? drag.dragging : false;
    }
    set dragging(value) {
      const drag = this.traits.get("draggable");
      if (!drag) return;
      drag.dragging = Boolean(value);
      if (this.element && this.element.classList) {
        this.element.classList.toggle("is-dragging", drag.dragging);
      }
    }
    /** @deprecated since 0.3.0 - use {@link Pin#dragging}. Removed in 0.4.0. */
    setDragging(dragging) {
      this.dragging = dragging;
    }
    /**
     * Whether the card's border is painted. Default true, and independent of
     * `chrome`: that takes the whole card away, this leaves surface, padding and
     * shadow where they were and stops only the border (`./pin-element.js`).
     */
    get bordered() {
      return this._bordered !== false;
    }
    set bordered(value) {
      setBordered(this, value);
    }
    /**
     * Whether this Pin wears the default card chrome: the surface, padding, radius,
     * border and shadow. Default true. `chrome: false` is what a component drawing
     * its own surface asks for - `contentElement` becomes the Pin's own boundary,
     * with no card around it.
     *
     * Structurally one class on the root, exactly like `bordered` - toggling it
     * never touches `contentElement` or its children (the two-child structure is
     * fixed and built once). It differs from `bordered` in one way only: chrome
     * carries real geometry (padding, border width, shadow), so the setter re-measures
     * through `invalidate('content')` where `bordered` - a transparent border that
     * moves nothing - does not (`./pin-element.js`).
     */
    get chrome() {
      return this._chrome !== false;
    }
    set chrome(value) {
      setChrome(this, value);
    }
    /**
     * How this Pin arranges its CHILDREN: `'free'` (default - every child absolutely
     * positioned by its own transform, unchanged), or `'row'` / `'column'` / `'grid'`,
     * which lay the scope well out with flex or grid so the children flow.
     *
     * Structurally the twin of `chrome`: one class, live-settable - but on the scope
     * well rather than the root, because it is about how the children sit, not how
     * this Pin does. Switching a container to a flow mode makes every existing child
     * a flow child (`position: relative`, no transform); switching back to `'free'`
     * restores absolute positioning (`./pin-element.js`). An unknown value throws.
     */
    get layout() {
      return this._layout || "free";
    }
    set layout(value) {
      setLayout(this, value);
    }
    /**
     * Gap between children in a non-`free` layout, in pixels, written as the
     * `--cc-layout-gap` custom property all three flow modes read. Null (the
     * default) leaves the stylesheet's own spacing token in place.
     */
    get layoutGap() {
      return this._layoutGap;
    }
    set layoutGap(value) {
      setLayoutGap(this, value);
    }
    /** Request a layout measurement (batched when a renderer is attached). */
    syncDimensions() {
      return syncDimensions(this);
    }
    /** Read this Pin's layout box straight from the DOM (read phase only). */
    measureLayout() {
      return measureLayout(this);
    }
    mount(parentContainer) {
      return mountInto(this, parentContainer);
    }
    unmount() {
      return unmountElement(this);
    }
    /* ------------------ TICK & RENDERING HOOKS ------------------ */
    /** Execute trait tick lifecycle hooks, then tick the subtree. */
    tick(dt = 1, context = {}) {
      return tick(this, dt, context);
    }
    /** Render spatial transform */
    renderPosition() {
      return writeTransform(this);
    }
    /** Run every trait's `onRender` hook against the display-only content element. */
    renderContent(context = {}) {
      return renderContent(this, context);
    }
    /** Full synchronous render: contents, measurement, transform, and children. */
    render(context = {}) {
      return render(this, context);
    }
    /* ------------------ EVENT TRANSMISSION ------------------ */
    _normalizeTransmitEvent(event) {
      return normalizeTransmitEvent(this, event);
    }
    /**
     * Transmit an event through this Pin and up its scope chain.
     * Returns every trait `onTransmit` result collected along the walk.
     */
    transmit(event, context = {}) {
      return transmit(this, event, context);
    }
    /* ------------------ BREADCRUMB / SCOPE ACCESS ------------------ */
    /** Parent chain, nearest first: [parent, grandparent, ... root]. */
    ancestors() {
      return ancestorsOf(this);
    }
    /** Root-first trail ending at this pin: [root, ... parent, this]. */
    breadcrumb() {
      return [...this.ancestors().reverse(), this];
    }
    /** Nearest ancestor's trait instance (never this pin's own), or null. */
    scopeTrait(name) {
      return scopeTrait(this, name);
    }
    /** Read a value off the nearest ancestor trait that defines it. */
    deriveFromScope(traitName, key) {
      return deriveFromScope(this, traitName, key);
    }
    /** Tear this Pin down, subtree and all (`./pin-lifecycle.js`). */
    destroy() {
      destroy(this);
    }
  };

  // pins/children-loader.js
  var CHILDREN_ERROR_EVENT = "childrenerror";
  function noChildren() {
    return [];
  }
  var LazyChildrenLoader = class {
    /**
     * @param {PinManager} manager owner of the Pin registry the specs are created
     *        in, and holder of the session-level `options.loadChildren` provider
     */
    constructor(manager) {
      this.manager = manager;
    }
    /**
     * Resolve the provider for a Pin: its own, then the manager's (plumbed from
     * session options), then the empty default.
     *
     * The manager's provider is read per call rather than captured, so a session
     * can install or swap one after construction.
     *
     * @returns {(pin: Pin, context: Object) => (Array|Promise<Array>)}
     */
    providerFor(pin) {
      if (typeof pin.loadChildren === "function") return pin.loadChildren;
      if (pin.options && typeof pin.options.loadChildren === "function") {
        return pin.options.loadChildren;
      }
      const shared = this.manager && this.manager.options ? this.manager.options.loadChildren : null;
      return typeof shared === "function" ? shared : noChildren;
    }
    /**
     * Provision a Pin's children exactly once.
     * @returns {Promise<Pin[]>} the Pins created by the provider
     */
    load(pin, context = {}) {
      if (!pin || !this._isRegistered(pin)) return Promise.resolve([]);
      if (pin._childrenLoaded) return Promise.resolve(Array.from(pin.children));
      if (pin._childrenLoading) return pin._childrenLoading;
      const provider = this.providerFor(pin);
      const flight = Promise.resolve().then(() => provider(pin, context)).then((specs) => this._adopt(pin, specs)).catch((error) => this._fail(pin, error));
      pin._childrenLoading = flight;
      return flight;
    }
    /** Turn resolved specs into registered child Pins. */
    _adopt(pin, specs) {
      pin._childrenLoading = null;
      if (!this._isRegistered(pin)) return [];
      pin._childrenLoaded = true;
      if (!Array.isArray(specs)) return [];
      const created = [];
      for (const spec of specs) {
        if (!spec || typeof spec !== "object") continue;
        created.push(this.manager.createPin({ ...spec, parent: pin }));
      }
      return created;
    }
    /**
     * Report a failed provider on the Pin itself and re-arm the trigger.
     * The event bubbles up the scope chain, so an ancestor can handle loading
     * failures for a whole subtree.
     */
    _fail(pin, error) {
      pin._childrenLoading = null;
      if (!this._isRegistered(pin)) return [];
      pin.transmit(new PinEvent(CHILDREN_ERROR_EVENT, {
        payload: { error, pin },
        bubbles: true,
        source: pin
      }));
      return [];
    }
    _isRegistered(pin) {
      return Boolean(this.manager && this.manager.pins.has(pin.id));
    }
  };

  // pins/manager-index.js
  function indexPin(manager, pin) {
    const traitNames = /* @__PURE__ */ new Set();
    const capabilities = /* @__PURE__ */ new Set();
    for (const trait of pin.traits ? pin.traits.values() : []) {
      if (!trait || !trait.name) continue;
      traitNames.add(trait.name);
      for (const capability of trait.capabilities || []) {
        capabilities.add(capability);
      }
    }
    for (const name of traitNames) addEntry(manager.traitIndex, name, pin);
    for (const capability of capabilities) addEntry(manager.capabilityIndex, capability, pin);
    manager._indexKeys.set(pin, { traitNames, capabilities });
  }
  function unindexPin(manager, pin) {
    const keys = manager._indexKeys.get(pin);
    if (!keys) return;
    for (const name of keys.traitNames) removeEntry(manager.traitIndex, name, pin);
    for (const capability of keys.capabilities) removeEntry(manager.capabilityIndex, capability, pin);
    manager._indexKeys.delete(pin);
  }
  function addEntry(index, key, pin) {
    let bucket = index.get(key);
    if (!bucket) {
      bucket = /* @__PURE__ */ new Set();
      index.set(key, bucket);
    }
    bucket.add(pin);
  }
  function removeEntry(index, key, pin) {
    const bucket = index.get(key);
    if (!bucket) return;
    bucket.delete(pin);
    if (bucket.size === 0) index.delete(key);
  }

  // engine/announcer.js
  var LIVE_REGION_CLASS = "cloudcanvas-live-region";
  var HOST_ROLE = "application";
  var HOST_ROLEDESCRIPTION = "canvas";
  var DEFAULT_HOST_LABEL = "Interactive canvas";
  var HIDDEN_STYLE = "position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0;";
  var NBSP = " ";
  function setIfAbsent(element, name, value) {
    if (!element || typeof element.setAttribute !== "function") return false;
    if (typeof element.hasAttribute === "function" && element.hasAttribute(name)) return false;
    element.setAttribute(name, value);
    return true;
  }
  function hideFromAssistiveTech(element) {
    if (!element || typeof element.setAttribute !== "function") return false;
    element.setAttribute("aria-hidden", "true");
    return true;
  }
  function applyHostAria(session) {
    const host = session ? session.hostElement : null;
    if (!host) return false;
    const label = session.options && session.options.label ? session.options.label : DEFAULT_HOST_LABEL;
    const written = [];
    if (setIfAbsent(host, "role", HOST_ROLE)) written.push("role");
    if (setIfAbsent(host, "aria-roledescription", HOST_ROLEDESCRIPTION)) {
      written.push("aria-roledescription");
    }
    if (setIfAbsent(host, "aria-label", label)) written.push("aria-label");
    session._hostAriaAttributes = written;
    hideFromAssistiveTech(session.svgLayerElement);
    hideFromAssistiveTech(session.focusVeilElement);
    hideFromAssistiveTech(cursorLayerOf(session));
    return true;
  }
  function removeHostAria(session) {
    if (!session) return false;
    const host = session.hostElement;
    const written = session._hostAriaAttributes;
    session._hostAriaAttributes = null;
    if (!host || !written || written.length === 0) return false;
    if (typeof host.removeAttribute !== "function") return false;
    for (const name of written) host.removeAttribute(name);
    return true;
  }
  function cursorLayerOf(session) {
    const overlay = session.overlayElement;
    if (!overlay || typeof overlay.querySelector !== "function") return null;
    return overlay.querySelector("svg.cloudcanvas-cursor-layer");
  }
  function mountAnnouncer(session) {
    if (typeof document === "undefined" || !session || !session.hostElement) return null;
    unmountAnnouncer(session);
    const region = document.createElement("div");
    region.className = LIVE_REGION_CLASS;
    region.setAttribute("role", "status");
    region.setAttribute("aria-live", "polite");
    region.setAttribute("aria-atomic", "true");
    region.setAttribute("style", HIDDEN_STYLE);
    session.hostElement.appendChild(region);
    session._liveRegion = region;
    return region;
  }
  function unmountAnnouncer(session) {
    const region = session ? session._liveRegion : null;
    if (!region) return false;
    if (region.parentNode) region.parentNode.removeChild(region);
    session._liveRegion = null;
    return true;
  }
  function announce(session, text) {
    const region = session ? session._liveRegion : null;
    if (!region) return false;
    const message = text === null || text === void 0 ? "" : String(text).trim();
    if (message === "") return false;
    region.textContent = region.textContent === message ? message + NBSP : message;
    return true;
  }
  function titleOf(pin) {
    if (!pin) return "";
    const title = pin.contents ? pin.contents.get("title") : null;
    if (typeof title === "string" && title.trim() !== "") return title.trim();
    if (typeof title === "number" && Number.isFinite(title)) return String(title);
    return pin.id;
  }
  function announceFocus(session, pin) {
    return announce(session, pin ? `Focused ${titleOf(pin)}` : "Focus cleared");
  }
  function announceEdit(session, pin, editing) {
    if (!session || !pin) return false;
    const label = titleOf(pin);
    return announce(session, editing ? `Editing ${label}` : `Finished editing ${label}`);
  }
  function announceProvision(session, pin, created) {
    if (!session || !pin) return false;
    if (!pin._childrenLoaded) return announce(session, "Failed to load items");
    return announce(session, `${created.length} items loaded`);
  }

  // pins/pin-signals.js
  var PinSignalBus = class {
    constructor(types = PIN_SIGNAL_TYPES) {
      this.types = types;
      this.handlers = /* @__PURE__ */ new Set();
      this._forward = (event) => {
        const source = event && event.detail ? event.detail.source : event ? event.target : null;
        if (event && event.currentTarget && source && event.currentTarget !== source) {
          return;
        }
        for (const handler of this.handlers) handler(event);
      };
    }
    /**
     * Observe every relayed signal.
     * @returns {() => boolean} unsubscribe
     */
    subscribe(handler) {
      if (typeof handler !== "function") {
        throw new TypeError("PinSignalBus.subscribe: handler must be a function");
      }
      this.handlers.add(handler);
      return () => this.handlers.delete(handler);
    }
    /** Start relaying a Pin's signals. */
    attach(pin) {
      return this._listen(pin, true);
    }
    /** Stop relaying a Pin's signals. */
    detach(pin) {
      return this._listen(pin, false);
    }
    _listen(pin, listening) {
      if (!pin || typeof pin.addEventListener !== "function") return false;
      for (const type of this.types) {
        if (listening) pin.addEventListener(type, this._forward);
        else pin.removeEventListener(type, this._forward);
      }
      return true;
    }
    /** Drop every subscriber. Pins keep their listeners; the bus has no audience. */
    clear() {
      this.handlers.clear();
    }
  };

  // pins/manager.js
  function visible(pins) {
    return pins.filter((pin) => !pin.utility);
  }
  var PinManager = class {
    constructor(options = {}) {
      this.options = options;
      this.defaultReload = normalizeReloadStrategy(options.defaultReload);
      this.childrenLoader = new LazyChildrenLoader(this);
      this.pins = /* @__PURE__ */ new Map();
      this.particleEngine = options.particleEngine || new ParticleEngine();
      this.container = options.container || null;
      this.renderer = options.renderer || null;
      this._session = options.session || null;
      this.capabilityIndex = /* @__PURE__ */ new Map();
      this.traitIndex = /* @__PURE__ */ new Map();
      this.particleToPin = /* @__PURE__ */ new Map();
      this._indexKeys = /* @__PURE__ */ new WeakMap();
      this.signals = new PinSignalBus();
    }
    /**
     * Observe `activate` / `select` / `destroy` signals from every registered Pin.
     * @param {(event: PinEvent) => void} handler
     * @returns {() => boolean} unsubscribe
     */
    onSignal(handler) {
      return this.signals.subscribe(handler);
    }
    /**
     * Set the parent DOM container for all root Pins.
     * Flushes the pre-mount queue: any root Pin registered before a container
     * existed is mounted now.
     */
    setContainer(container) {
      this.container = container;
      if (container) {
        this.mountAll(container);
      }
    }
    /**
     * The session that owns this manager, or null in headless use.
     *
     * Falls back to the renderer's own back-reference, so a manager wired the way
     * `CloudCanvasSession` wires one - `setRenderer` with a session-owned renderer
     * - already answers correctly without a second call.
     *
     * @returns {CloudCanvasSession|null}
     */
    get session() {
      if (this._session) return this._session;
      return this.renderer && this.renderer.session || null;
    }
    /**
     * Declare the owning session explicitly.
     * @returns {CloudCanvasSession|null} the session now held
     */
    setSession(session) {
      this._session = session || null;
      return this._session;
    }
    /**
     * Adopt a conjugate renderer. Pins registered before this call are handed over
     * now, so registration order never decides whether a Pin gets rendered.
     */
    setRenderer(renderer) {
      this.renderer = renderer || null;
      if (!this.renderer) return null;
      for (const pin of this.pins.values()) {
        this.renderer.attach(pin);
      }
      return this.renderer;
    }
    /**
     * Create and register a new Pin.
     * A Pin that declares neither `reload` nor the `lazy` alias inherits the
     * manager's default strategy.
     */
    createPin(options = {}) {
      const declaresStrategy = options.reload !== void 0 || options.lazy !== void 0;
      const pin = new Pin(declaresStrategy ? options : { ...options, reload: this.defaultReload });
      return this.registerPin(pin, options.parent);
    }
    /**
     * Register an existing Pin instance
     */
    registerPin(pin, parentPin = null) {
      if (!(pin instanceof Pin)) {
        throw new TypeError("Expected an instance of Pin");
      }
      this.pins.set(pin.id, pin);
      this.particleEngine.addPin(pin.particle);
      if (pin.particle) {
        this.particleToPin.set(pin.particle.id, pin.id);
      }
      pin._manager = this;
      this._indexPin(pin);
      this.signals.attach(pin);
      if (pin.utility) return pin;
      if (parentPin instanceof Pin) {
        parentPin.addChild(pin);
      } else if (this.container && !pin.parent) {
        if (resolveReloadMode(pin) === RELOAD_MODES.MOUNTED) pin.mount(this.container);
        else pin._reconcile();
      }
      if (this.renderer) {
        this.renderer.attach(pin);
      }
      if (pin.reload === RELOAD_STRATEGIES.LAZY && pin.active) {
        this.loadChildrenFor(pin);
      }
      return pin;
    }
    /* ------------------ LAZY CHILDREN PROVIDER ------------------ */
    /**
     * Provision a lazy Pin's children exactly once (see `LazyChildrenLoader`).
     *
     * A provider run is a state change no sighted-only signal covers - the scope
     * simply fills in - so the *first* run, and only the first, is announced.
     * Callers that arrive while a flight is in progress, or after it finished,
     * get the loader's own promise untouched, so single-flight identity and the
     * cached-result path both behave exactly as before.
     *
     * @returns {Promise<Pin[]>} the Pins created by the provider
     */
    loadChildrenFor(pin, context = {}) {
      const provisioning = Boolean(pin) && !pin._childrenLoaded && !pin._childrenLoading;
      const flight = this.childrenLoader.load(pin, context);
      if (!provisioning) return flight;
      return flight.then((created) => {
        announceProvision(this.session, pin, created);
        return created;
      });
    }
    /**
     * Destroy every child subtree of a Pin, keeping the manager's registries and
     * indices clean. The Pin itself is untouched.
     *
     * @returns {number} how many direct child subtrees were removed
     */
    removeSubtreeChildren(pin) {
      if (!pin) return 0;
      let removed = 0;
      for (const child of Array.from(pin.children)) {
        if (this.pins.has(child.id)) {
          if (this.removePin(child.id)) removed += 1;
        } else {
          child.destroy();
          removed += 1;
        }
      }
      pin.children.clear();
      return removed;
    }
    /**
     * Remove and destroy a Pin along with its entire subtree.
     * Pin.destroy() recursively destroys children and clears the child sets,
     * so the subtree is collected before destruction.
     */
    removePin(id) {
      const pin = this.pins.get(id);
      if (!pin) return false;
      const subtree = this._collectSubtree(pin);
      if (pin.parent) {
        pin.parent.removeChild(pin);
      }
      pin.destroy();
      for (const member of subtree) {
        this._deregister(member);
      }
      return true;
    }
    /**
     * Collect a Pin and all of its descendants (depth-first, cycle-safe)
     */
    _collectSubtree(pin) {
      const collected = [];
      const seen = /* @__PURE__ */ new Set();
      const stack = [pin];
      while (stack.length > 0) {
        const current = stack.pop();
        if (!current || seen.has(current)) continue;
        seen.add(current);
        collected.push(current);
        if (current.children) {
          for (const child of current.children) {
            stack.push(child);
          }
        }
      }
      return collected;
    }
    /**
     * Detach a single Pin from the manager, particle engine, and indices.
     * The particle engine keys by particle.id, which may differ from pin.id
     * when a pre-built particle is supplied.
     */
    _deregister(pin) {
      const particleId = pin.particle ? pin.particle.id : pin.id;
      this.signals.detach(pin);
      if (this.renderer) this.renderer.forget(pin);
      this.pins.delete(pin.id);
      this.particleEngine.removePin(particleId);
      this.particleToPin.delete(particleId);
      this._unindexPin(pin);
      if (pin._manager === this) {
        pin._manager = null;
      }
    }
    /**
     * Retrieve a Pin by ID
     */
    getPin(id) {
      return this.pins.get(id);
    }
    /**
     * Every registered Pin, utility Pins included.
     *
     * Internal: the engine needs full membership (the cursor Pin is registered and
     * has to be found by id), while every caller-facing query below reports the
     * canvas as the user built it.
     */
    allPins() {
      return Array.from(this.pins.values());
    }
    /**
     * Get all registered Pins
     */
    getAllPins() {
      return visible(this.allPins());
    }
    /**
     * Get only root-level Pins (no parent)
     */
    getRootPins() {
      return visible(this.allPins().filter((p) => !p.parent));
    }
    /**
     * Get only currently active Pins
     */
    getActivePins() {
      return visible(this.allPins().filter((p) => p.active));
    }
    /* ------------------ CAPABILITY & TRAIT INDICES ------------------ */
    /** Add every trait name and capability of a Pin to the indices. */
    _indexPin(pin) {
      return indexPin(this, pin);
    }
    /** Drop every index entry belonging to a Pin. */
    _unindexPin(pin) {
      return unindexPin(this, pin);
    }
    /**
     * Recompute index entries for a Pin whose traits changed.
     * Called by Pin.addTrait / Pin.removeTrait / Pin.destroy.
     */
    reindexPin(pin) {
      if (!pin || !this.pins.has(pin.id)) return false;
      this._unindexPin(pin);
      this._indexPin(pin);
      return true;
    }
    /**
     * Get all Pins possessing traits with a specific capability
     */
    getPinsByCapability(capability) {
      return visible(this.indexedByCapability(capability));
    }
    /**
     * Get all Pins carrying a trait by name
     */
    getPinsByTrait(traitName) {
      return visible(this.indexedByTrait(traitName));
    }
    /**
     * Raw index reads, utility Pins included. The global SVG pass walks the trait
     * index itself; these are for callers that need the same unfiltered view.
     */
    indexedByTrait(traitName) {
      const bucket = this.traitIndex.get(traitName);
      return bucket ? Array.from(bucket) : [];
    }
    indexedByCapability(capability) {
      const bucket = this.capabilityIndex.get(capability);
      return bucket ? Array.from(bucket) : [];
    }
    /**
     * Mount all root Pins into container
     */
    mountAll(container = this.container) {
      if (!container) return;
      this.container = container;
      for (const pin of this.pins.values()) {
        if (pin.parent) continue;
        if (resolveReloadMode(pin) === RELOAD_MODES.MOUNTED) pin.mount(container);
        else pin._reconcile();
      }
    }
    /**
     * Run simulation tick on all active Pins
     */
    tickAll(dt = 1, context = {}) {
      for (const pin of this.pins.values()) {
        if (!pin.parent) {
          pin.tick(dt, context);
        }
      }
    }
    /**
     * Render all root Pins (which recursively render active children).
     *
     * Not used by the session loop any more - the ConjugateRenderer owns per-frame
     * work. Kept as an explicit, synchronous full-graph render for headless callers.
     */
    renderAll(context = {}) {
      for (const pin of this.pins.values()) {
        if (!pin.parent) {
          pin.render(context);
        }
      }
    }
    /**
     * Resolve spatial-query particles back to their owning Pins.
     * Particles belonging to no registered Pin are dropped.
     */
    _pinsForParticles(particles) {
      const pins = [];
      for (const particle of particles) {
        const pin = this.pins.get(this.particleToPin.get(particle.id));
        if (pin && !pin.utility) pins.push(pin);
      }
      return pins;
    }
    /**
     * Find Pins within a circular radius of (x, y)
     */
    queryRadius(x, y, radius) {
      return this._pinsForParticles(this.particleEngine.queryRadius(x, y, radius));
    }
    /**
     * Find Pins within a bounding box
     */
    queryBox(minX, minY, maxX, maxY) {
      return this._pinsForParticles(this.particleEngine.queryBox(minX, minY, maxX, maxY));
    }
    /**
     * Remove and clean up all Pins
     */
    clear() {
      for (const pin of this.pins.values()) {
        pin.destroy();
        this.signals.detach(pin);
        if (this.renderer) this.renderer.forget(pin);
        this._unindexPin(pin);
        if (pin._manager === this) {
          pin._manager = null;
        }
      }
      this.pins.clear();
      this.particleToPin.clear();
      this.capabilityIndex.clear();
      this.traitIndex.clear();
      this.particleEngine.clear();
    }
  };

  // engine/svg-groups.js
  var SVG_NS2 = "http://www.w3.org/2000/svg";
  var GLOBAL_RENDER_CAPABILITY = "global-render";
  var NO_VERSION = -1;
  var ALLOW_ALL = () => true;
  function globalRenderTraits(manager, allows = ALLOW_ALL) {
    const found = [];
    if (!manager || !manager.traitIndex) return found;
    for (const [name, bucket] of manager.traitIndex) {
      if (!bucket || bucket.size === 0) continue;
      const carriers = Array.from(bucket);
      const trait = carriers[0].traits.get(name);
      if (!trait || typeof trait.onGlobalUpdate !== "function") continue;
      if (typeof trait.hasCapability !== "function") continue;
      if (!trait.hasCapability(GLOBAL_RENDER_CAPABILITY)) continue;
      found.push({ name, trait, pins: carriers.filter(allows) });
    }
    return found;
  }
  function participationOf(context) {
    return context && typeof context.participates === "function" ? context.participates : ALLOW_ALL;
  }
  function revisionOf(entry) {
    let sum = 0;
    for (const pin of entry.pins) {
      const trait = pin.traits instanceof Map ? pin.traits.get(entry.name) : null;
      if (trait && typeof trait.revision === "number") sum += trait.revision;
    }
    return sum;
  }
  function dependencyChanged(entry, frame) {
    for (const pin of entry.pins) {
      const trait = pin.traits instanceof Map ? pin.traits.get(entry.name) : null;
      if (!trait || typeof trait.collectRenderDependencies !== "function") continue;
      const dependencies = trait.collectRenderDependencies(pin, frame.context);
      if (!dependencies) continue;
      for (const dependency of dependencies) {
        if (frame.isDirty(dependency)) return true;
      }
    }
    return false;
  }
  var SvgGroupLayer = class {
    constructor(options = {}) {
      this.element = options.element || null;
      this.groups = /* @__PURE__ */ new Map();
    }
    /**
     * Point the layer at an `<svg>` host. Group records are dropped with the old
     * host: the elements belonged to it, so they must be rebuilt in the new one.
     */
    setElement(element) {
      const next = element || null;
      if (next === this.element) return this.element;
      this.element = next;
      this.groups.clear();
      return this.element;
    }
    /** The `<g>` for a trait name, or null when it has never been rendered. */
    getGroup(traitName) {
      const record = this.groups.get(traitName);
      return record ? record.element : null;
    }
    /**
     * Render every global trait group.
     *
     * @param {object} frame
     * @param {PinManager} frame.manager      - source of the trait index
     * @param {object}     frame.context      - the frame context handed to traits
     * @param {number}     frame.viewportVersion
     * @param {(pin: Pin) => boolean} frame.isDirty
     * @returns {number} how many groups were rewritten
     */
    render(frame) {
      if (!this.element) return 0;
      let written = 0;
      const live = /* @__PURE__ */ new Set();
      for (const entry of globalRenderTraits(frame.manager, participationOf(frame.context))) {
        live.add(entry.name);
        if (this._renderTrait(entry, frame)) written += 1;
      }
      this._dropGroups(live);
      return written;
    }
    /**
     * Update one trait's group when - and only when - its inputs moved.
     *
     * The `<g>` is materialised first so `onGlobalBuild` has a host to populate,
     * and the build runs exactly once per group: the bindings it returns are kept
     * on the record and reused, so every later change is an `onGlobalUpdate` that
     * mutates the existing subtree rather than rebuilding it.
     */
    _renderTrait(entry, frame) {
      const record = this._record(entry.name);
      const revision = revisionOf(entry);
      if (!this._traitChanged(record, entry, revision, frame)) return false;
      record.viewportVersion = frame.viewportVersion;
      record.pinCount = entry.pins.length;
      record.revision = revision;
      const host = this._element(entry.name, record);
      if (!record.bindings) {
        record.bindings = entry.trait.onGlobalBuild(host, entry.pins, frame.context) || { host };
      }
      entry.trait.onGlobalUpdate(record.bindings, entry.pins, frame.context);
      return true;
    }
    /**
     * True when a trait group's rendered output can no longer be trusted.
     *
     * The cheap whole-group answers are asked first, so an idle frame costs three
     * integer comparisons per group before anything is walked and nothing at all
     * is allocated.
     *
     * The camera is the *opt-in* one. This layer carries the same transform as the
     * plane, so a trait drawing in canvas coordinates - every built-in one, the
     * connectors included - is still correct after a pan or a zoom without being
     * rewritten, and rewriting it would rebuild every path in the document on
     * every frame of a camera animation. A trait that projects to screen space
     * itself declares `screenSpace = true` and gets the old behaviour.
     */
    _traitChanged(record, entry, revision, frame) {
      const cameraMoved = record.viewportVersion !== frame.viewportVersion;
      if (cameraMoved && entry.trait.screenSpace === true) return true;
      if (record.pinCount !== entry.pins.length) return true;
      if (record.revision !== revision) return true;
      for (const pin of entry.pins) {
        if (frame.isDirty(pin)) return true;
      }
      return dependencyChanged(entry, frame);
    }
    /** Per-trait render bookkeeping; the element itself stays unbuilt until used. */
    _record(traitName) {
      let record = this.groups.get(traitName);
      if (!record) {
        record = {
          element: null,
          bindings: null,
          viewportVersion: NO_VERSION,
          pinCount: NO_VERSION,
          revision: NO_VERSION
        };
        this.groups.set(traitName, record);
      }
      return record;
    }
    /** The trait's `<g>`, created and appended on first use. */
    _element(traitName, record) {
      if (record.element) return record.element;
      const group = document.createElementNS(SVG_NS2, "g");
      group.setAttribute("data-trait", traitName);
      this.element.appendChild(group);
      record.element = group;
      return group;
    }
    /** Retire groups whose trait left the index (last carrier Pin removed). */
    _dropGroups(live) {
      for (const [name, record] of Array.from(this.groups)) {
        if (live.has(name)) continue;
        if (record.element && record.element.parentNode) {
          record.element.parentNode.removeChild(record.element);
        }
        this.groups.delete(name);
      }
    }
    /** Detach every group from the layer and forget them. */
    clear() {
      for (const record of this.groups.values()) {
        if (record.element && record.element.parentNode) {
          record.element.parentNode.removeChild(record.element);
        }
      }
      this.groups.clear();
    }
  };

  // engine/scope-well.js
  var ScopeWellPass = class {
    constructor() {
      this._applied = /* @__PURE__ */ new WeakMap();
      this._dirty = /* @__PURE__ */ new Set();
    }
    /** Record that a parent's well may have changed for a reason nothing else saw. */
    invalidate(parent) {
      if (!parent) return false;
      this._dirty.add(parent);
      return true;
    }
    /**
     * Size every well whose contents may have moved.
     *
     * @param {object} frame
     * @param {Iterable<Pin>} frame.frameDirty  Pins that changed this frame
     * @param {(pin: Pin) => boolean} frame.isLive  participation test
     * @param {(parent: Pin) => void} frame.onWrite  called for each rewritten well
     * @returns {number} how many wells were rewritten
     */
    update(frame) {
      const parents = this._parents(frame.frameDirty);
      if (parents.size === 0) return 0;
      let written = 0;
      for (const parent of parents) {
        if (!this._apply(parent, frame.isLive)) continue;
        frame.onWrite(parent);
        written += 1;
      }
      return written;
    }
    /** Every parent whose well this frame could have changed. */
    _parents(frameDirty) {
      const parents = new Set(this._dirty);
      this._dirty.clear();
      for (const pin of frameDirty) {
        if (pin.parent) parents.add(pin.parent);
      }
      return parents;
    }
    /** Write one parent's well, only when its quantized state actually moved. */
    _apply(parent, isLive) {
      const scope = parent.scopeElement;
      if (!scope || !scope.style) return false;
      const { height, populated } = extentOf(parent, isLive);
      const flow = isFlowParent(parent);
      const applied = this._applied.get(parent);
      if (applied && applied.height === height && applied.populated === populated && applied.flow === flow) return false;
      this._applied.set(parent, { height, populated, flow });
      scope.style.minHeight = populated && !flow ? `${height}px` : "";
      if (scope.classList) scope.classList.toggle(SCOPE_POPULATED_CLASS, populated);
      return true;
    }
    clear() {
      this._dirty.clear();
    }
  };
  function isFlowParent(parent) {
    return Boolean(parent && parent.layout && parent.layout !== "free");
  }
  function extentOf(parent, isLive) {
    let extent = 0;
    let populated = false;
    for (const child of parent.children) {
      if (!isLive(child)) continue;
      populated = true;
      const bottom = child.particle.y + child.particle.height;
      if (bottom > extent) extent = bottom;
    }
    return { height: Math.ceil(extent), populated };
  }

  // engine/offload.js
  var DEFAULT_OFFLOAD_MARGIN = 400;
  function visibleCanvasRect(viewport, hostRect) {
    const left = hostRect.left || 0;
    const top = hostRect.top || 0;
    const width = hostRect.width || 0;
    const height = hostRect.height || 0;
    const topLeft = viewport.screenToCanvas(left, top, hostRect);
    const bottomRight = viewport.screenToCanvas(left + width, top + height, hostRect);
    return {
      minX: topLeft.x,
      minY: topLeft.y,
      maxX: bottomRight.x,
      maxY: bottomRight.y
    };
  }
  function resolveOffloadMargin(pin, defaultMargin) {
    return typeof pin.offloadMargin === "number" ? pin.offloadMargin : defaultMargin;
  }
  function isOutsideViewport(bounds, rect, margin) {
    return bounds.maxX < rect.minX - margin || bounds.minX > rect.maxX + margin || bounds.maxY < rect.minY - margin || bounds.minY > rect.maxY + margin;
  }
  function runOffloadSweep(renderer, context) {
    if (renderer._offloadPins.size === 0) return 0;
    const session = renderer.session;
    const viewport = context.viewport || (session ? session.viewport : null);
    const hostRect = context.hostRect || (session ? session._hostRect : null);
    const changed = renderer.offloadPass.sweep({
      renderer,
      pins: renderer._offloadPins,
      viewport,
      hostRect,
      viewportVersion: renderer.viewportVersion,
      defaultMargin: renderer._offloadMargin,
      force: renderer._offloadPending
    });
    renderer._offloadPending = false;
    return changed;
  }
  var OffloadPass = class {
    constructor() {
      this._sweptVersion = -1;
    }
    /**
     * Bring every offload Pin's dormant flag in line with the current camera.
     *
     * Runs only when the camera moved since the last sweep, or when `force` is set
     * (a newly adopted offload Pin needs one evaluation even under a still camera).
     * A Pin whose in/out state actually changed is reconciled, so the renderer's
     * next structure flush detaches or reattaches it through the ordinary path.
     *
     * @param {object} args
     * @param {import('./renderer.js').ConjugateRenderer} args.renderer
     * @param {Iterable<import('../pins/pin.js').Pin>} args.pins offload Pins to test
     * @param {import('./viewport.js').Viewport|null} args.viewport
     * @param {object|null} args.hostRect
     * @param {number} args.viewportVersion current camera version
     * @param {number} args.defaultMargin session-level margin
     * @param {boolean} [args.force] evaluate even if the camera did not move
     * @returns {number} how many Pins changed offload state this sweep
     */
    sweep({ renderer, pins, viewport, hostRect, viewportVersion, defaultMargin, force = false }) {
      if (!force && viewportVersion === this._sweptVersion) return 0;
      this._sweptVersion = viewportVersion;
      if (!viewport || !hostRect) return 0;
      const rect = visibleCanvasRect(viewport, hostRect);
      let changed = 0;
      for (const pin of pins) {
        if (pin.parent) continue;
        if (this._reconcileOne(renderer, pin, rect, defaultMargin)) changed += 1;
      }
      return changed;
    }
    /**
     * Test one Pin and, if its offload state flipped, raise or lower its dormant
     * flag and hand it to the renderer to detach or reattach.
     *
     * @returns {boolean} true when the Pin's state changed
     */
    _reconcileOne(renderer, pin, rect, defaultMargin) {
      const margin = resolveOffloadMargin(pin, defaultMargin);
      const outside = isOutsideViewport(pin.getGlobalBounds(), rect, margin);
      if (outside === Boolean(pin._offloadDormant)) return false;
      pin._offloadDormant = outside;
      renderer.reconcile(pin);
      return true;
    }
    /** Forget the last-swept version, so the next sweep runs unconditionally. */
    reset() {
      this._sweptVersion = -1;
    }
  };

  // engine/renderer.js
  var ConjugateRenderer = class {
    constructor(options = {}) {
      this.session = options.session || null;
      this.planeElement = options.planeElement || null;
      this.pinManager = options.pinManager || null;
      this.svgLayer = new SvgGroupLayer({ element: options.svgLayerElement || null });
      this.rootScope = new RenderRootScope();
      this._frameDirty = /* @__PURE__ */ new Set();
      this._isGlobalDirty = this.isGlobalDirty.bind(this);
      this.activeSet = /* @__PURE__ */ new Set();
      this.liveSet = /* @__PURE__ */ new Set();
      this.dirtyContent = /* @__PURE__ */ new Set();
      this.dirtyStructure = /* @__PURE__ */ new Set();
      this.measureQueue = /* @__PURE__ */ new Set();
      this.viewportVersion = 0;
      this._appliedViewportVersion = -1;
      this._appliedPos = /* @__PURE__ */ new WeakMap();
      this.scopeWells = new ScopeWellPass();
      this.motionHints = new MotionHintSet();
      this.offloadPass = new OffloadPass();
      this._offloadPins = /* @__PURE__ */ new Set();
      this._offloadMargin = typeof options.offloadMargin === "number" ? options.offloadMargin : DEFAULT_OFFLOAD_MARGIN;
      this._offloadPending = false;
      this._isLive = (pin) => this.liveSet.has(pin);
      this._onWellWritten = (parent) => this._afterWellWritten(parent);
      this.frameCount = 0;
    }
    /* ------------------ MEMBERSHIP ------------------ */
    /**
     * Adopt a Pin: it is mounted, measured, and rendered on the next frame, and
     * any invalidation it recorded before the renderer existed is replayed.
     */
    attach(pin) {
      if (!pin || this.activeSet.has(pin)) return false;
      this.activeSet.add(pin);
      pin._renderer = this;
      if (pin.offload) {
        this._offloadPins.add(pin);
        this._offloadPending = true;
      }
      this.dirtyStructure.add(pin);
      this.dirtyContent.add(pin);
      if (pin.element) this.measureQueue.add(pin);
      if (typeof pin.takePendingInvalidations === "function") {
        for (const kind of pin.takePendingInvalidations()) {
          this.invalidate(pin, kind);
        }
      }
      return true;
    }
    /** Drop a Pin from every set. Idempotent; leaves the DOM untouched. */
    forget(pin) {
      if (!pin) return false;
      const owned = this.activeSet.delete(pin);
      this.liveSet.delete(pin);
      this.dirtyContent.delete(pin);
      this.dirtyStructure.delete(pin);
      this.measureQueue.delete(pin);
      this._offloadPins.delete(pin);
      this._appliedPos.delete(pin);
      this.motionHints.delete(pin);
      this.scopeWells.invalidate(pin.parent);
      if (pin._renderer === this) pin._renderer = null;
      return owned;
    }
    isAttached(pin) {
      return this.activeSet.has(pin);
    }
    /** True when a Pin takes part in per-frame work (mounted and awake). */
    isLive(pin) {
      return this.liveSet.has(pin);
    }
    /**
     * Point the renderer at the canvas plane. Every owned Pin is re-mounted on the
     * next frame and the plane transform is rewritten.
     */
    setPlaneElement(element) {
      this.planeElement = element || null;
      this._appliedViewportVersion = -1;
      this._reconcileAll();
      return this.planeElement;
    }
    /** Point the global SVG pass at the session's `.cloudcanvas-svg-layer`. */
    setSvgLayerElement(element) {
      this._appliedViewportVersion = -1;
      return this.svgLayer.setElement(element);
    }
    /* ------------------ RENDER ROOT ------------------ */
    /** The promoted render root, or null when the whole canvas renders. */
    get renderRoot() {
      return this.rootScope.pin;
    }
    /**
     * Promote a Pin to render root, or restore the whole canvas with `null`.
     *
     * Everything outside the promoted subtree and its breadcrumb demotes per its
     * own reload strategy on the next structure flush - the same flush, the same
     * policy, and the same three DOM states as every other membership change.
     *
     * @returns {Pin|null} the new render root
     */
    setRenderRoot(pin = null) {
      if (this.rootScope.set(pin)) this._reconcileAll();
      return this.rootScope.pin;
    }
    /** Whether the current render root lets a Pin take part at all. */
    participates(pin) {
      return this.rootScope.allows(pin);
    }
    /** Queue every owned Pin for re-evaluation by the next structure flush. */
    _reconcileAll() {
      for (const pin of this.activeSet) {
        this.dirtyStructure.add(pin);
      }
      return this.dirtyStructure.size;
    }
    /* ------------------ INVALIDATION ------------------ */
    /**
     * Queue work for an owned Pin.
     * @param {'content'|'structure'} kind
     */
    invalidate(pin, kind = "content") {
      if (kind !== "content" && kind !== "structure") {
        throw new TypeError(`ConjugateRenderer.invalidate: unknown kind "${kind}"`);
      }
      if (!pin || !this.activeSet.has(pin)) return false;
      if (kind === "content") this.dirtyContent.add(pin);
      else this.dirtyStructure.add(pin);
      return true;
    }
    /**
     * Queue a Pin whose reload state changed (activation, deactivation, focus,
     * re-parenting). The strategy is executed by the next structure flush, so a
     * burst of activations costs exactly one DOM pass.
     */
    reconcile(pin) {
      return this.invalidate(pin, "structure");
    }
    /** Queue a Pin for the next batched read phase. */
    enqueueMeasure(pin) {
      if (!pin || !pin.element) return false;
      this.measureQueue.add(pin);
      return true;
    }
    /**
     * Forget a Pin's last-applied transform, so the next write phase re-applies it
     * unconditionally. Called by `syncFlowChild` (`../pins/pin-element.js`) on every
     * crossing of the flow-child boundary: entering flow the cached value must not
     * suppress a later re-write, and leaving flow the transform the Pin now needs
     * would otherwise be skipped as unchanged against a stale cache entry.
     *
     * @returns {boolean} whether a cached position was actually dropped
     */
    clearAppliedPosition(pin) {
      return this._appliedPos.delete(pin);
    }
    /** Signal that the camera moved; the plane transform is rewritten next frame. */
    bumpViewportVersion() {
      this.viewportVersion += 1;
      return this.viewportVersion;
    }
    /* ------------------ FRAME ------------------ */
    /**
     * Execute one render frame.
     * @returns {number} the number of frames rendered so far
     */
    frame(context = {}) {
      this._frameDirty.clear();
      runOffloadSweep(this, context);
      this._flushStructure();
      this._readPhase();
      this._writePhase(context);
      this.frameCount += 1;
      return this.frameCount;
    }
    /**
     * Phase 1: DOM membership, in `./mounting.js` - the module that owns every
     * move of a Pin's root element.
     */
    _flushStructure() {
      return flushStructure(this);
    }
    /** Put one Pin into the DOM state a mode asks for (`./mounting.js`). */
    _applyMode(pin, mode) {
      return applyMode(this, pin, mode);
    }
    /** Phase 2: every layout read of the frame happens here, before any write. */
    _readPhase() {
      if (this.measureQueue.size === 0) return 0;
      const queued = Array.from(this.measureQueue);
      this.measureQueue.clear();
      let measured = 0;
      for (const pin of queued) {
        if (!pin.element) continue;
        if (isDormant(pin)) continue;
        if (this._measure(pin)) measured += 1;
      }
      return measured;
    }
    /**
     * Measure one Pin, recording a geometry change for the global SVG pass.
     * A resize moves a Pin's bounds just as much as a translation does, so
     * connectors anchored to its centre have to be redrawn - and so does a flow
     * child whose flex/grid origin shifted without its particle moving at all.
     */
    _measure(pin) {
      const { width, height } = pin.particle;
      const offset = pin._scopeOffset;
      const scopeX = offset ? offset.x : 0;
      const scopeY = offset ? offset.y : 0;
      const flow = pin._flowOrigin;
      const wasFlow = Boolean(flow);
      const flowX = flow ? flow.x : 0;
      const flowY = flow ? flow.y : 0;
      if (!pin.measureLayout()) return false;
      const sizeChanged = pin.particle.width !== width || pin.particle.height !== height;
      const scopeChanged = Boolean(pin._scopeOffset && (pin._scopeOffset.x !== scopeX || pin._scopeOffset.y !== scopeY));
      const flowNow = pin._flowOrigin;
      const flowChanged = Boolean(flowNow) !== wasFlow || Boolean(flowNow && (flowNow.x !== flowX || flowNow.y !== flowY));
      if (sizeChanged || scopeChanged || flowChanged) this._frameDirty.add(pin);
      if (sizeChanged) this._reflowFlowNeighbours(pin);
      return true;
    }
    /**
     * Re-queue the flow children whose live origin a measured size change moved.
     *
     * `pin` resized this frame. If it is a flow container, every child it holds may
     * have been re-laid; if it is itself a flow child, its later siblings were
     * pushed along the flow axis. Either way the affected set is one container's
     * live children, so they rejoin the next read phase - which is what refreshes
     * their `_flowOrigin` (and, for a resized child, its container's own box).
     *
     * This is the flow analogue of the scope-well pass's one-level-per-frame
     * convergence: a flow subtree's measurement writes no layout (no transform for a
     * flow child, no min-height for a flow well), so re-reading it cannot change it,
     * and the upstream size-change gate stops the cascade the moment a size repeats.
     *
     * @returns {number} how many Pins were queued
     */
    _reflowFlowNeighbours(pin) {
      let container = null;
      if (isFlowParent(pin)) container = pin;
      else if (pin.parent && isFlowParent(pin.parent)) container = pin.parent;
      if (!container) return 0;
      let queued = 0;
      if (container !== pin && container.element) {
        this.measureQueue.add(container);
        queued += 1;
      }
      for (const child of container.children) {
        if (!this.liveSet.has(child) || !child.element) continue;
        this.measureQueue.add(child);
        queued += 1;
      }
      return queued;
    }
    /**
     * Phase 3: content for dirty Pins, transforms for moved Pins, plane transform
     * for a moved camera.
     */
    _writePhase(context) {
      this._writeContents(context);
      for (const pin of this.liveSet) {
        this._applyPosition(pin);
      }
      this.motionHints.sweep(this.frameCount);
      this.scopeWells.update({
        frameDirty: this._frameDirty,
        isLive: this._isLive,
        onWrite: this._onWellWritten
      });
      this._applyPlaneTransform(context);
      this._renderSvgGroups(context);
    }
    /**
     * A rewritten well changed its parent's box and its scope offset, so the
     * parent is measured again next frame - which is what carries the new size one
     * level further up the chain.
     */
    _afterWellWritten(parent) {
      this.measureQueue.add(parent);
      this._frameDirty.add(parent);
    }
    /**
     * Phase 3c: the global SVG pass, gated per trait group.
     * Runs last, so every group sees this frame's final geometry.
     */
    _renderSvgGroups(context) {
      const session = this.session;
      return this.svgLayer.render({
        manager: this.pinManager || (session ? session.pinManager : null),
        context,
        viewportVersion: this.viewportVersion,
        isDirty: this._isGlobalDirty
      });
    }
    /**
     * Whether a Pin's *global* geometry or contents changed this frame.
     *
     * Global bounds are cumulative over the scope chain, so an ancestor that moved
     * drags every descendant with it even though no descendant particle changed.
     *
     * Public because the frame's dirt outlives `frame()`: the session's cursor pass
     * runs immediately afterwards and gates itself on exactly this answer.
     */
    isGlobalDirty(pin) {
      let node = pin;
      for (let depth = 0; node && depth < MAX_DEPTH; depth += 1) {
        if (this._frameDirty.has(node)) return true;
        node = node.parent;
      }
      return false;
    }
    /**
     * Render contents for live, dirty Pins.
     *
     * A dirty Pin that is asleep keeps its flag rather than losing the update: it
     * renders once, on the frame it wakes up.
     */
    _writeContents(context) {
      if (this.dirtyContent.size === 0) return 0;
      const dirty = Array.from(this.dirtyContent);
      this.dirtyContent.clear();
      let rendered = 0;
      for (const pin of dirty) {
        if (!this.activeSet.has(pin) || !pin.element) continue;
        if (!this.liveSet.has(pin)) {
          this.dirtyContent.add(pin);
          continue;
        }
        pin.renderContent(context);
        this.measureQueue.add(pin);
        this._frameDirty.add(pin);
        this._reflowFlowNeighbours(pin);
        rendered += 1;
      }
      return rendered;
    }
    /**
     * Write a Pin's transform only when its particle actually moved.
     * The comparison is three floats, so physics motion is caught without any
     * per-frame DOM read or string build for stationary Pins.
     */
    _applyPosition(pin) {
      if (!pin.element || !pin.element.style) return false;
      const parent = pin.parent;
      if (parent && parent.layout && parent.layout !== "free") return false;
      const particle = pin.particle;
      let applied = this._appliedPos.get(pin);
      if (applied && applied[0] === particle.x && applied[1] === particle.y && applied[2] === particle.z) {
        return false;
      }
      if (!applied) {
        applied = new Float64Array(3);
        this._appliedPos.set(pin, applied);
      }
      applied[0] = particle.x;
      applied[1] = particle.y;
      applied[2] = particle.z;
      pin.renderPosition();
      this.motionHints.mark(pin, this.frameCount);
      this._frameDirty.add(pin);
      return true;
    }
    /**
     * Rewrite the camera transform only when the viewport version moved.
     *
     * The SVG layer gets the *same* string as the plane. That is what makes a
     * connector correct at zoom: both are drawn in canvas coordinates and both are
     * projected by one transform, instead of the layer re-deriving screen-space
     * endpoints and drifting from the boxes it is joining.
     */
    _applyPlaneTransform(context) {
      if (this._appliedViewportVersion === this.viewportVersion) return false;
      const viewport = context.viewport || (this.session ? this.session.viewport : null);
      if (!viewport || !this.planeElement || !this.planeElement.style) return false;
      const transform = viewport.getTransformString();
      this.planeElement.style.transform = transform;
      const svgElement = this.svgLayer.element;
      if (svgElement && svgElement.style) svgElement.style.transform = transform;
      this._appliedViewportVersion = this.viewportVersion;
      return true;
    }
    /* ------------------ HELPERS ------------------ */
    /** Release every Pin. The DOM is left as-is; callers own teardown. */
    clear() {
      for (const pin of Array.from(this.activeSet)) {
        this.forget(pin);
      }
      this.dirtyContent.clear();
      this.dirtyStructure.clear();
      this.measureQueue.clear();
      this.liveSet.clear();
      this._frameDirty.clear();
      this._offloadPins.clear();
      this._offloadPending = false;
      this.offloadPass.reset();
      this.scopeWells.clear();
      this.motionHints.clear();
      this.rootScope.clear();
      this.svgLayer.clear();
    }
  };

  // pins/cursor.js
  var SVG_NS3 = "http://www.w3.org/2000/svg";
  var CURSOR_PIN_ID = "__cursor__";
  var CURSOR_CAPABILITY = "cursor";
  var CURSOR_FOCUS = "cursor-focus";
  var CURSOR_SELECTED = "cursor-selected";
  var CURSOR_ACTIVATED = "cursor-activated";
  var CURSOR_TRAIT_NAMES = Object.freeze([CURSOR_FOCUS, CURSOR_SELECTED, CURSOR_ACTIVATED]);
  var CURSOR_LAYER_CLASS = "cloudcanvas-cursor-layer";
  var NO_VERSION2 = -1;
  var CURSOR_FOCUS_COLOR = "var(--cc-cursor-focus, var(--cc-focus, #833446))";
  var CURSOR_SELECTED_COLOR = "var(--cc-cursor-selected, #38bdf8)";
  var CURSOR_ACTIVATED_COLOR = "var(--cc-cursor-activated, #34d399)";
  var CURSOR_LABEL_COLOR = "var(--cc-cursor-label, var(--cc-text, #e2e8f0))";
  var DEFAULT_HOST_RECT = Object.freeze({ width: 800, height: 600, left: 0, top: 0 });
  var LAYER_STYLE = "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:visible;";
  function createCursorLayer(overlayElement) {
    if (!overlayElement || typeof document === "undefined") return null;
    const existing = overlayElement.querySelector(`svg.${CURSOR_LAYER_CLASS}`);
    if (existing) return existing;
    const layer = document.createElementNS(SVG_NS3, "svg");
    layer.setAttribute("class", CURSOR_LAYER_CLASS);
    layer.setAttribute("style", LAYER_STYLE);
    overlayElement.appendChild(layer);
    return layer;
  }
  function screenBoundsOf(pin, context = {}) {
    const hostRect = context.hostRect || DEFAULT_HOST_RECT;
    const viewport = context.viewport;
    const bounds = pin.getGlobalBounds();
    if (!viewport || typeof viewport.canvasToScreen !== "function") return bounds;
    const topLeft = viewport.canvasToScreen(bounds.minX, bounds.minY, hostRect);
    const bottomRight = viewport.canvasToScreen(bounds.maxX, bounds.maxY, hostRect);
    const left = hostRect.left || 0;
    const top = hostRect.top || 0;
    return {
      minX: topLeft.x - left,
      minY: topLeft.y - top,
      maxX: bottomRight.x - left,
      maxY: bottomRight.y - top
    };
  }
  function isPinMounted(pin) {
    const element = pin ? pin.element : null;
    if (!element) return Boolean(pin);
    return element.isConnected !== false;
  }
  function isPinVisible(pin, context = {}) {
    if (!pin || pin.active === false) return false;
    if (!isPinMounted(pin)) return false;
    const participates = context.participates;
    if (typeof participates === "function" && !participates(pin)) return false;
    return true;
  }
  var CursorTrait = class extends PinTrait {
    constructor(options = {}, fixed = {}) {
      super(options, {
        name: fixed.name,
        capabilities: [CURSOR_CAPABILITY, ...fixed.capabilities || []]
      });
      this.layer = options.layer || null;
      this.color = safeColor(options.color, fixed.color);
      this.padding = safeNumber(options.padding !== void 0 ? options.padding : fixed.padding, 8);
      this.label = options.label !== void 0 ? options.label : fixed.label || "";
      this.target = null;
      this._group = null;
      this._shape = null;
      this._drawnTarget = void 0;
      this._drawnVersion = NO_VERSION2;
      this._visible = false;
    }
    /**
     * Point the cursor at a Pin, or clear it with `null`.
     * @returns {boolean} true when the target actually changed
     */
    setTarget(pin) {
      const next = pin || null;
      if (next === this.target) return false;
      this.target = next;
      return true;
    }
    /** Re-host the cursor in another overlay layer, dropping the old group. */
    setLayer(element) {
      const next = element || null;
      if (next === this.layer) return this.layer;
      this.layer = next;
      this._group = null;
      this._shape = null;
      this._drawnTarget = void 0;
      this._drawnVersion = NO_VERSION2;
      this._visible = false;
      return this.layer;
    }
    /**
     * The target this cursor may draw on right now, or null when it has none or
     * the one it holds is not on screen.
     *
     * Withdrawing the drawing is not the same as forgetting the Pin: `this.target`
     * survives, so waking the Pin, remounting it, or popping back to a render root
     * that includes it brings the cursor straight back.
     */
    visibleTarget(context = {}) {
      return isPinVisible(this.target, context) ? this.target : null;
    }
    /**
     * Redraw when - and only when - this cursor's own inputs moved.
     *
     * @param {{context: object, viewportVersion: number, isDirty: (pin) => boolean}} frame
     * @returns {boolean} true when the DOM was written
     */
    renderCursor(frame) {
      if (!this.layer || !frame || !frame.context) return false;
      const target = this.visibleTarget(frame.context);
      if (!this._changed(target, frame)) return false;
      this._drawnTarget = target;
      this._drawnVersion = frame.viewportVersion;
      if (!target) return this._setVisible(false);
      this.draw(this.group(), screenBoundsOf(target, frame.context), frame.context);
      this._setVisible(true);
      return true;
    }
    /** True when the drawn output can no longer be trusted. */
    _changed(target, frame) {
      if (this._drawnTarget !== target) return true;
      if (this._drawnVersion !== frame.viewportVersion) return true;
      if (target && typeof frame.isDirty === "function") return frame.isDirty(target);
      return false;
    }
    /** The cursor's `<g>`, created inside the shared layer on first draw. */
    group() {
      if (this._group) return this._group;
      const group = document.createElementNS(SVG_NS3, "g");
      group.setAttribute("data-cursor", this.name);
      this.layer.appendChild(group);
      this._group = group;
      return group;
    }
    /** The cursor's one persistent shape node, created once with its static attributes. */
    shape(tag, attributes = {}) {
      if (this._shape) return this._shape;
      const node = document.createElementNS(SVG_NS3, tag);
      for (const [name, value] of Object.entries(attributes)) {
        node.setAttribute(name, value);
      }
      this.group().appendChild(node);
      this._shape = node;
      return node;
    }
    /** Show or hide the group, writing the attribute only on a real change. */
    _setVisible(visible2) {
      if (!this._group || this._visible === visible2) return false;
      this._group.setAttribute("display", visible2 ? "inline" : "none");
      this._visible = visible2;
      return true;
    }
    /**
     * The caption to draw, resolving the default to the target's own title.
     *
     * The title is read defensively: `contents` is a Map on a Pin, but a cursor
     * may be pointed at anything Pin-shaped, and a missing title is a blank
     * caption rather than a thrown frame.
     */
    resolveLabel() {
      if (this.label === null) return "";
      if (this.label) return this.label;
      const contents = this.target ? this.target.contents : null;
      if (!contents || typeof contents.get !== "function") return "";
      const title = contents.get("title");
      return typeof title === "string" ? title : "";
    }
    /**
     * Draw the cursor for a target's screen bounds. Implemented by subclasses.
     * @abstract
     */
    draw(group, screenBounds, context) {
    }
    /** A destroyed cursor Pin takes its groups out of the overlay with it. */
    onDetach() {
      if (this._group && this._group.parentNode) {
        this._group.parentNode.removeChild(this._group);
      }
      this._group = null;
      this._shape = null;
      this._drawnTarget = void 0;
      this._drawnVersion = NO_VERSION2;
      this._visible = false;
    }
  };
  var CursorFocusTrait = class extends CursorTrait {
    constructor(options = {}) {
      super(options, {
        name: CURSOR_FOCUS,
        color: CURSOR_FOCUS_COLOR,
        padding: 8,
        // No default caption: the reticle says the Pin's own title, not a sentence
        // about the framework's navigation model.
        label: ""
      });
      this.showFrustum = options.showFrustum !== void 0 ? Boolean(options.showFrustum) : true;
      this.labelColor = safeColor(options.labelColor, CURSOR_LABEL_COLOR);
    }
    draw(group, bounds, context) {
      group.innerHTML = this.frustum(bounds, context) + createFocusCursorSVG(bounds, {
        color: this.color,
        labelColor: this.labelColor,
        label: this.resolveLabel(),
        padding: this.padding
      });
    }
    /**
     * The frustum markup for this draw, or nothing.
     *
     * The spikes point from the *parent scope's* box to the focused Pin - that is
     * the whole statement the frustum makes, "this Pin sits inside that scope". A
     * Pin at the canvas root sits inside nothing, so it gets no frustum, and a
     * parent that has never been measured has no box to point from, so it gets
     * none either rather than four spikes collapsed onto the origin.
     */
    frustum(bounds, context) {
      if (!this.showFrustum) return "";
      const parent = this.target ? this.target.parent : null;
      if (!parent) return "";
      const parentBounds = screenBoundsOf(parent, context);
      if (!(parentBounds.maxX - parentBounds.minX > 0)) return "";
      return createFrustumProjectionSVG(parentBounds, bounds, { stroke: this.color });
    }
  };
  var CursorSelectedTrait = class extends CursorTrait {
    constructor(options = {}) {
      super(options, { name: CURSOR_SELECTED, color: CURSOR_SELECTED_COLOR, padding: 6 });
    }
    draw(group, bounds) {
      const node = this.shape("rect", {
        class: "cloudcanvas-cursor-selected",
        fill: "none",
        rx: 6,
        "stroke-width": 2,
        "stroke-dasharray": "3,3"
      });
      node.setAttribute("stroke", this.color);
      node.setAttribute("x", (bounds.minX - this.padding).toFixed(1));
      node.setAttribute("y", (bounds.minY - this.padding).toFixed(1));
      node.setAttribute("width", (bounds.maxX - bounds.minX + this.padding * 2).toFixed(1));
      node.setAttribute("height", (bounds.maxY - bounds.minY + this.padding * 2).toFixed(1));
    }
  };
  var CursorActivatedTrait = class extends CursorTrait {
    constructor(options = {}) {
      super(options, { name: CURSOR_ACTIVATED, color: CURSOR_ACTIVATED_COLOR, padding: 4 });
      this.armLength = safeNumber(options.armLength, 12);
    }
    draw(group, bounds) {
      const node = this.shape("path", {
        class: "cloudcanvas-cursor-activated",
        fill: "none",
        "stroke-width": 2,
        "stroke-linecap": "round"
      });
      node.setAttribute("stroke", this.color);
      node.setAttribute("d", bracketPath(bounds, this.padding, this.armLength));
    }
  };
  function bracketPath(bounds, padding, arm) {
    const x = bounds.minX - padding;
    const y = bounds.minY - padding;
    const right = bounds.maxX + padding;
    const bottom = bounds.maxY + padding;
    return [
      `M ${x} ${y + arm} L ${x} ${y} L ${x + arm} ${y}`,
      `M ${right - arm} ${y} L ${right} ${y} L ${right} ${y + arm}`,
      `M ${right} ${bottom - arm} L ${right} ${bottom} L ${right - arm} ${bottom}`,
      `M ${x + arm} ${bottom} L ${x} ${bottom} L ${x} ${bottom - arm}`
    ].join(" ");
  }
  var CURSOR_DEFINITIONS = Object.freeze([
    [CURSOR_FOCUS, CursorFocusTrait],
    [CURSOR_SELECTED, CursorSelectedTrait],
    [CURSOR_ACTIVATED, CursorActivatedTrait]
  ]);
  function registerCursorTraits(registry = traitRegistry) {
    for (const [name, ctor] of CURSOR_DEFINITIONS) {
      if (!registry.has(name)) registry.register(name, ctor);
    }
    return registry;
  }
  traitRegistry.registerDefaults(registerCursorTraits);
  function createCursorPin(session) {
    if (!session || !session.pinManager) return null;
    const layer = createCursorLayer(session.overlayElement);
    const traits = CURSOR_TRAIT_NAMES.filter((name) => traitRegistry.has(name)).map((name) => traitRegistry.create(name, { layer }));
    return session.pinManager.createPin({ id: CURSOR_PIN_ID, utility: true, traits });
  }
  function renderCursors(pin, frame) {
    if (!pin || !pin.traits) return 0;
    let written = 0;
    for (const trait of pin.traits.values()) {
      if (typeof trait.renderCursor !== "function") continue;
      if (trait.renderCursor(frame)) written += 1;
    }
    return written;
  }

  // engine/elevation.js
  var ELEVATED_CLASS = "cc-elevated";
  var DRAG_CHAIN_CLASS = "cc-dragging";
  function setElevationChain(pin, className, on) {
    if (!pin || !className) return 0;
    let written = 0;
    let node = pin;
    for (let depth = 0; node && depth < MAX_DEPTH; depth += 1) {
      const classList = node.element ? node.element.classList : null;
      if (classList) {
        if (on) classList.add(className);
        else classList.remove(className);
        written += 1;
      }
      node = node.parent;
    }
    return written;
  }

  // engine/navigation.js
  var DEFAULT_HOST_RECT2 = Object.freeze({ width: 800, height: 600, left: 0, top: 0 });
  var VEIL_ACTIVE_CLASS = "is-active";
  function resolvePin(session, pinOrId) {
    if (!pinOrId) return null;
    const pin = typeof pinOrId === "string" ? session.pinManager.getPin(pinOrId) : pinOrId;
    return pin && !pin.utility ? pin : null;
  }
  function setFocusCursor(session, pin) {
    if (typeof session.setCursorTarget !== "function") return false;
    return session.setCursorTarget(CURSOR_FOCUS, pin || null);
  }
  function setFocusPresentation(session, previous, next) {
    if (previous && previous !== next) setElevationChain(previous, ELEVATED_CLASS, false);
    if (next) setElevationChain(next, ELEVATED_CLASS, true);
    setFocusCursor(session, next);
    setFocusVeil(session, Boolean(next));
    return next;
  }
  function setFocusVeil(session, active) {
    const veil = session ? session.focusVeilElement : null;
    if (!veil || !veil.classList) return false;
    veil.classList.toggle(VEIL_ACTIVE_CLASS, Boolean(active));
    return true;
  }
  function captureState(session) {
    return {
      focusedPin: session.focusedPin,
      viewport: {
        x: session.viewport.x,
        y: session.viewport.y,
        scale: session.viewport.scale
      },
      renderRoot: session.renderer.renderRoot || null
    };
  }
  function forwardStack(session) {
    if (!Array.isArray(session._forwardStack)) session._forwardStack = [];
    return session._forwardStack;
  }
  function canGoBack(session) {
    return Boolean(session) && session.focusStack.length > 0;
  }
  function canGoForward(session) {
    return Boolean(session) && forwardStack(session).length > 0;
  }
  function focusPin(session, pinOrId, options = {}) {
    const pin = resolvePin(session, pinOrId);
    if (!pin) return null;
    forwardStack(session).length = 0;
    const previous = session.focusedPin;
    if (previous && previous !== pin) {
      previous.setFocused(false, session);
    }
    session.focusedPin = pin;
    pin.setFocused(true, session);
    setFocusPresentation(session, previous, pin);
    if (session.options && session.options.frameOnFocus === false) return pin;
    const focussable = pin.traits.get("focussable");
    session.viewport.zoomToFit(pin.getGlobalBounds(), session.getHostRect(), {
      padding: focussable ? focussable.padding : void 0,
      maxZoom: focussable ? focussable.maxZoom : void 0,
      ...options
    });
    return pin;
  }
  function focus(session, pinOrId, options = {}) {
    if (options.promote === false) return focusPin(session, pinOrId, options);
    return promoteToRoot(session, pinOrId, options);
  }
  function pushFocus(session, pinOrId, options = {}) {
    if (options.promote) return promoteToRoot(session, pinOrId, options);
    const pin = resolvePin(session, pinOrId);
    if (!pin) return null;
    session.focusStack.push(captureState(session));
    return focusPin(session, pin, options);
  }
  function promoteToRoot(session, pinOrId, options = {}) {
    const pin = resolvePin(session, pinOrId);
    if (!pin) return null;
    const settled = session.renderer.renderRoot === pin && session.focusedPin === pin;
    if (!settled) session.focusStack.push(captureState(session));
    session.renderer.setRenderRoot(pin);
    return focusPin(session, pin, options);
  }
  function popFocus(session, options = {}) {
    if (session.focusStack.length === 0) return unfocus(session, options);
    const previous = session.focusStack.pop();
    forwardStack(session).push(captureState(session));
    return restoreState(session, previous, options);
  }
  function goForward(session, options = {}) {
    const stack = forwardStack(session);
    if (stack.length === 0) return null;
    const next = stack.pop();
    session.focusStack.push(captureState(session));
    return restoreState(session, next, options);
  }
  function restoreState(session, entry, options = {}) {
    const outgoing = session.focusedPin;
    if (outgoing) {
      outgoing.setFocused(false, session);
    }
    session.renderer.setRenderRoot(entry.renderRoot || null);
    session.focusedPin = entry.focusedPin;
    if (session.focusedPin) {
      session.focusedPin.setFocused(true, session);
    }
    setFocusPresentation(session, outgoing, session.focusedPin);
    session.viewport.animateTo(
      entry.viewport.x,
      entry.viewport.y,
      entry.viewport.scale,
      options
    );
    return session.focusedPin;
  }
  function unfocus(session, options = {}) {
    const outgoing = session.focusedPin;
    if (outgoing) {
      outgoing.setFocused(false, session);
      session.focusedPin = null;
    }
    setFocusPresentation(session, outgoing, null);
    session.focusStack = [];
    forwardStack(session).length = 0;
    session.renderer.setRenderRoot(null);
    session.viewport.reset(options);
    return null;
  }
  function focusParent(session, options = {}) {
    if (session.focusedPin && session.focusedPin.parent) {
      return focusPin(session, session.focusedPin.parent, options);
    }
    return unfocus(session, options);
  }

  // engine/context-menu.js
  var MENU_CLASS = "cloudcanvas-context-menu";
  var MENU_FLYOUT_CLASS = "cloudcanvas-context-menu-flyout";
  var MENU_GROUP_CLASS = "cloudcanvas-context-menu-group";
  var MENU_ITEM_CLASS = "cloudcanvas-context-menu-item";
  var MENU_ITEM_SUBMENU_CLASS = "cloudcanvas-context-menu-item--submenu";
  var MENU_ITEM_ATTR = "data-menu-item";
  var MENU_HOVER_OPEN_MS = 180;
  function bringToFront(pin) {
    const element = pin ? pin.element : null;
    const container = element ? element.parentNode : null;
    if (!container || container.lastElementChild === element) return false;
    container.appendChild(element);
    return true;
  }
  function sendToBack(pin) {
    const element = pin ? pin.element : null;
    const container = element ? element.parentNode : null;
    if (!container || typeof container.querySelector !== "function") return false;
    const first = container.querySelector(`:scope > .${PIN_CLASS}`);
    if (!first || first === element) return false;
    container.insertBefore(element, first);
    return true;
  }
  var BUILT_IN_ITEMS = Object.freeze([
    {
      id: "nav-back",
      label: "Back",
      group: "navigation",
      when: (session) => canGoBack(session),
      action: (session) => session.popFocus()
    },
    {
      id: "nav-forward",
      label: "Forward",
      group: "navigation",
      when: (session) => canGoForward(session),
      action: (session) => session.goForward()
    },
    {
      id: "bring-to-front",
      label: "Bring to front",
      group: "order",
      when: (session, { pin }) => Boolean(pin),
      action: (session, { pin }) => bringToFront(pin)
    },
    {
      id: "send-to-back",
      label: "Send to back",
      group: "order",
      when: (session, { pin }) => Boolean(pin),
      action: (session, { pin }) => sendToBack(pin)
    }
  ]);
  var ALWAYS = () => true;
  var MenuRegistry = class {
    constructor() {
      this._items = /* @__PURE__ */ new Map();
      this._initDefaults();
    }
    _initDefaults() {
      for (const item of BUILT_IN_ITEMS) this.register(item);
    }
    /**
     * Register a command. Ids are unique: re-registering one throws rather than
     * silently displacing a command something else put there.
     *
     * An `action` is required *unless* the command is (or becomes) a submenu
     * trigger. Because trigger status is derived from being named as a `parent`,
     * the two facts can only collide the moment a child arrives naming a parent
     * that already carries an action - and that is exactly where this throws.
     *
     * @param {MenuItem} item
     * @returns {MenuItem} the normalised, frozen definition
     */
    register(item) {
      const { id, label, action } = item || {};
      if (typeof id !== "string" || id === "") {
        throw new Error("MenuRegistry.register: id must be a non-empty string");
      }
      if (typeof label !== "string" || label === "") {
        throw new Error(`MenuRegistry.register: "${id}" requires a label`);
      }
      if (action !== void 0 && typeof action !== "function") {
        throw new Error(`MenuRegistry.register: "${id}" action, if given, must be a function`);
      }
      if (item.renderItem !== void 0 && typeof item.renderItem !== "function") {
        throw new Error(`MenuRegistry.register: "${id}" renderItem, if given, must be a function`);
      }
      if (this._items.has(id)) {
        throw new Error(`MenuRegistry.register: "${id}" is already registered`);
      }
      const parent = this._resolveParent(item, id);
      const definition = Object.freeze({
        id,
        label,
        group: typeof item.group === "string" ? item.group : "",
        parent,
        when: typeof item.when === "function" ? item.when : ALWAYS,
        action: typeof action === "function" ? action : null,
        // The three opt-in seams, normalized once so every read is a plain field.
        renderItem: typeof item.renderItem === "function" ? item.renderItem : null,
        closeOnRun: item.closeOnRun !== false,
        openOnHover: Boolean(item.openOnHover)
      });
      this._items.set(id, definition);
      return definition;
    }
    /**
     * Validate a `parent` reference and return the normalised id ('' at the top
     * level). The parent must already exist - forward references are refused, so
     * the graph is an acyclic forest and its render order stays top-down - and it
     * must not carry an action of its own, because naming it here makes it a
     * trigger, and a command cannot be both.
     */
    _resolveParent(item, id) {
      const parent = typeof item.parent === "string" ? item.parent : "";
      if (parent === "") return "";
      const target = this._items.get(parent);
      if (!target) {
        throw new Error(`MenuRegistry.register: "${id}" names parent "${parent}", which is not registered`);
      }
      if (typeof target.action === "function") {
        throw new Error(
          `MenuRegistry.register: "${parent}" cannot be both a submenu trigger and an action (named as parent by "${id}")`
        );
      }
      return parent;
    }
    /** @returns {boolean} true when an item was actually removed */
    unregister(id) {
      return this._items.delete(id);
    }
    has(id) {
      return this._items.has(id);
    }
    get(id) {
      return this._items.get(id);
    }
    /** @returns {boolean} true when some other command names `id` as its parent */
    hasChildren(id) {
      for (const item of this._items.values()) {
        if (item.parent === id) return true;
      }
      return false;
    }
    /** @returns {MenuItem[]} the commands nesting under `id`, in registration order */
    childrenOf(id) {
      const out = [];
      for (const item of this._items.values()) {
        if (item.parent === id) out.push(item);
      }
      return out;
    }
    /** @returns {MenuItem[]} in registration order */
    list() {
      return Array.from(this._items.values());
    }
    /** Drop every custom command and restore the built-in set. */
    clear() {
      this._items.clear();
      this._initDefaults();
    }
  };
  var menuRegistry = new MenuRegistry();
  function registerMenuItem(item) {
    return menuRegistry.register(item);
  }
  function unregisterMenuItem(id) {
    return menuRegistry.unregister(id);
  }
  function isSubmenuTrigger(item) {
    return menuRegistry.hasChildren(item.id);
  }
  function isVisible(session, context, item) {
    if (!item.when(session, context)) return false;
    if (isSubmenuTrigger(item)) {
      return menuRegistry.childrenOf(item.id).some((child) => isVisible(session, context, child));
    }
    return typeof item.action === "function";
  }
  function menuItemsFor(session, context) {
    return menuRegistry.list().filter(
      (item) => item.parent === "" && isVisible(session, context, item)
    );
  }
  function childItemsFor(session, context, parentId) {
    return menuRegistry.childrenOf(parentId).filter((item) => isVisible(session, context, item));
  }
  function groupItems(items) {
    const groups = /* @__PURE__ */ new Map();
    for (const item of items) {
      const bucket = groups.get(item.group);
      if (bucket) bucket.push(item);
      else groups.set(item.group, [item]);
    }
    return Array.from(groups.values());
  }
  function mountContextMenu(session) {
    if (typeof document === "undefined") return null;
    const overlay = session ? session.overlayElement : null;
    if (!overlay) return null;
    unmountContextMenu(session);
    const element = document.createElement("div");
    element.className = MENU_CLASS;
    element.setAttribute("role", "menu");
    element.hidden = true;
    const state = {
      element,
      /** @type {MenuContext|null} the click the open menu belongs to */
      context: null,
      /** @type {Map<string, MenuItem>} every item on screen now, across all panels */
      items: /* @__PURE__ */ new Map(),
      /** @type {PanelRecord[]} the open chain: [0] is the root, then each flyout */
      panels: [],
      /** Pending `openOnHover` timer, or null; at most one is ever armed. */
      hoverTimer: null,
      onClick: (event) => runClickedItem(session, event),
      onPointerOver: (event) => onMenuPointerOver(session, event),
      onPointerOut: (event) => onMenuPointerOut(session, event),
      onDocumentPointerDown: (event) => dismissOnOutside(session, event),
      onDocumentKeyDown: (event) => onMenuKeyDown(session, event)
    };
    element.addEventListener("click", state.onClick);
    element.addEventListener("pointerover", state.onPointerOver);
    element.addEventListener("pointerout", state.onPointerOut);
    overlay.appendChild(element);
    session._contextMenu = state;
    return element;
  }
  function unmountContextMenu(session) {
    const state = session ? session._contextMenu : null;
    if (!state) return false;
    closeContextMenu(session);
    state.element.removeEventListener("click", state.onClick);
    state.element.removeEventListener("pointerover", state.onPointerOver);
    state.element.removeEventListener("pointerout", state.onPointerOut);
    if (state.element.parentNode) state.element.parentNode.removeChild(state.element);
    session._contextMenu = null;
    return true;
  }
  function openContextMenu(session, context) {
    const state = session ? session._contextMenu : null;
    if (!state) return false;
    const items = menuItemsFor(session, context);
    if (items.length === 0) {
      closeContextMenu(session);
      return false;
    }
    closeContextMenu(session);
    const ids = renderInto(state.element, items, state, context);
    state.panels = [rootPanel(state.element, ids)];
    state.element.hidden = false;
    placeInHost(session, state.element, { mode: "point", x: context.x, y: context.y });
    state.context = context;
    document.addEventListener("pointerdown", state.onDocumentPointerDown);
    document.addEventListener("keydown", state.onDocumentKeyDown);
    focusFirstItem(state.element);
    return true;
  }
  function closeContextMenu(session) {
    const state = session ? session._contextMenu : null;
    if (!state || state.element.hidden) return false;
    const held = menuHoldsFocus(state);
    clearHoverTimer(state);
    closePanelsDeeperThan(session, 0);
    state.element.hidden = true;
    state.element.textContent = "";
    state.items.clear();
    state.panels = [];
    state.context = null;
    document.removeEventListener("pointerdown", state.onDocumentPointerDown);
    document.removeEventListener("keydown", state.onDocumentKeyDown);
    if (held) restoreFocus(session);
    return true;
  }
  function isContextMenuOpen(session) {
    const state = session ? session._contextMenu : null;
    return Boolean(state) && state.element.hidden === false;
  }
  function rootPanel(element, itemIds) {
    return { element, triggerButton: null, triggerId: null, depth: 0, itemIds, side: "right" };
  }
  function panelOf(state, node) {
    if (!node) return null;
    for (const panel of state.panels) {
      if (panel.element.contains(node)) return panel;
    }
    return null;
  }
  function openFlyout(session, triggerItem, triggerButton) {
    const state = session._contextMenu;
    const parentPanel = panelOf(state, triggerButton);
    if (!parentPanel) return false;
    const already = state.panels[state.panels.indexOf(parentPanel) + 1];
    if (already && already.triggerId === triggerItem.id) {
      focusFirstItem(already.element);
      return true;
    }
    closePanelsDeeperThan(session, parentPanel.depth);
    const children = childItemsFor(session, state.context, triggerItem.id);
    if (children.length === 0) return false;
    const panel = state.element.ownerDocument.createElement("div");
    panel.className = `${MENU_CLASS} ${MENU_FLYOUT_CLASS}`;
    panel.setAttribute("role", "menu");
    panel.addEventListener("click", state.onClick);
    panel.addEventListener("pointerover", state.onPointerOver);
    panel.addEventListener("pointerout", state.onPointerOut);
    session.overlayElement.appendChild(panel);
    const ids = renderInto(panel, children, state, state.context);
    const side = placeInHost(session, panel, {
      mode: "box",
      rect: triggerButton.getBoundingClientRect(),
      preferSide: parentPanel.side,
      allowFlip: parentPanel.depth === 0
    });
    triggerButton.setAttribute("aria-expanded", "true");
    state.panels.push({
      element: panel,
      triggerButton,
      triggerId: triggerItem.id,
      depth: parentPanel.depth + 1,
      itemIds: ids,
      side
    });
    focusFirstItem(panel);
    return true;
  }
  function closePanelsDeeperThan(session, depth) {
    const state = session._contextMenu;
    let closed = 0;
    while (state.panels.length > 0 && state.panels[state.panels.length - 1].depth > depth) {
      const panel = state.panels.pop();
      for (const id of panel.itemIds) state.items.delete(id);
      if (panel.triggerButton) panel.triggerButton.setAttribute("aria-expanded", "false");
      if (panel.element !== state.element) {
        panel.element.removeEventListener("click", state.onClick);
        panel.element.removeEventListener("pointerover", state.onPointerOver);
        panel.element.removeEventListener("pointerout", state.onPointerOut);
        if (panel.element.parentNode) panel.element.parentNode.removeChild(panel.element);
      }
      closed += 1;
    }
    return closed;
  }
  function closeInnermostFlyout(session) {
    const state = session._contextMenu;
    if (state.panels.length <= 1) return false;
    const innermost = state.panels[state.panels.length - 1];
    const trigger = innermost.triggerButton;
    closePanelsDeeperThan(session, innermost.depth - 1);
    if (trigger && typeof trigger.focus === "function") trigger.focus({ preventScroll: true });
    return true;
  }
  function renderInto(containerElement, items, state, context) {
    const doc = containerElement.ownerDocument;
    containerElement.textContent = "";
    const ids = [];
    for (const group of groupItems(items)) {
      const wrapper = doc.createElement("div");
      wrapper.className = MENU_GROUP_CLASS;
      for (const item of group) {
        wrapper.appendChild(itemButton(doc, item, context));
        state.items.set(item.id, item);
        ids.push(item.id);
      }
      containerElement.appendChild(wrapper);
    }
    return ids;
  }
  function itemButton(doc, item, context) {
    const button = doc.createElement("button");
    button.type = "button";
    button.className = MENU_ITEM_CLASS;
    button.setAttribute("role", "menuitem");
    button.setAttribute(MENU_ITEM_ATTR, item.id);
    button.textContent = item.label;
    if (isSubmenuTrigger(item)) decorateTrigger(button);
    if (typeof item.renderItem === "function") {
      const replacement = item.renderItem(button, item, context);
      if (replacement && replacement !== button && replacement.nodeType === 1) return replacement;
    }
    return button;
  }
  function decorateTrigger(button) {
    button.classList.add(MENU_ITEM_SUBMENU_CLASS);
    button.setAttribute("aria-haspopup", "menu");
    button.setAttribute("aria-expanded", "false");
    button.style.display = "flex";
    button.style.alignItems = "center";
    button.style.justifyContent = "space-between";
    const caret = button.ownerDocument.createElement("span");
    caret.className = `${MENU_ITEM_SUBMENU_CLASS}-caret`;
    caret.setAttribute("aria-hidden", "true");
    caret.textContent = "▸";
    button.appendChild(caret);
  }
  var EMPTY_INSETS = Object.freeze({ top: 0, right: 0, bottom: 0, left: 0 });
  function placeInHost(session, element, anchor) {
    const hostRect = session.getHostRect();
    const inset = session.menuInsets || EMPTY_INSETS;
    const hostLeft = (hostRect.left || 0) + (inset.left || 0);
    const hostTop = (hostRect.top || 0) + (inset.top || 0);
    const hostRight = (hostRect.left || 0) + (hostRect.width || 0) - (inset.right || 0);
    const hostBottom = (hostRect.top || 0) + (hostRect.height || 0) - (inset.bottom || 0);
    const anchorTop = anchor.mode === "box" ? anchor.rect.top : Number(anchor.y) || 0;
    const anchorLeft = anchor.mode === "box" ? anchor.rect.right : Number(anchor.x) || 0;
    element.style.top = `${anchorTop - hostTop}px`;
    element.style.left = `${anchorLeft - hostLeft}px`;
    const box = element.getBoundingClientRect();
    let side = null;
    if (anchor.mode === "box") {
      side = placeBoxHorizontally(element, anchor, box.width, hostLeft, hostRight);
    } else {
      clampFarEdge(element, "left", box.right, hostRight);
    }
    if (!placeAbove(element, anchor, box, hostTop, hostBottom)) {
      clampFarEdge(element, "top", box.bottom, hostBottom);
    }
    return side;
  }
  function placeAbove(element, anchor, box, hostTop, hostBottom) {
    if (anchor.mode === "box") return false;
    if (box.bottom <= hostBottom) return false;
    const top = parseFloat(element.style.top) || 0;
    const above = top - box.height;
    if (above < 0 || box.height > (anchor.y || 0) - hostTop) return false;
    element.style.top = `${above}px`;
    return true;
  }
  function placeBoxHorizontally(element, anchor, panelWidth, hostLeft, hostRight) {
    const { rect: triggerRect, preferSide, allowFlip } = anchor;
    const fitsRight = triggerRect.right + panelWidth <= hostRight;
    const fitsLeft = triggerRect.left - panelWidth >= hostLeft;
    const rightLocal = triggerRect.right - hostLeft;
    const leftLocal = triggerRect.left - panelWidth - hostLeft;
    if (preferSide === "right" && fitsRight) {
      element.style.left = `${rightLocal}px`;
      return "right";
    }
    if (preferSide === "left" && fitsLeft) {
      element.style.left = `${leftLocal}px`;
      return "left";
    }
    if (allowFlip && fitsLeft) {
      element.style.left = `${leftLocal}px`;
      return "left";
    }
    if (allowFlip && fitsRight) {
      element.style.left = `${rightLocal}px`;
      return "right";
    }
    const clamped = preferSide === "left" ? 0 : Math.max(0, hostRight - hostLeft - panelWidth);
    element.style.left = `${clamped}px`;
    return preferSide;
  }
  function clampFarEdge(element, styleProp, boxFar, hostFar) {
    const over = boxFar - hostFar;
    if (over > 0) {
      element.style[styleProp] = `${Math.max(0, parseFloat(element.style[styleProp]) - over)}px`;
    }
  }
  function focusFirstItem(element) {
    const first = element.querySelector(`.${MENU_ITEM_CLASS}`);
    if (!first || typeof first.focus !== "function") return false;
    first.focus({ preventScroll: true });
    return true;
  }
  function menuHoldsFocus(state) {
    const active = state.element.ownerDocument.activeElement;
    return Boolean(panelOf(state, active));
  }
  function restoreFocus(session) {
    const host = session.hostElement;
    if (!host || typeof host.focus !== "function") return false;
    host.focus({ preventScroll: true });
    return true;
  }
  function runClickedItem(session, event) {
    const state = session._contextMenu;
    const button = event.target && typeof event.target.closest === "function" ? event.target.closest(`[${MENU_ITEM_ATTR}]`) : null;
    if (!button) return false;
    const item = state.items.get(button.getAttribute(MENU_ITEM_ATTR));
    if (!item) return false;
    if (isSubmenuTrigger(item)) return openFlyout(session, item, button);
    if (typeof item.action !== "function") return false;
    item.action(session, state.context);
    if (item.closeOnRun) closeContextMenu(session);
    return true;
  }
  function onMenuPointerOver(session, event) {
    const state = session ? session._contextMenu : null;
    if (!state || state.element.hidden) return;
    clearHoverTimer(state);
    const target = event ? event.target : null;
    const button = target && typeof target.closest === "function" ? target.closest(`[${MENU_ITEM_ATTR}]`) : null;
    if (!button) return;
    const item = state.items.get(button.getAttribute(MENU_ITEM_ATTR));
    if (!item || !item.openOnHover || !isSubmenuTrigger(item)) return;
    if (button.getAttribute("aria-expanded") === "true") return;
    state.hoverTimer = setTimeout(() => {
      state.hoverTimer = null;
      if (!button.isConnected || button.getAttribute("aria-expanded") === "true") return;
      openFlyout(session, item, button);
    }, MENU_HOVER_OPEN_MS);
  }
  function onMenuPointerOut(session, event) {
    const state = session ? session._contextMenu : null;
    if (!state) return;
    const target = event ? event.target : null;
    const onItem = target && typeof target.closest === "function" && target.closest(`[${MENU_ITEM_ATTR}]`);
    if (onItem) clearHoverTimer(state);
  }
  function clearHoverTimer(state) {
    if (state && state.hoverTimer !== null) {
      clearTimeout(state.hoverTimer);
      state.hoverTimer = null;
    }
  }
  function dismissOnOutside(session, event) {
    const state = session._contextMenu;
    if (panelOf(state, event.target)) return false;
    return closeContextMenu(session);
  }
  function onMenuKeyDown(session, event) {
    const state = session ? session._contextMenu : null;
    if (!state || state.element.hidden) return;
    switch (event.key) {
      case "Escape":
        preventDefault(event);
        if (!closeInnermostFlyout(session)) closeContextMenu(session);
        break;
      case "ArrowDown":
        if (moveRoving(state, 1)) preventDefault(event);
        break;
      case "ArrowUp":
        if (moveRoving(state, -1)) preventDefault(event);
        break;
      case "ArrowRight":
        if (openFocusedTrigger(session)) preventDefault(event);
        break;
      case "ArrowLeft":
        if (closeFocusedFlyout(session)) preventDefault(event);
        break;
      default:
        break;
    }
  }
  function moveRoving(state, delta) {
    const active = state.element.ownerDocument.activeElement;
    const panel = panelOf(state, active);
    if (!panel) return false;
    const buttons = Array.from(panel.element.querySelectorAll(`.${MENU_ITEM_CLASS}`));
    if (buttons.length === 0) return false;
    const from = buttons.indexOf(active);
    const to = (from + delta + buttons.length) % buttons.length;
    buttons[to].focus({ preventScroll: true });
    return true;
  }
  function openFocusedTrigger(session) {
    const state = session._contextMenu;
    const active = state.element.ownerDocument.activeElement;
    if (!active || typeof active.getAttribute !== "function") return false;
    const item = state.items.get(active.getAttribute(MENU_ITEM_ATTR));
    if (!item || !isSubmenuTrigger(item)) return false;
    return openFlyout(session, item, active);
  }
  function closeFocusedFlyout(session) {
    const state = session._contextMenu;
    const active = state.element.ownerDocument.activeElement;
    const panel = panelOf(state, active);
    if (!panel || panel.depth === 0) return false;
    const trigger = panel.triggerButton;
    closePanelsDeeperThan(session, panel.depth - 1);
    if (trigger && typeof trigger.focus === "function") trigger.focus({ preventScroll: true });
    return true;
  }
  function preventDefault(event) {
    if (event && typeof event.preventDefault === "function") event.preventDefault();
  }

  // engine/gesture.js
  var TEXT_REGION_FLAG = "_ccTextRegion";
  function pinchStateFrom(points) {
    if (!Array.isArray(points) || points.length < 2) return null;
    const [a, b] = points;
    return {
      dist: Math.hypot(b.x - a.x, b.y - a.y),
      midX: (a.x + b.x) / 2,
      midY: (a.y + b.y) / 2
    };
  }
  function pointerPoints(session) {
    return Array.from(session.activePointers.values());
  }
  function hostRectOf(session) {
    return session.hostElement.getBoundingClientRect();
  }
  function startsOnControl(event) {
    return isControlTarget(event ? event.target : null);
  }
  function capturePointerId(session, pointerId) {
    const host = session.hostElement;
    if (!host || typeof host.setPointerCapture !== "function") return false;
    if (pointerId === void 0) return false;
    try {
      host.setPointerCapture(pointerId);
      return true;
    } catch {
      return false;
    }
  }
  function armCapture(session, event) {
    session._pendingCapture = {
      pointerId: event.pointerId,
      x: Number(event.clientX),
      y: Number(event.clientY),
      declined: startsOnControl(event) || event[TEXT_REGION_FLAG] === true
    };
    return session._pendingCapture;
  }
  function takeDeferredCapture(session, event) {
    const pending = session._pendingCapture;
    if (!pending || pending.declined) return false;
    if (pending.pointerId !== event.pointerId) return false;
    const travel = Math.hypot(event.clientX - pending.x, event.clientY - pending.y);
    if (!(travel > DRAG_THRESHOLD_PX)) return false;
    session._pendingCapture = null;
    return capturePointerId(session, event.pointerId);
  }
  function releasePointer(session, event) {
    const host = session.hostElement;
    const id = event ? event.pointerId : void 0;
    if (!host || id === void 0) return false;
    if (typeof host.releasePointerCapture !== "function") return false;
    try {
      if (typeof host.hasPointerCapture === "function" && !host.hasPointerCapture(id)) return false;
      host.releasePointerCapture(id);
      return true;
    } catch {
      return false;
    }
  }
  function beginPinch(session) {
    cancelDrag(session);
    session.isPanning = false;
    for (const pointerId of session.activePointers.keys()) {
      capturePointerId(session, pointerId);
    }
    session._pendingCapture = null;
    session.pinch = pinchStateFrom(pointerPoints(session));
    return session.pinch;
  }
  function updatePinch(session) {
    const previous = session.pinch;
    const next = pinchStateFrom(pointerPoints(session));
    if (!next) {
      session.pinch = null;
      return false;
    }
    const hostRect = hostRectOf(session);
    if (previous.dist > 0 && next.dist > 0) {
      session.viewport.zoomAt(
        next.dist / previous.dist,
        previous.midX - hostRect.left,
        previous.midY - hostRect.top
      );
    }
    session.viewport.panBy(next.midX - previous.midX, next.midY - previous.midY);
    session.pinch = next;
    return true;
  }
  function endPinch(session) {
    if (session.activePointers.size >= 2) {
      session.pinch = pinchStateFrom(pointerPoints(session));
      return true;
    }
    session.pinch = null;
    const [survivor] = pointerPoints(session);
    if (!survivor) return false;
    session.lastPointer = { x: survivor.x, y: survivor.y };
    session.isPanning = true;
    return true;
  }
  function cancelDrag(session) {
    session._pendingCapture = null;
    const pin = session.activeDragPin;
    if (!pin) return null;
    session.activeDragPin = null;
    setElevationChain(pin, DRAG_CHAIN_CLASS, false);
    const draggable = pin.traits.get("draggable");
    if (draggable && typeof draggable.onPointerUp === "function") {
      draggable.onPointerUp(pin);
    }
    return pin;
  }
  function isGestureActive(session) {
    return Boolean(session.isPanning || session.activeDragPin || session.pinch);
  }
  function cancelGesture(session) {
    cancelDrag(session);
    session.pinch = null;
    session.isPanning = false;
    session.activePointers.clear();
    session._pendingCapture = null;
    return true;
  }

  // engine/wheel.js
  var LINE_HEIGHT_PX = 16;
  var PAGE_HEIGHT_FALLBACK_PX = 800;
  var MAX_WHEEL_DELTA_PX = 160;
  var PINCH_ZOOM_K = 0.01;
  var WHEEL_ZOOM_K = 15e-4;
  var DISCRETE_WHEEL_MIN_PX = 40;
  function wheelPixelsPerUnit(deltaMode, hostHeight) {
    if (deltaMode === 1) return LINE_HEIGHT_PX;
    if (deltaMode === 2) return Number(hostHeight) || PAGE_HEIGHT_FALLBACK_PX;
    return 1;
  }
  function clampWheelDelta(pixels) {
    return Math.min(MAX_WHEEL_DELTA_PX, Math.max(-MAX_WHEEL_DELTA_PX, pixels));
  }
  function normalizeWheelDeltas(event, hostHeight) {
    const unit = wheelPixelsPerUnit(Number(event.deltaMode) || 0, hostHeight);
    return {
      dx: clampWheelDelta((Number(event.deltaX) || 0) * unit),
      dy: clampWheelDelta((Number(event.deltaY) || 0) * unit)
    };
  }
  function isDiscreteWheel(event) {
    if ((Number(event.deltaMode) || 0) !== 0) return true;
    const dy = Number(event.deltaY) || 0;
    return (Number(event.deltaX) || 0) === 0 && Math.abs(dy) >= DISCRETE_WHEEL_MIN_PX && Number.isInteger(dy);
  }
  function wheelZoomFactor(deltaPx, gain) {
    return Math.exp(-deltaPx * gain);
  }

  // engine/pointer.js
  var PIN_SELECTOR2 = ".cloudcanvas-pin";
  function routeToTraits(session, pin, hook, event) {
    for (const trait of pin.traits.values()) {
      if (typeof trait[hook] === "function") {
        trait[hook](pin, event, session);
      }
    }
    return pin;
  }
  function pinForEvent(session, event) {
    const element = event.target && event.target.closest ? event.target.closest(PIN_SELECTOR2) : null;
    const id = element ? element.getAttribute("data-pin-id") : null;
    return id ? session.pinManager.getPin(id) : null;
  }
  function isPrimaryGesture(event) {
    return event.isPrimary === true && event.button === 0;
  }
  function isSecondFinger(session, event) {
    return event.button === 0 && session.activePointers.size === 1;
  }
  function onPointerDown(session, event) {
    if (!session.hostElement) return null;
    if (!isPrimaryGesture(event) && !isSecondFinger(session, event)) return null;
    if (isTextRegionTarget(event.target)) event[TEXT_REGION_FLAG] = true;
    armCapture(session, event);
    session.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (session.activePointers.size >= 2) {
      beginPinch(session);
      return null;
    }
    const pin = pinForEvent(session, event);
    if (!pin) {
      if (session.options && session.options.pan === false) return null;
      session.isPanning = true;
      session.lastPointer = { x: event.clientX, y: event.clientY };
      return null;
    }
    routeToTraits(session, pin, "onPointerDown", event);
    session.activeDragPin = pin;
    setElevationChain(pin, DRAG_CHAIN_CLASS, true);
    return pin;
  }
  function onPointerMove(session, event) {
    if (!session.hostElement) return false;
    const tracked = session.activePointers.get(event.pointerId);
    if (tracked) {
      tracked.x = event.clientX;
      tracked.y = event.clientY;
    }
    if (session.pinch) return tracked ? updatePinch(session) : false;
    if (tracked && isGestureActive(session)) takeDeferredCapture(session, event);
    if (session.activeDragPin) {
      routeToTraits(session, session.activeDragPin, "onPointerMove", event);
      return true;
    }
    if (!session.isPanning) return false;
    session.viewport.panBy(
      event.clientX - session.lastPointer.x,
      event.clientY - session.lastPointer.y
    );
    session.lastPointer = { x: event.clientX, y: event.clientY };
    return true;
  }
  function onPointerUp(session, event) {
    releasePointer(session, event);
    if (event && event.pointerId !== void 0) {
      session.activePointers.delete(event.pointerId);
    }
    session._pendingCapture = null;
    if (session.pinch && endPinch(session)) return null;
    const pin = session.activeDragPin;
    if (pin) {
      session.activeDragPin = null;
      setElevationChain(pin, DRAG_CHAIN_CLASS, false);
      routeToTraits(session, pin, "onPointerUp", event);
    }
    session.isPanning = false;
    return pin || null;
  }
  function onContextMenu(session, event) {
    if (isGestureActive(session)) {
      if (event && typeof event.preventDefault === "function") event.preventDefault();
      cancelGesture(session);
      return true;
    }
    const opened = openContextMenu(session, {
      pin: pinForEvent(session, event),
      x: event ? event.clientX : 0,
      y: event ? event.clientY : 0
    });
    if (!opened) return false;
    if (event && typeof event.preventDefault === "function") event.preventDefault();
    return true;
  }
  var SCROLL_REGION_SELECTOR = "[data-cc-scroll]";
  function scrollRegionFor(event) {
    const target = event ? event.target : null;
    if (!target || typeof target.closest !== "function") return null;
    return target.closest(SCROLL_REGION_SELECTOR);
  }
  function onWheel(session, event) {
    const zoomModifier = Boolean(event.ctrlKey || event.metaKey);
    if (!zoomModifier && scrollRegionFor(event)) return false;
    event.preventDefault();
    if (!session.hostElement) return false;
    const hostRect = hostRectOf(session);
    const { dx, dy } = normalizeWheelDeltas(event, hostRect.height);
    if (dx === 0 && dy === 0) return false;
    if (dy !== 0 && (zoomModifier || isDiscreteWheel(event))) {
      const gain = zoomModifier ? PINCH_ZOOM_K : WHEEL_ZOOM_K;
      session.viewport.zoomAt(
        wheelZoomFactor(dy, gain),
        event.clientX - hostRect.left,
        event.clientY - hostRect.top
      );
      return true;
    }
    session.viewport.panBy(-dx, -dy);
    return true;
  }

  // engine/cursors.js
  function mountCursors(session) {
    destroyCursors(session);
    session.cursorPin = createCursorPin(session);
    session._unsubscribeSignals = session.pinManager.onSignal(session._onPinSignal);
    return session.cursorPin;
  }
  function remountCursors(session) {
    const targets = captureTargets(session);
    mountCursors(session);
    for (const [name, pin] of targets) {
      setCursorTarget(session, name, pin);
    }
    return session.cursorPin;
  }
  function captureTargets(session) {
    const targets = /* @__PURE__ */ new Map();
    if (!session.cursorPin) return targets;
    for (const [name, trait] of session.cursorPin.traits) {
      if (typeof trait.setTarget === "function" && trait.target) {
        targets.set(name, trait.target);
      }
    }
    return targets;
  }
  function destroyCursors(session) {
    if (session._unsubscribeSignals) {
      session._unsubscribeSignals();
      session._unsubscribeSignals = null;
    }
    if (session.cursorPin) {
      session.pinManager.removePin(session.cursorPin.id);
      session.cursorPin = null;
    }
    return null;
  }
  function handlePinSignal(session, event) {
    const pin = event && event.detail ? event.detail.source : null;
    if (!pin || pin.utility) return false;
    if (event.type === "destroy") return releaseCursorsFor(session, pin);
    if (event.type === "activate") {
      return setCursorTarget(session, CURSOR_ACTIVATED, pin);
    }
    if (event.type === "deactivate") {
      return releaseCursorIfOn(session, CURSOR_ACTIVATED, pin);
    }
    if (event.type !== "select") return false;
    if (event.payload) return setCursorTarget(session, CURSOR_SELECTED, pin);
    return releaseCursorIfOn(session, CURSOR_SELECTED, pin);
  }
  function releaseCursorIfOn(session, name, pin) {
    if (getCursorTarget(session, name) !== pin) return false;
    return setCursorTarget(session, name, null);
  }
  function setCursorTarget(session, name, pin) {
    const trait = cursorTrait(session, name);
    if (!trait || typeof trait.setTarget !== "function") return false;
    return trait.setTarget(pin || null);
  }
  function getCursorTarget(session, name) {
    const trait = cursorTrait(session, name);
    return trait ? trait.target : null;
  }
  function releaseCursorsFor(session, pin) {
    if (!session.cursorPin) return false;
    let released = false;
    for (const trait of session.cursorPin.traits.values()) {
      if (typeof trait.setTarget !== "function" || trait.target !== pin) continue;
      released = trait.setTarget(null) || released;
    }
    return released;
  }
  function cursorTrait(session, name) {
    return session.cursorPin ? session.cursorPin.traits.get(name) : null;
  }
  function renderSessionCursors(session, context) {
    if (!session.cursorPin) return 0;
    return renderCursors(session.cursorPin, {
      context,
      viewportVersion: session.renderer.viewportVersion,
      isDirty: session._cursorDirty
    });
  }

  // engine/frame.js
  var FRAME_MS = 16.67;
  var MAX_FRAME_DELTA_MS = 50;
  function start(session) {
    if (session.running) return;
    session.running = true;
    session._lastTs = null;
    if (typeof requestAnimationFrame !== "undefined") {
      session.rafId = requestAnimationFrame(session._loop);
    }
  }
  function stop(session) {
    session.running = false;
    if (session.rafId && typeof cancelAnimationFrame !== "undefined") {
      cancelAnimationFrame(session.rafId);
      session.rafId = null;
    }
  }
  function frameContext(session) {
    return {
      session,
      viewport: session.viewport,
      hostRect: session._hostRect,
      svgLayer: session.svgLayerElement,
      overlay: session.overlayElement,
      focusedPin: session.focusedPin,
      pinMap: session.pinManager.pins,
      // The render root's participation test travels with the frame: a trait
      // that resolves Pins of its own (a connector reaching for its targets)
      // applies the same rule the renderer does.
      participates: session._participates
    };
  }
  function tick2(session, dt = 1) {
    session.viewport.update(dt * FRAME_MS);
    syncViewportVersion(session);
    const context = frameContext(session);
    session.particleEngine.tick(dt);
    session.pinManager.tickAll(dt, context);
    session.renderer.frame(context);
    renderSessionCursors(session, context);
  }
  function syncViewportVersion(session) {
    const { x, y, scale } = session.viewport;
    const applied = session._appliedViewport;
    if (applied && applied.x === x && applied.y === y && applied.scale === scale) {
      return false;
    }
    session._appliedViewport = { x, y, scale };
    session._refreshHostRect();
    session.renderer.bumpViewportVersion();
    return true;
  }
  function regraph(session, traitName, fn) {
    const pins = session.pinManager.getPinsByTrait(traitName);
    if (pins.length === 0) return pins;
    const context = frameContext(session);
    for (const pin of pins) {
      if (typeof fn === "function") fn(pin);
      pin.render(context);
    }
    return pins;
  }
  function frameDelta(session, timestamp) {
    if (!Number.isFinite(timestamp)) {
      session._lastTs = null;
      return 1;
    }
    const previous = session._lastTs;
    session._lastTs = timestamp;
    if (previous === null) return 1;
    const elapsedMs = Math.min(Math.max(timestamp - previous, 0), MAX_FRAME_DELTA_MS);
    return elapsedMs / FRAME_MS;
  }
  function loopStep(session, timestamp) {
    if (!session.running) return;
    session.tick(frameDelta(session, timestamp));
    if (typeof requestAnimationFrame !== "undefined") {
      session.rafId = requestAnimationFrame(session._loop);
    }
  }

  // engine/keyboard.js
  var PIN_SELECTOR3 = ".cloudcanvas-pin";
  var PAN_STEP_PX = 40;
  var PAN_SHIFT_MULTIPLIER = 4;
  var ZOOM_STEP = 1.2;
  var VISIBILITY_MARGIN_PX = 24;
  var ENSURE_VISIBLE_MS = 200;
  var KEY_BINDINGS = Object.freeze({
    host: Object.freeze({
      ArrowLeft: Object.freeze({ action: "pan", dx: -1, dy: 0 }),
      ArrowRight: Object.freeze({ action: "pan", dx: 1, dy: 0 }),
      ArrowUp: Object.freeze({ action: "pan", dx: 0, dy: -1 }),
      ArrowDown: Object.freeze({ action: "pan", dx: 0, dy: 1 }),
      "+": Object.freeze({ action: "zoom", direction: 1 }),
      "=": Object.freeze({ action: "zoom", direction: 1 }),
      "-": Object.freeze({ action: "zoom", direction: -1 }),
      _: Object.freeze({ action: "zoom", direction: -1 }),
      0: Object.freeze({ action: "reset" }),
      Enter: Object.freeze({ action: "enter-pins" }),
      Escape: Object.freeze({ action: "back" }),
      Home: Object.freeze({ action: "unfocus" })
    }),
    pin: Object.freeze({
      ArrowDown: Object.freeze({ action: "step", delta: 1 }),
      ArrowRight: Object.freeze({ action: "step", delta: 1 }),
      ArrowUp: Object.freeze({ action: "step", delta: -1 }),
      ArrowLeft: Object.freeze({ action: "step", delta: -1 }),
      Enter: Object.freeze({ action: "focus" }),
      " ": Object.freeze({ action: "act" }),
      Escape: Object.freeze({ action: "exit" })
    })
  });
  var KEY_OWNING_TAGS = /* @__PURE__ */ new Set(["INPUT", "TEXTAREA", "SELECT", "OPTION", "BUTTON"]);
  function bindKeyboard(session) {
    const host = session.hostElement;
    if (!host || typeof host.addEventListener !== "function") return false;
    if (session._keyboard) unbindKeyboard(session);
    const tabStop = !(session.options && session.options.tabStop === false);
    const tabindexAdded = tabStop && typeof host.hasAttribute === "function" && !host.hasAttribute("tabindex");
    if (tabindexAdded) host.setAttribute("tabindex", "0");
    const state = {
      /** Whether this binding is the one that made the host focusable. */
      tabindexAdded,
      /** The Pin currently holding DOM focus, or null while the host holds it. */
      pin: null,
      /** Reading order, recomputed whenever pin navigation is entered. */
      order: [],
      onKeyDown: (event) => onKeyDown(session, event)
    };
    session._keyboard = state;
    host.addEventListener("keydown", state.onKeyDown);
    return true;
  }
  function unbindKeyboard(session) {
    const state = session._keyboard;
    if (!state) return false;
    const host = session.hostElement;
    if (host && typeof host.removeEventListener === "function") {
      host.removeEventListener("keydown", state.onKeyDown);
    }
    if (host && state.tabindexAdded && typeof host.removeAttribute === "function") {
      host.removeAttribute("tabindex");
    }
    session._keyboard = null;
    return true;
  }
  function onKeyDown(session, event) {
    if (!event || ownsItsKeys(event.target)) return false;
    const pin = pinForEvent2(session, event);
    const binding = pin ? KEY_BINDINGS.pin[event.key] : KEY_BINDINGS.host[event.key];
    if (!binding) return false;
    const handled = pin ? applyPinBinding(session, binding, pin, event) : applyHostBinding(session, binding, event);
    if (handled && typeof event.preventDefault === "function") event.preventDefault();
    return handled;
  }
  function applyHostBinding(session, binding, event) {
    switch (binding.action) {
      case "pan":
        return panByStep(session, binding, event.shiftKey === true);
      case "zoom":
        return zoomAtCenter(session, binding.direction);
      case "reset":
        session.unfocus();
        return true;
      case "enter-pins":
        return enterPinNavigation(session);
      case "back":
        if (session.focusStack.length > 0) session.popFocus();
        else session.unfocus();
        return true;
      case "unfocus":
        session.unfocus();
        return true;
      default:
        return false;
    }
  }
  function applyPinBinding(session, binding, pin, event) {
    switch (binding.action) {
      case "step":
        return stepTo(session, pin, binding.delta);
      case "focus":
        session.focus(pin);
        return true;
      case "act":
        return runTraitAction(session, pin, event);
      case "exit":
        return exitPinNavigation(session);
      default:
        return false;
    }
  }
  function runTraitAction(session, pin, event) {
    if (!pin || !(pin.traits instanceof Map)) return false;
    for (const trait of pin.traits.values()) {
      if (!trait || typeof trait.onAction !== "function") continue;
      if (!trait.onAction(pin, event, session)) continue;
      if (event && typeof event.stopPropagation === "function") event.stopPropagation();
      return true;
    }
    return false;
  }
  function panByStep(session, binding, shift) {
    const step = PAN_STEP_PX * (shift ? PAN_SHIFT_MULTIPLIER : 1);
    session.viewport.panBy(binding.dx * step, binding.dy * step);
    return true;
  }
  function zoomAtCenter(session, direction) {
    const hostRect = session.getHostRect();
    const factor = direction > 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
    session.viewport.zoomAt(factor, hostRect.width / 2, hostRect.height / 2);
    return true;
  }
  function enterPinNavigation(session) {
    const order = refreshOrder(session);
    if (order.length === 0) return false;
    const current = session.focusedPin;
    const target = current && order.includes(current) ? current : order[0];
    return focusPinElement(session, target);
  }
  function exitPinNavigation(session) {
    const state = session._keyboard;
    if (state) state.pin = null;
    const host = session.hostElement;
    if (!host || typeof host.focus !== "function") return false;
    host.focus({ preventScroll: true });
    return true;
  }
  function stepTo(session, pin, delta) {
    const order = currentOrder(session, pin);
    if (order.length === 0) return false;
    const index = order.indexOf(pin);
    const next = index < 0 ? order[0] : order[(index + delta + order.length) % order.length];
    return focusPinElement(session, next);
  }
  function currentOrder(session, pin) {
    const state = session._keyboard;
    const order = state ? state.order : [];
    if (order.length > 0 && order.includes(pin)) return order;
    return refreshOrder(session);
  }
  function refreshOrder(session) {
    const order = readingOrder(session);
    const state = session._keyboard;
    if (state) state.order = order;
    return order;
  }
  function readingOrder(session) {
    const entries = [];
    for (const pin of session.pinManager.getAllPins()) {
      if (!pin.active || !pin.element) continue;
      if (session.renderer && !session.renderer.participates(pin)) continue;
      entries.push({ pin, bounds: pin.getGlobalBounds() });
    }
    entries.sort(byReadingOrder);
    return entries.map((entry) => entry.pin);
  }
  function byReadingOrder(a, b) {
    if (a.bounds.minY !== b.bounds.minY) return a.bounds.minY - b.bounds.minY;
    if (a.bounds.minX !== b.bounds.minX) return a.bounds.minX - b.bounds.minX;
    return a.pin.id < b.pin.id ? -1 : 1;
  }
  function focusPinElement(session, pin) {
    if (!pin || !pin.element || typeof pin.element.focus !== "function") return false;
    pin.element.focus({ preventScroll: true });
    const state = session._keyboard;
    if (state) state.pin = pin;
    ensureVisible(session, pin);
    return true;
  }
  function ensureVisible(session, pin) {
    if (!pin || !session.viewport || typeof pin.getGlobalBounds !== "function") return false;
    const hostRect = session.getHostRect();
    const viewport = session.viewport;
    const bounds = pin.getGlobalBounds();
    const topLeft = viewport.canvasToScreen(bounds.minX, bounds.minY, hostRect);
    const bottomRight = viewport.canvasToScreen(bounds.maxX, bounds.maxY, hostRect);
    const left = hostRect.left || 0;
    const top = hostRect.top || 0;
    const dx = axisCorrection(
      topLeft.x - VISIBILITY_MARGIN_PX,
      bottomRight.x + VISIBILITY_MARGIN_PX,
      left,
      left + (hostRect.width || 0)
    );
    const dy = axisCorrection(
      topLeft.y - VISIBILITY_MARGIN_PX,
      bottomRight.y + VISIBILITY_MARGIN_PX,
      top,
      top + (hostRect.height || 0)
    );
    if (dx === 0 && dy === 0) return false;
    viewport.animateTo(viewport.x + dx, viewport.y + dy, viewport.scale, {
      duration: ENSURE_VISIBLE_MS
    });
    return true;
  }
  function axisCorrection(min, max, lo, hi) {
    if (min >= lo && max <= hi) return 0;
    if (max - min > hi - lo) return lo - min;
    if (min < lo) return lo - min;
    return hi - max;
  }
  function pinForEvent2(session, event) {
    const element = event.target && typeof event.target.closest === "function" ? event.target.closest(PIN_SELECTOR3) : null;
    const id = element ? element.getAttribute("data-pin-id") : null;
    return id ? session.pinManager.getPin(id) || null : null;
  }
  function ownsItsKeys(target) {
    if (!target || typeof target !== "object") return false;
    if (target.isContentEditable === true) return true;
    return KEY_OWNING_TAGS.has(target.tagName);
  }

  // engine/host.js
  var SVG_NS4 = "http://www.w3.org/2000/svg";
  var LAYER_CLASSES = Object.freeze({
    SVG: "cloudcanvas-svg-layer",
    PLANE: "cloudcanvas-plane",
    VEIL: "cloudcanvas-focus-veil",
    OVERLAY: "cloudcanvas-overlay-layer"
  });
  var HOST_CLASS = "cloudcanvas-host";
  function adoptOrCreate(host, className, create) {
    const existing = host.querySelector(`:scope > .${className}`);
    if (existing) return existing;
    const element = create();
    host.appendChild(element);
    return element;
  }
  function mountLayers(session) {
    const host = session.hostElement;
    if (!host || typeof document === "undefined") return false;
    session._hostClassAdded = !host.classList.contains(HOST_CLASS);
    host.classList.add(HOST_CLASS);
    session.svgLayerElement = adoptOrCreate(host, LAYER_CLASSES.SVG, () => {
      const svg = document.createElementNS(SVG_NS4, "svg");
      svg.setAttribute("class", LAYER_CLASSES.SVG);
      return svg;
    });
    session.renderer.setSvgLayerElement(session.svgLayerElement);
    const plane = adoptOrCreate(host, LAYER_CLASSES.PLANE, () => {
      const element = document.createElement("div");
      element.className = LAYER_CLASSES.PLANE;
      return element;
    });
    session.planeElement = plane;
    session.pinManager.setContainer(plane);
    session.renderer.setPlaneElement(plane);
    let veil = plane.querySelector(`:scope > .${LAYER_CLASSES.VEIL}`);
    if (!veil) {
      veil = document.createElement("div");
      veil.className = LAYER_CLASSES.VEIL;
      plane.insertBefore(veil, plane.firstChild);
    }
    session.focusVeilElement = veil;
    session.overlayElement = adoptOrCreate(host, LAYER_CLASSES.OVERLAY, () => {
      const element = document.createElement("div");
      element.className = LAYER_CLASSES.OVERLAY;
      return element;
    });
    return true;
  }
  function unmountLayers(session) {
    for (const key of ["focusVeilElement", "planeElement", "svgLayerElement", "overlayElement"]) {
      const element = session[key];
      if (element && element.parentNode) element.parentNode.removeChild(element);
      session[key] = null;
    }
    const host = session.hostElement;
    if (host && host.classList && session._hostClassAdded) {
      host.classList.remove(HOST_CLASS);
      if (host.getAttribute("class") === "") host.removeAttribute("class");
    }
    session._hostClassAdded = false;
    return true;
  }
  function bindSessionEvents(session) {
    const host = session.hostElement;
    if (!host) return false;
    host.addEventListener("pointerdown", session._onPointerDown);
    window.addEventListener("pointermove", session._onPointerMove);
    window.addEventListener("pointerup", session._onPointerUp);
    window.addEventListener("pointercancel", session._onPointerUp);
    window.addEventListener("resize", session._onResize);
    host.addEventListener("wheel", session._onWheel, { passive: false });
    host.addEventListener("contextmenu", session._onContextMenu);
    bindKeyboard(session);
    return true;
  }
  function unbindSessionEvents(session) {
    unbindKeyboard(session);
    const host = session.hostElement;
    if (host) {
      host.removeEventListener("pointerdown", session._onPointerDown);
      host.removeEventListener("wheel", session._onWheel);
      host.removeEventListener("contextmenu", session._onContextMenu);
    }
    if (typeof window !== "undefined") {
      window.removeEventListener("pointermove", session._onPointerMove);
      window.removeEventListener("pointerup", session._onPointerUp);
      window.removeEventListener("pointercancel", session._onPointerUp);
      window.removeEventListener("resize", session._onResize);
    }
    return true;
  }

  // engine/placement.js
  var MAX_RINGS = 12;
  var BASE_SAMPLES = 8;
  var SAMPLES_PER_RING = 4;
  var STEP_RATIO = 0.75;
  var DEFAULT_WIDTH = 200;
  var DEFAULT_HEIGHT = 120;
  var DEFAULT_MARGIN = 24;
  function place(session, options = {}) {
    const box = {
      width: positive(options.width, DEFAULT_WIDTH),
      height: positive(options.height, DEFAULT_HEIGHT),
      margin: Math.max(0, numberOr(options.margin, DEFAULT_MARGIN))
    };
    const scope = scopeFor(session, options);
    const centre = anchorFor(session, scope, options, box);
    const step = Math.max(box.width, box.height) * STEP_RATIO + box.margin;
    let candidate = corner(centre, box);
    if (isFree(scope.occupancy, candidate, box)) return candidate;
    for (let ring = 1; ring <= MAX_RINGS; ring += 1) {
      const found = searchRing(scope.occupancy, centre, ring, step, box);
      candidate = found.candidate;
      if (found.free) return candidate;
    }
    return candidate;
  }
  function searchRing(occupancy, centre, ring, step, box) {
    const radius = ring * step;
    const samples = BASE_SAMPLES + SAMPLES_PER_RING * ring;
    let candidate = null;
    for (let index = 0; index < samples; index += 1) {
      const angle = index / samples * Math.PI * 2;
      candidate = corner({
        x: centre.x + Math.cos(angle) * radius,
        y: centre.y + Math.sin(angle) * radius
      }, box);
      if (isFree(occupancy, candidate, box)) return { candidate, free: true };
    }
    return { candidate, free: false };
  }
  function scopeFor(session, options) {
    if (options.within === void 0 || options.within === null) {
      return {
        parent: null,
        boxes: null,
        occupancy: (minX, minY, maxX, maxY) => session.queryBox(minX, minY, maxX, maxY)
      };
    }
    const parent = resolvePin2(session, options.within);
    if (!parent) {
      throw new TypeError(`place: within "${idOf(options.within)}" is not a Pin in this session`);
    }
    const boxes = occupiedChildBoxes(parent);
    return {
      parent,
      boxes,
      occupancy: (minX, minY, maxX, maxY) => boxes.filter((bounds) => overlaps(bounds, minX, minY, maxX, maxY))
    };
  }
  function occupiedChildBoxes(parent) {
    const boxes = [];
    for (const child of parent.children) {
      if (!child || child.utility || !child.particle) continue;
      boxes.push(child.particle.getBounds());
    }
    return boxes;
  }
  function overlaps(bounds, minX, minY, maxX, maxY) {
    return bounds.minX <= maxX && bounds.maxX >= minX && bounds.minY <= maxY && bounds.maxY >= minY;
  }
  function anchorFor(session, scope, options, box) {
    const anchor = options.anchor;
    if (anchor && Number.isFinite(Number(anchor.x)) && Number.isFinite(Number(anchor.y))) {
      return { x: Number(anchor.x), y: Number(anchor.y) };
    }
    const near = resolvePin2(session, options.near);
    if (near) return scope.parent ? localCentre(near) : globalCentre(near);
    if (!scope.parent) return viewportCentre(session);
    const centroid = centroidOf(scope.boxes);
    if (centroid) return centroid;
    return { x: box.margin + box.width / 2, y: box.margin + box.height / 2 };
  }
  function localCentre(pin) {
    const bounds = pin.particle.getBounds();
    return { x: bounds.centerX, y: bounds.centerY };
  }
  function globalCentre(pin) {
    const bounds = pin.getGlobalBounds();
    return { x: bounds.centerX, y: bounds.centerY };
  }
  function centroidOf(boxes) {
    if (!boxes || boxes.length === 0) return null;
    let x = 0;
    let y = 0;
    for (const bounds of boxes) {
      x += bounds.centerX;
      y += bounds.centerY;
    }
    return { x: x / boxes.length, y: y / boxes.length };
  }
  function viewportCentre(session) {
    const hostRect = session.getHostRect();
    const left = hostRect.left || 0;
    const top = hostRect.top || 0;
    return session.viewport.screenToCanvas(
      left + (hostRect.width || 0) / 2,
      top + (hostRect.height || 0) / 2,
      hostRect
    );
  }
  function resolvePin2(session, pinOrId) {
    if (!pinOrId) return null;
    const pin = typeof pinOrId === "string" ? session.getPin(pinOrId) : pinOrId;
    return pin && typeof pin.getGlobalBounds === "function" ? pin : null;
  }
  function idOf(pinOrId) {
    if (typeof pinOrId === "string") return pinOrId;
    return pinOrId && pinOrId.id || String(pinOrId);
  }
  function corner(point, box) {
    return { x: point.x - box.width / 2, y: point.y - box.height / 2 };
  }
  function isFree(occupancy, topLeft, box) {
    const hits = occupancy(
      topLeft.x - box.margin,
      topLeft.y - box.margin,
      topLeft.x + box.width + box.margin,
      topLeft.y + box.height + box.margin
    );
    return hits.length === 0;
  }
  function numberOr(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  function positive(value, fallback) {
    const parsed = numberOr(value, fallback);
    return parsed > 0 ? parsed : fallback;
  }

  // engine/hydrate.js
  var ATTR_PREFIX = "data-cc-";
  var PIN_ATTR = `${ATTR_PREFIX}pin`;
  var HYDRATE_SELECTOR = `[${PIN_ATTR}]`;
  var NUMERIC_OPTIONS = /* @__PURE__ */ new Set(["x", "y", "z", "width", "height", "mass", "friction"]);
  var BOOLEAN_OPTIONS = /* @__PURE__ */ new Set([
    "chrome",
    "bordered",
    "draggable",
    "selectable",
    "selectableText",
    "pinned"
  ]);
  var BOOLEAN_VALUES = /* @__PURE__ */ new Map([["true", true], ["false", false]]);
  var ELEMENT_NODE = 1;
  function isElement(value) {
    return Boolean(value) && value.nodeType === ELEMENT_NODE;
  }
  function adopt(session, element, options = {}) {
    if (!isElement(element)) {
      throw new TypeError("adopt: a real DOM element is required");
    }
    const config = { chrome: false, ...options, element };
    if (!config.type && !config.displayTrait) {
      config.type = PRESERVE_TYPE;
    }
    return session.createPin(config);
  }
  function hydrate(session, container, selector = HYDRATE_SELECTOR) {
    if (!isElement(container)) {
      throw new TypeError("hydrate: a real DOM element is required");
    }
    const matches = Array.from(container.querySelectorAll(selector));
    const pinByElement = /* @__PURE__ */ new Map();
    for (const element of matches) {
      const parentElement = element.parentElement ? element.parentElement.closest(selector) : null;
      const parent = parentElement ? pinByElement.get(parentElement) : null;
      pinByElement.set(element, adopt(session, element, { ...readConfig(element), parent }));
    }
    return Array.from(pinByElement.values());
  }
  function readConfig(element) {
    const options = {};
    for (const attribute of element.attributes) {
      if (!attribute.name.startsWith(ATTR_PREFIX) || attribute.name === PIN_ATTR) continue;
      const key = camelCase(attribute.name.slice(ATTR_PREFIX.length));
      options[key] = coerce(key, attribute.value, attribute.name);
    }
    return options;
  }
  function camelCase(name) {
    return name.replace(/-([a-z])/g, (_, character) => character.toUpperCase());
  }
  function coerce(key, value, attributeName) {
    if (NUMERIC_OPTIONS.has(key)) {
      const number = value.trim() === "" ? NaN : Number(value);
      if (!Number.isFinite(number)) {
        throw new TypeError(`hydrate: ${attributeName}="${value}" is not a number`);
      }
      return number;
    }
    if (BOOLEAN_OPTIONS.has(key) && BOOLEAN_VALUES.has(value)) {
      return BOOLEAN_VALUES.get(value);
    }
    return value;
  }

  // engine/framing.js
  function isBounds(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value) && typeof value[Symbol.iterator] !== "function" && Number.isFinite(Number(value.minX)) && Number.isFinite(Number(value.minY));
  }
  function unionBounds(pins) {
    let box = null;
    for (const pin of pins) {
      if (!pin || typeof pin.getGlobalBounds !== "function") continue;
      const bounds = pin.getGlobalBounds();
      if (!box) {
        box = { minX: bounds.minX, minY: bounds.minY, maxX: bounds.maxX, maxY: bounds.maxY };
        continue;
      }
      box.minX = Math.min(box.minX, bounds.minX);
      box.minY = Math.min(box.minY, bounds.minY);
      box.maxX = Math.max(box.maxX, bounds.maxX);
      box.maxY = Math.max(box.maxY, bounds.maxY);
    }
    if (!box) return null;
    return {
      ...box,
      width: box.maxX - box.minX,
      height: box.maxY - box.minY,
      centerX: (box.minX + box.maxX) / 2,
      centerY: (box.minY + box.maxY) / 2
    };
  }
  function fitBounds(session, pinsOrBounds) {
    if (isBounds(pinsOrBounds)) return pinsOrBounds;
    if (pinsOrBounds) return unionBounds(pinsOrBounds);
    return unionBounds(contentPins(session));
  }
  function* contentPins(session) {
    for (const pin of session.pinManager.pins.values()) {
      if (!pin.utility) yield pin;
    }
  }
  function zoomToFit(session, pinsOrBounds, options = {}) {
    const bounds = fitBounds(session, pinsOrBounds);
    if (!bounds) return null;
    if (typeof session.viewport.zoomToFit !== "function") return null;
    session.viewport.zoomToFit(bounds, session.getHostRect(), options);
    return bounds;
  }

  // engine/session-options.js
  var SESSION_OPTION_KEYS = Object.freeze([
    "autoInjectStyles",
    "container",
    "customCSS",
    "defaultReload",
    "frameOnFocus",
    "label",
    "loadChildren",
    "offloadMargin",
    "pan",
    "tabStop",
    "viewport"
  ]);
  var OPTION_HINTS = Object.freeze({
    css: "customCSS",
    element: "container",
    host: "container",
    hostElement: "container",
    styles: "customCSS",
    target: "container"
  });
  function assertKnownOptions(options = {}) {
    for (const key of Object.keys(options)) {
      if (SESSION_OPTION_KEYS.includes(key)) continue;
      const hint = OPTION_HINTS[key] ? ` - did you mean "${OPTION_HINTS[key]}"?` : "";
      throw new TypeError(
        `CloudCanvasSession: unknown option "${key}"${hint} (known options: ${SESSION_OPTION_KEYS.join(", ")})`
      );
    }
    return true;
  }
  var ELEMENT_NODE2 = 1;
  function describeContainer(value) {
    if (value === null) return "null";
    if (typeof value === "string") return "an empty string";
    return typeof value;
  }
  function assertValidContainer(container) {
    if (typeof container === "string" && container.length > 0) return true;
    if (container && container.nodeType === ELEMENT_NODE2) return true;
    throw new TypeError(
      `CloudCanvasSession: option "container" must be a non-empty selector string or a DOM element, received ${describeContainer(container)} - omit it entirely to mount later with session.mount()`
    );
  }

  // engine/session.js
  var CloudCanvasSession = class {
    constructor(options = {}) {
      assertKnownOptions(options);
      this.options = options;
      this.events = new EventTarget();
      this.viewport = new Viewport(options.viewport || {});
      this.particleEngine = new ParticleEngine();
      this.pinManager = new PinManager({
        particleEngine: this.particleEngine,
        defaultReload: options.defaultReload,
        loadChildren: options.loadChildren
      });
      this.renderer = new ConjugateRenderer({
        session: this,
        offloadMargin: options.offloadMargin
      });
      this.pinManager.setRenderer(this.renderer);
      this._appliedViewport = null;
      this._hostRect = DEFAULT_HOST_RECT2;
      this.hostElement = null;
      this.svgLayerElement = null;
      this.planeElement = null;
      this.overlayElement = null;
      this.focusVeilElement = null;
      this.running = false;
      this.rafId = null;
      this._lastTs = null;
      this.focusedPin = null;
      this.focusStack = [];
      this._forwardStack = [];
      this.cursorPin = null;
      this._unsubscribeSignals = null;
      this._onPinSignal = this._onPinSignal.bind(this);
      this._participates = (pin) => this.renderer.participates(pin);
      this._cursorDirty = (pin) => this.renderer.isGlobalDirty(pin);
      this.isPanning = false;
      this.activeDragPin = null;
      this.lastPointer = { x: 0, y: 0 };
      this.activePointers = /* @__PURE__ */ new Map();
      this.pinch = null;
      this._pendingCapture = null;
      this._onPointerDown = this._onPointerDown.bind(this);
      this._onPointerMove = this._onPointerMove.bind(this);
      this._onPointerUp = this._onPointerUp.bind(this);
      this._onContextMenu = this._onContextMenu.bind(this);
      this._onWheel = this._onWheel.bind(this);
      this._onResize = this._onResize.bind(this);
      this._loop = this._loop.bind(this);
      if (options.autoInjectStyles !== false) {
        injectCanvasStyles();
      }
      this._sessionStyleEl = options.customCSS ? injectSessionStyles(options.customCSS) : null;
      if ("container" in options) {
        assertValidContainer(options.container);
        this.mount(options.container);
      }
    }
    /**
     * Mount the session into a target DOM container
     */
    mount(container) {
      if (typeof document === "undefined") return this;
      assertValidContainer(container);
      const host = typeof container === "string" ? document.querySelector(container) : container;
      if (!host) {
        throw new Error(`CloudCanvasSession: Target container "${container}" not found`);
      }
      this.hostElement = host;
      mountLayers(this);
      mountCursors(this);
      mountContextMenu(this);
      applyHostAria(this);
      mountAnnouncer(this);
      this._refreshHostRect();
      bindSessionEvents(this);
      this.start();
      return this;
    }
    /* ------------------ CURSORS (see `./cursors.js`) ------------------ */
    /** Point a cursor at a Pin, or clear it with `null`. */
    setCursorTarget(name, pin) {
      return setCursorTarget(this, name, pin);
    }
    /** The Pin a cursor currently points at, or null. */
    getCursorTarget(name) {
      return getCursorTarget(this, name);
    }
    /**
     * Rebuild the cursor Pin from the registry, keeping its current targets.
     * This is how a cursor re-registered after mount takes effect.
     */
    remountCursors() {
      return remountCursors(this);
    }
    /**
     * The session's sink for the manager's Pin signals.
     *
     * Two consumers, one subscription (`mountCursors` in `./cursors.js`): the edit
     * lock is announced, everything else moves a cursor. Kept here rather than in
     * either module because the split is the session's, and a second subscription
     * would be a second place a signal type has to be remembered.
     */
    _onPinSignal(event) {
      if (event && event.type === "edit") {
        return announceEdit(this, event.detail ? event.detail.source : null, event.payload);
      }
      return handlePinSignal(this, event);
    }
    /* ------------------ HOST GEOMETRY ------------------ */
    /** The cached host rectangle every screen-space calculation frames against. */
    getHostRect() {
      return this._hostRect;
    }
    /** Re-read the host box. The only place the session measures the host. */
    _refreshHostRect() {
      this._hostRect = this.hostElement ? this.hostElement.getBoundingClientRect() : DEFAULT_HOST_RECT2;
      return this._hostRect;
    }
    /**
     * A resized host invalidates both the cached rect and every screen-space SVG
     * group, so the viewport version is bumped along with it.
     */
    _onResize() {
      this._refreshHostRect();
      this.renderer.bumpViewportVersion();
    }
    /* ------------------ FOCUS & NAVIGATION API ------------------ */
    /**
     * Zoom into a Pin: promote it to render root and focus it (see
     * `./navigation.js`).
     *
     * Promotion is the default outcome since 0.4.0 - "focus this Pin" and "make
     * this Pin the view" were always the same gesture, and having them be two
     * calls meant the interesting one was the one nobody reached for. Pass
     * `{promote: false}` for the plain camera move.
     *
     * Every wrapper that changes focus announces it *and* publishes it: a camera
     * move is silent to anyone not watching it, and this layer is the one place
     * every route to a focus change - pointer, keyboard, or API - passes through.
     */
    focus(pinOrId, options = {}) {
      const pin = focus(this, pinOrId, options);
      if (pin) this._focusChanged(pin);
      return pin;
    }
    /** Push the current view state and focus a Pin; `promote` also promotes it. */
    pushFocus(pinOrId, options = {}) {
      const pin = pushFocus(this, pinOrId, options);
      if (pin) this._focusChanged(pin);
      return pin;
    }
    /** Promote a Pin to render root and focus it, stacking the outgoing state. */
    promoteToRoot(pinOrId, options = {}) {
      const pin = promoteToRoot(this, pinOrId, options);
      if (pin) this._focusChanged(pin);
      return pin;
    }
    /** Restore the previous focus, camera, and render root. */
    popFocus(options = {}) {
      const pin = popFocus(this, options);
      this._focusChanged(pin);
      return pin;
    }
    /**
     * Re-apply the state the last `popFocus` left behind - Forward to its Back.
     *
     * A no-op with nothing to go forward to, rather than a reset: an empty forward
     * stack means the history ends here, and ending it *again* is not a transition
     * worth announcing.
     */
    goForward(options = {}) {
      if (!canGoForward(this)) return null;
      const pin = goForward(this, options);
      this._focusChanged(pin);
      return pin;
    }
    /** Drop all focus and promotion state, returning to the whole canvas. */
    unfocus(options = {}) {
      const cleared = unfocus(this, options);
      this._focusChanged(cleared);
      return cleared;
    }
    /**
     * Focus the parent scope of the focused Pin.
     * Announced like every other wrapper, including the step out to the canvas,
     * which resolves to no focused Pin at all.
     */
    focusParent(options = {}) {
      const pin = focusParent(this, options);
      this._focusChanged(pin);
      return pin;
    }
    /**
     * Say a focus transition out loud, twice: once to assistive technology and
     * once to the page.
     *
     * `focus:changed` carries the whole navigational state rather than the Pin
     * alone, because a breadcrumb bar needs the trail and a title needs the render
     * root, and reading them back off the session afterwards is a second source of
     * truth that can disagree with the event that woke it.
     *
     * @param {Pin|null} pin the newly focused Pin, or null at the canvas root
     * @returns {boolean} true when the event was dispatched
     */
    _focusChanged(pin) {
      announceFocus(this, pin);
      return this.events.dispatchEvent(new CustomEvent("focus:changed", {
        detail: {
          focusedPin: pin || null,
          renderRoot: this.renderer.renderRoot,
          breadcrumb: this.breadcrumb()
        }
      }));
    }
    /** Root-first trail to the current render root, or [] at the canvas root. */
    breadcrumb() {
      return this.renderer.rootScope.breadcrumb();
    }
    /* ------------------ POINTER EVENT ROUTING (see `./pointer.js`) ------------------ */
    _onPointerDown(event) {
      return onPointerDown(this, event);
    }
    _onPointerMove(event) {
      return onPointerMove(this, event);
    }
    _onPointerUp(event) {
      return onPointerUp(this, event);
    }
    _onWheel(event) {
      return onWheel(this, event);
    }
    /** Raise the canvas menu, or leave the platform's alone (see `./pointer.js`). */
    _onContextMenu(event) {
      return onContextMenu(this, event);
    }
    /** End the active drag without a pointer event (the renderer calls this). */
    cancelDrag() {
      return cancelDrag(this);
    }
    /* ------------------ SIMULATION & RENDERING (see `./frame.js`) ------------------ */
    /** Begin driving frames from `requestAnimationFrame`. */
    start() {
      return start(this);
    }
    /** Stop the frame loop, cancelling the frame already asked for. */
    stop() {
      return stop(this);
    }
    /** The per-frame context traits and render passes are handed. */
    getContext() {
      return frameContext(this);
    }
    /**
     * Execute one simulation & render frame.
     * `dt` is expressed in reference frames (1 = one 60Hz frame).
     */
    tick(dt = 1) {
      return tick2(this, dt);
    }
    /** Publish the live camera to the renderer; true when it had moved. */
    _syncViewportVersion() {
      return syncViewportVersion(this);
    }
    /**
     * Re-run a trait across the graph: apply `fn` to every Pin carrying
     * `traitName`, then re-render it.
     *
     * @returns {Pin[]} the Pins that were regraphed
     */
    regraph(traitName, fn) {
      return regraph(this, traitName, fn);
    }
    /** Frame delta in reference frames, derived from the rAF timestamp. */
    _frameDelta(timestamp) {
      return frameDelta(this, timestamp);
    }
    _loop(timestamp) {
      return loopStep(this, timestamp);
    }
    createPin(options) {
      return this.pinManager.createPin(options);
    }
    removePin(id) {
      return this.pinManager.removePin(id);
    }
    getPin(id) {
      return this.pinManager.getPin(id);
    }
    queryRadius(x, y, radius) {
      return this.pinManager.queryRadius(x, y, radius);
    }
    queryBox(minX, minY, maxX, maxY) {
      return this.pinManager.queryBox(minX, minY, maxX, maxY);
    }
    /**
     * A free canvas-space top-left corner for a box of the given size
     * (see `./placement.js`). Deterministic: same canvas, same answer.
     */
    place(options = {}) {
      return place(this, options);
    }
    /**
     * Turn an element that already exists into a Pin, keeping its markup exactly
     * as it was written (see `./hydrate.js`).
     */
    adopt(element, options = {}) {
      return adopt(this, element, options);
    }
    /**
     * Adopt every `[data-cc-pin]` element inside `container`, nesting the Pins the
     * way the DOM nests them (see `./hydrate.js`).
     */
    hydrate(container, selector) {
      return hydrate(this, container, selector);
    }
    /**
     * Frame Pins in the host: a list of them, a bounding box, or - given nothing -
     * every content Pin on the canvas (see `./framing.js`).
     *
     * @param {Iterable<Pin>|object} [pinsOrBounds]
     * @param {object} [options] passed through to `viewport.zoomToFit`
     * @returns {object|null} the framed bounds, or null when there was nothing to frame
     */
    zoomToFit(pinsOrBounds, options = {}) {
      return zoomToFit(this, pinsOrBounds, options);
    }
    /** @deprecated since 0.3.0 - use {@link CloudCanvasSession#unfocus}. Removed in 0.4.0. */
    resetView(options) {
      this.unfocus(options);
    }
    /**
     * Take the session apart and hand the host element back as it was found:
     * each module below reverses what *it* added, and only when this session was
     * what added it - the mount path's no-clobber rule, read from the other end.
     */
    destroy() {
      this.stop();
      unbindSessionEvents(this);
      unmountContextMenu(this);
      destroyCursors(this);
      unmountAnnouncer(this);
      removeHostAria(this);
      this.pinManager.clear();
      this.renderer.clear();
      unmountLayers(this);
      if (this._sessionStyleEl && this._sessionStyleEl.parentNode) {
        this._sessionStyleEl.parentNode.removeChild(this._sessionStyleEl);
      }
      this._sessionStyleEl = null;
    }
  };

  // pins/reaction-actions.js
  var PARAM_CONTROLS = Object.freeze(["text", "number", "checkbox", "select"]);
  function coerceParam(descriptor, raw) {
    if (descriptor.control === "number") {
      const number = Number(raw);
      if (!Number.isFinite(number)) return { error: `"${descriptor.key}" must be a number` };
      return { value: number };
    }
    if (descriptor.control === "checkbox") return { value: Boolean(raw) };
    if (descriptor.control === "select") {
      const value = raw === void 0 || raw === null ? "" : String(raw);
      const allowed = descriptor.options.some((option) => option.value === value);
      if (!allowed) return { error: `"${descriptor.key}" is not one of the offered values` };
      return { value };
    }
    return { value: raw === void 0 || raw === null ? "" : String(raw) };
  }
  function isRequired(descriptor) {
    return descriptor.required !== false;
  }
  function validateParams(definition, raw) {
    const source = raw && typeof raw === "object" ? raw : {};
    const params = {};
    for (const descriptor of definition.params) {
      const has = Object.prototype.hasOwnProperty.call(source, descriptor.key);
      if (!has) {
        if (isRequired(descriptor)) return { valid: false, error: `missing parameter "${descriptor.key}"` };
        continue;
      }
      const coerced = coerceParam(descriptor, source[descriptor.key]);
      if (coerced.error) return { valid: false, error: coerced.error };
      params[descriptor.key] = coerced.value;
    }
    return { valid: true, params };
  }
  function normalizeDescriptor(descriptor, type) {
    const key = descriptor && typeof descriptor.key === "string" ? descriptor.key : "";
    if (key === "") throw new Error(`ActionRegistry: action "${type}" has a parameter with no key`);
    if (!PARAM_CONTROLS.includes(descriptor.control)) {
      throw new Error(`ActionRegistry: parameter "${key}" of "${type}" has an unknown control`);
    }
    if (descriptor.control === "select" && !Array.isArray(descriptor.options)) {
      throw new Error(`ActionRegistry: select parameter "${key}" of "${type}" needs options`);
    }
    return Object.freeze({
      key,
      label: descriptor.label || key,
      control: descriptor.control,
      required: descriptor.required !== false,
      options: descriptor.control === "select" ? Object.freeze([...descriptor.options]) : null,
      placeholder: descriptor.placeholder || ""
    });
  }
  var ActionRegistry = class {
    constructor() {
      this._definitions = /* @__PURE__ */ new Map();
    }
    /**
     * Register an action definition. Names are unique - re-registering throws, so a
     * page cannot silently shadow `set-style` with its own.
     *
     * @param {string} type
     * @param {{label?: string, params?: object[], run: Function}} definition
     * @returns {object} the frozen, normalized definition
     */
    register(type, definition) {
      if (typeof type !== "string" || type.length === 0) {
        throw new Error("ActionRegistry.register: type must be a non-empty string");
      }
      if (!definition || typeof definition.run !== "function") {
        throw new Error(`ActionRegistry.register: "${type}" requires a run function`);
      }
      if (this._definitions.has(type)) {
        throw new Error(`ActionRegistry.register: "${type}" is already registered`);
      }
      const params = Array.isArray(definition.params) ? definition.params : [];
      const normalized = Object.freeze({
        type,
        label: definition.label || type,
        params: Object.freeze(params.map((descriptor) => normalizeDescriptor(descriptor, type))),
        run: definition.run
      });
      this._definitions.set(type, normalized);
      return normalized;
    }
    has(type) {
      return this._definitions.has(type);
    }
    get(type) {
      return this._definitions.get(type);
    }
    unregister(type) {
      return this._definitions.delete(type);
    }
    /** Every registered definition, for an editor's action picker. */
    list() {
      return Array.from(this._definitions.values());
    }
    /** The parameter descriptors an editor renders fields from, or []. */
    describe(type) {
      const definition = this._definitions.get(type);
      return definition ? definition.params : [];
    }
    /**
     * Validate a `{ type, params }` pair without running it.
     * @returns {{valid: true, params: object}|{valid: false, error: string}}
     */
    validate(type, params) {
      const definition = this._definitions.get(type);
      if (!definition) return { valid: false, error: `unknown action type "${type}"` };
      return validateParams(definition, params);
    }
    /**
     * Run an action against its target Pin.
     *
     * @param {string} type an action name; an unknown one throws, never runs
     * @param {Pin} target the Pin the action mutates
     * @param {object} params raw parameters, validated and coerced here
     * @param {object} [context] `{ session, source, event }` handed to `run`
     * @returns {*} whatever the action's `run` returned
     * @throws {TypeError} on an unknown type or invalid parameters
     */
    run(type, target, params, context = {}) {
      const definition = this._definitions.get(type);
      if (!definition) throw new TypeError(`ActionRegistry.run: unknown action type "${type}"`);
      const result = validateParams(definition, params);
      if (!result.valid) throw new TypeError(`ActionRegistry.run: ${result.error}`);
      return definition.run(target, result.params, context);
    }
  };
  var STYLE_PARAM_OPTIONS = Object.freeze(
    STYLE_PROPERTIES.map((entry) => Object.freeze({ value: entry.property, label: entry.label }))
  );
  var VISIBILITY_MODES = Object.freeze([
    Object.freeze({ value: "toggle", label: "Toggle" }),
    Object.freeze({ value: "hide", label: "Hide" }),
    Object.freeze({ value: "show", label: "Show" })
  ]);
  function runToggleVisibility(target, params) {
    const element = target && target.element;
    if (!element || !element.style) return false;
    const hidden = element.style.getPropertyValue("visibility") === "hidden";
    const next = params.mode === "hide" ? true : params.mode === "show" ? false : !hidden;
    if (next) element.style.setProperty("visibility", "hidden");
    else element.style.removeProperty("visibility");
    return next;
  }
  function showClientToast(session, message, variant = "info") {
    if (typeof document === "undefined") return;
    const host = session && session.hostElement || document.body;
    let container = host.querySelector(".cloudcanvas-toast-container");
    if (!container) {
      container = document.createElement("div");
      container.className = "cloudcanvas-toast-container";
      container.style.cssText = [
        "position: absolute",
        "bottom: 24px",
        "right: 24px",
        "display: flex",
        "flex-direction: column",
        "gap: 10px",
        "z-index: 9999",
        "pointer-events: none",
        "max-width: 360px"
      ].join("; ");
      host.appendChild(container);
    }
    const toast = document.createElement("div");
    toast.className = `cloudcanvas-toast cloudcanvas-toast-${variant}`;
    const borderCol = variant === "success" ? "#22c55e" : variant === "warning" ? "#eab308" : "#3b82f6";
    toast.style.cssText = [
      "background: rgba(15, 23, 42, 0.92)",
      "color: #f8fafc",
      "padding: 12px 18px",
      "border-radius: 8px",
      "font-family: system-ui, -apple-system, sans-serif",
      "font-size: 13px",
      "line-height: 1.4",
      `border-left: 4px solid ${borderCol}`,
      "border: 1px solid rgba(255, 255, 255, 0.12)",
      "box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)",
      "backdrop-filter: blur(12px)",
      "transform: translateY(10px)",
      "opacity: 0",
      "transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
      "pointer-events: auto"
    ].join("; ");
    toast.textContent = message;
    container.appendChild(toast);
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => {
        toast.style.transform = "translateY(0)";
        toast.style.opacity = "1";
      });
    } else {
      toast.style.transform = "translateY(0)";
      toast.style.opacity = "1";
    }
    setTimeout(() => {
      toast.style.transform = "translateY(-10px)";
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }
  function registerBuiltinActions(registry) {
    registry.register("set-content", {
      label: "Set content",
      params: [
        { key: "key", label: "Content key", control: "text", placeholder: "title" },
        { key: "value", label: "Value", control: "text" }
      ],
      run: (target, params) => target.setContent(params.key, params.value)
    });
    registry.register("set-style", {
      label: "Set style",
      params: [
        { key: "property", label: "Property", control: "select", options: STYLE_PARAM_OPTIONS },
        { key: "value", label: "CSS value", control: "text", placeholder: "e.g. #ff0000" }
      ],
      run: (target, params) => setPinStyle(target, params.property, params.value)
    });
    registry.register("toggle-visibility", {
      label: "Toggle visibility",
      params: [
        { key: "mode", label: "Mode", control: "select", options: VISIBILITY_MODES, required: false }
      ],
      run: runToggleVisibility
    });
    registry.register("focus", {
      label: "Focus (zoom to)",
      params: [
        { key: "promote", label: "Zoom in", control: "checkbox", required: false }
      ],
      run: (target, params) => {
        const session = target && target.session;
        if (!session) return null;
        return session.focus(target, { promote: Boolean(params.promote) });
      }
    });
    registry.register("increment-counter", {
      label: "Increment counter",
      params: [
        { key: "key", label: "Content key", control: "text", placeholder: "count" },
        { key: "step", label: "Step", control: "number", required: false }
      ],
      run: (target, params) => {
        const key = params.key || "count";
        const step = Number.isFinite(params.step) ? params.step : 1;
        const current = Number(target.getContent(key)) || 0;
        const next = current + step;
        target.setContent(key, next);
        if (target.contents && target.contents.has("title")) {
          const title = target.contents.get("title");
          if (typeof title === "string" && title.includes(":")) {
            const parts = title.split(":");
            target.setContent("title", `${parts[0].trim()}: ${next}`);
          }
        }
        return next;
      }
    });
    registry.register("notify", {
      label: "Show notification",
      params: [
        { key: "message", label: "Message", control: "text", placeholder: "Action completed successfully" },
        { key: "variant", label: "Variant", control: "select", options: [
          { value: "info", label: "Info" },
          { value: "success", label: "Success" },
          { value: "warning", label: "Warning" }
        ], required: false }
      ],
      run: (target, params, context) => {
        const session = target && target.session || context && context.session;
        showClientToast(session, params.message || "Notification", params.variant || "info");
        return true;
      }
    });
    registry.register("navigate-page", {
      label: "Navigate to page",
      params: [
        { key: "page", label: "Page name", control: "text", placeholder: "index.html" }
      ],
      run: (target, params, context) => {
        const session = target && target.session || context && context.session;
        if (!session) return null;
        const pageName = params.page ? params.page.trim() : "";
        if (pageName && session.pinManager) {
          const roots = session.pinManager.getRootPins();
          for (const r of roots) {
            if (r.contents && (r.contents.get("title") === pageName || r.contents.get("name") === pageName)) {
              return session.focus(r, { promote: true });
            }
          }
        }
        return session.focus(target, { promote: true });
      }
    });
    return registry;
  }
  var actionRegistry = registerBuiltinActions(new ActionRegistry());

  // pins/reactions.js
  var SIGNAL_SET = new Set(PIN_SIGNAL_TYPES);
  function freshId() {
    return `rx_${Math.random().toString(36).slice(2, 10)}`;
  }
  var ReactionStore = class {
    constructor(registry = actionRegistry) {
      this.registry = registry;
      this._bindings = /* @__PURE__ */ new Map();
    }
    /**
     * Add a binding, validating its signal and its action's parameters.
     *
     * @param {{id?: string, sourcePinId: string, signal: string,
     *   action: {type: string, targetPinId: string, params?: object}}} binding
     * @returns {object} the stored, normalized binding
     * @throws {TypeError} on a bad signal, unknown action, or invalid parameters
     */
    add(binding) {
      const normalized = this._normalize(binding);
      this._bindings.set(normalized.id, normalized);
      return normalized;
    }
    /** Normalize and validate a binding without storing it. */
    _normalize(binding) {
      const source = binding && typeof binding === "object" ? binding : {};
      const action = source.action && typeof source.action === "object" ? source.action : {};
      if (typeof source.sourcePinId !== "string" || source.sourcePinId === "") {
        throw new TypeError("ReactionStore.add: a sourcePinId is required");
      }
      if (!SIGNAL_SET.has(source.signal)) {
        throw new TypeError(`ReactionStore.add: "${source.signal}" is not a Pin signal`);
      }
      if (typeof action.targetPinId !== "string" || action.targetPinId === "") {
        throw new TypeError("ReactionStore.add: an action.targetPinId is required");
      }
      const result = this.registry.validate(action.type, action.params);
      if (!result.valid) throw new TypeError(`ReactionStore.add: ${result.error}`);
      return {
        id: typeof source.id === "string" && source.id ? source.id : freshId(),
        sourcePinId: source.sourcePinId,
        signal: source.signal,
        action: { type: action.type, targetPinId: action.targetPinId, params: result.params }
      };
    }
    remove(id) {
      return this._bindings.delete(id);
    }
    get(id) {
      return this._bindings.get(id);
    }
    /** Every binding, in insertion order. */
    all() {
      return Array.from(this._bindings.values());
    }
    /** Every binding fired by a Pin, whatever the signal. */
    forSource(pinId) {
      return this.all().filter((binding) => binding.sourcePinId === pinId);
    }
    /** The bindings a given signal on a given Pin should run. */
    matching(pinId, signal) {
      return this.all().filter((binding) => binding.sourcePinId === pinId && binding.signal === signal);
    }
    /** Whether any binding names this Pin as either end. */
    references(pinId) {
      return this.all().some((binding) => binding.sourcePinId === pinId || binding.action.targetPinId === pinId);
    }
    /**
     * Drop every binding that names this Pin as source or target.
     * @returns {number} how many bindings were removed
     */
    pruneForPin(pinId) {
      let removed = 0;
      for (const [id, binding] of this._bindings) {
        if (binding.sourcePinId === pinId || binding.action.targetPinId === pinId) {
          this._bindings.delete(id);
          removed += 1;
        }
      }
      return removed;
    }
    clear() {
      this._bindings.clear();
    }
    /** Every binding as a plain, JSON-safe object (the serialization surface). */
    toJSON() {
      return this.all().map((binding) => ({
        id: binding.id,
        sourcePinId: binding.sourcePinId,
        signal: binding.signal,
        action: {
          type: binding.action.type,
          targetPinId: binding.action.targetPinId,
          params: { ...binding.action.params }
        }
      }));
    }
    /**
     * Replace the store's contents from a persisted list.
     *
     * Clears first, so loading a saved canvas over a live one is a replace, not a
     * merge - the same semantics `clearCanvas` gives the Pins themselves. A binding
     * that fails validation, or (given `pinExists`) names a Pin that did not come
     * back, is skipped with a warning rather than thrown: a canvas that restores
     * nine bindings out of ten is worth more than one that restores none.
     *
     * @param {object[]} list
     * @param {{pinExists?: (id: string) => boolean, warn?: (message: string) => void}} [options]
     * @returns {string[]} the warnings collected
     */
    load(list, options = {}) {
      this.clear();
      const warnings = [];
      const exists = typeof options.pinExists === "function" ? options.pinExists : null;
      const warn = (message) => {
        warnings.push(message);
        if (options.warn) options.warn(message);
      };
      for (const raw of Array.isArray(list) ? list : []) {
        const bad = exists ? this._danglingEnd(raw, exists) : null;
        if (bad) {
          warn(`reaction skipped: ${bad}`);
          continue;
        }
        try {
          this.add(raw);
        } catch (error) {
          warn(`reaction skipped: ${error.message}`);
        }
      }
      return warnings;
    }
    /** The description of a missing endpoint, or null when both resolve. */
    _danglingEnd(raw, exists) {
      const source = raw && typeof raw === "object" ? raw : {};
      const action = source.action && typeof source.action === "object" ? source.action : {};
      if (source.sourcePinId && !exists(source.sourcePinId)) return `source pin "${source.sourcePinId}" is gone`;
      if (action.targetPinId && !exists(action.targetPinId)) return `target pin "${action.targetPinId}" is gone`;
      return null;
    }
  };
  var ReactionRunner = class {
    constructor(session, store, registry = actionRegistry) {
      this.session = session;
      this.store = store;
      this.registry = registry;
      this._unsubscribe = null;
      this._onSignal = this._onSignal.bind(this);
    }
    /** Begin observing the session's Pin signals. Idempotent. */
    attach() {
      if (this._unsubscribe) return this;
      this._unsubscribe = this.session.pinManager.onSignal(this._onSignal);
      return this;
    }
    /** Stop observing. */
    detach() {
      if (this._unsubscribe) this._unsubscribe();
      this._unsubscribe = null;
      return this;
    }
    /** One relayed Pin signal: prune on a death, otherwise run what it fires. */
    _onSignal(event) {
      const source = event && event.detail ? event.detail.source : null;
      if (!source || source.utility) return;
      if (event.type === "destroy") {
        this.store.pruneForPin(source.id);
        return;
      }
      const bindings = this.store.matching(source.id, event.type);
      for (const binding of bindings) this._run(binding, source, event);
    }
    /**
     * Run one binding's action against its target, if the target still exists.
     *
     * A missing target is the runtime orphan case: skipped, never thrown. A `run`
     * that itself throws is contained to its own binding, so one broken action
     * cannot take the bus - or the next binding on the same signal - down with it.
     */
    _run(binding, source, event) {
      const { type, targetPinId, params } = binding.action;
      const target = this.session.getPin(targetPinId);
      if (!target) return;
      try {
        this.registry.run(type, target, params, { session: this.session, source, target, event });
      } catch (error) {
        if (typeof console !== "undefined") {
          console.error(`[CloudCanvas] reaction "${binding.id}" (${type}) failed`, error);
        }
      }
    }
  };
  var STORES = /* @__PURE__ */ new WeakMap();
  var RUNNERS = /* @__PURE__ */ new WeakMap();
  function reactionsFor(session) {
    let store = STORES.get(session);
    if (!store) {
      store = new ReactionStore();
      STORES.set(session, store);
    }
    return store;
  }
  function attachReactions(session, options = {}) {
    const store = reactionsFor(session);
    if (Array.isArray(options.bindings)) {
      store.load(options.bindings, { pinExists: (id) => Boolean(session.getPin(id)) });
    }
    const existing = RUNNERS.get(session);
    if (existing) existing.detach();
    const runner = new ReactionRunner(session, store).attach();
    RUNNERS.set(session, runner);
    return { store, runner, detach: () => detachReactions(session) };
  }
  function detachReactions(session) {
    const runner = RUNNERS.get(session);
    if (runner) runner.detach();
    RUNNERS.delete(session);
  }

  // pins/group.js
  var GROUP_STORAGE_PREFIX = "cloudcanvas-group:";
  function storage() {
    if (typeof localStorage === "undefined") return null;
    return localStorage;
  }
  function serializeGroup(rootPin) {
    if (!rootPin || typeof rootPin !== "object") {
      throw new TypeError("serializeGroup: a valid Pin instance is required");
    }
    function serializeNode(pin) {
      const contents = {};
      if (pin.contents instanceof Map) {
        for (const [k, v] of pin.contents.entries()) {
          if (v !== void 0 && typeof v !== "function") {
            contents[k] = v;
          }
        }
      }
      const traitNames = pin.traits instanceof Map ? Array.from(pin.traits.keys()) : [];
      const children = pin.children instanceof Set || Array.isArray(pin.children) ? Array.from(pin.children).filter((c) => !c.utility).map(serializeNode) : [];
      return {
        type: pin.type || (pin.displayTrait ? pin.displayTrait.name : "card"),
        x: pin.x || 0,
        y: pin.y || 0,
        width: pin.particle ? pin.particle.width : pin.width,
        height: pin.particle ? pin.particle.height : pin.height,
        layout: pin.layout || "free",
        layoutGap: pin.layoutGap !== void 0 ? pin.layoutGap : null,
        chrome: pin.chrome !== void 0 ? pin.chrome : true,
        bordered: pin.bordered !== void 0 ? pin.bordered : true,
        contents,
        traitNames,
        children
      };
    }
    return serializeNode(rootPin);
  }
  function saveGroup(rootPin, name) {
    if (typeof name !== "string" || name.trim().length === 0) {
      throw new TypeError("saveGroup: a non-empty name is required");
    }
    const store = storage();
    const data = serializeGroup(rootPin);
    if (store) {
      store.setItem(`${GROUP_STORAGE_PREFIX}${name.trim()}`, JSON.stringify(data));
    }
    return data;
  }
  function loadGroup(name) {
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
  function listGroupKeys() {
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
  function deleteGroup(name) {
    const store = storage();
    if (!store) return false;
    const key = `${GROUP_STORAGE_PREFIX}${name.trim()}`;
    if (store.getItem(key) === null) return false;
    store.removeItem(key);
    return true;
  }
  function instantiateGroup(session, groupData, options = {}) {
    if (!session || typeof session.createPin !== "function") {
      throw new TypeError("instantiateGroup: a valid CloudCanvasSession is required");
    }
    if (!groupData || typeof groupData !== "object") {
      throw new TypeError("instantiateGroup: invalid group data");
    }
    function spawnNode(nodeData, parentPin = null, isRoot = false) {
      const posX = isRoot && options.x !== void 0 ? options.x : nodeData.x;
      const posY = isRoot && options.y !== void 0 ? options.y : nodeData.y;
      const targetParent = isRoot && options.parent !== void 0 ? options.parent : parentPin;
      const pinConfig = {
        type: nodeData.type,
        x: posX,
        y: posY,
        contents: { ...nodeData.contents || {} },
        parent: targetParent
      };
      if (nodeData.width) pinConfig.width = nodeData.width;
      if (nodeData.height) pinConfig.height = nodeData.height;
      if (nodeData.chrome !== void 0) pinConfig.chrome = nodeData.chrome;
      if (nodeData.bordered !== void 0) pinConfig.bordered = nodeData.bordered;
      const pin = session.createPin(pinConfig);
      if (nodeData.layout) pin.layout = nodeData.layout;
      if (nodeData.layoutGap !== void 0 && nodeData.layoutGap !== null) {
        pin.layoutGap = nodeData.layoutGap;
      }
      if (Array.isArray(nodeData.traitNames)) {
        for (const t of nodeData.traitNames) {
          if (!pin.traits.has(t)) {
            try {
              pin.addTrait(t);
            } catch {
            }
          }
        }
      }
      if (Array.isArray(nodeData.children)) {
        for (const childData of nodeData.children) {
          spawnNode(childData, pin, false);
        }
      }
      return pin;
    }
    return spawnNode(groupData, null, true);
  }

  // graphics/style-gates.js
  var STYLE_RULES = Object.freeze({
    TOKEN: "token",
    PREFIX: "prefix",
    IMPORTANT: "important"
  });
  var THEMABLE_PROPERTY = /^(?:color|background|background-color|background-image|background-size|box-shadow|font|font-family|font-size|font-weight|border-radius|padding|padding-[a-z]+|margin|margin-[a-z]+|z-index)$/;
  var STRUCTURAL_RESET_PROPERTY = /^(?:display|visibility|transition|animation|pointer-events|overflow|touch-action|user-select)$/;
  var UNFORCEABLE_PROPERTY = /^z-index$/;
  var KEYWORD_VALUE = /^[a-z-]+$/i;
  var LITERAL_ALLOWED = /^[a-z-]+$/i;
  var COMMENT_PATTERN = /\/\*[\s\S]*?\*\//g;
  var CLASS_PATTERN = /\.(-?[_a-zA-Z][\w-]*)/g;
  var IMPORTANT_PATTERN = /!\s*important/i;
  function checkStyleDiscipline(css, options = {}) {
    const prefix = options.prefix === void 0 ? "cloudcanvas-" : options.prefix;
    const statePrefixes = options.allowStateClasses || ["cc-", "is-"];
    const themable = options.themableProperty || THEMABLE_PROPERTY;
    const readers = tokenReaders(options.extraTokenReaders);
    const violations = [];
    const stats = { rules: 0, declarations: 0, themable: 0, classes: 0 };
    for (const rule of parseRules(css)) {
      stats.rules += 1;
      checkSelector(rule.selector, prefix, statePrefixes, violations, stats);
      for (const declaration of declarationsOf(rule.body)) {
        stats.declarations += 1;
        checkImportant(rule.selector, declaration, readers, violations);
        if (!themable.test(declaration.property)) continue;
        stats.themable += 1;
        checkTokenReads(rule.selector, declaration, readers, violations);
      }
    }
    return { violations, stats };
  }
  function checkSelector(selector, prefix, statePrefixes, violations, stats) {
    const seen = /* @__PURE__ */ new Set();
    for (const match of selector.matchAll(CLASS_PATTERN)) {
      const className = match[1];
      if (seen.has(className)) continue;
      seen.add(className);
      stats.classes += 1;
      if (className.startsWith(prefix)) continue;
      if (statePrefixes.some((state) => className.startsWith(state))) continue;
      violations.push({
        rule: STYLE_RULES.PREFIX,
        selector,
        className,
        message: `"${selector}" - class ".${className}" is not namespaced "${prefix}"`
      });
    }
  }
  function checkImportant(selector, { property, value }, readers, violations) {
    if (!IMPORTANT_PATTERN.test(value)) return;
    const bare = value.replace(IMPORTANT_PATTERN, "").trim();
    const forced = !UNFORCEABLE_PROPERTY.test(property) && (isPureTokenRead(bare, readers) || STRUCTURAL_RESET_PROPERTY.test(property) && KEYWORD_VALUE.test(bare));
    if (forced) return;
    violations.push({
      rule: STYLE_RULES.IMPORTANT,
      selector,
      property,
      value,
      message: `"${selector}" - ${property}: ${value} forces a value a consumer cannot override`
    });
  }
  function checkTokenReads(selector, { property, value }, readers, violations) {
    if (readers.exempt.some((pattern) => pattern.test(value))) return;
    const literal = stripTokenReads(value.replace(IMPORTANT_PATTERN, ""), readers.functions);
    for (const word of literal.split(/[\s,()]+/)) {
      if (word === "" || word === "0" || LITERAL_ALLOWED.test(word)) continue;
      violations.push({
        rule: STYLE_RULES.TOKEN,
        selector,
        property,
        value,
        literal: word,
        message: `"${selector}" - ${property}: ${value} - "${word}" is a literal outside a var() fallback`
      });
    }
  }
  function tokenReaders(extra = []) {
    const functions = ["var"];
    const exempt = [];
    for (const entry of extra) {
      if (entry instanceof RegExp) exempt.push(entry);
      else if (typeof entry === "string" && entry.length > 0) functions.push(entry);
    }
    return { functions, exempt };
  }
  function isPureTokenRead(value, readers) {
    if (readers.exempt.some((pattern) => pattern.test(value))) return true;
    return stripTokenReads(value, readers.functions).trim() === "";
  }
  function stripTokenReads(value, functions) {
    let out = "";
    let index = 0;
    while (index < value.length) {
      const call = nextCall(value, index, functions);
      if (!call) {
        out += value.slice(index);
        break;
      }
      out += value.slice(index, call.start);
      index = closingParen(value, call.open) + 1;
    }
    return out;
  }
  function nextCall(value, from, functions) {
    let best = null;
    for (const name of functions) {
      const needle = `${name}(`;
      const start2 = value.indexOf(needle, from);
      if (start2 === -1) continue;
      if (start2 > 0 && /[\w-]/.test(value[start2 - 1])) continue;
      if (!best || start2 < best.start) best = { start: start2, open: start2 + name.length };
    }
    return best;
  }
  function closingParen(value, open) {
    let depth = 0;
    for (let cursor = open; cursor < value.length; cursor += 1) {
      if (value[cursor] === "(") depth += 1;
      else if (value[cursor] === ")") {
        depth -= 1;
        if (depth === 0) return cursor;
      }
    }
    return value.length;
  }
  function parseRules(css) {
    const stripped = String(css || "").replace(COMMENT_PATTERN, "");
    const rules = [];
    for (const chunk of stripped.split("}")) {
      const open = chunk.lastIndexOf("{");
      if (open === -1) continue;
      const prelude = chunk.slice(0, open);
      const nested = prelude.lastIndexOf("{");
      rules.push({
        selector: prelude.slice(nested + 1).replace(/\s+/g, " ").trim(),
        body: chunk.slice(open + 1)
      });
    }
    return rules;
  }
  function declarationsOf(body) {
    const declarations = [];
    for (const raw of body.split(";")) {
      const colon = raw.indexOf(":");
      if (colon === -1) continue;
      declarations.push({
        property: raw.slice(0, colon).trim().toLowerCase(),
        value: raw.slice(colon + 1).trim()
      });
    }
    return declarations;
  }

  // graphics/tokens.js
  var TOKEN_CATEGORY = Object.freeze({
    COLOR: "color",
    SPACE: "space",
    RADIUS: "radius",
    SHADOW: "shadow",
    TYPE: "type",
    Z_INDEX: "z-index",
    SIZE: "size",
    LAYOUT: "layout"
  });
  var C = TOKEN_CATEGORY;
  var TOKENS = Object.freeze({
    /* ---- foundations: colour ---- */
    "--cc-bg": { category: C.COLOR, purpose: "Canvas background fill" },
    "--cc-grid-dot": { category: C.COLOR, purpose: "Dot colour of the background grid" },
    "--cc-text": { category: C.COLOR, purpose: "Primary body text colour" },
    "--cc-text-muted": { category: C.COLOR, purpose: "Secondary/muted text colour" },
    "--cc-accent": { category: C.COLOR, purpose: "Accent colour for selection and controls" },
    "--cc-focus": { category: C.COLOR, purpose: "Focus ring / focused-Pin outline colour" },
    "--cc-focus-glow": { category: C.COLOR, purpose: "Soft glow around a focused Pin" },
    "--cc-focus-veil": { category: C.COLOR, purpose: "Dimming veil over the unfocused canvas" },
    "--cc-focus-ring": { category: C.COLOR, purpose: "Keyboard focus-visible outline colour" },
    "--cc-connector": { category: C.COLOR, purpose: "Default connector stroke colour" },
    "--cc-cursor-focus": { category: C.COLOR, purpose: "Focus cursor reticle colour" },
    "--cc-cursor-selected": { category: C.COLOR, purpose: "Selection cursor colour" },
    "--cc-cursor-activated": { category: C.COLOR, purpose: "Activation cursor colour" },
    "--cc-cursor-label": { category: C.COLOR, purpose: "Cursor caption text colour" },
    "--cc-card-bg": { category: C.COLOR, purpose: "Card surface fill" },
    "--cc-card-border": { category: C.COLOR, purpose: "Card border colour" },
    "--cc-card-border-hover": { category: C.COLOR, purpose: "Card border colour on hover" },
    "--cc-scope-bg": { category: C.COLOR, purpose: "Scope-well surface fill" },
    "--cc-scope-border": { category: C.COLOR, purpose: "Scope-well dashed outline colour" },
    "--cc-badge-bg": { category: C.COLOR, purpose: "Badge background fill" },
    "--cc-badge-text": { category: C.COLOR, purpose: "Badge label colour" },
    "--cc-badge-text-override": { category: C.COLOR, purpose: "Theme override for computed badge text colour" },
    "--cc-badge-border": { category: C.COLOR, purpose: "Badge border colour" },
    "--cc-btn-bg": { category: C.COLOR, purpose: "Action button background" },
    "--cc-btn-bg-hover": { category: C.COLOR, purpose: "Action button background on hover" },
    "--cc-btn-border": { category: C.COLOR, purpose: "Action button border colour" },
    "--cc-btn-text": { category: C.COLOR, purpose: "Action button label colour" },
    "--cc-meter-track": { category: C.COLOR, purpose: "Gradient-meter track colour" },
    "--cc-meter-end": { category: C.COLOR, purpose: "Gradient-meter far-end colour" },
    "--cc-menu-bg": { category: C.COLOR, purpose: "Context-menu surface fill" },
    "--cc-menu-border": { category: C.COLOR, purpose: "Context-menu border colour" },
    "--cc-menu-item-bg": { category: C.COLOR, purpose: "Context-menu item background" },
    "--cc-menu-item-bg-hover": { category: C.COLOR, purpose: "Context-menu item background on hover" },
    "--cc-resize-handle-bg": { category: C.COLOR, purpose: "Resize-handle fill colour" },
    "--cc-resize-handle-ring": { category: C.COLOR, purpose: "Resize-handle outer ring shadow" },
    "--cc-grab-handle-bg": { category: C.COLOR, purpose: "Chromeless grab-handle background" },
    "--cc-grab-handle-dot": { category: C.COLOR, purpose: "Grab-handle grip-dot colour" },
    "--cc-grab-handle-fill": { category: C.COLOR, purpose: "Grab-handle backing fill" },
    "--cc-grab-handle-ring": { category: C.COLOR, purpose: "Grab-handle outer ring shadow" },
    /* ---- foundations: spacing ---- */
    "--cc-space-1": { category: C.SPACE, purpose: "Spacing step 1 (tightest)" },
    "--cc-space-2": { category: C.SPACE, purpose: "Spacing step 2" },
    "--cc-space-3": { category: C.SPACE, purpose: "Spacing step 3" },
    "--cc-space-4": { category: C.SPACE, purpose: "Spacing step 4 (widest)" },
    /* ---- foundations: radius ---- */
    "--cc-radius-sm": { category: C.RADIUS, purpose: "Small corner radius (chips, insets)" },
    "--cc-radius-md": { category: C.RADIUS, purpose: "Medium corner radius (cards, menus)" },
    "--cc-radius-pill": { category: C.RADIUS, purpose: "Full pill radius (badges, meters)" },
    /* ---- foundations: shadow ---- */
    "--cc-shadow-1": { category: C.SHADOW, purpose: "Resting elevation shadow" },
    "--cc-shadow-2": { category: C.SHADOW, purpose: "Raised elevation shadow (hover, drag)" },
    "--cc-shadow-focus": { category: C.SHADOW, purpose: "Focused-Pin shadow stack" },
    /* ---- foundations: type ---- */
    "--cc-font": { category: C.TYPE, purpose: "Base font-family stack" },
    "--cc-type-xs": { category: C.TYPE, purpose: "Extra-small type size" },
    "--cc-type-sm": { category: C.TYPE, purpose: "Small type size" },
    "--cc-type-md": { category: C.TYPE, purpose: "Medium (body) type size" },
    "--cc-type-lg": { category: C.TYPE, purpose: "Large (title) type size" },
    "--cc-weight-medium": { category: C.TYPE, purpose: "Medium font weight" },
    "--cc-weight-semibold": { category: C.TYPE, purpose: "Semibold font weight" },
    /* ---- foundations: stacking ---- */
    "--cc-z-svg": { category: C.Z_INDEX, purpose: "SVG connector layer stacking order" },
    "--cc-z-plane": { category: C.Z_INDEX, purpose: "Pin plane stacking order" },
    "--cc-z-overlay": { category: C.Z_INDEX, purpose: "Cursor/overlay layer stacking order" },
    "--cc-z-veil": { category: C.Z_INDEX, purpose: "Focus veil stacking order" },
    "--cc-z-elevated": { category: C.Z_INDEX, purpose: "Elevated-Pin stacking order" },
    "--cc-z-drag": { category: C.Z_INDEX, purpose: "Dragging/resizing Pin stacking order" },
    "--cc-z-menu": { category: C.Z_INDEX, purpose: "Context-menu stacking order" },
    /* ---- scalar geometry (themable knobs) ---- */
    "--cc-grid-size": { category: C.SIZE, purpose: "Background grid cell size" },
    "--cc-grid-dot-size": { category: C.SIZE, purpose: "Background grid dot radius" },
    "--cc-card-blur": { category: C.SIZE, purpose: "Card backdrop blur radius" },
    "--cc-card-max-width": { category: C.SIZE, purpose: "Max width of a self-sizing card" },
    "--cc-media-max-height": { category: C.SIZE, purpose: "Max height of a media Pin image" },
    "--cc-scope-min-height": { category: C.SIZE, purpose: "Minimum populated scope-well height" },
    "--cc-control-min": { category: C.SIZE, purpose: "Minimum interactive control height" },
    "--cc-control-min-coarse": { category: C.SIZE, purpose: "Minimum control height for coarse pointers" },
    "--cc-menu-min-width": { category: C.SIZE, purpose: "Minimum context-menu width" },
    "--cc-focus-ring-width": { category: C.SIZE, purpose: "Keyboard focus outline width" },
    "--cc-focus-ring-offset": { category: C.SIZE, purpose: "Keyboard focus outline offset" },
    "--cc-resize-handle-size": { category: C.SIZE, purpose: "Resize-handle size" },
    "--cc-resize-handle-size-coarse": { category: C.SIZE, purpose: "Resize-handle size for coarse pointers" },
    "--cc-grab-handle-size": { category: C.SIZE, purpose: "Grab-handle size" },
    "--cc-grab-handle-size-coarse": { category: C.SIZE, purpose: "Grab-handle size for coarse pointers" },
    /* ---- layout ---- */
    "--cc-layout-gap": { category: C.LAYOUT, purpose: "Gap between flow-container children" },
    "--cc-grid-columns": { category: C.LAYOUT, purpose: "Grid container column-track template" },
    "--cc-scope-overflow": { category: C.LAYOUT, purpose: "Overflow behaviour of a populated scope well" }
  });
  var TOKEN_NAMES = Object.freeze(Object.keys(TOKENS));
  function isToken(name) {
    return Object.prototype.hasOwnProperty.call(TOKENS, name);
  }
  function tokensInCategory(category) {
    return Object.entries(TOKENS).filter(([, entry]) => entry.category === category);
  }
  function lightThemeValue(name) {
    return LIGHT_THEME[name];
  }

  // index.js
  function createCanvasSession(options = {}) {
    return new CloudCanvasSession(options);
  }
  return __toCommonJS(index_exports);
})();
