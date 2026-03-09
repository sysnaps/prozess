const path = require("path")
const hyph = require("./hyph")
const lookups = require("./lookups")
const zells = require("./zells")
const { buffgits } = require("./buffgits")

const version = 1

const viewpoints = {}

function viewpoint(vdna) {
    zells.init(vdna)

    vdna.cache = lookups.cache(vdna)

    vdna.check.version(version)

    return vdna
}

// build the chicken filepath for a viewpoint
viewpoints.path = function (signal) {
    let fofupath = signal.irpath.fofu.join(path.sep)
    let mofu = signal.irpath.mofu.join(".")
    let lofu = signal.irpath.lofu[0] || ""
    let group = mofu ? "°" + mofu : ""
    return path.join(fofupath, group + "." + lofu)
}

viewpoints.create = function (signal, fofuwell, mofuwell, lofuwell, spherenum) {
    let vdna = viewpoint({
        zell: "viewpoint",
        link: signal.link,
        entity: signal.irpath.lofu[0],
        group: "°" + signal.irpath.mofu.join("."),
        buffer: "!buffers.create()",
        buffgit: buffgits.create({
            ring: spherenum,
            sphere: 1,
            fofu: fofuwell.thrigit.fofu,
            mofu: mofuwell.thrigit.mofu,
            lofu: lofuwell.thrigit.lofu
        })
    })

    let filepath = viewpoints.path(signal)
    hyph.save(filepath, vdna)

    vdna.cache(fofuwell.sphere, spherenum)

    console.log("viewpoint:", signal.link, "->", vdna.buffgit.thrigit, "sphere:", fofuwell.sphere, "num:", spherenum)
    return vdna
}

module.exports = { viewpoint, viewpoints }
