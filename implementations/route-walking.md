# Part 2: Unified Route Walking with .get/.exe

## Context

Part 1 (complete) gave every zell a buffgit with sphere/realmnum, added counters, sig.route, sig.chicken. Now Part 2 replaces the two separate pipelines (irlinks.create + strands.create) with a single .get/.exe chain through the egg.

The egg comes first. Zells are born in the egg, then saved as chicks to the chicken.

## Signal shape

```js
sig.walk("q.Center°admins@seri--")
-> {
    link: "q.Center°admins@seri--",
    walked: [],
    irpath: ["default", "q", "Center", "°", "admins", "@", "seri--"],
    payload: []
  }
```

Irlink walk example:
```
step "default" -> egg.default                 realm, no .get
step "q"       -> egg.default.get("q", signal)
                  -> well creation, distribute unschärfe
                  -> payload gets [minwell]
step "Center"  -> egg.default.q.get("Center", signal)
                  -> midwell creation, redistribute
                  -> payload updates [minwell]
step "°"       -> switch to egg["°"].admins (concept-first)
                  conop, no .get
step "admins"  -> egg["°"].admins.default.get (realm auto-resolved)
                  -> groups well, mofu distribution
                  -> payload gets [fofu, mofu]
step "@"       -> switch to lofu mode
                  conop, no .get
step "seri--"  -> current.exe("seri--", signal)
                  -> lofu entity, viewpoint creation
                  -> payload gets [fofu, mofu, lofu]
                  -> final buffgit built from payload
```

sig.route() already builds the irpath. sig.walk() wraps it with walked + payload.

## Egg roots

```
egg["~"]              <- strand vorzeichen root
egg["~"].default      <- default ring realm
egg[":"]              <- cosmos root (zones' mofu spaces)
egg[":"].name         <- superzone! cross-ring connector for zone "name"
egg[":"].name.default <- default realm within name cosmos
egg["№"]              <- nype root (numeric values)
egg["№"].elephants.default.12 <- nype value, redirect from egg["~"].elephants["12"]
egg.default           <- default globe realm (irlinks, no vorzeichen)
egg["°"]              <- groups root (irlinks mofu)
egg["°"].admins       <- group "admins" (concept-first, then realm)
egg["°"].admins.default <- default realm within admins group
egg["@"]              <- lofu root (irlinks entities)
```

Nesting rule: concept-first for ALL conop roots. This lets us compare a concept across realms.

### Superzones

egg[":"].{zonename} before calling .default is a superzone -- the cross-ring connector.
.default on a superzone is the ring. So .get from superzone to ring connects rings.
zones.super(dna) already stubbed in zones.js -- communicates with same-named zones across rings.
Not a separate zell type, just a flavor handled by the ring property on the zone.

### Nypes (egg["№"])

A nype is a numeric endpoint. Any strand ending in a number is a nype.
`~networth.dollars.amount:millions.9` -> thrigit [671337, 450001, 9]

The parent without the nype (`~networth.dollars.amount:millions`) always exists as [671337, 450001, 900001].
Arithmetic: moving from .9 to .10 is just [671337, 450001, 9] -> [671337, 450001, 10].
Subtracting a dimension: `millions.9 - millions` = `amount:9` at a different mofu position.

Filesystem: `№` in filenames. egg["№"].networth.default -> chicken/№.1.networth

### Filesystem conop mapping

| conop | egg key | filename |
|-------|---------|----------|
| `:` | `egg[":"]` | `᛬` (runic colon) |
| `°` | `egg["°"]` | `°` (works on NTFS) |
| `@` | `egg["@"]` | `@` (works) |
| `~` | `egg["~"]` | `~` (works) |
| `№` | `egg["№"]` | `№` (works on NTFS) |

## The walk — no separate route.js

The walk is driven by .get chaining. No fat route module. incoming.js has a thin loop
that pops irpath, detects conops/realms, and calls .get/.exe. All real logic lives in .get/.exe.

```js
// incoming.js — the thin loop
function incoming(link) {
    let signal = sig.walk(link)
    let current = egg
    while (signal.irpath.length > 0) {
        let step = signal.irpath.shift()
        signal.walked.push(step)
        current = incoming.step(current, step, signal)
    }
    return current
}
```

incoming.step dispatches:
- conop -> navigate to egg root, set mode on signal
- realm (first non-conop) -> navigate to current[realm]
- concept -> current.get(step, signal)
- last before conop or end -> current.exe(step, signal)

### Thrystem (implemented in Phase 1)

Every .get also mirrors the eggdress into numeric thrigit paths on the egg:
`egg["~"].default.llms.claude` -> also `egg["~"]["1"]["2"]["238"]`
The numbers come from each step's minwell/fixpoint. Built during .get, not after.

---

## Phase 1: Foundation

Remove old code immediately as we go. No clustering.

### 1.1 sig.walk() -- signal.js
- New function wrapping sig.route() with `walked: []`, `payload: []`

### 1.2 egg roots -- egg.js
- In eggs.init(), create root objects for all conops: `~`, `:`, `°`, `@`, `№`
- Wire realm objects (egg["~"].default links to default ring well)

### 1.3 incoming.js rewrite
- Replace old dispatch (irlinks.create / strands.create) with the thin walk loop
- incoming.step: conop detection, realm navigation, .get/.exe dispatch
- Small named functions: incoming.conop(), incoming.realm(), incoming.concept()
- Delete old irlinks/strands dispatch code immediately

### 1.4 zells.get / zells.exe rewrite -- zells.js
- `.get(concept, signal)`:
  1. check dna[concept]
  2. if not -> hyph.get(chickenpath) to load from chicken
  3. if not in chicken -> create the zell (sphere-specific)
  4. check version, rebuild if outdated
  5. increment dna.counter.get[signal.link]
  6. push thrigit value to signal.payload
  7. mirror eggdress into thrystem (numeric path on egg)
  8. return child zell

- `.exe(concept, signal)`:
  1. same find-or-create
  2. increment dna.counter.exe[signal.link]
  3. build buffgit from accumulated signal.payload
  4. populate thrystem spot
  5. tell all walked streets to save counters to chicken (batch save at end of chain)
  6. return endpoint zell

### 1.5 gaps.js -- NEW factory
- `gap(gdna)` factory -- unit: "gap", zells.init
- `gaps.create({ slot, minschärfe })` -- creates gap at slot
- `gaps.populate(ring)` -- fills ring.zones with 459 gaps
- `gdna.swap(zone)` -- method ON the gap, replaces itself with zone in ring

### 1.6 hyph.js -- conop filename mapping
- Map conop characters to filesystem-safe equivalents in hyph.resolve()
- `:` -> `᛬`, others work as-is on NTFS

### 1.7 delete old pipeline code
- Remove irlinks.create, irlinks.walk.globe, irlinks.walk.groups
- Remove strands.create (keep strands.save.*, strands.realmnum as utilities)
- Remove walk.js (logic absorbed into .get)
- Keep: wells.js, zones.js, rings.js, pyramids/triangles/pascals — called FROM .get

### what to track for removal
| removed | reason |
|---------|--------|
| walk.js | absorbed into zells.get |
| irlinks.create | replaced by incoming loop |
| strands.create | replaced by incoming loop |
| incoming old dispatch | replaced by walk loop |

---

## zwischenreport after Phase 1
findings, insights, concerns, bugs, how it affects Phase 2.

---

## Phase 2: Sphere-specific .get behaviors

The generic .get from Phase 1 delegates to sphere-specific creators. This is where
the strand and irlink logic actually lives.

### 2.1 ring realm .get (strands)
- When .get is called on egg["~"].default, it does what strands.zone() + rings.assign() do
- First concept = turbo -> find zone, swap gap, create pascals
- Zone reference stored on signal for subsequent steps
- Reuse: rings.assign(), zones.find(), zones.create(), gdna.swap()

### 2.2 strand concept .get
- Each concept after turbo -> pascal chick creation (from strands.chick logic)
- Get triangle point, push to signal.payload
- Nest at eggdress + thrystem mirror

### 2.3 ":" cosmos .exe
- Navigate to egg[":"].{zonename}.{realm} (superzone -> realm)
- Cosmos = proper well, 900000 unschärfe
- Create/find cap, distribute, push mofu to payload

### 2.4 nype via "№"
- Numeric endpoint -> egg["№"] cache
- Parent strand always exists as [fofu, mofu, 900001]
- Nype adds lofu: [fofu, mofu, N]

### 2.5 globe realm .get (irlinks)
- When .get is called on egg.default, well creation + distribution
- Reuse: wells.first(), wells.distribute()

### 2.6 "°" groups .get -> mofu wells
### 2.7 "@" lofu .exe -> entity endpoint, viewpoint from payload

---

## zwischenreport after Phase 2

---

## Phase 3: Polish

### 3.1 buffgits.links.convert -> .get
- Instead of returning 900001, trigger the .get pipeline
- The walk IS the lookup

### 3.2 cosmos as proper well
- cosmi.js: cosmos factory with 900000 unschärfe distribution
- Replaces the inline zones.distributeCosmos

### 3.3 zones.super
- Flesh out the cross-ring communication via superzone .get

---

## What stays vs changes

| module | stays | changes |
|--------|-------|---------|
| signal.js | sig.nal, sig.route, sig.chicken | add sig.walk() |
| egg.js | eggs.init loading | add conop root structures |
| zells.js | stamp, thrigit.return | rewrite .get/.exe with thrystem |
| incoming.js | -- | full rewrite: thin walk loop |
| gaps.js | -- | NEW: gap factory |
| strands.js | save.*, realmnum | delete strands.create |
| irlinks.js | viewpoint logic | delete irlinks.create |
| walk.js | -- | DELETED (absorbed into .get) |
| rings.js | all stays | called from .get |
| zones.js | all stays + super stub | cosmos evolves |
| wells.js | all stays | called from .get |
| pyramids/triangles/pascals | all stay | no changes |
| caps.js | all stays | no changes |
| hyph.js | all stays | add conop mapping |
| collection.js | all stays | no changes |

## CLAUDE.md reminders
- No camelCase: use dot.case (incoming.step, incoming.conop, etc.)
- Big endian properties (endian.big)
- Small functions after every if/for, attach to objects
- IF().then() pattern where fitting
- Globals -> need a zell for it

## Verification

Phase 1: `node -e "require('./logic/incoming')"` loads, sig.walk() works, gaps populate, .get/.exe chain runs.

Phase 2: `~name.nick:seri` through walk loop -> zone, pascals, cosmos cap. `q.Center°admins@seri--` -> wells, groups, viewpoint.
