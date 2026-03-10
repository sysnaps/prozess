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
    zdna.unit = "zone"
    zdna.unschärfe = zoneunscharfe
    zells.init(zdna)
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
    zdna.check.version(version)

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
    return function (pascal) { // not sure what we specifically do here but in general we communicate with zones from different rings

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

    let zdna = zone({
        "zell": "zell",
        concept: concepts[0], // namensgeber
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
    })

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

module.exports = { zone, zones, zoneunscharfe, count }
