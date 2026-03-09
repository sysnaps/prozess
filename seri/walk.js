const path = require("path")
const hyph = require("./hyph")
const { collection, collections } = require("./collection")
const zells = require("./zells")

// build a sphere descriptor from signal type and root well
const sphere = function (is, wdna) {
    const keys = { irlink: "globe", strand: "ring", hive: "hive", command: "runebook" }
    let key = keys[is]
    let value = key ? (wdna[key] || "default") : null
    let concept = value && key ? value + " " + key : null
    return { unit: "sphere", sphere: key, value, concept }
}

const chick = {}

// resolve the chicken path for a segment at a given depth
chick.path = function (segments, index, prefix) {
    let parts = segments.slice(0, index).map((segment, depth) => depth === 0 ? prefix + segment : segment)
    let folder = parts.join(path.sep)
    let dotprefix = index === 0 ? prefix : ""
    let file = path.join(folder, dotprefix + "." + segments[index])
    return { folder, file, dotprefix }
}

// find existing, hatch from chick, or create a new well at this concept
function step(current, concept, chick, signal, wells, well, tofu) {
    let found = current.midwells ? current.midwells[concept] : null
    if (found && typeof found !== "string") {
        return found
    }

    let hatched = hyph.get(chick.file)
    if (hatched) {
        console.log("walk: hatched", concept, "from chicken")
        if (hatched.midwells && hatched.midwells.unit === "collection") {
            hatched.midwells.refs = true
            collection(hatched.midwells)
        }
        zells.stamp(hatched)(chick.file)
        well(hatched)
        current.midwells.attach(hatched)
        return hatched
    }

    // not in egg, not in chicken — create it
    console.log("walk: creating", concept, "at depth", chick.file)
    let created = wells.first(signal.is, concept, null, null,
        collections.create(concept + ".midwells", "concept"), tofu)
    zells.stamp(created)(chick.file)
    current.midwells.add(created)
    hyph.mkdir(path.join(chick.folder, chick.dotprefix + concept))
    return created
}

// stamp type and sphere properties on a well if missing
function mark(current, type, SPHERE) {
    if (type && !current.well) current.well = type
    if (SPHERE.sphere && !current[SPHERE.sphere]) current[SPHERE.sphere] = SPHERE.value
    if (SPHERE.concept && !current.sphere) current.sphere = SPHERE.concept
}

// record a link passing through this well
function record(current, link) {
    if (current.links && !current.links[link]) {
        current.links.add(link)
        if (current.chicken) hyph.save(current.chicken, current)
    }
}

// factory: attach to a well, returns a function that walks a signal's tofu
const walk = function (wdna) {
    return function (signal) {
        // late require to avoid circular dep (wells requires walk)
        const { wells, well } = require("./wells")

        let segments = signal.irpath[wdna.tofu || "fofu"]
        let current = wdna
        let prefix = wdna.tofu === "mofu" ? "°" : ""
        let type = wells.types[wdna.is]
        let SPHERE = sphere(wdna.is, wdna)

        for (let i = 0; i < segments.length; i++) {
            let chickfile = chick.path(segments, i, prefix)
            current = step(current, segments[i], chickfile, signal, wells, well, wdna.tofu)
            mark(current, type, SPHERE)
            record(current, signal.link)
        }

        return { status: "ok", well: current, signal }
    }
}

module.exports = walk
