# Phase 2 Zwischenreport — Strands into Route Walker

## what was built

| file | change |
|------|--------|
| `route.js` | added `signal.vorzeichen`, `signal.realm` tracking. first vs mid-walk conop detection. `route.finish` saves zone/cosmos and handles nype. `route.finish.fofu` extracts fofu from walked path |
| `streets.js` | NEW — sphere-specific .get/.exe factories. `streets.strand` wires strand realm with turbo/spore/chick logic. `streets.cosmos` wires cosmos root for cap creation |
| `egg.js` | `eggs.roots.strands` calls `streets.strand()` on realm. `eggs.roots.cosmos` calls `streets.cosmos.wire()` |
| `entrance.js` | strand dispatch now goes through `sig.walk` + `route()`. irlinks still use old pipeline. `strands.create` no longer called |
| `strands.js` | deleted `strands.create`, `strands.hydrate`, `strands.zone`, `strands.chick`. kept `strands.realmnum`, `strands.nype`, `strands.save.*` |
| `zells.js` | renamed child → spore everywhere. counter hydration: re-attach `.increment` on counters loaded from JSON |
| `counters.js` | added `counters.hydrate(cdna)` — re-runs `counter()` on deserialized counter data |
| `hyph.js` | removed debug `console.log('link - ')` from `hyph.get` |

## key design: streets.js

streets are sphere-specific .get/.exe factories that get wired onto egg realm objects. the realm carries the logic, not the route walker. route.js stays thin — it just dispatches steps. streets.js has the domain knowledge.

```
egg["~"].default  ← streets.strand wired here
  .get("llms", signal)  → turbo: zone finding, pascal creation
  .get("claude", signal) → spore: chick file, triangle point

egg[":"]  ← streets.cosmos wired here
  .exe("seri", signal)  → cap creation, mofu distribution
```

every spore created during a strand walk gets `streets.strand` wired on it too. this keeps the strand pipeline active as the walker descends into nested spores: `egg["~"].default.llms.get("claude", signal)` uses strand logic, not generic zells.get.

## signal as walk state

the signal object accumulates state during the walk:

```
signal.vorzeichen  = "~"           set by first conop
signal.realm       = "default"     set by realm step
signal.ring        = {ringwell}    set by streets.strand.hydrate
signal.realmnum    = 1             resolved from lookups
signal.zone        = {zone}        set by streets.strand.turbo
signal.turbo       = {pascal}      the turbo pascal for triangle assignment
signal.assigned    = {concept: point}  points from z.record()
signal.chickenpath = "~llms/"      builds up as we descend
signal.impliedstrand = "~llms"     partial strand for chick metadata
signal.depth       = 1             depth counter for pyramid selection
signal.capname     = "seri"        set by streets.cosmos.cap
signal.nype        = "9"           set by route.finish.nype (if numeric)
```

## bugs found and fixed

### 1. counter deserialization — functions lost on reload

counters saved to chicken via `hyph.save` lose their `.add`/`.increment` methods (JSON.stringify strips functions). when a chick is loaded from chicken, its counter exists as data but without methods. `zells.init` checked `if (!dna.counter.get)` — the counter existed, so it skipped creation. the loaded counter had no `.increment`.

fix: added `counters.hydrate(cdna)` that re-runs `counter()` to re-attach methods. `zells.init` now checks `else if (!dna.counter.get.increment)` → hydrate.

this is a general problem for any object that stores functions and gets serialized to chicken. counters are the first case we hit. worth remembering for cages and runebooks later.

### 2. spore nesting — realm vs host

initial implementation nested all spores directly on the realm (`egg["~"].default.claude` instead of `egg["~"].default.llms.claude`). the strand .get was only wired on the realm, so subsequent steps fell through to the generic zells.get.

fix: `streets.strand.chick` takes a `host` parameter (the current node being walked into). and after creating/finding a spore, calls `streets.strand(spore)` to wire strand .get/.exe on it. this keeps the entire chain in the strand pipeline.

### 3. pre-conop exe was wrong

the original Phase 1 peek logic triggered `.exe` before conops (e.g. `claude` before `:`). but `claude` is a regular pascal chick, not an endpoint. the exe should only fire for truly last steps.

fix: removed `is.before.conop` from exe detection. only `is.last` triggers exe now. the conop itself handles the transition.

### 4. first vs mid-walk conop

`~` is the first conop (vorzeichen) — a realm step follows. `:` is a mid-walk conop — a concept/exe step follows directly (no realm). the original conop handler always returned mode "conop" which made the next step a realm.

fix: conop handler checks `is.first = !signal.vorzeichen`. first conop → mode "conop" (realm follows). mid-walk conop → mode "concept" (next step is a concept or exe).

## what irlinks still need (Phase 3)

irlinks flow through the old pipeline unchanged. to move them into the route walker:

1. `streets.irlink` — wire on `egg.default`. .get does what `walk.js step()` does: find/create wells, distribute unschärfe, nest midwells
2. `streets.groups` — wire on `egg["°"]`. .get creates group wells (mofu distribution)
3. `streets.lofu` — wire on `egg["@"]`. .exe creates entity endpoint, triggers viewpoint creation
4. delete `irlinks.create`, `walk.js`

the pattern is established: sphere-specific logic lives in streets.js, wired onto egg roots via eggs.roots. the route walker and signal accumulation work the same way.

## what about criminals.pirates.caribbean

the cosmos subdivision question: every zone gets one cosmos (900000 unschärfe). caps subdivide it. `criminals.pirates.caribbean` would be a strand `~criminals.pirates.caribbean:X` where X is the cap. the zone cosmos at the `criminals` zone holds all caps equally — pirates, bank robbers, etc.

for `criminals.pirates` having its OWN cosmos separate from `criminals`: that would need the `.` separator within mofu to create nested cosmos. currently caps are flat strings in the zone's cosmos collection. nested cosmos is a Phase 3+ concept — the cosmos itself would need to become a well tree (like irlinks) rather than a flat distribution.
