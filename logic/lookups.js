const { egg } = require("./egg")
const { sigs } = require("./sigs")

const lookups = {}

lookups.init = function () {
    if (egg.globes) {
        for (let item of egg.globes.items) {
            lookups[item.globe] = {}
        }
    }
    if (egg.rings) {
        for (let item of egg.rings.items) {
            lookups[item.ring] = {}
        }
    }
}

// find the realmnum for any sphere name (checks globes and rings)
lookups.realmnum = function (spherename) {
    if (egg.globes) {
        let found = egg.globes.items.find(function (item) { return item.globe === spherename })
        if (found) return found.globenum
    }
    if (egg.rings) {
        let found = egg.rings.items.find(function (item) { return item.ring === spherename })
        if (found) return found.ringnum
    }
    return sigs.null("realmnum not found for " + spherename)
}

// cache any dna with a buffgit into the nested lookup
// returns a function bound to the dna (factory pattern for zell init)
lookups.cache = function (dna) {
    return (spherename, realmnum) => {
        let spheres = lookups[spherename]
        if (!spheres) {
            lookups[spherename] = {}
            spheres = lookups[spherename]
        }
        if (!spheres[realmnum]) spheres[realmnum] = {}
        let byrealm = spheres[realmnum]
        let thrigit = dna.buffgit.thrigit
        if (!byrealm[thrigit[0]]) byrealm[thrigit[0]] = {}
        let byfofu = byrealm[thrigit[0]]
        if (!byfofu[thrigit[1]]) byfofu[thrigit[1]] = {}
        byfofu[thrigit[1]][thrigit[2]] = dna
    }
}

// get a cached dna by sphere coordinates
lookups.get = function (spherename, realmnum, fofu, mofu, lofu) {
    let spheres = lookups[spherename]
    if (!spheres) return sigs.null("sphere not found: " + spherename)
    let byrealm = spheres[realmnum]
    if (!byrealm) return sigs.null("realmnum not found: " + realmnum)
    let byfofu = byrealm[fofu]
    if (!byfofu) return sigs.null("fofu not found: " + fofu)
    let bymofu = byfofu[mofu]
    if (!bymofu) return sigs.null("mofu not found: " + mofu)
    return bymofu[lofu] || sigs.null("lofu not found: " + lofu)
}

module.exports = lookups
