// rings contain zones. a ring is NOT a well — zones have fixed size (1957)
// ring wraps: below 0 = 900000 (it's a ring!)
// 900000 / 1957 = 459 zones + 1737 restschärfe
//
// zone spacing based on shared pascals:
//   0 shared → 5 free zone slots apart
//   1 shared → 2 free zone slots apart
//   2+ shared → 1 above or below (adjacent)
//
// furthest apart from 0 is 450000 (halfway around the ring)

const { collection } = require("./collection")
const { zones, zoneunscharfe } = require("./zones")
const { pascals } = require("./pascals")

const total = 900000
const slots = Math.floor(total / zoneunscharfe) // 459
const ringend = slots * zoneunscharfe            // 898263
const restschärfe = total - ringend               // 1737

const rings = {}

// factory: hydrate a ring with methods
function ring(rdna) {
    rdna.unit = "ring"
    rdna.slots = slots
    rdna.ringend = ringend
    rdna.restschärfe = restschärfe

    // get the minschärfe for a zone at a given slot index
    rdna.slot = function (index) {
        // wrap around the ring
        return (index % slots) * zoneunscharfe
    }

    return rdna
}

rings.create = function ({ concept }) {
    let rdna = ring({
        concept: concept || "default ring",
        total,
        counter: { recalculation: [] }
    })

    rdna.zones = collection({
        unit: "collection",
        collection: rdna.concept + ".zones",
        maps: "concept",
        items: []
    })

    // track which slots are occupied (sparse array)
    rdna.occupied = {}

    return rdna
}

// find the nearest free slot at a given distance from a reference slot
rings.free = function (ring, reference, distance) {
    // try above first, then below, wrapping around
    for (let d = distance; d < ring.slots; d++) {
        let above = (reference + d) % ring.slots
        if (!ring.occupied[above]) return above
        let below = (reference - d + ring.slots) % ring.slots
        if (!ring.occupied[below]) return below
    }
    return null // ring is full
}

// find or create a zone for the given concepts
rings.assign = function (ring, concepts) {
    let found = zones.find(ring, concepts)

    if (found) {
        // zone exists — add new pascals if room
        if (!found.saturated()) {
            for (let concept of concepts) {
                if (!found.pascals[concept] && !found.saturated()) {
                    let p = pascals.create({
                        concept,
                        index: found.pascals.items.length,
                        zoneminschärfe: found.minschärfe
                    })
                    found.add(p)
                }
            }
        } else {
            // saturated — overflow concepts need a new zone
            let unmatched = concepts.filter(c => !found.pascals[c])
            if (unmatched.length > 0) {
                // 2+ shared → place 1 slot apart (adjacent)
                let shared = zones.shared(found, concepts)
                let refslot = Math.floor(found.minschärfe / zoneunscharfe)
                let spacing = shared >= 2 ? 1 : shared === 1 ? 2 : 5
                let slot = rings.free(ring, refslot, spacing)
                if (slot === null) return found // ring full, use existing

                let newconcepts = [
                    ...concepts.filter(c => !!found.pascals[c]),
                    ...unmatched
                ].slice(0, 6)
                let newzone = zones.create({ concepts: newconcepts, minschärfe: ring.slot(slot) })
                ring.zones.add(newzone)
                ring.occupied[slot] = newzone.concept
                return newzone
            }
        }
        return found
    }

    // no matching zone — brand new, 5 slots spacing from nearest occupied
    let refslot = 0
    let spacing = Object.keys(ring.occupied).length === 0 ? 0 : 5
    let slot = rings.free(ring, refslot, spacing)
    if (slot === null) slot = rings.free(ring, 0, 1) // fallback: any free slot

    let newzone = zones.create({ concepts: concepts.slice(0, 6), minschärfe: ring.slot(slot) })
    ring.zones.add(newzone)
    ring.occupied[slot] = newzone.concept
    return newzone
}

module.exports = { ring, rings, slots, ringend, restschärfe, total }