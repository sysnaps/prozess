const { zells } = require("./zells")
const { zoneunscharfe } = require("./zones")

const version = 1
const total = 459

function gap(gdna) {
    gdna.zell = gdna.zell || "gap"
    gdna.unit = "gap"
    if (gdna.check) gdna.check.version(version)
    return gdna
}

const gaps = {}

gaps.create = function ({ slot, minschärfe }) {
    let gdna = {
        zell: "gap",
        version,
        concept: "gap." + slot,
        slot,
        minschärfe,
        maxschärfe: minschärfe + zoneunscharfe - 1
    }
    zells.init(gdna)
    return gdna
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
