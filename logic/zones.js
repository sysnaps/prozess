// zones are NOT wells — they have fixed 1957 unschärfe
// each zone holds up to 6 pascals and its own mofu cosmos (normal wells)
// zones live inside rings and get placed with proximity spacing

const { collection, collections } = require("./collection")
const { cap: capfactory, caps } = require("./caps")
const { pascals } = require("./pascals")
const { pyramids, unscharfe } = require("./pyramids")
const { buffgits } = require("./buffgits")
const hyph = require("./hyph")
const { zells } = require("./zells")

const version = 1

// zone unschärfe = 6 pascals × 326 + 1 minschärfe
const count = 6
const zoneunscharfe = (count * unscharfe) + 1 // 1957

const zones = {}

// factory: hydrate a zone with methods
function zone(zdna) {
    zdna.zell = zdna.zell || "zone"
    zdna.unit = "zone"
    zdna.unschärfe = zoneunscharfe
    zdna.super = zones.super(zdna)
    if (!zdna.links) {
        zdna.links = collection({
            unit: "collection",
            collection: zdna.concept + ".links",
            maps: "link",
            refs: true,
            items: []
        })
    }

    // record a strand into the turbo pascal's pyramid layers
    // returns map of concept → assigned point
    zdna.record = zones.record(zdna)

    // check if zone is full (6 pascals)
    zdna.saturated = zones.saturated(zdna)

    zdna.add = zones.add(zdna)

    // rename zone to the pascal with the most strands (namensgeber)
    zdna.rename = zones.rename(zdna)


    zdna.cap = zones.cap(zdna)

    // version check
    if (zdna.check) zdna.check.version(version)

    return zdna
}
// add a new pascal concept to this zone
zones.add = function (dna) {
    return function (pascal) {
        if (dna.saturated()) return { status: "saturated" }
        dna.pascals.add(pascal)
    }
}

zones.super = function (dna) {
    let { supers } = require("./supers")
    let sdna = supers.create({ concept: dna.concept, is: "zone" })
    return function (realmname) {
        return sdna.find(realmname)
    }
}

zones.saturated = function (dna) {
    return function () {
        return dna.pascals.items.length >= count
    }
}

zones.rename = function (dna) {
    return function () {
        let max = 0
        let namensgeber = dna.concept
        dna.pascals.each((p, i) => {
            if (typeof p === "string") return
            if (p.strands > max) {
                max = p.strands
                namensgeber = p.concept
            }
        })
        dna.concept = namensgeber
        return namensgeber
    }
}

zones.record = function (dna) {
    return (strand, concepts) => {
        let turbo = dna.pascals[concepts[0]]
        if (!turbo || typeof turbo === "string") return {}

        // assign points from turbo pascal's layers at each depth
        let assigned = {}
        for (let i = 0; i < concepts.length; i++) {
            let layername = pyramids.which(i + 1)
            if (layername && turbo.triangle.layers[layername]) {
                let point = turbo.triangle.layers[layername].assign(strand)
                if (point !== null) assigned[concepts[i]] = point
            }
        }
        turbo.strands++

        // track in non-turbo pascals for rename/namensgeber
        for (let i = 1; i < concepts.length; i++) {
            let p = dna.pascals[concepts[i]]
            if (p && typeof p !== "string") p.strands++
        }

        // record link reference
        if (dna.links && !dna.links[strand]) {
            dna.links.add(strand)
        }

        return assigned
    }
}


// add a cap to this zone's cosmos and redistribute
zones.cap = function (dna) {
    return (capname, strandlink) => {
        if (!dna.cosmos[capname]) {
            let newcap = caps.create({
                concept: capname,
                strandlink,
                ring: dna.ring || "default"
            })
            dna.cosmos.add(newcap)
            zones.distributeCosmos(dna.cosmos)
        } else {
            let existing = dna.cosmos[capname]
            if (existing && typeof existing !== "string") {
                existing.strands.add(strandlink)
            }
        }
        return dna.cosmos[capname]
    }
}

// distribute 900000 unschärfe among cosmos members (same as irlinks wells)
zones.distributeCosmos = function (cosmos) {
    let total = 900000
    let count = 0
    cosmos.each(function (cap) { if (typeof cap !== "string") count++ })
    if (count === 0) return
    let share = Math.floor(total / count)
    let current = 0
    cosmos.each(function (cap) {
        if (typeof cap === "string") return
        cap.minwell = current
        cap.maxwell = current + share - 1
        cap.unschärfe = share
        current = cap.maxwell + 1
    })
}

// create a zone at a given minschärfe
zones.create = function ({ concepts, minschärfe, realmnum }) {
    let maxschärfe = minschärfe + zoneunscharfe - 1

    let zdna = {
        "zell": "zone",
        concept: concepts[0],
        version,
        realm: "default",
        minschärfe,
        maxschärfe,
        buffgit: buffgits.create({
            sphere: "ring",
            realmnum: realmnum || 1,
            fofu: minschärfe,
            mofu: 900001,
            lofu: 900001
        }),
        counter: { recalculation: [] }
    }
    zells.init(zdna)

    // pascals collection
    zdna.pascals = collection({
        unit: "collection",
        collection: zdna.concept + ".pascals",
        maps: "concept",
        items: []
    })

    // cosmos: this zone's mofu — a normal well-based distribution
    // caps (mofu instances) live here and share 900000 unschärfe
    zdna.cosmos = collection({
        unit: "collection",
        collection: zdna.concept + ".cosmos",
        maps: "cap",
        refs: true,
        items: []
    })

    // add initial concepts as pascals
    for (let i = 0; i < concepts.length && i < count; i++) {
        let p = pascals.create({
            concept: concepts[i],
            index: i,
            zoneminschärfe: minschärfe
        })
        zdna.pascals.add(p)
    }

    return zdna
}

// find a zone in a ring that shares at least one concept
zones.find = function (ring, concepts) {
    if (!ring.zones || !ring.zones.items) return null

    for (let item of ring.zones.items) {
        if (typeof item === "string") continue
        for (let concept of concepts) {
            if (item.pascals && item.pascals[concept]) {
                return item
            }
        }
    }
    return null
}

// how many concepts from a list match pascals in a zone?
zones.shared = function (zone, concepts) {
    let matched = 0
    for (let concept of concepts) {
        if (zone.pascals[concept] && typeof zone.pascals[concept] !== "string") matched++
    }
    return matched
}

// --- realm factory ---
// realm = strand root (egg["~"].default). handles turbo detection and pascal chick creation
function realm(rdna) {
    rdna.zell = rdna.zell || "realm"
    rdna.work = zones.work(rdna)
    return rdna
}

// --- realm work: manufactured by zones, attached to realm ---
// route walker calls realm.get(concept, signal) → hub → dna.work(concept, signal)
zones.work = function (dna) {
    return function (concept, signal) {
        zones.work.hydrate(dna, signal)
        if (!signal.zone) return zones.work.turbo(dna, concept, signal)
        return zones.work.chick(dna, concept, signal)
    }
}

// lazy-hydrate the ring on first access
zones.work.hydrate = function (dna, signal) {
    if (signal.ring) return
    let ringwell = dna.ring
    if (!ringwell) return
    if (!ringwell.zones) {
        ringwell.zell = ringwell.zell || "ring"
        zells.init(ringwell)
        ringwell.zones = collection({
            unit: "collection",
            collection: (ringwell.concept || "default") + ".zones",
            maps: "concept",
            items: []
        })
        ringwell.occupied = {}
        let { gaps } = require("./gaps")
        gaps.populate(ringwell)
    }
    signal.ring = ringwell
    signal.realmnum = zones.realmnum(signal)
}

zones.realmnum = function (signal) {
    let lookups = require("./lookups")
    let realmname = signal.realm || "default"
    let num = lookups.realmnum(realmname + " ring")
    if (num && !num.sig) return num
    return 1
}

// first concept = turbo → zone finding, gap swapping, pascal creation
zones.work.turbo = function (dna, concept, signal) {
    let { rings } = require("./rings")
    let fofu = zones.fofu(signal, concept)
    let z = rings.assign(signal.ring, fofu)
    signal.zone = z

    let assigned = z.record(signal.link, fofu)
    z.rename()
    signal.assigned = assigned

    let turbo = z.pascals[concept]
    signal.turbo = turbo
    signal.chickenpath = "~"
    signal.impliedstrand = "~"
    signal.depth = 0

    console.log("work turbo:", concept, "zone:", z.concept, "min:" + z.minschärfe)

    return zones.work.chick(dna, concept, signal)
}

// collect fofu concepts: current concept + remaining until next conop
zones.fofu = function (signal, concept) {
    let conops = require("./conops")
    let fofu = [concept]
    for (let i = 0; i < signal.irpath.length; i++) {
        if (conops.includes(signal.irpath[i])) break
        fofu.push(signal.irpath[i])
    }
    return fofu
}

// create or update a pascal chick file
zones.work.chick = function (host, concept, signal) {
    let z = signal.zone
    let turbo = signal.turbo
    let realmnum = signal.realmnum || 1
    let depth = signal.depth || 0
    let kind = pyramids.which(depth + 1)
    let assigned = signal.assigned || {}
    let point = assigned[concept] !== undefined ? assigned[concept] : null

    signal.impliedstrand += (depth > 0 ? "." : "") + concept
    let filepath = signal.chickenpath + "." + realmnum + "." + concept
    let folderpath = signal.chickenpath + concept

    let spore = zones.work.chick.find(host, concept, filepath)

    if (!spore) {
        spore = zones.work.chick.create(concept, filepath, signal, kind, point, turbo, realmnum, z)
    } else {
        zones.work.chick.update(spore, filepath, kind, point, turbo, realmnum, z)
    }

    spore.zell = "pascal"
    host[concept] = spore
    zells.init(spore)
    spore.stamp(filepath)

    zones.work.chick.payload(spore, signal)

    hyph.mkdir(folderpath)
    signal.chickenpath = folderpath + "/"

    return spore
}

zones.work.chick.find = function (host, concept, filepath) {
    if (host[concept] && typeof host[concept] !== "string") return host[concept]
    let loaded = hyph.get(filepath)
    if (loaded) return loaded
    return null
}

zones.work.chick.create = function (concept, filepath, signal, kind, point, turbo, realmnum, z) {
    let layer = turbo && turbo.triangle ? turbo.triangle.layers[kind] : null
    let data = {
        zell: "pascal",
        unit: "pascal",
        concept,
        strand: signal.impliedstrand,
        realm: signal.realm || "default",
        zone: z.concept,
        pyramid: {
            concept: kind,
            capacity: layer ? layer.capacity : null,
            minschärfe: layer ? layer.minschärfe : null,
            maxschärfe: layer ? layer.maxschärfe : null
        },
        point,
        buffgit: buffgits.create({
            sphere: "ring",
            realmnum,
            fofu: point,
            mofu: 900001,
            lofu: 900001
        })
    }
    hyph.save(filepath, data)
    console.log("work chick: created", filepath, "point:" + point)
    return data
}

zones.work.chick.update = function (existing, filepath, kind, point, turbo, realmnum, z) {
    let layer = turbo && turbo.triangle ? turbo.triangle.layers[kind] : null
    let updated = false

    if (!existing.zell) {
        existing.zell = "pascal"
        updated = true
    }
    if (!existing.point && point) {
        existing.point = point
        updated = true
    }
    if (!existing.pyramid && layer) {
        existing.pyramid = {
            concept: kind,
            capacity: layer.capacity,
            minschärfe: layer.minschärfe,
            maxschärfe: layer.maxschärfe
        }
        updated = true
    }
    if (!existing.buffgit) {
        existing.buffgit = buffgits.create({
            sphere: "ring",
            realmnum,
            fofu: existing.point || point,
            mofu: 900001,
            lofu: 900001
        })
        updated = true
    }
    if (updated) {
        hyph.save(filepath, existing)
        console.log("work chick: updated", filepath)
    }
}

zones.work.chick.payload = function (spore, signal) {
    if (spore.point !== null && spore.point !== undefined) {
        signal.payload.push(spore.point)
    }
}

module.exports = { zone, zones, realm, zoneunscharfe, count }
