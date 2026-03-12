# Phase 3–5: Structural Rewiring, Irlinks, Stammzellen

Phase 2 unified strands into the route walker. zells.get became the hub.
But Phase 2 made a mistake: it routed everything through static streets.* functions
instead of using the actual stammzell instances and their methods.

The fix: stammzell factories (zone(), pascal(), well()) attach instance methods.
The pipeline works with those instances. The plural functions (zones, pascals, wells)
RETURN closures that get attached — they're method factories, not the logic itself.

```js
// PATTERN: plural returns closure → singular attaches to instance → pipeline uses instance
zones.record = function (dna) {          // plural: returns closure
    return (strand, concepts) => { ... } // the closure
}
function zone(zdna) {
    zdna.record = zones.record(zdna)     // singular: attaches to instance
}
// pipeline:
z.record(signal.link, fofu)              // instance method called in pipeline
```

This document plans:
- **Phase 3**: Stammzell init, zone-before-realm, SuPeRs, Megas, zell type split
- **Phase 4**: Irlinks into route walker (continents, wells, groups, entities)
- **Phase 5**: Funks/sparks, Napps, Highrs/Fassungen, runtime zell creation

---

## Terminology

| term | meaning |
|------|---------|
| **stammzell** | a zell with its own JS file in the codebase. zone.js, pascal.js, ring.js, etc. |
| **SuPeR** | cross-realm communicator. zell:"super", super:"zone" or super:"continent". 1337 case (super is reserved). no realm numbers in chicken filenames. |
| **mega** | cross-sphere communicator. handles same concept across ~strands and irlinks. |
| **continent** | globe's equivalent of zone. first irlink concept = continent. |
| **funk** | subscriber unit on a zell. from german Funk (broadcast). contains sparks. |
| **spark** | callback sig inside a funk. triggered on zell.change. no proxies. |
| **CI** | character interface. like UI but works in non-rendering shreads. |
| **Napp** | nested application. aggregation of CI elements. first: verfassung, then: MDNAger. |
| **Highr/Fassung** | strands with own que components → "irlinkable". encode governing Napp in dna. |

---

## Phase 3: Structural — Stammzell Init, Zone-before-realm, SuPeRs, Megas

### 3.1 Zell type property split

The key names the type of its value. `dna[dna.zell]` always gives the subtype.
Same principle as irlink/strand on a smaller scale.

```js
// wells
{ zell: "well", well: "fofu", concept: "q" }
{ zell: "well", well: "mofu", concept: "admins" }
{ zell: "well", well: "lofu", concept: "seri--" }

// strands
{ zell: "pascal", pascal: "providence", concept: "llms" }
{ zell: "zone", concept: "llms" }
{ zell: "ring", concept: "default ring" }

// pyramids — key = type of value
{ zell: "pyramid", pyramid: "providence", concept: "llms" }
{ zell: "triangle", triangle: "llms", concept: "llms" }

// cross-communication
{ zell: "super", super: "zone", concept: "llms" }
{ zell: "super", super: "continent", concept: "q" }

// units
{ zell: "unit", unit: "collection", collection: "llms.links" }
{ zell: "unit", unit: "counter", counter: "get" }
```

seri: (again: why llms.links ? )


### 3.2 zells.init calls stammzell factories

Currently: each stammzell factory (zone(), pascal(), well()) calls zells.init internally.
New: zells.init calls the stammzell factory AFTER generic setup.

```js
zells.init = function (dna) {
    // generic base
    dna.get = zells.get(dna)
    dna.exe = zells.exe(dna)
    // counters, cage, runebook...

    // stammzell: call the actual factory
    zells.init.stammzell(dna)

    return dna
}

zells.init.stammzell = function (dna) {
    let kind = dna.zell
    if (!kind || kind === "unit") return

    let factories = {
        zone:      () => require("./zones").zone(dna),
        pascal:    () => require("./pascals").pascal(dna),
        ring:      () => require("./rings").ring(dna),
        well:      () => require("./wells").well(dna),
        triangle:  () => require("./triangles").triangle(dna),
        pyramid:   () => require("./pyramids").pyramid(dna),
        super:     () => require("./supers").SuPeR(dna),
        gap:       () => require("./gaps").gap(dna),
        viewpoint: () => require("./viewpoints").viewpoint(dna),
        cap:       () => require("./caps").cap(dna)
    }

    let factory = factories[kind]
    if (factory) factory()
}
```

The stammzell factories NO LONGER call zells.init (removed to prevent infinite loop).
They only attach their specific instance methods:

```js
// zone(zdna) — AFTER this change:
function zone(zdna) {
    // NO zells.init call — zells.init already ran
    zdna.unit = "zone"
    zdna.record = zones.record(zdna)
    zdna.rename = zones.rename(zdna)
    zdna.cap = zones.cap(zdna)
    zdna.saturated = zones.saturated(zdna)
    zdna.add = zones.add(zdna)
    zdna.super = zones.super(zdna)
    zdna.sprout = zones.sprout(zdna)   // NEW: route-walking behavior
    zdna.check.version(version)
    return zdna
}
```

### 3.3 The hub defers to instance methods

zells.get is the hub. No dispatch table. No streets. It checks if the zell instance
has a `.sprout` method (attached by its stammzell factory). If yes, calls it.
If no, uses generic find/load/create. Counter always increments.

```js
zells.get = function (dna) {
    return (concept, signal) => {
        let spore

        if (dna.sprout) {
            spore = dna.sprout(concept, signal)
        } else {
            spore = zells.get.find(dna, concept)
            if (!spore) spore = zells.get.load(dna, concept)
            if (!spore) spore = zells.get.create(dna, concept)
            zells.get.payload(spore, signal)
        }

        dna.counter.get.increment(signal ? signal.link : concept)
        zells.get.save(dna)
        return spore
    }
}
```

The `.sprout` method is manufactured by the plural function and attached by the singular:

```js
// in zones.js — plural manufactures the closure
zones.sprout = function (dna) {
    return (concept, signal) => {
        // turbo detection, zone finding, pascal chick creation
        // uses dna (the zone/realm instance) via closure
        // calls OTHER instance methods: z.record(), z.rename(), z.cap()
    }
}

// in zone() — singular attaches it
zdna.sprout = zones.sprout(zdna)
```

In the pipeline (route walker), we only ever call instance methods:
```
egg["~"].get("llms", signal)     → hub calls egg["~"].sprout("llms", signal)
                                    which calls z.record(), z.rename()
egg["~"].llms.get("default", s)  → hub calls realm.sprout("default", signal)
well.get("Center", signal)       → hub calls well.sprout("Center", signal)
                                    which calls well.recalculate()
```

### 3.4 Delete streets.js — absorb into stammzell factories

streets.js logic moves into the stammzell files where it belongs:

| streets.js function | moves to | becomes |
|---------------------|----------|---------|
| streets.strand.get | zones.js | zones.sprout(dna) → zdna.sprout |
| streets.strand.turbo | zones.js | zones.sprout internal |
| streets.strand.spore | zones.js | zones.sprout internal |
| streets.strand.chick | pascals.js or zones.js | pascal chick creation |
| streets.strand.hydrate | zones.js | zones.hydrate(dna) → zdna.hydrate |
| streets.strand.fofu | zones.js | zones.fofu(signal, concept) (static helper) |
| streets.cosmos.cap | zones.js | already z.cap() instance method! |
| streets.cosmos.get/exe | zones.js | already z.cap() |

Some of streets logic is already instance methods (z.record, z.rename, z.cap).
The rest (turbo detection, chick creation, hydrate) gets absorbed as new instance methods.

### 3.5 Zone-before-realm (strands)

Current nesting: `egg["~"].default.llms.claude` (realm → turbo → spores)
New nesting:     `egg["~"].llms.default.claude` (turbo/zone → realm → spores)

Realm IS a walk step (confirmed), but comes after turbo.
SuPeRs don't get walked — zones call .super() method.

#### sig.route change for strands

```
BEFORE: sig.route("~llms.claude:seri") → ["~", "default", "llms", "claude", ":", "seri"]
AFTER:  sig.route("~llms.claude:seri") → ["~", "llms", "default", "claude", ":", "seri"]
```

Turbo concept first, then realm. Realm from + modifier or "default".

#### Route walker: "~" conop → concept mode

```js
// in conop():
let mode = is.first ? (step === "~" ? "concept" : "conop") : "concept"
```

"~" → mode "concept" → next step goes to .get (turbo detection).
No vorzeichen (irlinks) → mode "root" → first step is realm.

#### egg["~"] as strand root

```js
eggs.roots.strands = function (e) {
    if (!e["~"]) e["~"] = {}
    e["~"].zell = "realm"
    let ring = e["default ring"]
    if (ring) e["~"].ring = ring
    zells.init(e["~"])   // → generic setup, then stammzell factory for "realm"
}
```

The walk using INSTANCE METHODS:
```
"~"       → conop, current = egg["~"], mode = "concept"
"llms"    → egg["~"].get("llms", signal)
            → hub calls egg["~"].sprout("llms", signal)
            → turbo detection: !signal.zone → this is turbo
            → calls z.record(), z.rename() (zone instance methods)
            → returns zone zell: egg["~"].llms
"default" → egg["~"].llms.get("default", signal)
            → hub calls sprout: !signal.realm → this IS the realm
            → creates egg["~"].llms.default with ring context
"claude"  → egg["~"].llms.default.get("claude", signal)
            → hub calls sprout: pascal chick creation
            → uses turbo.triangle.layers[kind].assign() (pyramid instance method)
```

Design: how sprout knows "default" is a realm vs a concept:
After turbo, `signal.zone` exists but `signal.realm` doesn't yet.
`!signal.realm` → this concept IS the realm.

### 3.6 SuPeRs — cross-realm communication

```js
// supers.js
const SuPeR = function (sdna) {
    // NO zells.init — called BY zells.init
    sdna.unit = "super"
    // methods TBD: cross-ring zone communication
    return sdna
}

supers.create = function ({ concept, is }) {
    return SuPeR({
        version,
        zell: "super",
        super: is,     // "zone" or "continent"
        concept
    })
}
```

SuPeRs are NOT walked by .get. No thraddress. No realm numbers in chicken filenames.
Zones call `.super()` instance method to communicate cross-realm.

Super vs Mega partition:
- **super** = cross-realm (ring1.llms ↔ ring2.llms, globe1.q ↔ globe2.q)
- **mega** = cross-sphere (~llms ↔ llms, same concept across strands and irlinks)

### 3.7 Megas — cross-sphere communication

```js
// megas.js
const mega = function (mdna) {
    // NO zells.init — called BY zells.init
    mdna.unit = "mega"
    mdna.count = megas.count(mdna)    // instance method: count strand vs irlink
    return mdna
}

megas.count = function (dna) {
    return (sphere) => {
        if (!dna.counter[sphere]) dna.counter[sphere] = 0
        dna.counter[sphere]++
    }
}

megas.create = function ({ concept }) {
    return mega({
        version: 1,
        zell: "mega",
        concept,
        counter: {}
    })
}
```

The mega is the entry point. In entrance, the walk starts at the mega:
- mega sees by irpath whether it's strand or irlink
- mega.count("strand") or mega.count("irlink")
- then the walk continues into the conop root

Phase 3 scope: skeleton only. Wire as first stop in route.

---

## Phase 4: Irlinks into Route Walker

### 4.1 Irlink walk — revised irpath

```
"q.Center.Middle.SevenSeas" → [q, default, Center, Middle, SevenSeas]
```

First concept `q` = **continent** (like turbo for zones).
After continent, globe (realm). Globe is responsible for well distribution.

The walk using INSTANCE METHODS:
```
"q"          → mega.get("q") → mega.count("irlink")
             → enters continent well for q
"default"    → continent.get("default") → resolves globe
             → globe.recalculate() (well instance method!)
             → current = globe context for q
"Center"     → q.get("Center") → well.sprout("Center", signal)
             → finds/creates midwell, well.recalculate() triggers
"Middle"     → Center.get("Middle") → well.sprout
"SevenSeas"  → Middle.get("SevenSeas") → well.sprout
```

Key: well.sprout replaces walk.js step(). It's an instance method that:
- finds in midwells: `dna.midwells[concept]`
- loads from chicken: `hyph.get(chickenpath)`
- creates via `wells.create(...)` then `dna.midwells.add(spore)` → triggers recalculate
- marks sphere/type/realm on the spore
- records link: `spore.links.add(signal.link)`
- pushes thrigit to signal.thrigits

#### Continent = zone equivalent for globes

| ring sphere | globe sphere |
|-------------|--------------|
| zone | continent |
| pascal | well (midwell) |
| ring | globe |
| superzone | supercontinent |

### 4.2 sig.route for irlinks — revised

```js
"q.Center.Middle.SevenSeas"
→ ["q", "default", "Center", "Middle", "SevenSeas"]

"q.Center.Middle.SevenSeas°podcasts@The-Deep-Dive"
→ ["q", "default", "Center", "Middle", "SevenSeas", "°", "podcasts", "@", "The-Deep-Dive"]

// implied 0 group — ° always present
"q.Center.Middle.SevenSeas@seri--"
→ ["q", "default", "Center", "Middle", "SevenSeas", "°", "@", "seri--"]
```

Concept first (continent), then realm (globe), then wells.
° always in irpath — implied 0 group when no explicit group.

### 4.3 well.sprout — the instance method for well walking

Manufactured by plural, attached by singular:

```js
// in wells.js — plural manufactures closure
wells.sprout = function (dna) {
    return (concept, signal) => {
        let spore = wells.sprout.find(dna, concept)
        if (!spore) spore = wells.sprout.load(dna, concept, signal)
        if (!spore) spore = wells.sprout.create(dna, concept, signal)

        wells.sprout.mark(spore, dna, signal)
        wells.sprout.record(spore, signal)

        // push thrigit — dimension from dna.well
        let dim = dna.well || "fofu"
        if (spore.thrigit) signal.thrigits[dim] = spore.thrigit

        return spore
    }
}

// in well() — singular attaches
function well(wdna) {
    // existing methods
    wdna.walk = walk(wdna)           // old walk.js style (kept for compatibility)
    wdna.recalculate = wells.recalculate(wdna)
    wdna.changed = wells.changed(wdna)
    // NEW: route-walking behavior
    wdna.sprout = wells.sprout(wdna)
}
```

Find checks `dna.midwells[concept]`. Create uses `wells.create(...)` then `dna.midwells.add(spore)`.
Adding triggers `wells.distribute` via `wells.changed → recalculate` (existing instance methods!).

### 4.4 Groups (° .get)

After fofu walk, ° conop switches to groups.

`egg["°"]` gets `{ zell: "well", well: "mofu" }` + zells.init.
No realm step — `egg["°"].get("podcasts")` directly.

```
"°"        → conop, current = egg["°"], mode = "concept"
"podcasts" → egg["°"].get("podcasts", signal) → hub calls egg["°"].sprout
             → well.sprout finds/creates group well, pushes mofu thrigit
```

Without explicit group (implied 0):
```
"°"  → conop, current = egg["°"]
"@"  → immediately another conop — signal.thrigits.mofu = 0 (no group)
```

### 4.5 Entities (@ inside °)

@ lives inside groups: `egg["°"]["@"]`.

```
"@"      → conop, current = egg["°"]["@"], mode = "concept"
"seri--" → exe (last step), egg["°"]["@"].exe("seri--", signal)
```

`egg["°"]["@"]` gets `{ zell: "well", well: "lofu" }` + zells.init.

The exe uses instance methods:
1. Last mofu well provides lofu cosmos (via groups.lofu.handle or equivalent)
2. Distribute lofu among members: `well.recalculate()` (instance method)
3. Build viewpoint: `viewpoints.create(signal, ...)` → `viewpoint(vdna)` instantiates
4. viewpoint.cache() (instance method on the viewpoint zell)

### 4.6 signal.thrigits for irlinks

```js
sig.walk = function (link) {
    let irpath = sig.route(link)
    return {
        link,
        walked: [],
        irpath,
        payload: [],           // strands: flat point array
        thrigits: {            // irlinks: named dimensions
            fofu: null,
            mofu: null,
            lofu: null
        }
    }
}
```

Each well.sprout overwrites `signal.thrigits[dim]` (deepest well wins).
The exe reads signal.thrigits to build the viewpoint buffgit.

### 4.7 Delete old pipeline

| removed | absorbed into |
|---------|---------------|
| walk.js | wells.sprout (instance method on well zells) |
| streets.js | stammzell factories (zones.js, wells.js, etc.) |
| irlinks.create | sig.walk + route |
| irlinks.walk.globe | well.sprout |
| irlinks.walk.groups | well.sprout (mofu mode) |
| irlinks.lofu.handle | groups.js + well instance methods |
| zells.get.dispatch | removed — hub checks dna.sprout directly |

Keep from walk.js: chick.path computation → move to wells or hyph.
Keep from irlinks.js: viewpoints reference.

### 4.8 Cackles (cached chicken paths)

```js
egg.cackles = {}

// before computing chickenpath in well.sprout.load:
function cackle(key) {
    if (egg.cackles[key]) return egg.cackles[key]
    let computed = chick.path(...)
    egg.cackles[key] = computed
    return computed
}
```

Memory only. Lives for lifetime of egg.

---

## Phase 5: Stammzellen System

### 5.1 Definition

**Stammzellen** are zells that have a distinct JavaScript file in the codebase.
zone.js, pascal.js, ring.js, well.js, supers.js, megas.js, funks.js — all stammzellen.

App-created zells (via verfassung Napp) are NOT stammzellen.
They're assembled from stammzell runes at runtime.

### 5.2 Funks and Sparks

```js
// funks.js — plural manufactures closures
funks.fire = function (dna) {
    return (change) => {
        for (let spark of dna.sparks) {
            if (funks.match(spark.condition, change)) {
                spark.callback(change)
            }
        }
    }
}

// funk() — singular attaches to instance
function funk(fdna) {
    fdna.sparks = fdna.sparks || []
    fdna.fire = funks.fire(fdna)    // instance method
    return fdna
}
```

No proxies. `zell.change(what)` → `zell.funk.fire(what)` checks sparks.
Sparks are sigs — callback function objects.

### 5.3 Napps — nested applications

First: **verfassung** — CI for dynamically creating irlinks/strands, display, tags, connections.
Then: **MDNAger** — turn links into Highrs/Fassungen with custom UI.

A Napp's dna encodes which CI elements compose it.

### 5.4 Highrs and Fassungen

Strands with own que components → "irlinkable".

```
plans.real life@Seri--: ~companies.money.plan:found the Eselsbrückenbauunternehmen
```

The irlink is the key, the strand is the value.
Encode the governing Napp in dna:

```js
{
    zell: "fassung",
    fassung: "plans",
    concept: "plans",
    napp: ["preplanner", "plans"],    // governing CI elements — street on the route
    irlink: "plans.real life@Seri--",
    strand: "~companies.money.plan:found..."
}
```

### 5.5 Runtime zell creation

The verfassung Napp creates new zells by:
1. Picking runes from the runebook
2. Encoding as dna (JSON-serializable)
3. zells.init attaches base methods
4. During .get walks, runebook.each calls runes → zell-specific behavior

---

## Implementation Order

### Phase 3 (structural)
1. Zell type split: `zell: "pyramid", pyramid: "providence"` everywhere
2. zells.init stammzell dispatch (calls zone(), pascal(), well(), etc.)
3. Remove zells.init from inside stammzell factories (prevent infinite loop)
4. Add .sprout instance methods to stammzell factories (zones.sprout, wells.sprout)
5. Hub (zells.get) checks dna.sprout — no dispatch table, no streets
6. Delete streets.js — logic absorbed into stammzell factories
7. Zone-before-realm: sig.route change, conop mode, egg["~"] rewire
8. SuPeRs skeleton: supers.js, .super() on zones
9. Megas skeleton: megas.js, wire as first stop

### Phase 4 (irlinks)
1. sig.route for irlinks: continent first, then globe
2. wells.sprout instance method (absorb walk.js step logic)
3. egg roots: egg["°"] = groups, egg["°"]["@"] = entities
4. Implied 0 group: ° always in irpath
5. signal.thrigits for irlink dimension tracking
6. Viewpoint creation in @ exe (using viewpoint instance methods)
7. Cackles
8. Delete walk.js, irlinks.create

### Phase 5 (stammzellen)
1. Funks + sparks on zells (instance methods)
2. Verfassung Napp skeleton
3. Highr/Fassung zell types with napp encoding
4. Runtime zell creation from runebook runes

---

## Stammzellen inventory

| stammzell | file | dna.zell | dna[dna.zell] example |
|-----------|------|----------|-----------------------|
| well | wells.js | "well" | "fofu", "mofu", "lofu" |
| zone | zones.js | "zone" | — |
| pascal | pascals.js | "pascal" | "providence", "louvre" |
| triangle | triangles.js | "triangle" | "llms" |
| pyramid | pyramids.js | "pyramid" | "providence" |
| ring | rings.js | "ring" | — |
| gap | gaps.js | "gap" | — |
| SuPeR | supers.js | "super" | "zone", "continent" |
| mega | megas.js | "mega" | — |
| viewpoint | viewpoints.js | "viewpoint" | — |
| cap | caps.js | "cap" | — |
| cosmos | cosmi.js | "cosmos" | — |
| funk | funks.js | "unit" | (unit:"funk") |
| counter | counters.js | "unit" | (unit:"counter") |
| collection | collection.js | "unit" | (unit:"collection") |
| fassung | (phase 5) | "fassung" | "plans" |
| highr | (phase 5) | "highr" | — |
