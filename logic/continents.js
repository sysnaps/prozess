const { megas } = require("./Megas")
const { supers } = require("./supers")

const version = 1

// continent sub-factory — runs AFTER well() has already hydrated base well methods
const continent = function (cdna) {
    cdna.super = continents.super(cdna)
    cdna.mega = continents.mega(cdna)
    return cdna
}

const continents = {}

continents.create = function ({ concept }) {
    let { zells } = require("./zells")
    let cdna = {
        version,
        zell: "well",
        well: "continent",
        concept
    }
    zells.init(cdna)
    return cdna
}

// manufactured closure — find same concept in another globe
continents.super = function (cdna) {
    let sdna = supers.create({ concept: cdna.concept, is: "continent" })
    return function (realmname) {
        return sdna.find(realmname)
    }
}

// manufactured closure — find or create mega for this concept
continents.mega = function (cdna) {
    return function () {
        return megas.get(cdna.concept)
    }
}

module.exports = { continent, continents }
