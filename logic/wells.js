const walk = require("./walk")
const hyph = require("./hyph")
const { collection, collections } = require("./collection")
const { buffgits } = require("./buffgits")
const lookups = require("./lookups")
const { zells } = require("./zells")

const wells = {}

const version = 3

wells.types = { irlink: "irlinks", strand: "strands", hive: "bees", command: "commands" }

// hydrate a well object with methods (like collection() does for collections)
const well = function (wdna) {
    wdna.zell = wdna.zell || "well"
    wdna.well = wdna.well || wdna.tofu || "fofu"
    wdna.tofu = wdna.tofu || "fofu"

    // hydrate or create links collection
    if (!wdna.links) {
        wdna.links = collections.create(wdna.concept + ".links", "link")
    } else if (!wdna.links.add) {
        wdna.links.refs = true
        collection(wdna.links)
    }
    // hydrate lofu collection if present (mofu endpoints own a lofu cosmos)
    if (wdna.lofu && !wdna.lofu.add) {
        collection(wdna.lofu)
        for (let i = 0; i < wdna.lofu.items.length; i++) {
            if (typeof wdna.lofu.items[i] !== "string") {
                let item = wdna.lofu.items[i]
                item.zell = item.zell || "well"
                item.well = item.well || item.tofu || "lofu"
                zells.init(item)
            }
        }
    }
    wdna.walk = walk(wdna)
    wdna.work = wells.work(wdna)
    wdna.recalculate = wells.recalculate(wdna)
    // hydrate midwells as a collection if not already
    if (wdna.midwells && !wdna.midwells.add) {
        wdna.midwells.unit = wdna.midwells.unit || "collection"
        wdna.midwells.collection = wdna.midwells.collection || (wdna.concept || "well") + ".midwells"
        wdna.midwells.maps = wdna.midwells.maps || "concept"
        wdna.midwells.refs = true
        collection(wdna.midwells)
    }
    // wire the midwells collection to notify this well on changes
    wdna.changed = wells.changed(wdna)
    if (wdna.midwells) {
        wdna.midwells.on = {}
        wdna.midwells.on.added = wells.on.added(wdna)
        wdna.midwells.on.removed = wells.on.removed(wdna)
    }

    if (wdna.check) wdna.check.version(version)

    return wdna
}

wells.create = function ({ is, buffgit, qugit, concept, minwell, maxwell }) {
    let obj = {
        zell: "well",
        well: is,
        concept: concept.preferred,
        version,
        minwell,
        maxwell,
        midwells: [],
        grammatik: concept,
        buffgit,
        qugit
    }
    zells.init(obj)
    return obj
}

wells.recalculate = function (dna) {
    return () => {
        let children = dna.midwells && dna.midwells.items ? dna.midwells.items : []
        if (children.length === 0) return
        wells.distribute(dna.is, dna.minwell + 1, children, dna.maxwell)
    }
}

wells.changed = function (dna) {
    return (item, whadth) => {
        console.log("wells.changed:", dna.concept, "—", whadth, typeof item === "string" ? item : item.concept)
        switch (whadth) {
            case "added":
                dna.recalculate()
                break
            case "removed":
                dna.recalculate()
                break
            case "moved":
                break
        }
    }
}

wells.on = {}

wells.on.added = function (dna) {
    return (item) => {
        dna.changed(item, "added")
    }
}

wells.on.removed = function (dna) {
    return (item) => {
        dna.changed(item, "removed")
    }
}

// distribute unschärfe among sibling wells
// minschärfe: minwell is reserved for the parent (passed as minwell+1 from parent)
// restschärfe: leftover from Math.floor sits at the top of the range
wells.distribute = function (is, minwell, siblings, maxwell) {
    let distributable = maxwell - minwell
    let count = siblings.length
    let share = Math.floor(distributable / count)
    let current = minwell

    siblings.forEach(well => {
        // skip unhatched string references — they keep their share reserved
        if (typeof well === "string") {
            current += share
            return
        }

        // push previous unschärfe to history
        let prev = (well.counter && well.counter.recalculation) ? well.counter.recalculation : []
        if (!well.counter) well.counter = {}
        well.counter.recalculation = well.unschärfe !== undefined ? [...prev, well.unschärfe] : [...prev]

        well.is = is
        well.minwell = current
        well.maxwell = current + share - 1 // inclusive, no overlap
        well.unschärfe = share
        current = well.maxwell + 1 // next starts after this one

        well.thrigit = { fofu: 0, mofu: 0, lofu: 0 }
        well.thrigit[well.tofu] = well.minwell

        let realmnum = wells.realmnum(well)
        well.buffgit = buffgits.create({
            sphere: "globe",
            realmnum,
            fofu: well.thrigit.fofu,
            mofu: well.thrigit.mofu,
            lofu: well.thrigit.lofu
        })

        // save updated well back to chicken
        if (well.chicken) {
            hyph.save(well.chicken, well)
        }

        // recurse into children (reserve 1 for this well's minschärfe)
        let midwells = well.midwells && well.midwells.items ? well.midwells.items : []
        if (midwells.length > 0) {
            wells.distribute(is, well.minwell + 1, midwells, well.maxwell)
        }
    })
    // restschärfe: positions from current to maxwell are unused spillage
}

// resolve realmnum from the well's globe/sphere property
wells.realmnum = function (welldata) {
    let spherename = welldata.sphere || welldata.globe || "default globe"
    let num = lookups.realmnum(spherename)
    if (num && !num.sig) return num
    return 1
}

// --- wells.work: route-walking behavior for irlink wells ---
// route walker calls well.get(concept, signal) → hub → dna.work(concept, signal)
wells.work = function (dna) {
    return function (concept, signal) {
        wells.work.hydrate(dna, signal)
        let spore = wells.work.find(dna, concept)
        if (!spore) spore = wells.work.create(dna, concept, signal)
        wells.work.stamp(spore, concept, signal)
        wells.work.record(spore, signal)
        wells.work.payload(spore, signal)
        return spore
    }
}

// lazy-hydrate: ensure midwells collection, init realmnum and chickenpath on signal
wells.work.hydrate = function (dna, signal) {
    if (!dna.midwells) {
        dna.midwells = collection({
            unit: "collection",
            collection: (dna.concept || "root") + ".midwells",
            maps: "concept",
            items: []
        })
    }
    if (!dna.midwells.add) {
        dna.midwells.refs = true
        collection(dna.midwells)
    }
    // init chicken path tracking — stamp continent on first fofu access only
    // null = explicitly cleared at ° or @, undefined = never set
    if (signal.chickenpath === undefined) {
        let realmnum = wells.work.realmnum(dna, signal)
        signal.realmnum = realmnum
        wells.work.continent(dna, signal)
    }
}



// resolve realmnum for this well's sphere
wells.work.realmnum = function (dna, signal) {
    let spherename = dna.sphere || dna.globe || "default globe"
    if (typeof spherename === "object") spherename = spherename.concept || "default globe"
    let num = lookups.realmnum(spherename)
    if (num && !num.sig) return num
    return 1
}

// find existing child well — check dna, midwells, then try loading from chicken
wells.work.find = function (dna, concept) {
    if (dna[concept] && typeof dna[concept] !== "string") return dna[concept]
    if (dna.midwells && dna.midwells[concept] && typeof dna.midwells[concept] !== "string") {
        Object.defineProperty(dna, concept, { value: dna.midwells[concept], writable: true, configurable: true })
        return dna[concept]
    }
    return null
}

// create a new child well and add to midwells
wells.work.create = function (dna, concept, signal) {
    let tofu = dna.tofu || "fofu"
    let spherename = wells.work.create.spherename(dna)
    let spore = wells.create({
        is: signal.is || "irlink",
        concept,
        tofu,
        sphere: spherename,
        globe: spherename
    })
    dna.midwells.add(spore)
    Object.defineProperty(dna, concept, { value: spore, writable: true, configurable: true })
    wells.work.distribute(dna, signal)
    wells.work.create.save(dna)
    return spore
}

// re-save parent after adding a child so midwells persists
wells.work.create.save = function (dna) {
    if (dna.chicken) {
        hyph.save(dna.chicken, dna)
    }
}

// resolve sphere name as a string (not an object reference)
wells.work.create.spherename = function (dna) {
    let sphere = dna.sphere || dna.globe || "default globe"
    if (typeof sphere === "object") return sphere.concept || "default globe"
    return sphere
}

// stamp chicken path on spore and save to filesystem
wells.work.stamp = function (spore, concept, signal) {
    if (!signal.chickenpath) return
    let realmnum = signal.realmnum || 1
    let filepath = signal.chickenpath + "." + realmnum + "." + concept
    let folderpath = signal.chickenpath + concept
    // stamp with chicken path
    if (!spore.chicken) {
        zells.stamp(spore)(filepath)
        hyph.save(filepath, spore)
        console.log("wells.work: saved", filepath)
    }
    hyph.mkdir(folderpath)
    signal.chickenpath = folderpath + "/"
}

// redistribute unschärfe after adding a child
wells.work.distribute = function (dna, signal) {
    let children = dna.midwells && dna.midwells.items ? dna.midwells.items : []
    if (children.length === 0) return
    let is = signal.is || dna.is || "irlink"
    let min = dna.minwell !== null && dna.minwell !== undefined ? dna.minwell + 1 : 1
    let max = dna.maxwell !== null && dna.maxwell !== undefined ? dna.maxwell : 900000
    wells.distribute(is, min, children, max)
}

// record link on the well
wells.work.record = function (spore, signal) {
    if (!signal || !signal.link) return
    if (spore.links && !spore.links[signal.link]) {
        spore.links.add(signal.link)
    }
}

// push thrigit to signal payload
wells.work.payload = function (spore, signal) {
    if (!signal) return
    if (spore.thrigit) {
        signal.payload.push(spore.thrigit)
    }
}

module.exports = { well, wells }

