const version = 1

const mega = function (mdna) {
    mdna.zell = mdna.zell || "mega"
    mdna.find = megas.find(mdna)
    return mdna
}

const megas = {}

// manufactured closure: search egg for the concept across both spheres
megas.find = function (mdna) {
    return function () {
        let { egg } = require("./egg")
        let found = {}
        // strand sphere — zone namespace
        if (egg["~"] && egg["~"][mdna.concept]) {
            found.zone = egg["~"][mdna.concept]
        }
        // irlink sphere — ☷ namespace
        if (egg["☷"] && egg["☷"][mdna.concept]) {
            found.continent = egg["☷"][mdna.concept]
        }
        return found
    }
}

// build dna, init, return
megas.create = function ({ concept }) {
    let { zells } = require("./zells")
    let mdna = {
        version,
        zell: "mega",
        concept
    }
    zells.init(mdna)
    return mdna
}

// static: check egg for existing mega, create if not found
megas.get = function (concept) {
    let { egg } = require("./egg")
    if (!egg.megas) egg.megas = {}
    if (egg.megas[concept]) return egg.megas[concept]
    let mdna = megas.create({ concept })
    egg.megas[concept] = mdna
    return mdna
}

module.exports = { mega, megas }
