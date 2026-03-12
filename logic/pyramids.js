// pyramid layers: named after famous pyramids, ordered smallest → largest
// these are NOT wells — they have fixed capacity, not evenly distributed
// each pyramid inside a pascal gets a fixed range of "points"
//
// the "kind" property is the pyramid name itself

const kinds = [
    { concept: "providence", capacity: 1, points: 1 },  // 👁️ dollar bill — just the pascal itself
    { concept: "louvre", capacity: 5, points: 2 },  // 21m Paris
    { concept: "castillo", capacity: 20, points: 3 },  // 24m Chichén Itzá
    { concept: "sun", capacity: 60, points: 4 },  // 65m Teotihuacán
    { concept: "luxor", capacity: 120, points: 5 },  // 107m Las Vegas
    { concept: "gizeh", capacity: 120, points: 6 },  // 146m Great Pyramid
]

// reverse lookup: point count → pyramid kind
const points = {}
kinds.forEach(k => { points[k.points] = k.concept })

// total unschärfe per pascal = sum of all pyramid capacities
const unscharfe = kinds.reduce((a, k) => a + k.capacity, 0) // 326

const { zells } = require("./zells")

const version = 1

const pyramids = {}

// factory: hydrate a pyramid object with methods
function pyramid(pdna) {
    pdna.unit = "pyramid"
    pdna.kind = pdna.kind || pdna.concept
    pdna.zell = "pyramid"
    pdna.pyramid = pdna.kind
    pdna.used = pdna.used || 0

    pdna.assign = pyramids.slot(pdna)

    if (pdna.check) pdna.check.version(version)

    return pdna
}

// assign a strand to the next available point in this pyramid
pyramids.slot = function (dna) {
    return (strand) => {
        if (dna.used >= dna.capacity) return null
        let point = dna.minschärfe + dna.used
        dna.used++
        dna.strands.push(strand)
        return point
    }
}

// create all 6 pyramid layers for a pascal at a given offset
pyramids.create = function (concept, offset) {
    let layers = {}
    let current = offset

    for (let kind of kinds) {
        let minschärfe = current
        let maxschärfe = current + kind.capacity - 1

        let pdna = {
            zell: "pyramid",
            concept: concept + "." + kind.concept,
            version,
            kind: kind.concept,
            capacity: kind.capacity,
            points: kind.points,
            minschärfe,
            maxschärfe,
            strands: []
        }
        zells.init(pdna)
        layers[kind.concept] = pdna

        current = maxschärfe + 1
    }

    return layers
}

// find which pyramid a strand belongs in based on point count
pyramids.which = function (count) {
    return points[count] || null
}

// assign a strand to the right pyramid in a set of layers
pyramids.assign = function (layers, strand, count) {
    let kind = pyramids.which(count)
    if (!kind || !layers[kind]) return null
    return layers[kind].assign(strand)
}

module.exports = { pyramid, pyramids, kinds, points, unscharfe }