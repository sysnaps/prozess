const { ring, rings } = require("./rings")
const { pyramids } = require("./pyramids")
const { buffgits } = require("./buffgits")
const { collection } = require("./collection")
const { zells } = require("./zells")
const { gaps } = require("./gaps")
const lookups = require("./lookups")
const hyph = require("./hyph")

const streets = {}

// --- strand street ---
// dispatched from zells.get when dna.zell is "realm" or "pascal"
streets.strand = {}

// .get — first concept is turbo, subsequent are pascal spores
streets.strand.get = function (dna, concept, signal) {
    streets.strand.hydrate(dna, signal)

    let is = {}
    is.turbo = !signal.zone

    if (is.turbo) return streets.strand.turbo(dna, concept, signal)
    return streets.strand.spore(dna, concept, signal)
}

// .exe — fallback, delegates to get
streets.strand.exe = function (dna, concept, signal) {
    return streets.strand.get(dna, concept, signal)
}

// lazy-hydrate the ring on first access
streets.strand.hydrate = function (dna, signal) {
    if (signal.ring) return
    let ringwell = dna.ring
    if (!ringwell) return
    if (!ringwell.zones) {
        ring(ringwell)
        ringwell.zones = collection({
            unit: "collection",
            collection: (ringwell.concept || "default") + ".zones",
            maps: "concept",
            items: []
        })
        ringwell.occupied = {}
        gaps.populate(ringwell)
    }
    signal.ring = ringwell
    signal.realmnum = streets.strand.realmnum(signal)
}

streets.strand.realmnum = function (signal) {
    let realm = signal.realm || "default"
    let num = lookups.realmnum(realm + " ring")
    if (num && !num.sig) return num
    return 1
}

// first concept = turbo → zone finding, gap swapping, pascal creation
streets.strand.turbo = function (dna, concept, signal) {
    let fofu = streets.strand.fofu(signal, concept)
    let z = rings.assign(signal.ring, fofu)
    signal.zone = z

    let assigned = z.record(signal.link, fofu)
    z.rename()
    signal.assigned = assigned

    let turbo = z.pascals[concept]
    signal.turbo = turbo
    signal.chickenpath = "~"
    signal.impliedstrand = "~"
    signal.depth = 0

    console.log("street turbo:", concept, "zone:", z.concept, "min:" + z.minschärfe)

    return streets.strand.chick(dna, concept, signal)
}

// collect all fofu concepts: current concept + remaining until next conop
streets.strand.fofu = function (signal, concept) {
    let conops = require("./conops")
    let fofu = [concept]
    for (let i = 0; i < signal.irpath.length; i++) {
        if (conops.includes(signal.irpath[i])) break
        fofu.push(signal.irpath[i])
    }
    return fofu
}

// subsequent concept → pascal spore creation at current depth
streets.strand.spore = function (dna, concept, signal) {
    signal.depth++
    return streets.strand.chick(dna, concept, signal)
}

// create or update a pascal chick file
streets.strand.chick = function (host, concept, signal) {
    let z = signal.zone
    let turbo = signal.turbo
    let realmnum = signal.realmnum || 1
    let depth = signal.depth || 0
    let pyramid = {}
    pyramid.kind = pyramids.which(depth + 1)
    let assigned = signal.assigned || {}
    let point = assigned[concept] !== undefined ? assigned[concept] : null

    signal.impliedstrand += (depth > 0 ? "." : "") + concept
    let filepath = signal.chickenpath + "." + realmnum + "." + concept
    let folderpath = signal.chickenpath + concept

    let spore = streets.strand.chick.find(host, concept, filepath, signal)

    if (!spore) {
        spore = streets.strand.chick.create(concept, filepath, signal, pyramid.kind, point, turbo, realmnum, z)
    } else {
        streets.strand.chick.update(spore, filepath, pyramid.kind, point, turbo, realmnum, z)
    }

    // nest spore on host, mark as pascal, init as zell
    spore.zell = "pascal"
    host[concept] = spore
    zells.init(spore)
    zells.stamp(spore)(filepath)

    // push point to payload
    if (spore.point !== null && spore.point !== undefined) {
        signal.payload.push(spore.point)
    }

    // prepare chickenpath for next depth
    hyph.mkdir(folderpath)
    signal.chickenpath = folderpath + "/"

    return spore
}

// try to find existing chick in egg or chicken
streets.strand.chick.find = function (host, concept, filepath, signal) {
    if (host[concept] && typeof host[concept] !== "string") return host[concept]
    let loaded = hyph.get(filepath)
    if (loaded) return loaded
    return null
}

// create a fresh pascal chick
streets.strand.chick.create = function (concept, filepath, signal, kind, point, turbo, realmnum, z) {
    let layer = turbo && turbo.triangle ? turbo.triangle.layers[kind] : null
    let data = {
        zell: "pascal",
        unit: "pascal",
        concept,
        strand: signal.impliedstrand,
        realm: signal.realm || "default",
        zone: z.concept,
        pyramid: {
            concept: kind,
            capacity: layer ? layer.capacity : null,
            minschärfe: layer ? layer.minschärfe : null,
            maxschärfe: layer ? layer.maxschärfe : null
        },
        point,
        buffgit: buffgits.create({
            sphere: "ring",
            realmnum,
            fofu: point,
            mofu: 900001,
            lofu: 900001
        })
    }
    hyph.save(filepath, data)
    console.log("street chick: created", filepath, "point:" + point)
    return data
}

// update existing chick if missing pyramid/buffgit
streets.strand.chick.update = function (existing, filepath, kind, point, turbo, realmnum, z) {
    let layer = turbo && turbo.triangle ? turbo.triangle.layers[kind] : null
    let updated = false

    if (!existing.zell) {
        existing.zell = "pascal"
        updated = true
    }
    if (!existing.point && point) {
        existing.point = point
        updated = true
    }
    if (!existing.pyramid && layer) {
        existing.pyramid = {
            concept: kind,
            capacity: layer.capacity,
            minschärfe: layer.minschärfe,
            maxschärfe: layer.maxschärfe
        }
        updated = true
    }
    if (!existing.buffgit) {
        existing.buffgit = buffgits.create({
            sphere: "ring",
            realmnum,
            fofu: existing.point || point,
            mofu: 900001,
            lofu: 900001
        })
        updated = true
    }
    if (updated) {
        hyph.save(filepath, existing)
        console.log("street chick: updated", filepath)
    }
}

// --- cosmos street ---
// dispatched from zells.get/exe when dna.zell is "cosmos"
streets.cosmos = {}

// .get navigates into the zone's cosmos namespace
streets.cosmos.get = function (dna, capname, signal) {
    return streets.cosmos.cap(dna, capname, signal)
}

// .exe creates/finds the cap in the zone's cosmos
streets.cosmos.exe = function (dna, capname, signal) {
    return streets.cosmos.cap(dna, capname, signal)
}

streets.cosmos.cap = function (dna, capname, signal) {
    let z = signal.zone
    if (!z) {
        console.log("street cosmos: no zone on signal")
        return dna
    }

    let capobj = z.cap(capname, signal.link)
    signal.capname = capname

    // nest in dna[zonename][realm][capname]
    let zonename = z.concept
    if (!dna[zonename]) dna[zonename] = {}
    let realm = signal.realm || "default"
    if (!dna[zonename][realm]) dna[zonename][realm] = {}
    dna[zonename][realm][capname] = capobj

    // push mofu (minwell) to payload
    if (capobj && capobj.minwell !== undefined) {
        signal.payload.push(capobj.minwell)
    }

    console.log("street cosmos:", capname, "in zone", z.concept, "minwell:", capobj ? capobj.minwell : null)
    return capobj
}

module.exports = { streets }
