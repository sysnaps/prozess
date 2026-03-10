const walk = require("./walk")
const hyph = require("./hyph")
const { collection, collections } = require("./collection")
const { buffgits } = require("./buffgits")
const lookups = require("./lookups")
const { zells } = require("./zells")

const wells = {}

const version = 1

wells.types = { irlink: "irlinks", strand: "strands", hive: "bees", command: "commands" }

// hydrate a well object with methods (like collection() does for collections)
const well = function (wdna) {
    wdna.unit = wdna.unit || "well"
    wdna.tofu = wdna.tofu || "fofu"
    zells.init(wdna)

    // hydrate or create links collection
    if (!wdna.links) {
        wdna.links = collections.create(wdna.concept + ".links", "link")
    } else if (!wdna.links.add) {
        wdna.links.refs = true
        collection(wdna.links)
    }
    // hydrate lofu collection if present (mofu endpoints own a lofu cosmos)
    if (wdna.lofu && !wdna.lofu.add) {
        collection(wdna.lofu)
        for (let i = 0; i < wdna.lofu.items.length; i++) {
            if (typeof wdna.lofu.items[i] !== "string") {
                well(wdna.lofu.items[i])
            }
        }
    }
    wdna.walk = walk(wdna)
    wdna.recalculate = wells.recalculate(wdna)
    // wire the midwells collection to notify this well on changes
    wdna.changed = wells.changed(wdna)
    if (wdna.midwells) {
        wdna.midwells.on = {}
        wdna.midwells.on.added = wells.on.added(wdna)
        wdna.midwells.on.removed = wells.on.removed(wdna)
    }

    wdna.check.version(version)

    return wdna
}

wells.first = function (is, concept, minwell, maxwell, midwells, tofu) {
    let obj = {
        is,
        unit: "well",
        concept,
        tofu,
        version,
        minwell: minwell ?? null,
        maxwell: maxwell ?? null,
        midwells: midwells ?? { items: [] }
    }
    return well(obj)
}

wells.recalculate = function (dna) {
    return () => {
        let children = dna.midwells && dna.midwells.items ? dna.midwells.items : []
        if (children.length === 0) return
        wells.distribute(dna.is, dna.minwell + 1, children, dna.maxwell)
    }
}

wells.changed = function (dna) {
    return (item, whadth) => {
        console.log("wells.changed:", dna.concept, "—", whadth, typeof item === "string" ? item : item.concept)
        switch (whadth) {
            case "added":
                dna.recalculate()
                break
            case "removed":
                dna.recalculate()
                break
            case "moved":
                break
        }
    }
}

wells.on = {}

wells.on.added = function (dna) {
    return (item) => {
        dna.changed(item, "added")
    }
}

wells.on.removed = function (dna) {
    return (item) => {
        dna.changed(item, "removed")
    }
}

// distribute unschärfe among sibling wells
// minschärfe: minwell is reserved for the parent (passed as minwell+1 from parent)
// restschärfe: leftover from Math.floor sits at the top of the range
wells.distribute = function (is, minwell, siblings, maxwell) {
    let distributable = maxwell - minwell
    let count = siblings.length
    let share = Math.floor(distributable / count)
    let current = minwell

    siblings.forEach(well => {
        // skip unhatched string references — they keep their share reserved
        if (typeof well === "string") {
            current += share
            return
        }

        // push previous unschärfe to history
        let prev = well.counter ? well.counter.recalculation : []
        well.counter = {
            recalculation: well.unschärfe !== undefined ? [...prev, well.unschärfe] : [...prev]
        }

        well.is = is
        well.minwell = current
        well.maxwell = current + share - 1 // inclusive, no overlap
        well.unschärfe = share
        current = well.maxwell + 1 // next starts after this one

        well.thrigit = { fofu: 0, mofu: 0, lofu: 0 }
        well.thrigit[well.tofu] = well.minwell

        let realmnum = wells.realmnum(well)
        well.buffgit = buffgits.create({
            sphere: "globe",
            realmnum,
            fofu: well.thrigit.fofu,
            mofu: well.thrigit.mofu,
            lofu: well.thrigit.lofu
        })

        // save updated well back to chicken
        if (well.chicken) {
            hyph.save(well.chicken, well)
        }

        // recurse into children (reserve 1 for this well's minschärfe)
        let midwells = well.midwells && well.midwells.items ? well.midwells.items : []
        if (midwells.length > 0) {
            wells.distribute(is, well.minwell + 1, midwells, well.maxwell)
        }
    })
    // restschärfe: positions from current to maxwell are unused spillage
}

// resolve realmnum from the well's globe/sphere property
wells.realmnum = function (welldata) {
    let spherename = welldata.sphere || welldata.globe || "default globe"
    let num = lookups.realmnum(spherename)
    if (num && !num.sig) return num
    return 1
}

module.exports = { well, wells }
