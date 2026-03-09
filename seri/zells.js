const hyph = require("./hyph")

function zell(dna) {

}


const zells = {}

zells.create = function (concept) {
    const zell = {
        "zell": concept
    }
}

// initialize a zell with standard methods
zells.init = function (dna) {
    dna.check = {}
    dna.check.version = zells.check.version(dna)
    dna.stamp = zells.stamp(dna)
}

zells.check = {}

zells.check.version = function (dna) {
    return (version) => {
        if (dna.version !== version) {
            dna.version = version
            if (dna.chicken) {
                hyph.save(dna.chicken, dna)
            }
        }
    }
}

// stamp a chicken path on dna (non-enumerable so JSON.stringify skips it)
zells.stamp = function (dna) {
    return function (chickenpath) {
        Object.defineProperty(dna, "chicken", { value: chickenpath, writable: true, configurable: true })
    }
}

module.exports = zells