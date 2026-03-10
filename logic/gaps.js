const { zells } = require("./zells")
const { zoneunscharfe } = require("./zones")

const version = 1
const total = 459

function gap(gdna) {
    gdna.unit = "gap"
    gdna.zell = "zell"
    zells.init(gdna)
    gdna.check.version(version)
    return gdna
}

const gaps = {}

gaps.create = function ({ slot, minschärfe }) {
    return gap({
        version,
        concept: "gap." + slot,
        slot,
        minschärfe,
        maxschärfe: minschärfe + zoneunscharfe - 1
    })
}

// fill a ring's zones collection with 459 gap zells
gaps.populate = function (ring) {
    for (let i = 0; i < total; i++) {
        let minschärfe = i * zoneunscharfe
        let g = gaps.create({ slot: i, minschärfe })
        ring.zones.add(g)
        ring.occupied[i] = g.concept
    }
    return ring
}

// replace a gap at the given slot with a real zone
gaps.swap = function (ring, slot, zone) {
    let existing = ring.zones["gap." + slot]
    if (existing) {
        ring.zones.remove("gap." + slot)
    }
    ring.zones.add(zone)
    ring.occupied[slot] = zone.concept
    return zone
}

module.exports = { gap, gaps }
