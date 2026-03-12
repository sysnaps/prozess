# Phase 3 Completion + Phase 4 + Grammatik — Implementation Report

## Overview

This batch covers three areas:
1. **Phase 3 remainders** — zone-before-realm ordering, SuPeRs skeleton, Megas skeleton
2. **Phase 4** — irlinks absorbed into the route walker (same pipeline as strands)
3. **Grammatik system** — singular/plural awareness across the pipeline

---

## Batch A: Phase 3 Remainders

### A1. Zone-before-realm

**Problem**: `sig.route("~llms.claude:seri")` produced `["~", "default", "llms", "claude", ":", "seri"]` — realm before zone concept. Zone concept should come first so we can compare a concept across realms.

**Solution**:

`signal.js` — `sig.route.fofu()`: new helper pushes fofu[0] (turbo/continent concept) first, then realm, then remaining concepts.
- `"~llms.claude:seri"` → `["~", "llms", "default", "claude", ":", "seri"]`
- `"q.Center°admins@seri--"` → `["q", "default", "Center", "°", "admins", "@", "seri--"]`

Also fixed `sig.irlink` — lofu was stored as `"@seri--"` with the `@` prefix. Now strips it: stores `"seri--"`.

`route.js` — new mode flow:
- `"root"` → first conop (~) → `"zone"` mode
- `"zone"` → zone concept step (creates `egg["~"].llms`) → `"conop"` mode
- `"conop"` → realm step (creates `egg["~"].llms.default`) → `"concept"` mode
- Irlinks have no vorzeichen: root mode + non-conop step → auto-enters zone mode

Added `zone()` handler: navigates into zone namespace, carries ring/globe references from conop root.

`egg.js` — `eggs.roots.strands` no longer pre-creates `e["~"].default`. The ring reference lives on `e["~"]` directly. Realm objects are lazily init'd by `realm.init()` in route.js — which checks `signal.vorzeichen` to decide `zell:"realm"` (strands) vs `zell:"well"` (irlinks).

`route.finish.fofu()` — updated to skip zone concept + realm (two skips instead of one).

### A2. SuPeRs

`supers.js` — added `.find(realmname)` and `.bridge(realmname)` manufactured closures.
- `.find` looks up `egg["~"][concept][realmname]` to find same zone concept in another realm
- `.bridge` calls `.find` and adds the realm name to a bridges collection
- `supers.create` now includes a `bridges` collection (refs:true)

`zones.js` — `zones.super(dna)` body implemented: creates a SuPeR with `is:"zone"`, returns a closure delegating to `.find`.

### A3. Megas + Continents

`Megas.js`:
- `mega(mdna)` factory: attaches `.find()` manufactured closure
- `.find()` searches both spheres: `egg["~"][concept]` (strand zone) and `egg.default[concept]` (irlink continent)
- `megas.create({concept})` — builds dna with `zell:"mega"`, inits, returns
- `megas.get(concept)` — static find-or-create. Megas live at `egg.megas[concept]`

`continents.js` — fixed skeleton:
- Fixed `module.export` → `module.exports`
- `continent()`: doesn't call `wells.create()`. Sets `zell:"well"`, `well:"continent"`, attaches `.super` and `.mega`
- `continents.super()` creates a SuPeR with `is:"continent"`
- `continents.mega()` delegates to `megas.get(concept)`

`zells.js` — added `mega` to `zells.init.stammzell` dispatch table.

`egg.js` — added `egg.megas = {}` in roots.

`wells.js` — removed `wdna.unit = wdna.unit || "well"` (wells are stammzellen not units).

---

## Batch B: Phase 4 — Irlinks into Route Walker

### B1. Wells.work

`wells.js` — added `wells.work(dna)` manufactured closure for route-walking:
- `wells.work.hydrate(dna, signal)` — ensures midwells collection exists
- `wells.work.find(dna, concept)` — checks `dna[concept]` and `dna.midwells[concept]`
- `wells.work.create(dna, concept, signal)` — creates child well via `wells.create()`, adds to midwells, redistributes
- `wells.work.distribute(dna, signal)` — redistribute unschärfe after adding a child
- `wells.work.record(spore, signal)` — records link on the well
- `wells.work.payload(spore, signal)` — pushes thrigit to signal.payload

`well()` factory: attaches `wdna.work = wells.work(wdna)` alongside existing `.walk`.

### B2. Globe realm + entrance

`egg.js` — `eggs.roots.irlinks()` now inits `egg.default` as a well zell (`zell:"well"`, `well:"fofu"`, `is:"irlink"`). Gets `.work` through stammzell dispatch.

`entrance.js` — `entrance.irlink` now uses `sig.walk(link)` + `route(signal)`, same as strands.

### B3. Conop handlers (° @ :)

`route.js` — `conop()` split into `conop.first()` and `conop.mid()`:
- `°` mid-walk: saves `signal.fofu.endpoint`, switches to `egg["°"]` groups root (init'd as well with `tofu:"mofu"`)
- `@` mid-walk: saves `signal.mofu.endpoint`, prepares lofu collection on current, switches to `"lofu"` mode
- `:` and others: standard egg root switch

Added `lofu()` handler — delegates to `groups.lofu.handle(signal, mofuwell, concept)` with explicit concept parameter.

`groups.js` — `groups.lofu.handle` updated: accepts explicit `concept` param (third argument), falls back to `signal.irpath.lofu[0]`. Uses `wells.create({...})` object form.

### B4. Viewpoint finish

`route.finish` now dispatches:
- `signal.vorzeichen === "~"` → `route.finish.strand` (existing zone/cosmos/nype logic)
- `signal.fofu && signal.mofu` → `route.finish.irlink` (new viewpoint creation)

`route.finish.irlink`:
- Extracts fofu/mofu/lofu wells from signal endpoints
- Checks all three have thrigits
- Checks lookups cache first
- Creates viewpoint via `viewpoints.create()` if not cached
- Reconstructs `signal.irpath` from original link for viewpoint path

### B5. Cleanup

- `entrance.js` no longer imports `irlinks.js`
- `walk.js` still exists and is still attached via `wdna.walk` for backward compat
- `irlinks.js` still exists as dead code — can be deleted once confirmed no other consumers

---

## Grammatik System

### Design

Every zell gets a `dna.grammatik` property. Stammzellen get hardcoded singular/plural forms. Non-stammzellen get grammatik from entrance signal data. The system treats "characters" and "character" as the same concept — whichever name is used first creates the object, and the counterpart gets aliased to the same reference.

### grammatiks.js

**Unit**: `zell:"unit", unit:"grammatik"`

**Data**: `{ singular, plural, type }` — type is freeform (e.g. "noun", "initialism", "name")

**Methods** (manufactured closures):
- `gdna.counterpart(concept)` — given "characters" returns "character" and vice versa
- `gdna.alias.egg(host, concept)` — sets `host[counterpart] = host[concept]`
- `gdna.alias.chicken(chickenpath, concept)` — saves a shortcut file at the counterpart's chicken path

**Statics**:
- `grammatiks.stammzellen` — lookup table: zone/zones, well/wells, pascal/pascals, ring/rings, triangle/triangles, pyramid/pyramids, gap/gaps, viewpoint/viewpoints, cap/caps, realm/realms, mega/megas, super/supers, cosmos/cosmi, funk/funks, continent/continents
- `grammatiks.resolve(host, concept, signal)` — resolves concept against signal's grammatik data. If "characters" doesn't exist on host but "character" does, returns "character"
- `grammatiks.empty()` — default empty grammatik placeholder

**Chicken shortcuts**: `{ unit: "shortcut", target: "original.chickenpath" }` — small JSON files at the counterpart's path. When `zells.get.load` encounters one, it follows the target.

### zells.js changes

- `zells.grammatik()` — returns empty grammatik placeholder, called in `zells.init`
- `zells.init.stammzell` — after calling factory, looks up `grammatiks.stammzellen[kind]` and sets proper grammatik
- `zells.get.find(dna, concept, signal)` — now grammatik-aware: tries counterpart name if concept not found
- `zells.get.load` — follows shortcuts: if loaded file has `unit:"shortcut"`, loads the target file instead

### route.js changes

- Walk loop tracks `host` (parent before navigating)
- After each step: `route.alias(host, step, current, signal)` — creates counterpart reference on host if signal carries grammatik for that concept
- Also sets `navigated.grammatik = gdna` and creates chicken shortcut if the object is stamped

### entrance.js changes

Now accepts both strings and objects:

```js
// string
entrance("~llms.claude:seri")

// object with grammatik
entrance({
    link: "~llms.claude:seri",
    grammatik: {
        llms: { singular: "llm", plural: "llms", type: "initialism" },
        claude: { singular: "claude", plural: "claudes", type: "name" }
    }
})
```

Object form: extracts `link`, optional `irpath` override, and `grammatik` map. Passes `signal.grammatik` through to route walker where `route.alias` and `zells.get.find` use it.

---

## Insights + Open Questions

### What worked well
- Zone-before-realm was clean — `sig.route.fofu()` handles the reordering, route.js just needed a new `"zone"` mode
- `wells.work` mirrors `zones.work` pattern exactly — manufactured closure, find/create/distribute/payload sub-functions
- Grammatik as a unit (not stammzell) is the right call — it's always a sub-component of another zell

### Open questions
1. **Bees**: irlink|strand pairs that go together. Not yet implemented. Likely a new stammzell type (`zell:"bee"`) that holds references to both a strand and an irlink and coordinates them. Could live in a `bees.js` factory.

2. **Characters as highrs**: Sending "characters" creates a well in the irlink globe. A highr (strand with its own que components that makes it "irlinkable") would also need a strand counterpart. This is where bees come in — the bee links the irlink well to its strand.

3. **Chicken folder shortcuts**: Current implementation creates file shortcuts (`.1.characters` → `.1.character`). Folder shortcuts (so `characters/` and `character/` both work) aren't handled yet. Could use a `.shortcut` marker file inside the counterpart folder.

4. **Grammatik persistence**: Grammatik data is set on zell objects in memory but not explicitly persisted to chicken. The chicken shortcut files carry the `target` reference. The grammatik itself could be saved as part of the chick's JSON — it's already enumerable and would serialize.

5. **Sigs vs units**: Units (`zell:"unit"`) are sub-components (grammatik, collection, cage, runebook). Sigs are return values / signals. The distinction: units have structure and methods, sigs are lightweight status/error indicators.

---

## File Change Summary

| file | what changed |
|------|-------------|
| `signal.js` | sig.route zone-before-realm, sig.irlink strips @ from lofu |
| `route.js` | zone mode, conop.first/mid split, ° ° @ handlers, lofu mode, route.finish dispatch, route.alias grammatik |
| `egg.js` | strand roots simplified, irlinks root as well zell, egg.megas registry |
| `zones.js` | zones.super() body implemented |
| `supers.js` | .find .bridge methods, bridges collection |
| `Megas.js` | full factory + find/create/get |
| `continents.js` | fixed skeleton, module.exports, super/mega wiring |
| `zells.js` | mega in dispatch, zells.grammatik(), stammzell grammatik, shortcut following, grammatik-aware find |
| `wells.js` | wells.work() route-walking, removed wdna.unit |
| `entrance.js` | accepts strings + objects, irlinks through route walker |
| `groups.js` | lofu.handle accepts explicit concept param, wells.create object form |
| `grammatiks.js` | full implementation: factory, stammzellen table, counterpart, alias.egg, alias.chicken, resolve |
