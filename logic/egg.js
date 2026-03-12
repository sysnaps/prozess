const { hyph, chicken } = require("./hyph")
const { collection } = require("./collection")

let egg = {}
const eggs = {}

eggs.hydrate = function (zells) {
    return function (wdna) {
        wdna.zell = wdna.zell || "well"
        wdna.well = wdna.well || wdna.tofu || "fofu"
        zells.init(wdna)
    }
}

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

eggs.eggistry = function () {

}

eggs.init = function () {
    const { zells } = require("./zells")
    let eggdna = hyph.get("%.egg")
    egg = collection(eggdna)
    console.log('eggdna - ', eggdna)
    return
    // egg becomes the collection (mutate in place to keep reference)
    Object.assign(egg, eggdna)

    // load spheres BEFORE collection() so walk nests into real objects
    egg.globes = hyph.get(".globes")
    egg.rings = hyph.get(".rings")

    // collection() walks every string item — loads actual chicks from chicken,
    // nests at irlink path (egg.globes.default), replaces strings with objects
    collection(egg)

    // hydrate each loaded well and its midwells
    let hydrate = eggs.hydrate(zells)
    egg.each((welldata) => {
        if (typeof welldata === "string") return
        eggs.midwells.hydrate(welldata, hydrate)
        hydrate(welldata)
    })

    const lookups = require("./lookups")
    lookups.init()

    // egg roots — conop entry points for the route walker
    eggs.roots(egg)

    console.log("egg: loaded", egg.items.length, "wells")
}

// create conop root structures for the route walker
// egg["~"] = strands root (ring reference)
// egg["☷"] = irlinks root (globe reference)
// egg["°"] = groups root (irlinks mofu)
// cosmos lives on each zone's realm: egg["~"][zone][realm][":"]
eggs.roots = function (e) {
    eggs.roots.strands(e)
    eggs.roots.irlinks(e)
    eggs.roots.groups(e)
    if (!e.megas) e.megas = {}
}

eggs.roots.strands = function (e) {
    if (!e["~"]) e["~"] = {}
    let ring = e["default ring"]
    // bootstrap: create a default ring if none loaded from chicken
    if (!ring) {
        let { rings } = require("./rings")
        ring = rings.create({ concept: "default ring" })
        e["default ring"] = ring
    }
    e["~"].ring = ring
}

eggs.roots.irlinks = function (e) {
    let globe = e["default globe"]
    // bootstrap: create a default globe if none loaded from chicken
    if (!globe) {
        globe = { concept: "default globe", globenum: 1 }
        e["default globe"] = globe
    }
    // globe is a well — owns 900000 unschärfe, distributes among continents
    eggs.roots.irlinks.globe(globe)
    if (!e["☷"]) e["☷"] = {}
    e["☷"].globe = globe
}

eggs.roots.irlinks.globe = function (globe) {
    if (globe._zinit) return
    globe.zell = globe.zell || "well"
    globe.well = globe.well || "fofu"
    globe.tofu = globe.tofu || "fofu"
    globe.is = globe.is || "irlink"
    globe.minwell = globe.minwell ?? 0
    globe.maxwell = globe.maxwell ?? 900000
    globe.unschärfe = globe.unschärfe ?? 900000
    if (!globe.midwells) globe.midwells = { items: [] }
    let { zells } = require("./zells")
    zells.init(globe)
}

eggs.roots.groups = function (e) {
    if (!e["°"]) e["°"] = {}
}

module.exports = { eggs, egg }
