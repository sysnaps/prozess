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

The walk is driven by .get chaining. No fat route module. entrance.js has a thin loop
that pops irpath, detects conops/realms, and calls .get/.exe. All real logic lives in .get/.exe.

```js
// entrance.js — the thin loop
function entrance(link) {
    let signal = sig.walk(link)
    let current = egg
    while (signal.irpath.length > 0) {
        let step = signal.irpath.shift()
        signal.walked.push(step)
        current = entrance.step(current, step, signal)
    }
    return current
}
```

entrance.step dispatches:
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

### 1.3 entrance.js rewrite
- Replace old dispatch (irlinks.create / strands.create) with the thin walk loop
- entrance.step: conop detection, realm navigation, .get/.exe dispatch
- Small named functions: entrance.conop(), entrance.realm(), entrance.concept()
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
| irlinks.create | replaced by entrance loop |
| strands.create | replaced by entrance loop |
| entrance old dispatch | replaced by walk loop |

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
- Reuse: wells.create(), wells.distribute()

### 2.6 "°" groups .get -> mofu wells
### 2.7 "@" lofu .exe -> entity endpoint, viewpoint from payload

---

## zwischenreport after Phase 2

---

## Phase 3: Irlinks into Route Walker + Zone-before-realm

Phase 2 unified strands into the route walker with the hub refactor (zells.get dispatches
to streets based on dna.zell). Phase 3 does the same for irlinks and reorders strand nesting
so zones come before realms.

### Current state after Phase 2

```
strands: sig.walk → route() → zells.get hub → streets.strand dispatch
irlinks: sig.nal  → irlinks.create → walk.js (separate pipeline, not through route walker)
```

After Phase 3:
```
all links: sig.walk → route() → zells.get hub → streets.{strand|irlink|groups|lofu} dispatch
```

### Point assignment chain (for reference — stays unchanged)
```
rings.assign → zones.create → pascals.create → triangles.create → pyramids.create (6 layers)
zones.record → turbo.triangle.layers[kind].assign → pyramids.slot → returns point
streets.strand.chick reads signal.assigned[concept] + turbo.triangle.layers[kind]
```
pascals.js and triangles.js are critical — they're called through zones/rings, not directly from streets.

---

### 3.1 Zone-before-realm (strands)

Currently: `egg["~"].default.llms.claude` (realm → turbo → spores)
New:       `egg["~"].llms.default.claude` (turbo/zone → realm → spores)

Why: concept-first for ALL conop roots. Lets us compare a concept across realms:
`egg["~"].llms.default` vs `egg["~"].llms.realm2`.

#### sig.route changes for strands
Remove the realm emission from strand routes. Realm is implicit (from + modifier or "default").

```
BEFORE: sig.route("~llms.claude:seri") → ["~", "default", "llms", "claude", ":", "seri"]
AFTER:  sig.route("~llms.claude:seri") → ["~", "llms", "claude", ":", "seri"]
```

signal.realm = "default" (or from +ring modifier, e.g. `~llms.claude+myring:seri` → realm "myring")

#### route walker conop mode change

Currently: first conop → mode "conop" → next step is realm.
New: first conop "~" → mode "concept" → next step goes directly to .get (turbo).
Irlinks (no vorzeichen) keep mode "root" → first step is realm (the globe name).

```js
// in conop():
let mode = is.first ? (step === "~" ? "concept" : "conop") : "concept"
```

#### egg["~"] becomes the strand root

Instead of egg["~"].default getting zell: "realm" + zells.init, egg["~"] itself gets it:
```js
eggs.roots.strands = function (e) {
    if (!e["~"]) e["~"] = {}
    e["~"].zell = "realm"
    let ring = e["default ring"]
    if (ring) e["~"].ring = ring       // ring lives on egg["~"] now
    zells.init(e["~"])
}
```

streets.strand.get on egg["~"]:
- "llms" → turbo detection, zone finding, creates egg["~"].llms
- egg["~"].llms has zell: "pascal" (zone/turbo zell)

Then the REALM step. streets.strand needs a mode transition after turbo. After the turbo
.get creates the zone, the next concept is the realm. Two approaches:

seri:(yeah so the .super method talks to the superzone so in this case superllms. which means that we store the chicken of a zone directly in the chicken ... hey i think what makes sense here is that we did implement our files having the realm number as filenames, right ? this feels like the superzones are the chicks that do not have a number. so ... we probably do need a new zell for them afterall . lets call them supers . so i created a supers.js and we have a SuPeR zell which has 1337 case not because i am an 31337 h4xx0r but because super is a reserved name in javascript. what is interesting here is that we can also communicate between strands and irlinks that have the same starting concept (name). but for now we only deal with the default ring - but the supers will get very interesting when we think about the IRL getting a couple of people joining and them creating zones on their own rings.)

**Option A**: sig.route emits realm after turbo for strands:
```
sig.route("~llms.claude:seri") → ["~", "llms", "default", "claude", ":", "seri"]
```
Route walker sees is.realm=false for "default" → it goes through .get.
streets.strand.get on the turbo/zone zell recognizes "default" as a realm concept
and creates egg["~"].llms.default with the ring context.

**Option B**: Realm is never a walk step for strands.
streets.strand uses signal.realm internally to resolve the ring.
Egg nesting: egg["~"].llms.claude (no realm layer in egg, realm is metadata only).

**Recommendation**: Option A — realm IS a walk step but after turbo, not before vorzeichen.
This keeps the egg nesting explicit: egg["~"].llms.default.claude.
The turbo .get returns the zone zell. When the zone zell's .get sees a realm name,
it creates the realm context and wires it with the ring.

seri:(i also prefer that the realm is a street on the route. the super zones are kind of option B as in they don't have gets but a zone calls it super version via its .super method .
supers do not get called by gets i think because they do not leave a trace in the thrystem. they don't have a regular thraddress (new word - the numberfied eggdress in the thrystem. just a working title for now . i dont like the sound of thraddress)
)
---

### 3.2 Irlinks into sig.walk + route()

Currently irlinks use the old pipeline: `sig.nal → irlinks.create → walk.js`.
sig.route ALREADY handles irlinks:
```
sig.route("q.Center°admins@seri--") → ["default", "q", "Center", "°", "admins", "@", "seri--"]
```

Change entrance.irlink from `irlinks.create(signal)` to `sig.walk + route()`:
```js
entrance.irlink = function (link) {
    let signal = sig.walk(link)
    return route(signal)
}
entrance.strand = function (link) {
    let signal = sig.walk(link)
    return route(signal)
}
```

Both pipelines become identical: sig.walk → route.

#### Irlink walk through route walker
```
irpath: ["default", "q", "Center", "°", "admins", "@", "seri--"]

"default" → realm step (mode "root"), signal.realm = "default"
            current = egg.default (the globe well)
"q"       → get step, egg.default.get("q", signal)
            → streets.irlink: find/create midwell, distribute, push fofu thrigit
"Center"  → get step, q.get("Center", signal)
            → streets.irlink: midwell, distribute, push fofu thrigit
"°"       → conop (mid-walk), current = egg["°"], mode = "concept"
"admins"  → get step, egg["°"].get("admins", signal)
            → streets.groups: find/create group well, push mofu thrigit
"@"       → conop (mid-walk), current = egg["@"], mode = "concept"
"seri--"  → exe step (last), egg["@"].exe("seri--", signal)
            → streets.lofu: create lofu entity, build viewpoint from payload
```

---

### 3.3 streets.irlink (well .get for fofu)

Dispatched from zells.get when dna.zell === "well.fofu" (or just "well").
Replaces what walk.js step() does, one concept at a time.

```js
streets.irlink = {}

streets.irlink.get = function (dna, concept, signal) {
    let spore = streets.irlink.find(dna, concept)
    if (!spore) spore = streets.irlink.load(dna, concept, signal)
    if (!spore) spore = streets.irlink.create(dna, concept, signal)

    streets.irlink.mark(spore, dna, signal)
    streets.irlink.record(spore, signal)

    // push fofu thrigit to payload
    if (spore.thrigit) signal.payload.push(spore.thrigit)

    return spore
}
```

Key differences from generic zells.get:
- **find**: checks `dna.midwells[concept]`, not `dna[concept]`
- **load**: uses chick.path(segments, index, prefix, realmnum) format, not dna.chicken + concept
- **create**: uses `wells.create(signal.is, concept, ...)` then `dna.midwells.add(spore)`
  - adding triggers wells.distribute via wells.changed → recalculate
- **mark**: stamps sphere, type, realm from signal context (what walk.js mark() does)
- **record**: adds link to well's links collection (what walk.js record() does)

Each created well spore gets `zell: "well.fofu"` → recursive dispatch for deeper midwells.

seri:(now that would need to get split to get walked if we had: 
```js
{
    zell:"well",
    well:"fofu"
}
```
we already have the potentially computable steps inside the dna
)
#### egg.default setup
```js
eggs.roots.irlinks = function (e) {
    let globe = e["default globe"]
    if (!e.default) e.default = globe || {}
    e.default.zell = "well.fofu"
    zells.init(e.default)
}
```
egg.default IS the globe well. Its .get dispatches to streets.irlink.

#### Chickenpath for irlink wells

walk.js uses chick.path(segments, index, prefix, realmnum) which builds:
`folder/folder/.{realmnum}.{concept}` (e.g., `q/.1.Center`)

streets.irlink needs to track the chickenpath on signal (like strands do).
Each .get step extends signal.chickenpath. The prefix is "" for fofu wells.

---

### 3.4 streets.groups (° .get for mofu)

Dispatched from zells.get when dna.zell === "well.mofu".
Same well-walking pattern as irlink but for the mofu dimension.

```
egg["°"].zell = "well.mofu"
egg["°"].get("admins", signal) → find/create group well in egg["°"].admins
```

Groups use the same walk.js logic but with prefix "°" and tofu "mofu".
The groups well tree is `egg["default globe groups"]` in the old pipeline.

After ° conop, signal transitions to mofu dimension. streets.groups.get pushes
mofu thrigit to payload (instead of fofu).

Design note: each group endpoint owns a lofu cosmos (groups.lofu). This is like
how zones own a cosmos for caps. The lofu cosmos lives on the mofu endpoint well.

---

### 3.5 streets.lofu (@ .exe for entity endpoint)

Dispatched from zells.get when dna.zell === "lofu".
This is the endpoint — builds the final viewpoint from accumulated payload.

```
egg["@"].zell = "lofu"
egg["@"].exe("seri--", signal) → create lofu well, build viewpoint
```

streets.lofu.exe:
1. Find the mofu endpoint from the walk (last well before ° in signal.walked)
2. Create lofu entity via groups.lofu.handle (or inline equivalent)
3. Distribute lofu cosmos on the mofu well
4. Build viewpoint from payload thrigits:
   - signal.payload has fofu thrigits (from irlink steps) and mofu thrigits (from groups steps)
   - The exe knows which are which based on walked conop positions
5. Create viewpoint via viewpoints.create, save to chicken

#### Payload dimension tracking

The payload accumulates thrigits from ALL dimensions. The exe needs to know which is which.

**Approach**: Tag each payload entry with its dimension. When pushing:
```js
signal.payload.push({ dim: "fofu", thrigit: spore.thrigit })
signal.payload.push({ dim: "mofu", thrigit: spore.thrigit })
```

Or: streets.lofu.exe walks signal.walked to find conop boundaries and splits
the flat payload into fofu/mofu/lofu sections.

Or: signal.payload becomes `{ fofu: [], mofu: [], lofu: [] }` with each street
pushing to its section. Strand payload (flat point array) uses a different field
like signal.points.

**Recommendation**: Keep signal.payload as flat array for strands (points).
Add signal.thrigits = { fofu: null, mofu: null, lofu: null } for irlinks.
Each irlink .get overwrites the current dimension's thrigit (deepest well wins).
The exe reads signal.thrigits to build the viewpoint buffgit.

---

### 3.6 Cackles (cached chicken paths)

During egg time, compute chicken path once, cache for reuse.

```js
egg.cackles = {}

// in streets.irlink.load or zells.get.load:
function cackle(key) {
    if (egg.cackles[key]) return egg.cackles[key]
    let computed = chick.path(...)
    egg.cackles[key] = computed
    return computed
}
```

Memory only — no chicken persistence. The cache lives for the lifetime of the egg.
Useful for irlinks where the same well path gets walked by many links.

---

### 3.7 Delete old pipeline

| removed | reason |
|---------|--------|
| walk.js | absorbed into streets.irlink .get |
| irlinks.create | replaced by sig.walk + route |
| irlinks.walk.globe | replaced by streets.irlink |
| irlinks.walk.groups | replaced by streets.groups |
| irlinks.lofu.handle | replaced by streets.lofu |

Keep from irlinks.js:
- irlinks.viewpoint (move to viewpoints.js or streets.lofu)

Keep from walk.js:
- chick.path computation (move to streets.irlink or hyph)
- sphere() descriptor (move to streets or signal)

---

### 3.8 Polish

#### cosmi.js cosmos factory
- cosmos() factory with 900000 unschärfe distribution
- Replaces the inline zones.distributeCosmos
- Proper zell with .add, .redistribute methods

#### zones.super
- Flesh out cross-ring communication via superzone .get
- egg[":"].{zonename} is the superzone — connects same-named zones across rings
- .get from superzone to ring resolves the ring's copy of that zone

#### buffgits.links.convert → .get
- Instead of returning 900001, trigger the .get pipeline
- The walk IS the lookup — a link's buffgit is the result of walking it

---

### 3.9 Implementation order

1. **3.1 Zone-before-realm** — structural change to sig.route + route walker for strands.
   Affects egg roots, streets.strand. Must work before adding irlinks to route.
2. **3.2 + 3.3 Irlinks sig.walk + streets.irlink** — fofu well walking through route walker.
   Most logic comes from walk.js step().
3. **3.4 streets.groups** — mofu well walking. Similar pattern to 3.3.
4. **3.5 streets.lofu** — endpoint exe with viewpoint creation.
5. **3.6 Cackles** — can be added at any point, simple cache layer.
6. **3.7 Delete old pipeline** — remove walk.js, irlinks.create, clean up.
7. **3.8 Polish** — cosmi, zones.super, buffgits.links.convert.

---

## What stays vs changes (updated)

| module | stays | changes (Phase 3) |
|--------|-------|--------------------|
| signal.js | sig.nal, sig.walk | sig.route: strands emit turbo before realm |
| egg.js | eggs.init | roots: egg["~"] direct init, egg.default = globe well |
| zells.js | hub dispatch | add "well.fofu", "well.mofu", "lofu" dispatch |
| streets.js | strand + cosmos | add streets.irlink, streets.groups, streets.lofu |
| entrance.js | strand flow | irlink flow through sig.walk + route |
| route.js | walk loop | conop mode for "~" → "concept" |
| irlinks.js | viewpoint logic | delete create, walk.globe, walk.groups |
| walk.js | -- | DELETED (absorbed into streets.irlink) |
| wells.js | all stays | called from streets.irlink |
| groups.js | lofu cosmos | handle moves to streets.lofu |
| viewpoints.js | all stays | called from streets.lofu |
| strands.js | save.*, nype | no changes |
| rings.js | all stays | no changes |
| zones.js | all stays | no changes |
| pyramids/triangles/pascals | all stay | no changes |

## CLAUDE.md reminders
- No camelCase: use dot.case (entrance.step, entrance.conop, etc.)
- Big endian properties (endian.big)
- Small functions after every if/for, attach to objects
- IF().then() pattern where fitting
- Globals -> need a zell for it

## Verification

Phase 1: `node -e "require('./logic/entrance')"` loads, sig.walk() works, gaps populate, .get/.exe chain runs.

Phase 2: `~name.nick:seri` through walk loop -> zone, pascals, cosmos cap.

Phase 3: `q.Center°admins@seri--` through sig.walk + route -> fofu wells, group well, lofu entity, viewpoint.
Zone-before-realm: `~llms.claude:seri` nests as egg["~"].llms.default.claude.
