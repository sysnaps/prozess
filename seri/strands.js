const { egg } = require("./egg")
const { ring, rings } = require("./rings")
const { pyramids } = require("./pyramids")
const { buffgits } = require("./buffgits")
const { collection } = require("./collection")
const hyph = require("./hyph")

function strand() {

}

const strands = {}

// lazy-hydrate a ring well into a ring object with zones/occupied/slots
strands.hydrate = function (ringwell) {
    if (ringwell.zones) return ringwell
    ring(ringwell)
    ringwell.zones = collection({
        unit: "collection",
        collection: ringwell.concept + ".zones",
        maps: "concept",
        items: []
    })
    ringwell.occupied = {}
    return ringwell
}

// find or create a zone for the given fofu concepts
strands.zone = function (r, signal) {
    let fofu = signal.irpath.fofu
    let z = rings.assign(r, fofu)
    console.log("strand zone:", z.concept, "min:" + z.minschärfe, "pascals:", z.pascals.items.length)
    return z
}

// create or update a single pascal chick file
strands.chick = function (z, concept, filepath, impliedstrand, pyramidkind, assigned, fofu) {
    let existing = hyph.get(filepath)
    if (!existing) {
        let pascal = z.pascals[concept]
        let layer = pascal ? pascal.triangle.layers[pyramidkind] : null
        let point = assigned[concept] !== undefined ? assigned[concept] : null

        let data = {
            unit: "pascal",
            concept,
            strand: impliedstrand,
            zone: z.concept,
            counter: { gets: [], moves: [], usages: [] },
            pyramid: {
                concept: pyramidkind,
                capacity: layer ? layer.capacity : null,
                pascals: fofu.length,
                minschärfe: layer ? layer.minschärfe : null,
                maxschärfe: layer ? layer.maxschärfe : null
            },
            point,
            buffgit: buffgits.create({
                ring: 1,
                sphere: 2,
                fofu: point,
                mofu: 900001,
                lofu: 900001
            })
        }
        hyph.save(filepath, data)
        console.log("strand: created", filepath, "point:" + point)
        return point
    }

    // update old chicks missing pyramid/buffgit/version
    let pascal = z.pascals[concept]
    let layer = pascal ? pascal.triangle.layers[pyramidkind] : null
    let point = assigned[concept] !== undefined ? assigned[concept] : null
    let updated = false

    if (!existing.point && point) {
        existing.point = point
        updated = true
    }
    if (!existing.pyramid && layer) {
        existing.pyramid = {
            concept: pyramidkind,
            capacity: layer.capacity,
            pascals: fofu.length,
            minschärfe: layer.minschärfe,
            maxschärfe: layer.maxschärfe
        }
        updated = true
    }
    if (!existing.buffgit) {
        existing.buffgit = buffgits.create({
            ring: 1,
            sphere: 2,
            fofu: existing.point || point,
            mofu: 900001,
            lofu: 900001
        })
        updated = true
    }
    if (!existing.version) {
        existing.version = 1
        updated = true
    }
    if (updated) {
        hyph.save(filepath, existing)
        console.log("strand: updated", filepath)
    }
    return existing.point || point
}

// create a nype file at the endpoint
strands.nype = function (z, signal, fofu, chickenpath, pyramidkind, endpointpoint) {
    let value = signal.irpath.lofu[0]
    console.log("strand: nype", value, "at endpoint", fofu[fofu.length - 1])

    let endpointfolder = chickenpath.slice(0, -1)
    hyph.mkdir(endpointfolder)
    let nypefolder = endpointfolder + "/nype"
    hyph.mkdir(nypefolder)

    let nypefile = nypefolder + "/." + value
    let endpoint = fofu[fofu.length - 1]
    let endpascal = z.pascals[endpoint]
    let endlayer = endpascal ? endpascal.triangle.layers[pyramidkind] : null

    hyph.save(nypefile, {
        unit: "nype",
        concept: value,
        strand: signal.link,
        zone: z.concept,
        pyramid: {
            concept: pyramidkind,
            capacity: endlayer ? endlayer.capacity : null,
            pascals: fofu.length,
            minschärfe: endlayer ? endlayer.minschärfe : null,
            maxschärfe: endlayer ? endlayer.maxschärfe : null
        },
        buffgit: buffgits.create({
            ring: 1,
            sphere: 2,
            fofu: endpointpoint,
            mofu: 900001,
            lofu: parseInt(value) || 900001
        })
    })
    console.log("strand: created nype", nypefile)
}

strands.create = function (signal) {
    let ringwell = egg["default ring"]
    if (!ringwell) {
        console.log("strand: no default ring")
        return
    }

    let r = strands.hydrate(ringwell)
    let fofu = signal.irpath.fofu
    let mofu = signal.irpath.mofu
    let lofu = signal.irpath.lofu

    if (fofu.length === 0) {
        console.log("strand: no fofu concepts, skipping")
        return
    }

    let z = strands.zone(r, signal)

    let pyramidkind = pyramids.which(fofu.length)
    console.log("strand pyramid:", pyramidkind, "(" + fofu.length + " pascals)")

    let assigned = z.record(signal.link, fofu)
    console.log("strand: recorded", signal.link, "in zone", z.concept)

    // walk fofu chain and create/update pascal chick files
    let chickenpath = "~"
    let impliedstrand = "~"
    let endpointpoint = null

    for (let i = 0; i < fofu.length; i++) {
        let concept = fofu[i]
        impliedstrand += (i > 0 ? "." : "") + concept
        let filepath = chickenpath + "." + concept
        let folderpath = chickenpath + concept

        endpointpoint = strands.chick(z, concept, filepath, impliedstrand, pyramidkind, assigned, fofu)

        if (i < fofu.length - 1) {
            hyph.mkdir(folderpath)
        }
        chickenpath = chickenpath + concept + "/"
    }

    // handle cap (mofu)
    if (mofu.length > 0) {
        let capname = mofu.join(".")
        z.cap(capname)
        console.log("strand: cap", capname, "added to cosmos of", z.concept)
    }

    // handle nype (lofu)
    if (lofu.length > 0 && lofu[0] !== "900001") {
        strands.nype(z, signal, fofu, chickenpath, pyramidkind, endpointpoint)
    }
}

module.exports = strands
