# Phase 3 Plan: Stammzellen, Continents, and Funks

This plan crystallizes the architecture for Phase 3, incorporating the latest design additions: Stammzellen, Continents (q), SuPeRs/Megas, and the Funk reactivity system.

## 1. The `Stammzellen` (Stem Cells) Pattern
"Stammzellen" are the hardcoded, elemental JS definitions of our system's base structures (`triangles`, `rings`, `zones`, `wells`, `collection`, `counter`, etc.).
Instead of manually wrapping data objects, `zells.init()` will act as the stem cell differentiator:
- If a zell has `zell: "triangle"`, `zells.init` will internally route to `require("./triangles").triangle(dna)`. 
- For units, it will read `zell: "unit", unit: "collection"` and route to `require("./collection").collection(dna)`.

This makes loading from the egg/chicken purely data-driven. The data knows exactly what kind of Stammzelle it must become, just like stem cells differentiating.

## 2. Irlink Walking: Continents and Globes
An irlink like `q.Center.Middle.SevenSeas` expands conceptually into **`[q, globe, Center, Middle, SevenSeas]`**.
- **Continents (`q`)**: The very first coordinate is a continent (a top-level well).
- **Globes (`globe`)**: The second coordinate. When we evaluate `egg.q.get(...)`, it calls the globe, which recalculates the unschärfe of all other continents within that globe.
- **Wells**: Everything from `Center` downwards sits inside the well calculations. 

## 3. Megas & SuPeRs (Cross-Boundary Logic)
- **Megas (`zell: "mega"`)**: Handle cross-sphere communication. `entrance.js` starts the walk inside the Mega, which deduces if we are walking an irlink, strand, or command based on the irpath. It's the absolute top-level router.
- **SuPeRs (`zell: "SuPeR"`)**: Handle cross-realm communication. A SuPeR doesn't get called via standard `.get()` and doesn't leave a traditional trace in the thrystem (it has no "thraddress", since cross-realm isn't a single point). A zone calls its super via a `.super()` method.
  - Types look like: `zell: "SuPeR", SuPeR: "Zone"` or `zell: "SuPeR", SuPeR: "Continent"`.

## 4. Implied Groups (`°`)
When an irlink has no explicit group assigned, it walks through the implicit **"0 group"**. 
`q.Center.SevenSeas@seri--` conceptually resolves to `[q, globe, Center, SevenSeas, °, @, seri--]`.
This guarantees that all entities fit into the group `mofu` distribution hierarchy (up to 900,000 unschärfe), ensuring long-term scalability. `egg["°"]` becomes the governing body for all entities (`@`).

## 5. Viewpoints, Highrs, and Napps
- **Fassungen & Highrs**: These are specific strands that have their own Que (CI) components and are thus "irlinkable".
- **Napps**: The nested application that governs these zells is encoded directly into their DNA (e.g. `[preplanner, plans]` as a street on the route).

## 6. Funks & Sparks (Reactivity without Proxies)
Reactions to logic changes do not need clunky Proxy objects. Instead, they operate via:
- **Funks**: The subscriber unit (`zell: "unit", unit: "funk"` from the `funks.js` factory).
- **Sparks**: The individual callback function objects that live inside a Funk.
When conditions are met (e.g., via `zell.change`), the Funk fires its Sparks.

## Immediate Action Items for Phase 3 Code
1. Refactor `zells.init()` to cleanly dispatch to the correct Stammzellen factory based on `dna.zell` and `dna.unit`.
2. Introduce the implicit `°` step generation in `signal.ROUTE` parsing for Irlinks missing a group.
3. Update `streets.irlink` to handle the `Continent -> Globe -> Midwell` architecture.
4. Flesh out `entrance.js` and `megas.js` to begin the walk at the `Mega`.
5. Connect `SuPeR` logic (`supers.js`) to zones so they can communicate across realms without logging a thraddress.
