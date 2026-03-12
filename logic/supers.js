
const { collection } = require("./collection")

const version = 1
const SuPeR = function (sdna) {
    sdna.zell = sdna.zell || "super"
    sdna.find = supers.find(sdna)
    sdna.bridge = supers.bridge(sdna)
    return sdna
}

const supers = {}

// find a zone with the same concept in a different realm's ring
supers.find = function (sdna) {
    return function (realmname) {
        let { zones } = require("./zones")
        let { egg } = require("./egg")
        let root = egg["~"]
        if (!root) return null
        let zonenamespace = root[sdna.concept]
        if (!zonenamespace) return null
        let realmobj = zonenamespace[realmname]
        if (!realmobj) return null
        return realmobj
    }
}

// link two zones across realms — store reference in bridges
supers.bridge = function (sdna) {
    return function (realmname) {
        let found = sdna.find(realmname)
        if (!found) return null
        sdna.bridges.add(realmname)
        return found
    }
}

supers.create = function ({ concept, is }) {
    let { zells } = require("./zells")
    let sdna = {
        version,
        zell: "super",
        super: is,
        concept,
        bridges: collection({
            unit: "collection",
            collection: concept + ".bridges",
            maps: "concept",
            refs: true,
            items: []
        })
    }
    zells.init(sdna)
    return sdna
}

module.exports = { SuPeR, supers }
