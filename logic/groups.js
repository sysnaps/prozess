const { wells, well } = require("./wells")
const hyph = require("./hyph")
const { collection, collections } = require("./collection")

const groups = {}

const group = function (gdna) {
    gdna.lofu = groups.lofu.create(gdna)

    return gdna
}

// each group endpoint owns a lofu cosmos (0-900000)
groups.lofu = {}

// method factory: returns a closure that handles lofu for this group
groups.lofu.create = function (gdna) {
    return (signal) => {
        if (!gdna.lofu) {
            gdna.lofu = collection({
                unit: "collection",
                collection: gdna.concept, // TODO: change method for collection rename
                maps: "concept",
                items: []
            })
        }
    }
}

groups.lofu.handle = function (signal, mofuwell) {
    if (!mofuwell.lofu) {
        mofuwell.lofu = collection({
            unit: "collection",
            collection: mofuwell.concept + ".lofu",
            maps: "concept",
            items: []
        })
    }

    let concept = signal.irpath.lofu[0]

    // already exists?
    let existing = mofuwell.lofu[concept]
    if (existing && typeof existing !== "string") {
        return existing
    }

    // create lofu well
    let lofuwell = wells.first(signal.is, concept, null, null,
        collections.create(concept + ".midwells", "concept"), "lofu")
    lofuwell.globe = mofuwell.globe || "default"
    lofuwell.well = mofuwell.well || "irlinks"
    lofuwell.sphere = mofuwell.sphere || "default globe"

    mofuwell.lofu.add(lofuwell)

    // distribute lofu cosmos among members
    wells.distribute(signal.is, 1, mofuwell.lofu.items, 900000)

    // save mofu well with updated lofu
    if (mofuwell.chicken) {
        hyph.save(mofuwell.chicken, mofuwell)
    }

    return lofuwell
}

module.exports = { group, groups }