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

    // egg roots — conop entry points for the route walker
    eggs.roots(egg)

    console.log("egg: loaded", egg.items.length, "wells")
}

// create conop root structures for the route walker
// egg["~"].default = default ring realm (strands)
// egg[":"] = cosmos root (zones' mofu spaces)
// egg["°"] = groups root (irlinks mofu)
// egg["@"] = lofu root (irlinks entities)
// egg.default = default globe realm (irlinks)
eggs.roots = function (e) {
    eggs.roots.strands(e)
    eggs.roots.irlinks(e)
    eggs.roots.cosmos(e)
    eggs.roots.groups(e)
    eggs.roots.lofu(e)
}

eggs.roots.strands = function (e) {
    if (!e["~"]) e["~"] = {}
    let ring = e["default ring"]
    if (!e["~"].default) e["~"].default = {}
    e["~"].default.zell = "realm"
    if (ring) e["~"].default.ring = ring
    let { zells } = require("./zells")
    zells.init(e["~"].default)
}

eggs.roots.irlinks = function (e) {
    let globe = e["default globe"]
    if (!e.default) e.default = {}
    if (globe) e.default.globe = globe
}

eggs.roots.cosmos = function (e) {
    if (!e[":"]) e[":"] = {}
    e[":"].zell = "cosmos"
    let { zells } = require("./zells")
    zells.init(e[":"])
}

eggs.roots.groups = function (e) {
    if (!e["°"]) e["°"] = {}
}

eggs.roots.lofu = function (e) {
    if (!e["@"]) e["@"] = {}
}

module.exports = { eggs, egg }
