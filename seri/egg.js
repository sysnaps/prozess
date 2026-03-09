const hyph = require("./hyph")
const { collection } = require("./collection")

const egg = {}
const eggs = {}

eggs.midwells = {}
// hydrate a well's midwells collection — collection() walks and loads each child
// then hydrate each loaded child as a well and set as property on parent
eggs.midwells.hydrate = function (welldata, wellfn) {
    if (!welldata.midwells) return
    if (welldata.midwells.unit !== "collection") return
    welldata.midwells.refs = true
    collection(welldata.midwells)
    welldata.midwells.each((midwelldata) => {
        if (typeof midwelldata === "string") return
        eggs.midwells.hydrate(midwelldata, wellfn)
        wellfn(midwelldata)
        welldata[midwelldata.concept] = midwelldata
    })
}

eggs.init = function () {
    const { well } = require("./wells")

    let eggdna = hyph.get(".egg")
    if (!eggdna) {
        console.log("egg: no .egg found")
        return
    }

    // egg becomes the collection (mutate in place to keep reference)
    Object.assign(egg, eggdna)

    // load spheres BEFORE collection() so walk nests into real objects
    egg.globes = hyph.get(".globes")
    egg.rings = hyph.get(".rings")

    // collection() walks every string item — loads actual chicks from chicken,
    // nests at irlink path (egg.globes.default), replaces strings with objects
    collection(egg)

    // hydrate each loaded well and its midwells
    egg.each((welldata) => {
        if (typeof welldata === "string") return
        eggs.midwells.hydrate(welldata, well)
        well(welldata)
    })

    const lookups = require("./lookups")
    lookups.init()

    console.log("egg: loaded", egg.items.length, "wells")
}

module.exports = { eggs, egg }
