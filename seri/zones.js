// zones are NOT wells — they have fixed 1957 unschärfe
// each zone holds up to 6 pascals and its own mofu cosmos (normal wells)
// zones live inside rings and get placed with proximity spacing

const { collection, collections } = require("./collection")
const { pascals } = require("./pascals")
const { unscharfe } = require("./pyramids")
const hyph = require("./hyph")
const zells = require("./zells")

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

    // record a strand into the matching pascals' pyramids
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
        // how many of this strand's concepts are pascals in this zone?
        let matching = concepts.filter(c => dna.pascals[c] && typeof dna.pascals[c] !== "string").length
        let assigned = {}

        for (let concept of concepts) {
            let p = dna.pascals[concept]
            if (!p || typeof p === "string") continue
            assigned[concept] = p.record(strand, matching)
        }

        return assigned
    }
}


// add a cap to this zone's cosmos
zones.cap = function (dna) {
    return (concept) => {
        if (!dna.cosmos[concept]) {
            dna.cosmos.add({ concept, strands: 0 })
        }
        return dna.cosmos[concept]
    }
}

// create a zone at a given minschärfe
zones.create = function ({ concepts, minschärfe }) {
    let maxschärfe = minschärfe + zoneunscharfe - 1

    let zdna = zone({
        concept: concepts[0], // namensgeber
        version,
        minschärfe,
        maxschärfe,
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
        maps: "concept",
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
