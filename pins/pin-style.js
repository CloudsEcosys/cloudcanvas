/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Per-Pin style overrides: the sanctioned mutator for one Pin's own appearance,
 * and the one table both it and any editor UI read.
 *
 * The sibling of `pin-contents.js` - small, focused, the Pin passed first to
 * every function - over a different surface. Contents are what a display trait
 * renders *into* the content node; these are the presentation of the Pin's own
 * root box: its corner radius, its surface colour, its bevel, and - for a child
 * of a flow container - where it sits within the layout.
 *
 * THE WRITE IS A DIRECT INLINE PROPERTY, not a custom-property token.
 * `border-radius: 14px` is written straight onto the root element, where it
 * outranks the stylesheet's `border-radius: var(--cc-radius-md, 10px)` on
 * specificity alone (an inline declaration beats any ordinary rule, with no
 * `!important`). The one exception is by design: `styles-css.js` gives
 * `.cloudcanvas-pin.is-focused` its focus glow `box-shadow` with `!important`,
 * which does outrank an inline write - so a bevel preset is defeated while the
 * Pin holds focus, and reappears the moment it blurs. A focus indicator is not
 * meant to be user-overridable, so this is correct, not a leak.
 * The alternative - writing `--cc-radius-md` inline and letting the existing
 * `var()` read pick it up - was rejected for three reasons:
 *
 *   1. It demands a per-display-type map of which `--cc-*` token each type
 *      happens to read: a card reads `--cc-radius-md`, a badge `--cc-radius-pill`,
 *      and a `chrome: false` component reads none at all (it draws its own
 *      surface). A direct `border-radius` write is correct for every one of them;
 *      a token write does nothing for the component.
 *   2. A custom property cascades. Writing `--cc-radius-md` onto the root leaks
 *      into every descendant that reads the same token - nested cards, the scope
 *      well - when the intent was this one Pin's box.
 *   3. Clearing is symmetric and exact: `removeProperty` drops the inline value
 *      and the stylesheet's token default is what shows through again.
 *
 * `align-self` / `justify-self` are layout, not design-token-backed, so they are
 * plain inline writes whatever the mechanism - and they have no visible effect
 * unless the Pin is a child of a Row / Column / Grid container, exactly as a
 * non-flex-item's `align-self` is inert. The override is still stored (the UI
 * disables the control and says why, mirroring the inspector's X/Y lock), so a
 * Pin later dropped into a flow container honours the alignment it was given.
 *
 * The override lives entirely in the element's inline style - there is no flag
 * on the Pin mirroring it, unlike `bordered`/`chrome`. A headless Pin (no
 * element) therefore has nowhere to keep one, and a write is a validated no-op.
 * Display rendering never touches the root's inline style (it writes into the
 * content node), so an override set here survives every content re-render.
 */

/**
 * The bevel presets, as the `box-shadow` values they write.
 *
 * A bevel here is a soft, shadow-drawn one - an outer drop plus an inset top
 * highlight and inset bottom shadow - not `border-style: outset/inset`. It
 * matches the sheet's own `inset 0 1px 0 rgba(255,255,255,...)` highlight
 * tokens and the flat aesthetic, and it occupies no layout, where a real
 * border style would eat into the card's border-box and fight its 1px border
 * (the same reason `is-borderless` is a transparent border, not `border: none`).
 *
 * Literal values, deliberately: this is one Pin's inline style, not the
 * framework stylesheet the style-discipline gate lints, so no token read is
 * owed. The empty value is the default - clearing the override.
 */
export const BEVEL_PRESETS = /* @__PURE__ */ Object.freeze([
  { value: '', label: 'None (default)' },
  {
    value: '0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.12), inset 0 -1px 0 rgba(0, 0, 0, 0.25)',
    label: 'Raised'
  },
  {
    value: 'inset 0 2px 4px rgba(0, 0, 0, 0.45), inset 0 -1px 0 rgba(255, 255, 255, 0.06)',
    label: 'Inset (pressed)'
  },
  {
    value: '0 12px 32px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
    label: 'Floating'
  }
]);

/** Font-weight choices, as the values written. */
const FONT_WEIGHTS = /* @__PURE__ */ Object.freeze([
  { value: '', label: '(default)' },
  { value: '400', label: 'Regular (400)' },
  { value: '500', label: 'Medium (500)' },
  { value: '600', label: 'Semibold (600)' },
  { value: '700', label: 'Bold (700)' }
]);

/** Font-family stacks, as the values written. */
const FONT_FAMILIES = /* @__PURE__ */ Object.freeze([
  { value: '', label: '(default)' },
  { value: 'var(--cc-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif)', label: 'System' },
  { value: 'Georgia, "Times New Roman", serif', label: 'Serif' },
  { value: 'var(--cc-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace)', label: 'Monospace' }
]);

/** Text-alignment choices. */
const TEXT_ALIGN = /* @__PURE__ */ Object.freeze([
  { value: '', label: '(default)' },
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
  { value: 'justify', label: 'Justify' }
]);

/** The flow-placement keyword set `align-self` / `justify-self` are offered as. */
const SELF_ALIGN = /* @__PURE__ */ Object.freeze([
  { value: 'start', label: 'Start' },
  { value: 'center', label: 'Center' },
  { value: 'end', label: 'End' },
  { value: 'stretch', label: 'Stretch' }
]);

/**
 * The one table both the allow-list and any editor iterate.
 *
 * Reuses `THEMABLE_PROPERTY`'s vocabulary (colour, background, box-shadow,
 * font-*, border-radius, padding, margin) plus the three placement properties
 * (`text-align`, `align-self`, `justify-self`). Adding a knob later is one line
 * here, not a parallel edit in a mutator and a form.
 *
 * Per entry:
 *   - `property` : the CSS property written, and its allow-list key
 *   - `label`    : the human name an editor shows
 *   - `control`  : the control kind an editor builds - 'color', 'length'
 *                  (a number of px), 'select' (one of `options`), or 'presets'
 *                  (a button per `options` value)
 *   - `options`  : the value set for 'select' / 'presets'
 *   - `reflow`   : true when a change moves the Pin's layout box, so the mutator
 *                  owes the renderer a re-measure (the same call `setChrome`
 *                  makes); false for a paint-only property like colour or radius
 *   - `flowOnly` : true for a property inert unless the Pin is a flow child
 */
export const STYLE_PROPERTIES = /* @__PURE__ */ Object.freeze([
  Object.freeze({ property: 'color', label: 'Text colour', control: 'color', reflow: false }),
  Object.freeze({ property: 'background-color', label: 'Background', control: 'color', reflow: false }),
  Object.freeze({ property: 'border-radius', label: 'Corner radius', control: 'length', reflow: false }),
  Object.freeze({ property: 'box-shadow', label: 'Bevel / shadow', control: 'select', options: BEVEL_PRESETS, reflow: false }),
  Object.freeze({ property: 'padding', label: 'Padding', control: 'length', reflow: true }),
  Object.freeze({ property: 'margin', label: 'Margin', control: 'length', reflow: true }),
  Object.freeze({ property: 'font-size', label: 'Font size', control: 'length', reflow: true }),
  Object.freeze({ property: 'font-weight', label: 'Font weight', control: 'select', options: FONT_WEIGHTS, reflow: true }),
  Object.freeze({ property: 'font-family', label: 'Font family', control: 'select', options: FONT_FAMILIES, reflow: true }),
  Object.freeze({ property: 'text-align', label: 'Text align', control: 'select', options: TEXT_ALIGN, reflow: false }),
  Object.freeze({ property: 'align-self', label: 'Align self', control: 'presets', options: SELF_ALIGN, reflow: true, flowOnly: true }),
  Object.freeze({ property: 'justify-self', label: 'Justify self', control: 'presets', options: SELF_ALIGN, reflow: true, flowOnly: true })
]);

/** Property -> entry, built once, for O(1) validation. */
const ENTRY_BY_PROPERTY = /* @__PURE__ */ new Map(/* @__PURE__ */ STYLE_PROPERTIES.map((entry) => [entry.property, entry]));

/** Whether a property is one this mutator will write. */
export function isStyleProperty(property) {
  return ENTRY_BY_PROPERTY.has(property);
}

/** The table entry for a property, or undefined. */
export function stylePropertyInfo(property) {
  return ENTRY_BY_PROPERTY.get(property);
}

/** The allow-listed entry, or a thrown rejection - the one gate every write passes. */
function requireEntry(property) {
  const entry = ENTRY_BY_PROPERTY.get(property);
  if (!entry) {
    throw new TypeError(
      `setPinStyle: "${property}" is not a styleable property; `
      + `expected one of ${STYLE_PROPERTIES.map((e) => e.property).join(', ')}`
    );
  }
  return entry;
}

/** The Pin's root inline style, or null when it has no element (headless). */
function styleOf(pin) {
  return pin && pin.element && pin.element.style ? pin.element.style : null;
}

/**
 * A change that moves the layout box owes the renderer a re-measure, exactly as
 * `setChrome` does: the particle, any connector anchored to the Pin, and the
 * scope well it sits in all read that box. A paint-only property owes nothing.
 */
function reflow(pin, entry) {
  if (entry.reflow && pin.element) pin.invalidate('content');
}

/**
 * Write one appearance override onto the Pin's root element.
 *
 * @param {Pin} pin
 * @param {string} property an allow-listed property (see {@link STYLE_PROPERTIES})
 * @param {string} value the CSS value; an empty string clears the override
 * @returns {string} the value now in force ('' when cleared)
 * @throws {TypeError} on a property outside the allow-list, or a non-string value
 */
export function setPinStyle(pin, property, value) {
  const entry = requireEntry(property);
  if (typeof value !== 'string') {
    throw new TypeError(`setPinStyle: value for "${property}" must be a string`);
  }

  const trimmed = value.trim();
  const style = styleOf(pin);
  if (style) {
    if (trimmed === '') style.removeProperty(property);
    else style.setProperty(property, trimmed);
  }
  reflow(pin, entry);
  // What the CSSOM actually holds, not the raw input: a value it silently
  // rejected leaves '' in force, and the caller is owed that truth, not garbage.
  return style ? style.getPropertyValue(property) : trimmed;
}

/**
 * Drop one appearance override, restoring the stylesheet default.
 *
 * @returns {boolean} always true; the Pin is left with no override for the property
 * @throws {TypeError} on a property outside the allow-list
 */
export function clearPinStyle(pin, property) {
  const entry = requireEntry(property);
  const style = styleOf(pin);
  if (style) style.removeProperty(property);
  reflow(pin, entry);
  return true;
}

/**
 * The override currently in force for a property, or '' when there is none.
 * @throws {TypeError} on a property outside the allow-list
 */
export function getPinStyle(pin, property) {
  requireEntry(property);
  const style = styleOf(pin);
  return style ? style.getPropertyValue(property) : '';
}

/**
 * Every override this Pin carries, as a plain `{ property: value }` object.
 *
 * Only allow-listed properties with a value set are included, so the map is
 * exactly what serialization should persist - never the transform or the
 * width/height the renderer and the sizing path own.
 *
 * @returns {Object<string, string>}
 */
export function pinStyleMap(pin) {
  const map = {};
  const style = styleOf(pin);
  if (!style) return map;

  for (const entry of STYLE_PROPERTIES) {
    const value = style.getPropertyValue(entry.property);
    if (value) map[entry.property] = value;
  }
  return map;
}

/**
 * Apply a persisted override map back onto a Pin (deserialization).
 *
 * Each entry is run through the same allow-list as a live write, so an unknown
 * or malformed key from an old or hand-edited snapshot is skipped rather than
 * written blind.
 *
 * @param {Pin} pin
 * @param {Object<string, string>|null} map
 */
export function applyPinStyleMap(pin, map) {
  if (!map || typeof map !== 'object') return;
  for (const [property, value] of Object.entries(map)) {
    if (isStyleProperty(property) && typeof value === 'string' && value !== '') {
      setPinStyle(pin, property, value);
    }
  }
}
