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

// concept param: explicit concept name, or falls back to signal.irpath.lofu[0]
groups.lofu.handle = function (signal, mofuwell, concept) {
    if (!mofuwell.lofu) {
        mofuwell.lofu = collection({
            unit: "collection",
            collection: (mofuwell.concept || "mofu") + ".lofu",
            maps: "concept",
            items: []
        })
    }

    let name = concept || (signal.irpath && signal.irpath.lofu ? signal.irpath.lofu[0] : null)
    if (!name) return null

    // already exists?
    let existing = mofuwell.lofu[name]
    if (existing && typeof existing !== "string") {
        return existing
    }

    // create lofu well
    let lofuwell = wells.create({
        is: signal.is || "irlink",
        concept: name,
        tofu: "lofu",
        sphere: mofuwell.sphere || "default globe",
        globe: mofuwell.globe || "default"
    })
    lofuwell.well = "lofu"

    mofuwell.lofu.add(lofuwell)

    // distribute lofu cosmos among members
    wells.distribute(signal.is || "irlink", 1, mofuwell.lofu.items, 900000)

    // save mofu well with updated lofu
    if (mofuwell.chicken) {
        hyph.save(mofuwell.chicken, mofuwell)
    }

    return lofuwell
}

module.exports = { group, groups }