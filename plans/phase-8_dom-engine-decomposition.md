<!-- Written by Richard Christopher, Copyright 2026 NeoTec, LLC -->
# Phase 8 — Decomposable Pins: chrome, reparenting, offload

CloudCanvas is the DOM engine; the Sandbox is one app built on it. These are
core `src/` primitives, not sandbox-app logic. All three reuse an existing
shipped pattern — no new subsystem, no new abstraction layer.

## α — Live chrome toggle (src/pins/pin.js, pin-element.js)
`pin.chrome` get/set, mirroring the `bordered` accessor shipped in 0.4.0
exactly (same file, same pattern). The setter doesn't invent a second render
path — it re-runs the display trait's own `build`/`update` with the new flag,
same as any other content change. `chrome:false` leaves `contentElement` as
the pin's own boundary (no wrapping card) — that already works at construction
time; this just makes the same decision re-runnable live.

**New, not a toggle of existing code**: a small persistent grab handle,
visible only when `chrome === false && pin.selected` — identical
visibility wiring to `ResizableTrait`'s handles (same `select` signal hook).
Reason it's needed: `DraggableTrait` correctly declines real controls via
`CONTROL_SELECTOR` (a `<button>` shouldn't lose its click to a drag), and with
chrome off, `pin.element` *is* the control — nothing else to grab. The handle
sits outside the control's own hit area and is NOT itself `data-cc-control`,
so it initiates drag normally.

## β — Reparent / detach (src/pins/traits/interaction.js, new core module)
One primitive, two directions: `reparentPin(pin, newParent, {x, y})` —
`newParent` a Pin nests it (shared box); `newParent === null` promotes it to
root (pulled out of a shared box, floating). Implementation is
`oldParent.removeChild(pin)` + `newParent.addChild(pin)` (or session-root
equivalent) plus the same canvas↔scope-local coordinate conversion
`place({within})` already does — reuse that math, don't re-derive it.

The drop-target hit-test already exists: Sprint 7.2 built "find the deepest
droppable pin under this point" for dragging a *new* widget from the palette
onto a Container. Promote that same hit-test into core and call it from
`DraggableTrait`'s `drag:end` unconditionally (not just on pin creation) — if
the drop point resolves to a scope different from the pin's current parent,
reparent; otherwise it's an ordinary move, unchanged. Same Pin instance
throughout — traits Map, particle, selection state all survive untouched.

`lib/sandbox/serialize.js` already walks `pin.children`, so a pin reparented
before save should round-trip correctly with no serializer change — verify
this holds, don't assume.

## γ — Lazy offload + dirty-cache (render loop, reload-strategy site)
The dirty-cache is not new work — `pin.invalidate('content')` / `_frameDirty`
already exist and are proven load-bearing (Sprint 7.1 mutation-tested: deleting
the invalidate call made exactly the affected browser tests fail). This track
is an audit + one new capability, not a new engine.

New: the opposite direction of `reload:'lazy'` (which lazily *creates*
children once). Pins outside the viewport, past a configurable margin, get
their DOM detached (not destroyed — model/particle/traits stay live) and
reattached when panned back into range. Land it as one more reload-strategy
value / pin option next to the existing ones, invoked from the same per-frame
pass that already walks pins for dirty-marking — not a parallel virtualization
system.

## Order
α, β, γ are mutually independent — three parallel tracks, same split as
Sprint 7.1. `pin.js` is touched by both α (chrome accessor) and possibly β
(if `addChild`/`removeChild` need a small fix for live reparenting) — same
additive-block discipline that worked for `styles-css.js` in 7.1. QA gate
after all three land. Sandbox wiring (chrome-toggle exposed in the inspector,
drag-to-nest just works because core now handles it, a context-menu "Pull
out" action for detach) is a thin follow-up consumer pass, not part of this
phase's core work.

## Tests
Unit: `pin.chrome` toggle rebuilds DOM correctly both directions; grab handle
visibility tracks `selected` and only when chromeless; `reparentPin` both
directions preserve traits/particle/selection; serialize round-trip after a
live reparent; offload/reattach preserves pin state across a detach-reattach
cycle. Browser: chromeless pin still draggable/selectable via the handle;
drag an existing placed pin into a Container and it nests, coordinates
correct; drag it back out (detach) and it's a free root pin again; a pin
panned far off-screen and back reappears correctly with no state loss.

## Risks
Chromeless-drag-affordance is the one real design fork — resolved here as a
small persistent handle (reuses ResizableTrait's precedent) rather than a
modifier-key drag, to stay consistent with existing UI language. Reparenting
mid-drag must not fight the existing Container-drop-on-create path — same
hit-test, one caller. Offload must not evict a pin the dirty-cache still
thinks is visible-and-dirty — reattach has to clear that correctly.
