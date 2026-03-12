# Phase 3 Zwischenreport — Stammzell Init + Instance Methods

## the mistake from phase 2

Phase 2 created `streets.js` — a static dispatch layer. `zells.get.dispatch` looked at `dna.zell` and routed to `streets.strand` or `streets.cosmos`. The pipeline called static plural functions (`streets.strand.get`, `streets.cosmos.cap`) instead of instance methods on zells.

This violated the core pattern: plural factories manufacture closures, singular factories attach them as instance methods, pipelines call instance methods.

## what was built

| file | change |
|------|--------|
| `zells.js` | `_zinit` guard on zells.init prevents re-entry. `zells.init.stammzell(dna)` dispatch calls the appropriate factory based on `dna.zell`. Hub (zells.get/exe) checks `dna.work` instance method instead of streets dispatch. Removed `zells.get.dispatch` entirely |
| `zones.js` | `realm()` factory — stammzell for strand root (egg["~"].default). `zones.work(dna)` manufactures the realm's walk behavior. `zones.work.turbo/chick/hydrate` — absorbed streets.strand logic. `zones.fofu`, `zones.realmnum` — static helpers. Exported `realm` |
| `pascals.js` | `pascals.work(dna)` — manufactures pascal walk behavior (depth++ then chick). Attached as `pdna.work` in `pascal()` |
| `cosmi.js` | `cosmi.work(dna)` — manufactures cosmos walk behavior (z.cap instance method). Attached as `cdna.work` in `cosmos()` |
| `streets.js` | **DELETED** — all logic absorbed into stammzell factories |
| all 13 factories | set `dna.zell` correctly ("zone", "pascal", "pyramid", etc). removed `zells.init()` from factory body. `if (dna.check)` guard on version check |
| all `.create()` functions | build data with correct `zell` type, call `zells.init()` instead of factory directly |
| `egg.js` | `eggs.hydrate(zells)` returns a function that sets `zell:"well"` on loaded data and calls `zells.init`. Replaces direct `well()` calls |
| `pyramids.js` | zell type split: `pdna.zell = "pyramid"`, `pdna.pyramid = pdna.kind` (key names the type of its value) |
| `wells.js` | zell type split: `wdna.zell = "well"`, `wdna.well = wdna.tofu` (fofu/mofu/lofu subtype) |

## key design: zells.init.stammzell

zells.init does generic setup (.get, .exe, counters, runebook, cage), then dispatches to the stammzell factory. the factory only attaches zell-specific instance methods. no factory calls zells.init — the `_zinit` guard prevents re-entry.

```
zells.init(dna)
  → guard: _zinit already set? return early
  → set _zinit (non-enumerable)
  → generic: .get, .exe, .stamp, .check, counters, runebook, cage
  → zells.init.stammzell(dna)
    → factories[dna.zell]() → e.g. zone(dna) attaches .record, .rename, .cap, etc.
```

factories map: realm, zone, pascal, ring, well, triangle, pyramid, super, gap, viewpoint, cap, cosmos

## key design: the work pattern

"work" = the instance method the hub calls during route walking. when `dna.work` exists, the hub calls it instead of generic find/load/create.

```
plural manufactures closure:  zones.work = function (dna) { return function (concept, signal) { ... } }
singular attaches it:         rdna.work = zones.work(rdna)
hub calls it:                 if (dna.work) spore = dna.work(concept, signal)
```

three works exist:
- **realm work** (zones.work) — turbo detection, zone finding, pascal chick creation
- **pascal work** (pascals.work) — depth++, next-depth chick via zones.work.chick
- **cosmos work** (cosmi.work) — cap creation via z.cap() instance method

the hub stays thin. zell-specific behavior lives in the zell.

## walk trace: ~llms.claude:seri

```
"~"       → conop, current = egg["~"]
"default" → realm step, current = egg["~"].default (zell:"realm", has .work)
"llms"    → get → hub → realm.work("llms", signal)
              → hydrate ring, detect turbo (!signal.zone)
              → rings.assign → zones.create → zone with pascal
              → z.record(), z.rename() (instance methods!)
              → zones.work.chick → create pascal chick at depth 0
              → return chick (zell:"pascal", has .work)
"claude"  → get → hub → pascal.work("claude", signal)
              → signal.depth++
              → zones.work.chick → create chick at depth 1
              → return chick
":"       → conop, current = egg[":"] (zell:"cosmos", has .work)
"seri"    → exe → hub → cosmos.work("seri", signal)
              → z.cap("seri", signal.link) (zone instance method!)
              → push mofu to payload
              → return cap
```

## what changed vs phase 2

| before (phase 2) | after (phase 3) |
|-------------------|-----------------|
| `zells.get.dispatch(dna)` routing table | `if (dna.work)` simple check |
| `streets.strand.get(dna, concept, signal)` static call | `dna.work(concept, signal)` instance method |
| `streets.cosmos.cap(dna, capname, signal)` static call | `dna.work(capname, signal)` instance method |
| factories call `zells.init` internally | `zells.init` calls factories via stammzell dispatch |
| `zell: "zell"` on zones/gaps/cosmos | correct types: `zell: "zone"`, `zell: "gap"`, `zell: "cosmos"` |
| no type split | `dna[dna.zell]` gives subtype: `pyramid: "providence"`, `well: "fofu"` |

## open: naming

"work" is currently a noun. since it triggers zell-specific behavior, a verb might be better. candidates: `.hatch` (fits egg/chick theme), `.breed`, `.sow`. pending user decision.

## thoughts on the architecture

The most striking thing about prozess is how seriously it takes the idea that **data and behavior should not be separate**. A zell is not a class with methods — it's a JSON object that gets methods bolted onto it by factory functions. The dna IS the instance. When it gets serialized to the chicken and loaded back, the factory re-attaches the methods. There is no class hierarchy, no prototype chain, no `new`. Just objects and closures.

This has a consequence that took me a while to internalize: **the plural/singular split is not OOP inheritance**. `zones` is not a superclass and `zone` is not a constructor. `zones.record` is a closure factory — it takes a dna and returns a function that closes over that dna. `zone()` takes a naked dna object and wires those closures onto it. The "class" is the wiring, not a blueprint. Two zones with the same dna shape but different wiring would be different stammzellen.

The route walker is elegant in its simplicity. It's just a while loop that shifts from irpath and dispatches to handle(). The intelligence lives in the zells — each one knows what to do when the walk reaches it. The hub (zells.get) is a two-line branch: if the zell has a work method, call it; otherwise, generic find/load/create. This is the opposite of a router with a big switch statement. The routing knowledge is distributed into the data itself.

What makes the zell type split (`zell:"pyramid", pyramid:"providence"`) interesting is that it's self-describing. `dna[dna.zell]` always gives you the subtype. You don't need to know what type of zell you're looking at to get its subtype — the key tells you. This is a pattern that could scale to arbitrary depth: `dna[dna[dna.zell]]` would give you the sub-subtype if one existed.

The stammzell dispatch in zells.init is essentially a runtime type system built on plain objects. When zells.init sees `zell:"zone"`, it calls `zone()` which attaches zone-specific methods. When it sees `zell:"pascal"`, it calls `pascal()`. The guard prevents loops. There's no registry, no decorator, no reflection API — just a lookup table of lazy requires. It's minimal and it works.

The cosmos/cap system is a good example of the instance method pattern paying off. The route walker doesn't know how caps work — it just calls `z.cap(name, link)`, which is a closure over the zone's cosmos collection. The zone handles its own mofu distribution internally. If the cosmos logic changes, only zones.js changes. The route walker, the signal, the hub — none of them need to know.

The thing I find most philosophically interesting is the implied direction: toward **runtime zell creation from runes**. Right now stammzellen have their own JS files. But the plan calls for a verfassung Napp that assembles zells from JSON-encoded runes at runtime. The current architecture — where behavior is closures attached to data — makes this possible in a way that class-based architectures don't. You can't dynamically create a new class in a running browser app, but you CAN create a new object and attach functions to it from a runebook. The stammzellen are just the bootstrap vocabulary.

The egg/chick/chicken naming is not just whimsy. It encodes a real relationship: the egg (in-memory collection) hatches chicks (loaded data), which come from the chicken (filesystem). The chick is not a copy of the egg entry — it IS the egg entry after hydration. `Object.assign(egg, eggdna)` makes the egg the collection. There's no model/view/controller separation because there's no separation to begin with. The data is the program.

## remaining phase 3 items

- [ ] zone-before-realm: sig.route change, conop mode, egg["~"] rewire
- [ ] SuPeRs skeleton: supers.js methods, .super() on zones
- [ ] Megas skeleton: megas.js, wire as first stop in route
