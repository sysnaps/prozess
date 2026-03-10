
const version = 2

const buffgit = function (bdna) {
    bdna.unit = "buffgit"

    if (bdna.version !== version) {
        bdna.version = version
    }

    return bdna
}

const buffgits = {}

buffgits.links = {}

// look up a tofu value from a link's endpoint chick
// position: 0=fofu, 1=mofu, 2=lofu
// checks egg first, falls back to chicken, creates chick if neither exists
buffgits.links.convert = function (link, position) {
    let sig = require("./signal")
    let hyph = require("./hyph")
    let chick = {}
    chick.path = sig.chicken(link)
    if (!chick.path) return 900001
    chick.data = hyph.get(chick.path)
    if (!chick.data || !chick.data.buffgit) return 900001
    return chick.data.buffgit.thrigit[position]
}

buffgits.create = function ({ sphere, realmnum, fofu, mofu, lofu }) {
    let bdna = {
        unit: "buffgit",
        version,
        sphere,
        realmnum: realmnum || 1,
        thrigit: [
            fofu,
            mofu,
            lofu
        ]
    }
    if (typeof fofu === "string") {
        bdna.thrigit[0] = buffgits.links.convert(fofu, 0)
    }
    if (typeof mofu === "string") {
        bdna.thrigit[1] = buffgits.links.convert(mofu, 1)
    }
    if (typeof lofu === "string") {
        bdna.thrigit[2] = buffgits.links.convert(lofu, 2)
    }
    return buffgit(bdna)
}

module.exports = { buffgit, buffgits }
