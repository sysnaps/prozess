// a triangle is a set of 6 pyramid layers inside a pascal
// it holds the strands that reference this pascal's concept

const { pyramids } = require("./pyramids")
const { zells } = require("./zells")

const version = 1

const triangles = {}

// factory: hydrate a triangle with methods
function triangle(tdna) {
    tdna.zell = tdna.zell || "triangle"
    tdna.unit = "triangle"

    tdna.record = triangles.record(tdna)

    if (tdna.check) tdna.check.version(version)

    return tdna
}

// record a strand into the right pyramid layer
triangles.record = function (dna) {
    return (strand, count) => {
        return pyramids.assign(dna.layers, strand, count)
    }
}

// create a triangle for a pascal at a given offset
triangles.create = function (concept, offset) {
    let layers = pyramids.create(concept, offset)

    let tdna = {
        zell: "triangle",
        concept,
        version,
        layers
    }
    zells.init(tdna)
    return tdna
}

module.exports = { triangle, triangles }