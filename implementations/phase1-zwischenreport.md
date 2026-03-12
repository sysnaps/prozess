# Phase 1 Zwischenreport — Route Walking Foundation

## what was built

| file | change |
|------|--------|
| `signal.js:170-179` | `sig.walk(link)` — wraps `sig.route()` with `walked: []`, `payload: []` |
| `egg.js:53-96` | `eggs.roots()` — creates conop entry points on the egg after init |
| `route.js` | NEW — route walker loop with conop/realm/concept/exe dispatch |
| `zells.js:65-154` | rewrote `.get(concept, signal)` and `.exe(concept, signal)` — find/load/create, counters, payload |
| `gaps.js` | NEW — gap zells, `gaps.populate(ring)` fills 459 slots, `gaps.swap` replaces a gap |
| `hyph.js:14` | `:` → `᛬` (runic colon) mapping in `hyph.resolve()` |

## three bugs found in zells.js

1. **`const { zells } = {}`** — destructuring from empty object gives `undefined`. every downstream require that touched zells would crash when loaded in isolation. fixed to `const zells = {}`.

2. **missing `collection` import** — `zells.cage.create` and `zells.runebook.create` both call `collection()` but zells.js never required it. worked before by accident (collection was already in node's module cache from an earlier require chain). added `require("./collection")` at the top.

3. **`collection({ "unit": "cage" })` missing items** — collection() expects `cdna.items` to be an array. cage and runebook were created without `items: []`, so `collection()` would crash on `cdna.items.length`. these only survived before because zells.init was always called from code that had already loaded collection into cache AND the zell dna already had a runebook/cage from chicken data. fresh zells (like gaps) would fail. fixed both to `{ "unit": "cage", items: [] }`.

all three bugs are the same class: **implicit load-order dependencies**. the old pipeline always loaded egg.js first (which loads collection, wells, walk, zells in that order), so cached modules masked the missing requires. route walking loads modules more independently — these had to be fixed.

## design decisions

### route.js as thin loop, not fat dispatcher

the plan said "no separate route.js" in the earlier doc, suggesting the loop lives in entrance.js. i made route.js anyway because:
- entrance.js currently does type detection AND dispatch. mixing the walk loop into it would make entrance.js do three things.
- route.js is 80 lines. it has one job: pop from irpath, detect step type, delegate.
- Phase 2 will add sphere-specific .get behaviors. those live in the zell factories (zones.js, wells.js), not in route.js. the walker stays thin.

the loop can easily be inlined into entrance.js later if that's preferred.

### peek-based exe detection

the walker needs to know when a concept is the "last before a conop" vs a regular get. solved with peek functions:

```
peek.last(signal)       — irpath is empty after this step
peek.conop(signal)      — next step is a conop character
```

if either is true → `.exe()` instead of `.get()`. this is stateless — no mode tracking needed beyond what the irpath gives us.

### zells.get as layered find-or-create

`.get(concept, signal)` has three layers:
1. `zells.get.find(dna, concept)` — check if `dna[concept]` already exists
2. `zells.get.load(dna, concept)` — try `hyph.get(chickenpath)`
3. `zells.get.create(dna, concept)` — create fresh zell via `zells.create()`

each is its own named function on the zells.get namespace. Phase 2 will override `.create` per sphere — that's where strand-specific pascal logic and irlink-specific well logic will live.

### egg roots wired after lookups.init

`eggs.roots()` runs after `lookups.init()` so that realmnum lookups work when Phase 2 needs them inside `.get`. the roots themselves are just empty objects — `egg["~"].default = {}` etc. the ring well reference is wired in (`e["~"].default.ring = ring`) so .get handlers can find their ring.

## what matters for Phase 2

### 1. zells.get.create is the plug point

right now `zells.get.create` just calls `zells.create(concept)` — a bare zell with counters and runebook. Phase 2 needs sphere-specific creation:

- **strand .get**: first concept → zone finding via `rings.assign()`, gap swapping, pascal creation. subsequent concepts → `strands.chick()` logic (triangle point assignment, pyramid layers).
- **irlink .get**: well creation via `wells.create()`, distribute unschärfe via `wells.distribute()`.

the sphere can be detected from the egg root we're walking through. `egg["~"].default` knows it's a ring (`.ring` property wired in eggs.roots). `egg.default` knows it's a globe (`.globe` property).

possible approach: instead of a generic `zells.get.create`, have the realm object carry a `.creator` function set during `eggs.roots()`. or detect sphere from the walked conop in the signal.

### 2. conop transitions need state on the signal

when the walker hits `:` after walking `~.default.llms.claude`, it needs to know:
- which zone we're in (from the strand walking)
- which realm we're in

this state could live on the signal object. something like `signal.zone` set by the strand .get, then read by the cosmos .exe after `:`. the plan mentions "zone reference stored on signal for subsequent steps" — this is the mechanism.

similarly `°` needs to know the globe realm for groups, and `@` needs the mofu well for lofu.

### 3. chickenpath building differs per sphere

`zells.get.chickenpath` currently does `dna.chicken + "/." + concept`. this works for a simple flat tree but:
- strands need `~name/.1.nick` — the realmnum goes in the filename
- irlinks need `.1.q` / `q/.1.Center` — same realmnum pattern
- cosmos caps need `zones/default/name/1.seri` — different folder structure

Phase 2 should override chickenpath building per sphere. the realm object could carry a `.chickenpath(dna, concept, realmnum)` function.

### 4. gaps.swap integrates with rings.assign

`rings.assign()` currently creates zones at free slots. Phase 2 should change this: instead of finding free slots, swap a gap. the gap already occupies the slot with the right minschärfe.

```
before: rings.free(ring, ref, distance) → slot number → zones.create({minschärfe: ring.slot(slot)})
after:  rings.free(ring, ref, distance) → slot number → gaps.swap(ring, slot, newzone)
```

the zone still gets created with `zones.create()`, but the gap's slot number and minschärfe are known. `gaps.swap` handles the collection bookkeeping.

### 5. payload accumulation vs thrystem

the plan mentions thrystem (numeric mirror paths) but Phase 1 skips it. the payload currently collects `child.buffgit.thrigit` arrays as the walk progresses. for Phase 2:

- each `.get` pushes its thrigit to payload
- `.exe` reads payload to build the final buffgit
- thrystem mirroring (if implemented) would happen during `.get` — writing `egg["~"]["1"]["2"]` alongside `egg["~"].default.llms`

thrystem is tracked for later, not Phase 2 scope.

### 6. strands.save stays as utility

`strands.save.zone()` and `strands.save.cosmos()` persist zone/cap data to chicken. these are pure save functions (no creation logic) and should be called at the end of a strand walk. Phase 2 can call them from the `.exe` endpoint or from a post-walk hook on the signal.

### 7. the `.` conop is in the conops array

`conops = ["@", "!", ".", ":", "+", "~", "°", "/"]` — note `.` is a conop. but `.` is also the separator in link strings (`q.Center`). sig.route() already splits on `.` and doesn't include it in the irpath. so the route walker never sees a `.` step. but if raw unsplit paths ever enter the walker, `.` would trigger a conop switch incorrectly. worth keeping in mind.

### 8. exe fallback to get

when `.exe` is called but the current object has no `.exe` method, route.js falls back to `.get`. this handles the case where a step looks like an endpoint (last in path) but the current node is a plain object without exe. Phase 2 should ensure all realm roots have proper .get/.exe once they carry real logic.
