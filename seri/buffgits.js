
const version = 1

const buffgit = function (bdna) {
    bdna.unit = "buffgit"

    // version check
    if (bdna.version !== version) {
        bdna.version = version
    }

    return bdna
}

const buffgits = {}

buffgits.create = function ({ ring, sphere, fofu, mofu, lofu }) {
    return buffgit({
        "unit": "buffgit",
        version,
        ring,
        sphere,
        thrigit: [
            fofu,
            mofu,
            lofu
        ]
    })
}

module.exports = { buffgit, buffgits }
