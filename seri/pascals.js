// a pascal is one of the 6 entry points in a zone
// each gets 326 fixed unschärfe containing 6 pyramid layers via its triangle
// NOT a well — fixed addressing with minschärfe/maxschärfe

const { triangles } = require("./triangles")
const { unscharfe } = require("./pyramids")
const zells = require("./zells")

const version = 1

const pascals = {}

// factory: hydrate a pascal with methods
function pascal(pdna) {
    pdna.unit = "pascal"
    zells.init(pdna)

    pdna.record = pascals.record(pdna)

    pdna.check.version(version)

    return pdna
}

// record a strand into this pascal's triangle
// count = how many pascals from the zone match this strand
pascals.record = function (dna) {
    return (strand, count) => {
        let point = dna.triangle.record(strand, count)
        if (point !== null) dna.strands++
        return point
    }
}

// create a pascal at a specific index within a zone
// zoneminschärfe = the zone's own minschärfe (its identity point)
pascals.create = function ({ concept, index, zoneminschärfe }) {
    // position: after zone minschärfe (1) + previous pascals × 326
    let offset = 1 + (index * unscharfe)
    let minschärfe = zoneminschärfe + offset
    let maxschärfe = minschärfe + unscharfe - 1 // inclusive

    // create the triangle with pyramid layers starting at our minschärfe
    let tri = triangles.create(concept, minschärfe)

    return pascal({
        concept,
        version,
        index,
        minschärfe,
        maxschärfe,
        unschärfe: 326,
        triangle: tri,
        strands: 0,
        counter: { recalculation: [] }
    })
}

module.exports = { pascal, pascals }