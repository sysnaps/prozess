const IF = require("./IF")
const { egg } = require("./egg")
const lookups = require("./lookups")
const { groups } = require("./groups")
const { viewpoints } = require("./viewpoints")
const { sigs } = require("./sigs")

const irlink = function (link) {

}

const irlinks = {}
irlinks.walk = {}
// walk fofu concepts through the globe well tree
irlinks.walk.globe = function (signal, globename) {
    let globe = egg[globename] || egg["default globe"]
    if (!globe) return null
    let walked = globe.walk(signal)
    console.log("irlink walkglobe:", walked.status, walked.well ? walked.well.concept : "")
    return walked.well
}

// walk mofu concepts through the groups well tree
irlinks.walk.groups = function (signal, globename) {
    let groupswell = egg[globename + " groups"] || egg["default globe groups"]
    if (!groupswell) return null
    let walked = groupswell.walk(signal)
    console.log("irlink walkgroups:", walked.status, walked.well ? walked.well.concept : "")
    return walked.well
}

irlinks.lofu = {}
// handle lofu entity through groups
irlinks.lofu.handle = function (signal, mofuwell) {
    if (!mofuwell) return null
    let lofuwell = groups.lofu.handle(signal, mofuwell)
    console.log("irlink lofu:", lofuwell ? lofuwell.concept : "")
    return lofuwell
}

// check cache or create a new viewpoint for the resolved irlink
irlinks.viewpoint = function (signal, fofuwell, mofuwell, lofuwell) {
    let spherenum = lookups.spherenum(fofuwell.sphere)
    if (spherenum.sig) return spherenum
    let cached = lookups.get(fofuwell.sphere, spherenum, fofuwell.thrigit.fofu, mofuwell.thrigit.mofu, lofuwell.thrigit.lofu)
    if (cached.sig) {
        return viewpoints.create(signal, fofuwell, mofuwell, lofuwell, spherenum)
    }
    return cached
}


irlinks.create = function (signal) {
    let globename = (signal.irpath.globe || "default") + " globe"
    const wells = {}
    wells.fofu = IF(signal.irpath.fofu.length > 0).then(irlinks.walk.globe, signal, globename)
    wells.mofu = IF(signal.irpath.mofu.length > 0).then(irlinks.walk.groups, signal, globename)

    if (signal.irpath.lofu.length > 0) {
        if (!wells.mofu) wells.mofu = egg[globename + " groups"] || egg["default globe groups"]
        wells.lofu = irlinks.lofu.handle(signal, wells.mofu)
    }

    if (wells.fofu && wells.mofu && wells.lofu) {
        return irlinks.viewpoint(signal, wells.fofu, wells.mofu, wells.lofu)
    }

    if (wells.fofu) return sigs.signet(signal.link, signal, null)
    return sigs.null("irlink: no fofu concepts")
}

module.exports = irlinks
