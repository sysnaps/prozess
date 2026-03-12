# buffgits, realm, routes, gets — 2-part implementation

---

## part 1 — foundation: naming, buffgits, routes, counters

everything that needs to exist before the unified walking in part 2.

### 1.1 hyph.js — chicken folder rename

**change** `CHICKEN = path.join(HYPH_ROOT, "egg")` → `CHICKEN = path.join(HYPH_ROOT, "chicken")`

the filesystem folder is the chicken. the in-memory cache is the egg.
one line change. all existing files need moving or recreating.
seri: (i already renamed the folder from egg to chicken. no moving needed for those files)

### 1.2 buffgits.js — sphere/realm params

**change** `buffgits.create({ ring, sphere, fofu, mofu, lofu })` →
`buffgits.create({ sphere, realm, fofu, mofu, lofu })`

- `sphere` = type string: `"ring"`, `"globe"`, `"hive"`, `"runebook"`
- `realm` = instance name string: `"default"` (defaults to `"default"`)
- realmnum comes from lookups when needed, not stored in the buffgit itself
- drop the old `ring` (was a number) and old `sphere` (was a number)

seri:(the realmnum is always needed for the buffgit! we do not store the realm we store the realmnum. buffgit is called buffgit because we can put its values inside a sharedArrayBuffer (except for the descriping ones like version and unit))

**add** `buffgits.links.convert(link, position)` — but only as a fallback for when
the zell is NOT in the egg. normally we get tofus from the egg via .get walking.
seri:(also when the zell is in the egg. we should first check if the egg is fertilized at this address and if not we get the chick of it from the chicken. hydrate it into the egg and then read tofu. but the buffgits.links.convert function still takes a link and not the thrigit directly. so when we call buffgits.links.convert we don't even know yet if the zell was fertilized into the egg yet or not)

if the chick is not in the egg we load from chicken, hydrate into egg, then read tofu.
if not in chicken either → throw (not 900001 — that means NaN/NaC, not "missing")
seri:(why throw ? we should create that chick! we have enough context, right ? how about for added context: we not only send a link but also the zell from which we request the tofu. 
this principle seems to apply to .get in general. it feels like the .get and the conversion process here are very similar. like the conversion is part of the get. )

### 1.3 signal.js — sig.route(link)

**add** `sig.route(link)` — builds the egg walk route from a raw link

```
"~name.nick:seri"  → ["~", "default", "name", "nick", ":", "seri"]
"q.Center°admins@seri--" → ["default", "q", "Center", "°", "admins", "@", "seri--"]
"~name.nick"       → ["~", "default", "name", "nick"]
```

seri:(do not forget to incorporate the logic for a different realm. when a link has a + in it then the point after the plus indicates the realm. when there is no plus then we default to the default realms.)

rules:
- `~` prefix → first element is `"~"` (ring sphere vorzeichen)
- `!` prefix → first element is `"!"` (command vorzeichen)
- no prefix → globe sphere (no vorzeichen element)
- realm is always second element (default: `"default"`, or from `+realm` in link)
- fofu concepts follow
- `:` before mofu (caps), `°` before mofu (groups), `@` before lofu
- separators stay in the route — they tell us what comes next

this route is what we walk through the egg:
`egg["~"]["default"]["name"]["nick"]` then `:` tells us seri is in the cosmos.

### 1.4 realmnum in filenames

every chick file gets realmnum before the concept name. folders stay the same.

| before | after | why |
|--------|-------|-----|
| `~.name` | `~.1.name` | strand chick, realm 1 |
| `~name/.nick` | `~name/.1.nick` | nested strand chick |
| `.q` | `.1.q` | irlink chick, realm 1 |
| `q/.Center` | `q/.1.Center` | nested irlink chick |
| `zones/default/name/.seri` | `zones/default/name/1.seri` | cap file |

affected path builders:
- `walk.js` — `chick.path()` function
- `strands.js` — inline chickenpath building in `strands.create` loop
- `strands.js` — `strands.save.cosmos()` cap filename
- `strands.js` — `strands.nype()` nype filename

### 1.5 realm property normalization

every chick currently has `ring: "default"` or `globe: "default"`.
**change** to just `realm: "default"`. we know the sphere from the vorzeichen
(or from the sphere property on the buffgit).

affected: `strands.chick()`, `caps.create()`, `strands.nype()`, `walk.js mark()`

### 1.6 every saved zell gets a proper buffgit

| zell maker | sphere | fofu | mofu | lofu |
|------------|--------|------|------|------|
| `wells.distribute` | `"globe"` | minwell (when tofu=fofu) | minwell (when tofu=mofu) | minwell (when tofu=lofu) |
| `viewpoints.create` | `"globe"` | fofuwell.thrigit.fofu | mofuwell.thrigit.mofu | lofuwell.thrigit.lofu |
| `strands.chick` | `"ring"` | point | 900001 | 900001 |
| `strands.nype` | `"ring"` | endpointpoint | 900001 | parseInt(value) or 900001 |
| `zones.create` | `"ring"` | minschärfe | 900001 | 900001 |
| `caps.create` | `"ring"` | — | — | — |

caps are special: they get a `buffgits: []` array (one per strand).
each strand's buffgit fofu comes from the endpoint chick's thrigit[0].
built during route walking in part 2 (for now: via links.convert fallback).

### 1.7 lookups.js — rename spherenum → realmnum

- `lookups.spherenum()` → `lookups.realmnum()`
- callers: `irlinks.viewpoint()`, `viewpoints.create()`
- the stored property names in `.globes`/`.rings` stay as-is (`globenum`, `ringnum`)

seri:(why is it only viewpoint that calls the lookup? every zell gets a buffgit. and every buffgit needs a realmnum. so every zell factory should call realmnum and get the num of the realm that it has in its dna)

### 1.8 counters.js — fix wiring

already created. issues to fix:
- `counters.create()` returns raw object, never calls `counter(cdna)` to hydrate
- so `.add` and `.increment` are never attached
- fix: `counters.create` should call `counter()` to hydrate

seri:(the hyph.update call also needs fixing. i did not know the syntax here. especially for updating nested properties.)

### 1.9 zells.js — fix .get and .exe

already started. issues to fix:
- `dna.chickenpath` referenced but the stamp uses `dna.chicken` (non-enumerable)
- `zells.get.create` assigned to `dna.get.create` but never called — should just run inline
- `.get` and `.exe` for now: increment counter, save to chicken
- wire `zells.thrigit.return` into `zells.init` so every hydrated zell can return tofus

---
seri:(what do you mean with with just run inline? yeah i guess i forgot to make the call in the zell creation. just call it. ah i see i attached the function as a method but i dont think that create function makes sense to be a method. so i changed it to a direct call in the zell init function.)



## — zwischenreport after part 1 —

### done

| file | what changed |
|------|-------------|
| `hyph.js` | CHICKEN folder `"egg"` → `"chicken"`, `hyph.update` supports dot-separated nested keys |
| `counters.js` | `counters.create` now calls `counter()` to hydrate `.add` / `.increment` |
| `zells.js` | `.get` / `.exe` wired properly (uses `dna.chicken` not chickenpath), counter init is direct call, `thrigit.return` wired when buffgit exists |
| `lookups.js` | `spherenum` → `realmnum` everywhere |
| `buffgits.js` | params changed to `{ sphere, realmnum, fofu, mofu, lofu }`, added `buffgits.links.convert(link, position)` fallback |
| `signal.js` | added `sig.route(link)` and `sig.chicken(link, realmnum)` |
| `strands.js` | realmnum in all filenames (`.{realmnum}.{concept}`), `sphere:"ring"` in all buffgits, `realm` property on chicks, `strands.realmnum()` helper |
| `wells.js` | buffgit created in `wells.distribute` after thrigit, `wells.realmnum()` helper |
| `zones.js` | buffgit on zone creation `{sphere:"ring", realmnum, fofu:minschärfe, mofu:900001, lofu:900001}`, `realmnum` param on `zones.create` |
| `viewpoints.js` | buffgits.create uses `{sphere:"globe", realmnum}`, `realm` property |
| `irlinks.js` | `lookups.spherenum` → `lookups.realmnum` |
| `walk.js` | `resolveRealmnum(SPHERE)` extracts realmnum from sphere descriptor, passes it to `chick.path`, `mark()` stamps `realm` |
| `caps.js` | `caps.buffgit.from(strandlink)` looks up strand chicken for its buffgit, `caps.strands.add` also pushes buffgit, removed broken out-of-scope `cdna` reference |

### all require chains load clean

`entrance → irlinks → ok`, `entrance → strands → ok`, individual modules ok.

### known issues / open questions

1. **caps have no own buffgit** — they collect strand buffgits into `cdna.buffgits[]`, but the cap itself has no master buffgit. its position (minwell/maxwell) comes from `zones.distributeCosmos` but that doesn't create a buffgit. should it?

2. **wells.distribute hardcodes sphere `"globe"`** — line 136. this works for irlinks but if wells are ever used for other sphere types it would be wrong. for now: fine, wells are only irlinks.

3. **`caps.buffgit.from` timing** — relies on strand chicken file existing when cap is created. this works because `strands.chick()` runs before `z.cap()` in `strands.create`. if the order ever changes, the lookup returns null.

4. **record() still saves after every link** — the known bug from before. not addressed in part 1, same as before.

5. **`strands.realmnum` looks up `realm + " ring"`** — e.g. `"default ring"`. this depends on `.rings` having entries with `ring: "default ring"`. if the data says `ring: "default"` instead, the lookup fails and falls back to 1. works for now but fragile.

6. **walk.js `resolveRealmnum`** — for strands (sphere="ring"), the SPHERE.concept is `"default ring"`. same dependency on `.rings` data format as point 5.

---

## part 2 — route walking, egg nesting, buffgit building through gets

### 2.1 egg structure — strands live in egg["~"]

```
egg["~"]                          ← strand root
egg["~"].default                  ← default realm
egg["~"].default.name             ← hydrated ~.1.name chick
egg["~"].default.name.nick        ← hydrated ~name/.1.nick chick
egg["~"].default.name.nick.seri   ← reference to egg.zones.default.name.seri
```

for irlinks (no vorzeichen):
```
egg.default                       ← default realm
egg.default.q                     ← hydrated .1.q chick
egg.default.q.Center              ← hydrated q/.1.Center chick
```

### 2.2 route walking — unified .get/.exe pipeline

given route `["~", "default", "name", "nick", ":", "seri"]`:

```
current = egg
step "~"       → current = egg["~"]           (sphere root, no .get)
step "default" → current = egg["~"].default   (realm, no .get)
step "name"    → current.get(link)            → load from chicken if missing → counter++
step "nick"    → current.get(link)            → same
step ":"       → separator flag: next is cosmos
step "seri"    → current.exe(link)            → resolve from zone cosmos, counter++
```

the `:` separator tells us: seri is NOT a pascal chick at `~name/nick/.1.seri`.
seri is a cap in the zone's cosmos. so we resolve:
`egg.zones.default.{zonename}.seri` and alias it at `egg["~"].default.name.nick.seri`

the `@` separator works the same for irlinks → resolve from lofu cosmos.
the `°` separator → resolve from groups tree.

### 2.3 buffgit building through gets

as we walk the route, each .get step contributes its tofu:

```
step "name"  → name.buffgit.thrigit[0] = 1    → accumulate fofu = 1
step "nick"  → nick.buffgit.thrigit[0] = 2    → update fofu = 2
step "seri"  → seri cap has minwell = 0        → mofu = 0
                                               → lofu = 900001 (no nype)
```

the final buffgit passed to .exe: `[2, 0, 900001]`
this replaces the separate `buffgits.links.convert` lookup — the walk IS the lookup.

### 2.4 wellculations triggered by gets

when `.get` doesn't find a street:
- load chick from chicken → hydrate into egg
- for wells (irlinks): trigger `wells.distribute` (recalculate unschärfe)
- for rings (strands): trigger zone logic — check pascals, zone naming, zone placement

this unifies the current separate irlinks.walk and strands.create pipelines:
both become "walk the route, .get at each step, .exe at endpoint."
the sphere type (ring vs globe) determines which calculation logic fires.

### 2.5 zone rename mechanism

when a zone renames (namensgeber changes), the egg path alias needs updating.
the cap's `zone` property tracks which zone it belongs to.
on rename: update the zone folder in chicken, update the .zones registry,
update the egg.zones.{realm} reference.

---

seri:(did you think about using .get and .exe for the entrance strands in entrance.js as well?)

## questions / potential issues

1. **existing chicken files** — realmnum in filenames breaks all current files.
   just delete `D:\hyph\egg\` contents and let them recreate? (yes, since we're
   renaming the folder to chicken anyway) 

seri:(yes i already deleted everything except .globes and .rings inside the new chicken)

2. **egg["~"] initialization** — when does this get created? during `eggs.init`?
   or lazily on first strand? probably: `eggs.init` creates `egg["~"] = {}` and
   `egg["~"].default = {}` from `.rings` registry.
   seri:(hmm i think lazily is fine. and the chick of ["~"] is chicken\\.rings so its not that lazily because .rings and .globes is the first thing we get out of the chicken in 
   eggs.init )

3. **the .get method saves to chicken on every call** — for now ok (user confirmed).
   batch later when it gets heavy.

4. **buffgits.links.convert** — this is the FALLBACK for when we can't walk the egg
   (during initial creation before the chick exists in egg). once a chick is in the egg,
   we use `zells.thrigit.return(position)` directly from the walked zell.
   seri:(aaah ok . i complained about that above. but i think what you describe here makes sense)

5. **zone rename updates egg references** — the in-memory reference stays valid
   (same object). but the egg PATH changes. need to delete old key, set new key.
   and the chicken folder needs renaming too.
