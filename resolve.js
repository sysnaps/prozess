// resolve.js — irlink → hyph path resolution
// turns semantic irlinks into filesystem reads from d:\hyph
//
// "@seri--"              → i/characters/.@seri-- + i/characters/@seri--/*
// "plans.some-plan"      → i/.plans + i/plans/.some-plan + i/plans/some-plan/.@selected
// "~food.candy:snickers" → i/rings/[ring]/[zone]/[triangle]/.food + food/.candy + ...
// "qShread.IRLBar"       → q/.Shread + q/Shread/.IRLBar

var hyph = require('./hyph.handlers')

var resolve = {}

// ─── POINTERS ───
resolve.pointers = ["!", "~", "%", "@", ".", ":", "/", "^"]

// ─── PARSER ───
// irlink string → flat irpath array
// "plans.some-plan"       → ["plans", ".", "some-plan"]
// "@seri--"               → ["@", "seri--"]
// "~food.candy:snickers"  → ["~", "food", ".", "candy", ":", "snickers"]
// "qShread.IRLBar"        → ["q", "Shread", ".", "IRLBar"]
resolve.parse = function (irlink) {
    var result = []
    var current = ""

    for (var idx = 0; idx < irlink.length; idx++) {
        var ch = irlink[idx]

        // q-pointer: q followed by uppercase letter
        if (ch === "q" && idx + 1 < irlink.length && irlink[idx + 1] >= "A" && irlink[idx + 1] <= "Z") {
            if (current) result.push(current)
            result.push("q")
            current = ""
            continue
        }

        if (resolve.pointers.indexOf(ch) !== -1) {
            if (current) result.push(current)
            result.push(ch)
            current = ""
            continue
        }

        current += ch
    }

    if (current) result.push(current)
    return result
}

// extract point names from irpath (skip pointers and "q")
resolve.points = function (irpath, start) {
    var out = []
    for (var idx = (start || 0); idx < irpath.length; idx++) {
        var seg = irpath[idx]
        if (resolve.pointers.indexOf(seg) === -1 && seg !== "q") {
            out.push(seg)
        }
    }
    return out
}

// ─── MAIN RESOLVER ───
resolve.irlink = function (data) {
    if (!data.irlink) throw new Error("irlink required")

    var irpath = resolve.parse(data.irlink)
    if (irpath.length === 0) throw new Error("empty irlink")

    var first = irpath[0]

    if (first === "@") return resolve.entity(data, irpath)
    if (first === "~") return resolve.strand(data, irpath)
    if (first === "q") return resolve.que(data, irpath)
    if (first === "!") return resolve.rune(data, irpath)

    return resolve.plain(data, irpath)
}

// ─── WALK ───
// generic dot-file walker: reads .point at each level, descends into folder
// returns { [relative-path]: content }
resolve.walk = function (base, points) {
    var results = {}
    var dir = base

    for (var p = 0; p < points.length; p++) {
        // dot file at current level
        var dotpath = dir + "/." + points[p]
        var df = hyph.ead({ irpath: dotpath })
        if (df.exists) results[dotpath] = df.data

        // descend into folder
        dir = dir + "/" + points[p]
    }

    // read folder contents at deepest level
    var folder = hyph.ead.folder({ irpath: dir })
    if (folder.exists && folder.data) {
        for (var key in folder.data) {
            results[dir + "/" + key] = folder.data[key]
        }
    }

    return { dir: dir, files: results }
}

// ─── ENTITY ───
// "@seri--" → characters, "@--berlin" → trybes, "@IRL" → namespaces
resolve.entity = function (data, irpath) {
    var handle = "@" + irpath[1]
    var etype = resolve.entity.type(handle)
    var base = "i/" + (etype === "character" ? "characters" : etype === "trybe" ? "trybes" : "namespaces")

    // extra points after the entity name?
    var extra = resolve.points(irpath, 2)

    if (extra.length === 0) {
        // just the entity — dot file + full folder
        var results = {}

        var dotfile = hyph.ead({ irpath: base + "/." + handle })
        if (dotfile.exists) results["."] = dotfile.data

        var folder = hyph.ead.folder({ irpath: base + "/" + handle })
        if (folder.exists && folder.data) {
            for (var key in folder.data) {
                results[key] = folder.data[key]
            }
        }

        return { exists: true, irlink: data.irlink, type: "entity", entity: etype, data: results }
    }

    // walk deeper: @seri--.conditions.active
    var walked = resolve.walk(base + "/" + handle, extra)

    // also include the entity dot file
    var dotfile2 = hyph.ead({ irpath: base + "/." + handle })
    if (dotfile2.exists) walked.files["."] = dotfile2.data

    return { exists: true, irlink: data.irlink, type: "entity", entity: etype, data: walked.files }
}

resolve.entity.type = function (handle) {
    if (handle.startsWith("@--")) return "trybe"
    if (handle.endsWith("--")) return "character"
    return "namespace"
}

// ─── PLAIN ───
// "plans.some-plan" → i/.plans + i/plans/.some-plan + i/plans/some-plan/.@selected
resolve.plain = function (data, irpath) {
    var points = resolve.points(irpath)
    var walked = resolve.walk("i", points)

    // viewpoint: selected character at deepest level
    if (data.selected) {
        var viewpath = walked.dir + "/." + data.selected
        var vf = hyph.ead({ irpath: viewpath })
        if (vf.exists) walked.files[viewpath] = vf.data
    }

    return { exists: true, irlink: data.irlink, type: "plain", data: walked.files }
}

// ─── STRAND ───
// "~food.candy:snickers bar" → i/rings/[ring]/[zone-addr]/[triangle-addr]/.food + ...
resolve.strand = function (data, irpath) {
    var ring = data.ring
    if (!ring) return { exists: false, irlink: data.irlink, type: "strand", error: "no ring specified" }

    var points = resolve.points(irpath, 1) // skip the ~ pointer
    if (points.length === 0) return { exists: false, irlink: data.irlink, type: "strand", error: "empty strand" }

    // read ring data to find zone/triangle for the turbo (first point)
    var ringfile = hyph.ead({ irpath: "i/rings/." + ring })
    var ringdata = ringfile.exists ? ringfile.data : null

    // zone/triangle lookup
    // once zones are populated in the ring, we resolve:
    //   turbo = points[0]
    //   zone.addr = ring.zones[turbo].address
    //   triangle.addr = ring.zones[turbo].triangle
    //   base = "i/rings/" + ring + "/" + zone.addr + "/" + triangle.addr
    // for now: walk directly under the ring folder
    var base = "i/rings/" + ring
    var walked = resolve.walk(base, points)

    return { exists: true, irlink: data.irlink, type: "strand", ring: ring, data: walked.files }
}

// ─── QUE ───
// "qShread.IRLBar" → q/.Shread + q/Shread/.IRLBar
resolve.que = function (data, irpath) {
    var points = resolve.points(irpath)
    var walked = resolve.walk("q", points)

    return { exists: true, irlink: data.irlink, type: "que", data: walked.files }
}

// ─── RUNE ───
// "!tabs.click" → rune reference (not a file read, returns the path)
resolve.rune = function (data, irpath) {
    var points = resolve.points(irpath, 1)
    return { exists: true, irlink: data.irlink, type: "rune", points: points }
}

module.exports = resolve
