# prozess — the databrain's nervous system

prozess receives links from the app, parses them into signals, and processes them through two parallel pipelines: **irlinks** (the living tree) and **strands** (the fixed-point lattice).

---

## signal parsing (signal.js)

every link enters through `incoming.js` and gets parsed by `sig.nal(link)`.

the prefix determines the type:
- no prefix → **irlink** — `q.Center.Middle°admins.irl@seri--`
- `~` prefix → **strand** — `~energy.golden.strong.10`
- `!` prefix → **command** — `!globe.walk(entity)`

the parser extracts an **irpath** from every link:
- **fofu** — the main concept chain (dot-separated). `q.Center.Middle`
- **mofu** — the group/cap chain (after `°` for irlinks, after `:` for strands). `admins.irl`
- **lofu** — the entity/nype (after `@` for irlinks, last numeric for strands). `@seri--` or `10`
- **globe** — which globe to use (after `+`). `+eastwesteros`

conops: `@ ! . : + ~ ° /`

---

## the egg (egg.js)

the egg is the root collection. it loads at startup from `D:\hyph\egg\.egg`.

startup flow:
1. `hyph.get(".egg")` loads the collection dna
2. `Object.assign(egg, eggdna)` mutates egg in place (keeps module reference)
3. load sphere registries: `egg.globes = hyph.get(".globes")`, `egg.rings = hyph.get(".rings")`
4. `collection(egg)` — walks every string item, loads actual chicks from the chicken, nests at irlink path (`egg.globes.default`, `egg.rings.default`), attaches by concept key (`egg["default globe"]`)
5. hydrate each loaded well and its midwells recursively
6. `lookups.init()` — builds the sphere lookup tables

after init: `egg["default globe"]` and `egg.globes.default` both point to the same well object.

---

## pipeline 1: irlinks — the living tree

**goal:** build and maintain a hierarchical tree of wells that distributes 900,000 unschärfe among concepts. every irlink that arrives carves out a named region of unschärfe space.

### how it works

```
incoming("q.Center.Middle°admins.irl@seri--")
  → sig.nal() parses: fofu=["q","Center","Middle"], mofu=["admins","irl"], lofu=["@seri--"]
  → irlinks.create(signal)
    → irlinks.walk.globe(signal, "default globe")
      → globe.walk(signal) — walks fofu through the well tree
    → irlinks.walk.groups(signal, "default globe groups")
      → walks mofu through the groups tree
    → irlinks.lofu.handle(signal, mofuwell)
      → creates lofu entity under the mofu endpoint
    → irlinks.viewpoint(signal, fofu, mofu, lofu)
      → creates a viewpoint with a buffgit address
```

### the walk (walk.js)

the walk is the core of irlinks. for each concept in the fofu chain:

1. **step()** — find or create a well at this concept
   - check if it exists as a midwell of the current well
   - try loading from the chicken (chick file)
   - if not found: create a brand new well with `wells.first()`
2. **mark()** — stamp sphere/type properties on the well
3. **record()** — add the link string to the well's links collection, save to chicken

### unschärfe distribution (wells.js)

when a midwell is added, `wells.distribute()` recalculates:
- the parent's range (minwell to maxwell) gets divided equally among children
- each child gets: `minwell` (its identity point), `unschärfe` (its share), `maxwell` (its ceiling)
- this recurses: children distribute to their own children
- `thrigit.fofu = minwell` — the well's address in the fofu dimension

example with 3 first-depth wells under default globe (0–900000):
```
distributable = 900000 - 1 = 899999  (reserve 0 for globe itself)
share = floor(899999 / 3) = 299999

q:           minwell=1,      maxwell=299999,  unschärfe=299999
preplanner:  minwell=300000,  maxwell=599998,  unschärfe=299999
verfassung:  minwell=599999,  maxwell=899997,  unschärfe=299999
restschärfe: 899998–899999 (2 unused points at the top)
```

### links collection

every well records which links pass through it. links are stored as **strings only** — they are references, not data. `q.links.items = ["q.Center", "q.Center.Middle"]`

### viewpoints (viewpoints.js)

when an irlink has all three parts (fofu + mofu + lofu), a viewpoint is created. a viewpoint is the intersection of a fofu well, a mofu group, and a lofu entity. it gets a **buffgit** — a 3-coordinate address: `[fofu.thrigit.fofu, mofu.thrigit.mofu, lofu.thrigit.lofu]`. viewpoints are cached in lookups for fast retrieval.

---

## pipeline 2: strands — the fixed-point lattice

**goal:** map strand links onto a fixed-size ring of zones, where each concept gets a deterministic numerical address (point). strands answer: "given these concepts in this combination, what is the exact point?"

### how it works

```
incoming("~energy.golden.strong.10")
  → sig.nal() parses: fofu=["energy","golden","strong"], lofu=["10"]
  → strands.create(signal)
    → strands.hydrate(ringwell) — lazy-init the ring with zones/slots
    → strands.zone(r, signal) — find or create a zone
      → rings.assign(ring, fofu)
    → z.record(signal.link, fofu) — record into matching pascals
    → strands.chick() for each concept — create/update chick files
    → strands.nype() — create nype file for the lofu value
```

### the ring (rings.js)

the ring is a circular space of 900,000 points divided into **459 zone slots** of 1,957 points each (+1,737 restschärfe).

zone placement uses proximity spacing:
- 0 shared concepts → 5 free slots apart
- 1 shared concept → 2 free slots apart
- 2+ shared concepts → adjacent (1 slot apart)

### zones (zones.js)

each zone holds up to **6 pascals** and a **cosmos** (mofu caps collection).

- `zone.record(strand, concepts)` — distributes the strand into matching pascals' pyramids
- `zone.saturated()` — true when 6 pascals are filled
- `zone.rename()` — renames zone to the pascal with the most strands (namensgeber)
- `zone.cap(concept)` — adds a mofu cap to the zone's cosmos

### pascals (pascals.js)

each pascal is one of the 6 entry points in a zone. it gets **326 fixed unschärfe** containing a **triangle** with 6 pyramid layers.

position: `zoneminschärfe + 1 + (index * 326)`

### triangles and pyramids (triangles.js, pyramids.js)

a triangle is a set of 6 pyramid layers inside a pascal:

```
providence:  capacity=1    (1 point strand — just the concept itself)
louvre:      capacity=5    (2 point strands)
castillo:    capacity=20   (3 point strands)
sun:         capacity=60   (4 point strands)
luxor:       capacity=120  (5 point strands)
gizeh:       capacity=120  (6 point strands)
total:       326 points per pascal
```

`pyramids.which(count)` maps strand length to pyramid name. a strand with 3 concepts goes to "castillo".

each strand gets a **point** — the next available slot in the matching pyramid layer.

### chick files

for each concept in the fofu chain, strands create a chick file in the chicken:
- path: `~concept` or `~parent/concept` (prefixed with `~` for strands)
- contains: concept, strand, zone, pyramid info, point, and a **buffgit**
- the buffgit has `thrigit: [fofu_point, 900001, 900001]` (mofu/lofu default to NaN sentinel)

nype files are created for lofu values: `~parent/endpoint/nype/.value`

### example trace

```
~energy.golden.strong.10

1. ring slot 0 → zone "energy" at minschärfe 0
2. 3 pascals created: energy(idx=0), golden(idx=1), strong(idx=2)
3. pyramidkind = castillo (3 concepts)
4. record into each pascal's triangle → castillo layer
5. chick files:
   ~.energy         point=7    (energy pascal minschärfe + castillo offset)
   ~energy/.golden  point=333  (golden pascal minschärfe + castillo offset)
   ~energy/golden/.strong  point=659
6. nype: ~energy/golden/strong/nype/.10

~unschärfe.zone.1957

1. ring slot 5 → zone "unschärfe" at minschärfe 9785 (5×1957)
2. 2 pascals: unschärfe(idx=0), zone(idx=1)
3. pyramidkind = louvre (2 concepts)
4. chick files:
   ~.unschärfe      point=9787
   ~unschärfe/.zone point=10113
5. nype: ~unschärfe/zone/nype/.1957

~count.zone.pascals.6

1. zone "unschärfe" found (shares "zone" pascal)
2. new pascals added: count(idx=2), pascals(idx=3)
3. zone now has 4 pascals
4. pyramidkind = castillo (3 concepts)
5. chick files:
   ~.count               point=10444
   ~count/.zone          point=10118 (reuses existing "zone" pascal)
   ~count/zone/.pascals  point=10770
6. nype: ~count/zone/pascals/nype/.6
```
**comment**
seri:
now i tried ~name.nick:seri

what should happen is -
there is no ring specified so it goes into the default ring.
It checks the entries in the default Ring and does not find neither a zone with name or with nick.
Neither are Pascals anywhere. It create
~.name 
and inside there .nick

~.name is the providence of the "name" triangle of the name pascal of that zone.

It is the first strand we create so its in the very first zone.
~.name should get the address: 1 
0 for the entire ring.
1 is the first providence of the first pascal of the very first zone.
- ~.nick needs a "zone" property that shows the name of the zone (determined by the pascal that is used the most out of the 6 pascals.) all the pascals in that zone and the height of that zone .
And inside 
~.nick we have .name just .name not ~.name the ~ we only use for the turbo (the first pascal in a strand is the turbo ) and .name.nick is the strand of .name (it is inside name\nick) and it is in the louvre of our name triangle which has a capacity of 5 and it can be the first point there so "nick"
get's ring point number 2 . 
then "seri" is in the cosmos of the "name" zone. So we have a .zones file at egg level and a /zones folder and in there we have the folder "default" for the default ring and in there we have 
.name which has the zdna for the name zone and holds a collection of link references to the strands that were created in that zone and also the information i described above.
And we also have a name folder in there and that name folder is the cosmos of of that zone. And "seri" is the only item in that cosmos so it gets the full 900000
unschärfe of that cosmos. Every zone has its own cosmos and there we use the same distribution method we use for the irlinks. We evenly distribute the unschärfe among the children. 
---

## shared infrastructure

### collections (collection.js)

the universal container. every collection has:
- `items[]` — the ordered array of members
- `maps` — which property to use as the key (e.g., "concept", "link")
- `refs: true` — items are string references; toJSON saves concept names, not objects
- `attach()` — initial setup: walks string items (loads chicks from chicken), attaches by key
- `add()` — runtime: stores items directly, replaces stale strings with real objects, never walks
- `walk()` — parses a string with sig.nal, loads the chick file, nests at fofu path, replaces in items
- `toJSON()` — serializes: refs collections save items as string keys, others save as-is

### hyph (hyph.js)

filesystem adapter. the chicken lives at `D:\hyph\egg\`.
- `hyph.get(link)` — read a chick file. `".egg"` → `D:\hyph\egg\.egg`
- `hyph.save(link, data)` — write a chick file (auto-creates directories)
- `hyph.resolve(link)` — `%` prefix = hyph root, otherwise = chicken folder

### zells (zells.js)

the base factory for all units. `zells.init(dna)` adds:
- `dna.check.version(v)` — version migration with auto-save
- `dna.stamp(chickenpath)` — non-enumerable chicken path (invisible to JSON.stringify)

### buffgits (buffgits.js)

a 3-coordinate address: `thrigit: [fofu, mofu, lofu]`. used by strands and viewpoints to create fixed numerical addresses for lookup.

### sigs (sigs.js)

the smallest moving parts. `sigs.null(reason)` replaces null with an explanatory object. `sigs.signet(link, signal, buffgit)` wraps a resolved irlink.

### lookups (lookups.js)

nested cache: `lookups[spherename][spherenum][fofu][mofu][lofu]` → cached dna. used by viewpoints for fast retrieval of resolved irlinks.

### IF (IF.js)

flow control: `IF(condition).then(callback, ...args)` — calls callback with args only when condition is true, returns the result.

---

## known bugs and improvements

### bugs

1. **irlink wells have thrigit but no buffgit** — `wells.distribute()` creates `well.thrigit = { fofu: minwell, mofu: 0, lofu: 0 }` but never creates a buffgit. strands create buffgits for their chick files. irlinks should too, so viewpoints can compose buffgits from wells and everything flows through the same lookups cache.

2. ~~**sphere() in walk.js misreads globe number as name**~~ — FIXED: changed `globes/.default` to store `globe: "default"` (the name) instead of `globe: 1` (the number).

3. ~~**collection.toJSON does not save `refs`**~~ — FIXED: toJSON now saves `refs: true` when present. wells.js also sets `refs = true` on links collections loaded from chicken.

4. ~~**links get walked on reload**~~ — FIXED: `collection.attach` checks `maps === "link"` and skips walking for link collections.

5. **record() saves to disk after every single link** — `walk.js:record()` calls `hyph.save(current.chicken, current)` each time a link passes through a well. with many irlinks this causes excessive disk writes. could batch saves or defer to end of walk.

6. **strands.chick hardcodes ring:1, sphere:2 in buffgit** — should read from the actual ring well and sphere registry instead of hardcoded values.

7. **conops.js is unused** — defined but never required by any module.

### improvements

1. **irlinks should create buffgits on wells** — when distribute assigns thrigit values, also create a buffgit. this makes wells addressable through the lookups cache just like viewpoints and strand chicks.

2. ~~**separate attach-with-walk from attach-without-walk**~~ — FIXED: attach checks `maps === "link"` and skips walking.

3. ~~**sphere name resolution**~~ — FIXED: globe root stores `globe: "default"` (the name).

---

## file map

```
seri/
  incoming.js     — entry point: parse link, dispatch to irlinks or strands
  signal.js       — sig.nal(): parse links into { is, irpath: { fofu, mofu, lofu, globe } }
  IF.js           — IF(cond).then(fn, ...args) flow control

  egg.js          — egg/eggs: startup loader, midwells hydration
  collection.js   — universal container with attach/add/walk/toJSON
  hyph.js         — filesystem adapter for the chicken (D:\hyph\egg\)
  zells.js        — base factory: version check, chicken stamp
  sigs.js         — null signals, signets
  lookups.js      — nested sphere cache for fast address lookup
  conops.js       — operator characters (unused)

  irlinks.js      — irlink pipeline: walk globe, walk groups, handle lofu, create viewpoint
  walk.js         — step/mark/record: walk fofu concepts through well tree
  wells.js        — well factory, unschärfe distribution, change notifications
  groups.js       — mofu group handling, lofu cosmos
  viewpoints.js   — fofu×mofu×lofu intersection with buffgit address

  strands.js      — strand pipeline: hydrate ring, find zone, create chicks + nypes
  rings.js        — ring factory, zone slot placement with proximity spacing
  zones.js        — zone factory: 6 pascals + cosmos, record strands, rename
  pascals.js      — pascal factory: 326 fixed unschärfe, triangle with pyramids
  triangles.js    — triangle factory: 6 pyramid layers per pascal
  pyramids.js     — pyramid layers: providence/louvre/castillo/sun/luxor/gizeh
  buffgits.js     — 3-coordinate address: thrigit [fofu, mofu, lofu]
```
