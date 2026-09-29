/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * `UI_TOKENS`: the tokens only the UI kit reads, in the engine catalogue's
 * shape (`{category, purpose}`, category values from `TOKEN_CATEGORY`). They live
 * with the kit rather than in `../graphics/tokens.js`, so the core bundle does
 * not carry twenty entries it never reads. Every one chains to a core token in
 * the kit sheet, so a theme that sets only the core tokens themes the kit.
 */

/**
 * The categories used, spelled as `TOKEN_CATEGORY`'s values (the foundations
 * test holds them to it). Written out rather than imported: importing the
 * engine catalogue module would pull its whole token table into this entry.
 */
const C = /* @__PURE__ */ Object.freeze({ COLOR: 'color', SIZE: 'size', Z_INDEX: 'z-index' });

export const UI_TOKENS = /* @__PURE__ */ Object.freeze({
  /* ---- colour ---- */
  '--cc-ui-surface': { category: C.COLOR, purpose: 'Surface of dialogs, toasts and sticky timeline chrome' },
  '--cc-ui-backdrop': { category: C.COLOR, purpose: 'Dimming layer behind a modal dialog' },
  '--cc-ui-selected': { category: C.COLOR, purpose: 'Fill of a highlighted result option' },
  '--cc-ui-on-accent': { category: C.COLOR, purpose: 'Text on an accent fill (primary button, pressed view, today)' },
  '--cc-ui-grid-line': { category: C.COLOR, purpose: 'Rules between calendar, board and timeline cells' },
  '--cc-ui-hour-lines': { category: C.COLOR, purpose: 'Hour-rule background pattern of the week and day grids' },
  '--cc-ui-bar': { category: C.COLOR, purpose: 'Fill of a calendar event and a timeline bar' },
  '--cc-ui-bar-text': { category: C.COLOR, purpose: 'Text on a calendar event and a timeline bar' },
  '--cc-ui-drop': { category: C.COLOR, purpose: 'Outline of a drop target and of an item being moved' },
  '--cc-ui-today': { category: C.COLOR, purpose: "Fill marking today's date" },

  /* ---- geometry and stacking ---- */
  '--cc-ui-dialog-width': { category: C.SIZE, purpose: 'Maximum width of a dialog panel' },
  '--cc-ui-toast-offset': { category: C.SIZE, purpose: 'Gap between the toast stack and the bottom of the viewport' },
  '--cc-ui-hour-height': { category: C.SIZE, purpose: 'Height of one hour in the week and day grids' },
  '--cc-ui-time-height': { category: C.SIZE, purpose: 'Visible height of the scrolling hour grid' },
  '--cc-ui-timeline-height': { category: C.SIZE, purpose: 'Visible height of the timeline sheet' },
  '--cc-ui-gutter': { category: C.SIZE, purpose: 'Width of the timeline label column' },
  '--cc-ui-graph-height': { category: C.SIZE, purpose: 'Height of the relationship-graph viewport' },
  '--cc-z-ui-toast': { category: C.Z_INDEX, purpose: 'Toast stack stacking order' },
  '--cc-z-ui-raised': { category: C.Z_INDEX, purpose: 'Parts raised inside a UI view: sticky labels, a card being dragged' },
  '--cc-z-ui-sticky': { category: C.Z_INDEX, purpose: 'Sticky headers inside a UI view, above raised parts (the timeline axis)' }
});
