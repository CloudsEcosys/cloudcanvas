/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Primitive generators: color/URL/number validation at the markup boundary.
 *
 * Every generator in primitives.js returns a string that a caller assigns to
 * `innerHTML`, so a caller-supplied value that is not what it claims to be
 * (`#fff;"><img onerror=...>` as a "color") becomes live markup. These tests
 * parse the generated strings through the DOM and assert nothing survives.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { LIGHT_THEME } from '../../graphics/theme.js';
import {
  createBadgeSVG,
  createVectorPointerSVG,
  createGradientMeterSVG,
  createConnectorPathSVG,
  createFrustumProjectionSVG,
  createFocusCursorSVG,
  createPlaceholderDataURI,
  contrastTextFor,
  relativeLuminance,
  safeColor,
  safeNumber,
  safeUrl
} from '../../graphics/primitives/primitives.js';
import { resetDocument } from '../helpers/dom.js';

/** The exact payload QA proved live in the browser (badge `color`). */
const BREAKOUT = '#fff;"><img src=q onerror=window.__xssColor=1>';

/** Attribute-injection payload proven against `stroke="${color}"`. */
const ATTR_INJECT = '#fff" onload="window.__xssVec=1';

const HOSTILE_COLORS = [
  BREAKOUT,
  ATTR_INJECT,
  "#fff'><script>window.__xssColor=1</script>",
  'red;background:url(javascript:alert(1))',
  '</style><img src=q onerror=alert(1)>',
  'expression(alert(1)):',
  'rgb(0,0,0)"/><animate onbegin=alert(1)',
  '#fff\n" onmouseover="alert(1)'
];

const VALID_COLORS = [
  '#38bdf8',
  '#fff',
  '#38bdf8cc',
  'rgba(0, 0, 0, .5)',
  'rgb(56 189 248 / 60%)',
  'hsl(200, 90%, 60%)',
  'rebeccapurple',
  'var(--cc-accent)',
  'var(--cc-accent, #38bdf8)'
];

/** Parse generated markup and hand back the container for structural assertions. */
function parse(markup) {
  const holder = document.createElement('div');
  holder.innerHTML = markup;
  return holder;
}

test('safeColor - accepts the CSS color grammar and nothing else', () => {
  for (const color of VALID_COLORS) {
    assert.equal(safeColor(color, '#000'), color, `rejected a valid color: ${color}`);
  }

  for (const color of HOSTILE_COLORS) {
    assert.equal(safeColor(color, '#000'), '#000', `accepted a hostile color: ${color}`);
  }

  assert.equal(safeColor(undefined, '#123456'), '#123456');
  assert.equal(safeColor(null, '#123456'), '#123456');
  assert.equal(safeColor({ toString: () => '#fff' }, '#123456'), '#123456', 'non-strings must not be coerced');
  assert.equal(safeColor('  #38bdf8  ', '#000'), '#38bdf8', 'surrounding whitespace was not trimmed');
  assert.equal(safeColor('#12345', '#000'), '#000', 'a 5-digit hex is not a color');
  assert.equal(safeColor('a'.repeat(200), '#000'), '#000', 'unbounded length accepted');
  assert.equal(safeColor(BREAKOUT, BREAKOUT), '#38bdf8', 'a hostile fallback must degrade to the default');
});

test('safeNumber - coerces and rejects non-finite values', () => {
  assert.equal(safeNumber(12, 5), 12);
  assert.equal(safeNumber('12.5', 5), 12.5);
  assert.equal(safeNumber(0, 5), 0, 'zero is a number');
  assert.equal(safeNumber(NaN, 5), 5);
  assert.equal(safeNumber(Infinity, 5), 5);
  assert.equal(safeNumber('20px" onload="alert(1)', 5), 5);
  assert.equal(safeNumber(undefined, 5), 5);
  assert.equal(safeNumber({}, 5), 5);
  assert.equal(safeNumber('nope', NaN), 0, 'a non-finite fallback must degrade to 0');
});

test('safeUrl - allows http(s), relative and image data URIs only', () => {
  const placeholder = createPlaceholderDataURI();

  assert.equal(safeUrl('https://example.test/a.avif', placeholder), 'https://example.test/a.avif');
  assert.equal(safeUrl('http://example.test/a.png', placeholder), 'http://example.test/a.png');
  assert.equal(safeUrl('/assets/a.png', placeholder), '/assets/a.png');
  assert.equal(safeUrl('assets/a.png', placeholder), 'assets/a.png');
  assert.equal(safeUrl(placeholder, ''), placeholder, 'the built-in placeholder must survive');

  assert.equal(safeUrl('javascript:window.__xssSrc=1', placeholder), placeholder);
  assert.equal(safeUrl('  JaVaScRiPt:alert(1)', placeholder), placeholder);
  assert.equal(safeUrl('java\nscript:alert(1)', placeholder), placeholder, 'control chars smuggled a scheme');
  assert.equal(safeUrl('java\tscript:alert(1)', placeholder), placeholder);
  assert.equal(safeUrl('data:text/html,<script>alert(1)</script>', placeholder), placeholder);
  assert.equal(safeUrl('vbscript:alert(1)', placeholder), placeholder);
  assert.equal(safeUrl('', placeholder), placeholder);
  assert.equal(safeUrl(undefined, placeholder), placeholder);
});

test('primitives - the badge breakout payload renders inert', (t) => {
  t.after(resetDocument);

  const markup = createBadgeSVG('B', BREAKOUT);
  assert.ok(!markup.includes('<img'), `badge leaked markup: ${markup}`);
  assert.ok(!markup.includes('onerror'), `badge leaked an event handler: ${markup}`);
  assert.ok(markup.includes('#38bdf8'), 'badge did not fall back to its declared color');

  const holder = parse(markup);
  assert.equal(holder.querySelector('img'), null, 'the payload became a live element');
  assert.equal(holder.querySelectorAll('span').length, 2, 'badge structure changed shape');
  assert.equal(globalThis.__xssColor, undefined);
});

test('primitives - a color cannot inject an attribute on the vector pointer', (t) => {
  t.after(resetDocument);

  const markup = createVectorPointerSVG(45, { color: ATTR_INJECT });
  assert.ok(!markup.includes('onload'), `stroke leaked an event handler: ${markup}`);
  assert.ok(markup.includes('stroke="#38bdf8"'), 'the stroke did not fall back');

  const line = parse(markup).querySelector('line');
  assert.ok(line, 'the pointer did not render');
  assert.equal(line.getAttribute('onload'), null, 'an attribute was injected');
  assert.deepEqual(
    line.getAttributeNames().sort(),
    ['stroke', 'stroke-linecap', 'stroke-width', 'x1', 'x2', 'y1', 'y2'],
    'the line grew an unexpected attribute'
  );
});

test('primitives - every generator rejects hostile colors and keeps valid ones', () => {
  const bounds = { minX: 0, minY: 0, maxX: 10, maxY: 10 };
  const build = {
    vectorPointer: (color) => createVectorPointerSVG(1, { color }),
    gradientMeter: (color) => createGradientMeterSVG(50, 0, 100, { color }),
    connector: (color) => createConnectorPathSVG(0, 0, 10, 10, { stroke: color }),
    badge: (color) => createBadgeSVG('B', color),
    frustum: (color) => createFrustumProjectionSVG({ width: 800, height: 600 }, bounds, { stroke: color }),
    focusCursor: (color) => createFocusCursorSVG(bounds, { color })
  };

  for (const [name, generate] of Object.entries(build)) {
    for (const color of HOSTILE_COLORS) {
      const markup = generate(color);
      assert.ok(!markup.includes(color), `${name} interpolated a hostile color verbatim`);
      assert.ok(!/on[a-z]+\s*=/i.test(markup), `${name} leaked an event handler for: ${color}`);
      assert.ok(!markup.includes('<img'), `${name} leaked an element for: ${color}`);
      assert.equal(parse(markup).querySelector('img'), null, `${name} produced a live img for: ${color}`);
    }

    for (const color of VALID_COLORS) {
      assert.ok(generate(color).includes(color), `${name} dropped a valid color: ${color}`);
    }
  }
});

test('primitives - numeric arguments never render NaN into markup', () => {
  const meter = createGradientMeterSVG(NaN, NaN, NaN, { height: 'tall' });
  assert.ok(!meter.includes('NaN'), `meter rendered NaN: ${meter}`);
  assert.ok(meter.includes('width: 0.0%'), `meter percent collapsed wrongly: ${meter}`);
  assert.ok(meter.includes('height: 6px'), 'meter height did not fall back');

  assert.ok(createGradientMeterSVG(50, 100, 100).includes('width: 0.0%'), 'a zero span divided by zero');
  assert.ok(createGradientMeterSVG(150, 0, 100).includes('width: 100.0%'), 'clamping regressed');

  const pointer = createVectorPointerSVG('spin', { size: 'big' });
  assert.ok(!pointer.includes('NaN'), `pointer rendered NaN: ${pointer}`);
  assert.ok(pointer.includes('rotate(0.0deg)'));
  assert.ok(pointer.includes('width="24"'));

  const connector = createConnectorPathSVG('a', 'b', undefined, null, { strokeWidth: 'thick' });
  assert.ok(!connector.includes('NaN'), `connector rendered NaN: ${connector}`);
  assert.ok(connector.includes('stroke-width="2"'));

  const frustum = createFrustumProjectionSVG({}, { minX: 'x' }, { opacity: 'clear' });
  assert.ok(!frustum.includes('NaN'), `frustum rendered NaN: ${frustum}`);
  assert.ok(frustum.includes('opacity="0.85"'));

  const cursor = createFocusCursorSVG({}, { cornerSize: 'wide', padding: 'none' });
  assert.ok(!cursor.includes('NaN'), `focus cursor rendered NaN: ${cursor}`);
});

/* ------------------ FRUSTUM & CONNECTOR GEOMETRY ------------------ */

/** Every `M x y` move command in a path's `d`, as number pairs. */
function moveCommands(markup) {
  const d = /d="([^"]*)"/.exec(markup);
  if (!d) return [];
  return Array.from(d[1].matchAll(/M\s+(-?[\d.]+)\s+(-?[\d.]+)/g))
    .map((match) => ({ x: Number(match[1]), y: Number(match[2]) }));
}

test('createFrustumProjectionSVG - four tapered spikes from the real parent corners', () => {
  const parent = { minX: 100, minY: 200, maxX: 500, maxY: 600 };
  const target = { minX: 200, minY: 300, maxX: 300, maxY: 400 };
  const markup = createFrustumProjectionSVG(parent, target, { stroke: '#833446', strokeWidth: 4 });

  // One filled path, four subpaths: the taper is geometry, not a stroke width.
  const moves = moveCommands(markup);
  assert.equal(moves.length, 4, `expected four spikes, got ${moves.length}`);
  assert.match(markup, /fill="#833446"/);
  assert.match(markup, /stroke="none"/);

  // Every base straddles its own parent corner by half the base width (4 / 2).
  const corners = [
    { x: parent.minX, y: parent.minY },
    { x: parent.maxX, y: parent.minY },
    { x: parent.maxX, y: parent.maxY },
    { x: parent.minX, y: parent.maxY }
  ];
  for (const [index, corner] of corners.entries()) {
    assert.ok(
      Math.hypot(moves[index].x - corner.x, moves[index].y - corner.y) <= 2.1,
      `spike ${index} starts at ${JSON.stringify(moves[index])}, not corner ${JSON.stringify(corner)}`
    );
  }

  // ...and each stops 35% of the way in, well short of the target corner.
  const tips = Array.from(/d="([^"]*)"/.exec(markup)[1].matchAll(/L\s+(-?[\d.]+)\s+(-?[\d.]+)\s+L/g));
  assert.equal(tips.length, 4);
  assert.equal(Number(tips[0][1]), 100 + (200 - 100) * 0.35);
  assert.equal(Number(tips[0][2]), 200 + (300 - 200) * 0.35);
});

test('createFrustumProjectionSVG - the dashed rectangle is gone and degenerate runs vanish', () => {
  const markup = createFrustumProjectionSVG(
    { minX: 0, minY: 0, maxX: 400, maxY: 400 },
    { minX: 50, minY: 50, maxX: 350, maxY: 350 }
  );

  // The reticle brackets are the single outline of the target now.
  assert.equal(markup.includes('<rect'), false, 'the frustum still draws its own box');
  assert.equal(markup.includes('stroke-dasharray'), false, 'the dashed outline survived');

  // A target sitting exactly on the parent corners has nothing to point at.
  const box = { minX: 10, minY: 20, maxX: 30, maxY: 40 };
  const collapsed = createFrustumProjectionSVG(box, box);
  assert.equal(moveCommands(collapsed).length, 0, 'a zero-length spike was drawn anyway');
  assert.equal(collapsed.includes('NaN'), false);
});

test('createConnectorPathSVG - the stroke does not scale with the camera', () => {
  const markup = createConnectorPathSVG(0, 0, 100, 100, {});
  assert.match(
    markup,
    /vector-effect="non-scaling-stroke"/,
    'the connector stroke will thicken with zoom'
  );
});

/* ------------------ CONTRAST ------------------ */

/** Card background `createBadgeSVG` composites its fill over. */
const BADGE_SURFACE = '#1e293b';

/** Badge fill alpha, as the fraction the generator uses (0x40 / 255). */
const BADGE_BG_ALPHA = 0x40 / 255;

/** The WCAG floor for normal-size text. */
const AA_CONTRAST = 4.5;

/**
 * Tint sweep: the demo palette, the extremes, and the mid-luminance band where
 * neither foreground is obviously right.
 */
const BADGE_TINTS = [
  '#38bdf8', '#a855f7', '#f43f5e', '#eab308', '#22d3ee', '#34d399', '#ec4899',
  '#10b981', '#6366f1', '#000000', '#ffffff', '#808080', '#7f7f7f', '#4b5563',
  '#94a3b8', '#facc15', '#1e293b', '#0b1220', '#ff0000', '#00ff00', '#0000ff'
];

/** Independent re-implementation of the composite the generator performs. */
function compositeOver(hex, alpha, base) {
  const channels = (value) => [1, 3, 5].map((index) => parseInt(value.slice(index, index + 2), 16));
  const [tr, tg, tb] = channels(hex);
  const [br, bg, bb] = channels(base);
  const mix = (top, bottom) => Math.round(top * alpha + bottom * (1 - alpha));
  const pair = (value) => value.toString(16).padStart(2, '0');
  return `#${pair(mix(tr, br))}${pair(mix(tg, bg))}${pair(mix(tb, bb))}`;
}

function contrast(a, b) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * What a badge writes: the two fill tokens, and the text colour - which is not a
 * token but a `color` declaration whose *fallback* is the computed value, so a
 * theme can override it (`--cc-badge-text-override`) and nothing else can.
 */
function badgeTokens(markup) {
  const style = parse(markup).querySelector('.cloudcanvas-primitive-badge').getAttribute('style');
  const read = (name) => (new RegExp(`${name}:\\s*([^;]+)`).exec(style) || [])[1];
  // The fallback may itself be a `var()` read, so the match runs to the last
  // closing paren rather than the first.
  const color = (read('color') || '').trim();
  return {
    text: (/^var\(--cc-badge-text-override,\s*([\s\S]*)\)$/.exec(color) || [])[1],
    color,
    border: read('--cc-badge-border'),
    bg: read('--cc-badge-bg')
  };
}

test('relativeLuminance - known values, short hex, and non-hex colors', () => {
  assert.equal(relativeLuminance('#ffffff'), 1);
  assert.equal(relativeLuminance('#000000'), 0);
  assert.equal(relativeLuminance('#fff'), relativeLuminance('#ffffff'), 'short hex was not expanded');
  assert.equal(relativeLuminance('#ffffffcc'), 1, 'alpha changed the luminance');

  // Mid grey, from the WCAG formula: 0.2159.
  assert.ok(Math.abs(relativeLuminance('#808080') - 0.2159) < 1e-4);
  // The primary channels carry their weights exactly.
  assert.ok(Math.abs(relativeLuminance('#ff0000') - 0.2126) < 1e-9);
  assert.ok(Math.abs(relativeLuminance('#00ff00') - 0.7152) < 1e-9);
  assert.ok(Math.abs(relativeLuminance('#0000ff') - 0.0722) < 1e-9);

  // A color whose value only exists after the cascade has no luminance here.
  for (const color of ['var(--cc-accent)', 'rebeccapurple', 'rgb(0,0,0)', '', null, 42]) {
    assert.ok(Number.isNaN(relativeLuminance(color)), `invented a luminance for ${color}`);
  }
});

test('contrastTextFor - picks the readable foreground, and defaults to light', () => {
  assert.equal(contrastTextFor('#ffffff'), '#0b1220');
  assert.equal(contrastTextFor('#000000'), '#f8fafc');
  assert.equal(contrastTextFor('#1e293b'), '#f8fafc', 'the default card wants light text');
  assert.equal(contrastTextFor('#facc15'), '#0b1220', 'a bright tint wants dark text');

  // Whatever it picks, it picks the better of the two, for every sweep tint.
  for (const tint of BADGE_TINTS) {
    const chosen = contrastTextFor(tint);
    const other = chosen === '#f8fafc' ? '#0b1220' : '#f8fafc';
    assert.ok(
      contrast(tint, chosen) >= contrast(tint, other),
      `${tint} took the worse foreground`
    );
  }

  // Callers may supply their own pair.
  assert.equal(contrastTextFor('#000000', '#eeeeee', '#111111'), '#eeeeee');
  // An unknown background falls back to light: every shipped surface is dark.
  assert.equal(contrastTextFor('var(--cc-accent)'), '#f8fafc');
});

test('createBadgeSVG - every hex tint clears 4.5:1 against its own composited fill', () => {
  for (const tint of BADGE_TINTS) {
    const tokens = badgeTokens(createBadgeSVG('status', tint));

    assert.equal(tokens.bg, `${tint}40`, `${tint} fill alpha floor`);
    assert.equal(tokens.border, `${tint}66`, `${tint} border alpha floor`);

    const surface = compositeOver(tint, BADGE_BG_ALPHA, BADGE_SURFACE);
    const ratio = contrast(tokens.text, surface);
    assert.ok(
      ratio >= AA_CONTRAST,
      `${tint}: text ${tokens.text} on ${surface} is ${ratio.toFixed(2)}:1`
    );
  }
});

test('createBadgeSVG - the dot keeps the raw tint, and non-hex tints keep the old behaviour', () => {
  const badge = parse(createBadgeSVG('status', '#000000'));
  const dot = badge.querySelector('.cloudcanvas-primitive-badge span');
  assert.match(dot.getAttribute('style'), /background:\s*#000000/);
  assert.equal(badgeTokens(createBadgeSVG('status', '#000000')).text, '#f8fafc');

  // Values the generator cannot resolve are left exactly as they were: tinted
  // text and the legacy alphas, because a contrast decision on a guess is worse.
  for (const tint of ['var(--cc-accent)', 'rebeccapurple', '#fff', 'rgb(56, 189, 248)']) {
    const tokens = badgeTokens(createBadgeSVG('status', tint));
    assert.equal(tokens.text, tint, `${tint} was overridden`);
    assert.equal(tokens.bg, `${tint}26`, `${tint} fill changed`);
    assert.equal(tokens.border, `${tint}4d`, `${tint} border changed`);
  }
});

/** A light card, opaque: what `LIGHT_THEME` actually paints a badge onto. */
const LIGHT_CARD_SURFACE = '#fbfbfc';

test('createBadgeSVG - the computed colour is a fallback a theme can override', () => {
  const markup = createBadgeSVG('status', '#38bdf8');

  // The colour is inline (it is computed per tint, so no stylesheet can hold
  // it) but it is read through a token first, which is the only way a
  // host-level theme can outrank an inline declaration.
  assert.match(markup, /color:\s*var\(--cc-badge-text-override,\s*#[0-9a-f]{6}\)/i);
  assert.ok(!markup.includes('--cc-badge-text:'), 'the badge still writes the losing token');
  assert.equal(badgeTokens(markup).text, contrastTextFor(
    compositeOver('#38bdf8', BADGE_BG_ALPHA, '#1e293b')
  ));
});

test('createBadgeSVG - the assumed surface is a parameter, and a light one flips the text', () => {
  for (const tint of BADGE_TINTS) {
    const onLight = badgeTokens(createBadgeSVG('status', tint, { surface: LIGHT_CARD_SURFACE }));
    const surface = compositeOver(tint, BADGE_BG_ALPHA, LIGHT_CARD_SURFACE);
    const ratio = contrast(onLight.text, surface);

    assert.ok(
      ratio >= AA_CONTRAST,
      `${tint} on a light card: text ${onLight.text} on ${surface} is ${ratio.toFixed(2)}:1`
    );
  }

  // The whole point of the token: on a light card the computed-for-dark answer
  // is the wrong one, and `LIGHT_THEME` says so once instead of per badge.
  const themed = LIGHT_THEME['--cc-badge-text-override'];
  for (const tint of BADGE_TINTS) {
    const surface = compositeOver(tint, BADGE_BG_ALPHA, LIGHT_CARD_SURFACE);
    const ratio = contrast(themed, surface);
    assert.ok(
      ratio >= AA_CONTRAST,
      `the light theme's badge text ${themed} is ${ratio.toFixed(2)}:1 on ${surface}`
    );
  }
});
