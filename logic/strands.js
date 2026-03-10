const { zoneunscharfe } = require("./zones")
const { buffgits } = require("./buffgits")
const lookups = require("./lookups")
const hyph = require("./hyph")

const strands = {}

// resolve realmnum for a ring realm
strands.realmnum = function (realm) {
    let num = lookups.realmnum(realm + " ring")
    if (num && !num.sig) return num
    return 1
}

// create a nype file at the endpoint
// nypevalue: passed directly from route.finish or extracted from signal.irpath.lofu
strands.nype = function (z, signal, fofu, chickenpath, pyramidkind, endpointpoint, turbo, realmnum, nypevalue) {
    let value = nypevalue || (signal.irpath.lofu ? signal.irpath.lofu[0] : null)
    if (!value) return
    console.log("strand: nype", value, "at endpoint", fofu[fofu.length - 1])

    let endpointfolder = chickenpath.slice(0, -1)
    hyph.mkdir(endpointfolder)
    let nypefolder = endpointfolder + "/nype"
    hyph.mkdir(nypefolder)

    let nypefile = nypefolder + "/." + realmnum + "." + value
    let endlayer = turbo ? turbo.triangle.layers[pyramidkind] : null

    hyph.save(nypefile, {
        unit: "nype",
        concept: value,
        strand: signal.link,
        realm: "default",
        zone: z.concept,
        pyramid: {
            concept: pyramidkind,
            capacity: endlayer ? endlayer.capacity : null,
            pascals: fofu.length,
            minschärfe: endlayer ? endlayer.minschärfe : null,
            maxschärfe: endlayer ? endlayer.maxschärfe : null
        },
        buffgit: buffgits.create({
            sphere: "ring",
            realmnum,
            fofu: endpointpoint,
            mofu: 900001,
            lofu: parseInt(value) || 900001
        })
    })
    console.log("strand: created nype", nypefile)
}

// strands.create removed — strand logic now lives in streets.strand + route.js

strands.save = {}
// save zone summary to zones/{ring}/.{zoneconcept}
strands.save.zone = function (ringwell, z) {
    let ringname = ringwell.ring || "default"
    let folderpath = "zones/" + ringname
    hyph.mkdir(folderpath)
    hyph.save(folderpath + "/." + z.concept, {
        unit: "zone",
        concept: z.concept,
        realm: ringname,
        minschärfe: z.minschärfe,
        maxschärfe: z.maxschärfe,
        height: z.pascals.items.length,
        pascals: z.pascals.items.map(function (p) {
            return typeof p === "string" ? p : p.concept
        }),
        links: z.links ? z.links.toJSON() : { items: [] },
        cosmos: z.cosmos ? z.cosmos.toJSON() : { items: [] }
    })

    // update .zones registry at egg level
    let registry = hyph.get(".zones") || {
        unit: "collection",
        collection: "zones",
        maps: "concept",
        items: []
    }
    let exists = registry.items.find(function (item) {
        return item.concept === z.concept && item.ring === ringname
    })
    if (!exists) {
        registry.items.push({
            concept: z.concept,
            ring: ringname,
            slot: Math.floor(z.minschärfe / zoneunscharfe)
        })
        hyph.save(".zones", registry)
    }
}

// save cosmos member to zones/{ring}/{zoneconcept}/{realmnum}.{cap}
strands.save.cosmos = function (ringwell, z, capname, realmnum) {
    let ringname = ringwell.ring || "default"
    let folderpath = "zones/" + ringname + "/" + z.concept
    hyph.mkdir(folderpath)
    let capobj = z.cosmos[capname]
    if (capobj && typeof capobj !== "string") {
        hyph.save(folderpath + "/" + realmnum + "." + capobj.cap, capobj)
    }
}

module.exports = strands
