// resolve.js — irlink → hyph path resolution
// turns semantic irlinks into filesystem reads from d:\hyph
//
// "%i.init"               → hyph/i/.init + hyph/i/init/*
// "%i.init;"              → hyph/i/.init only (no folder)
// "@seri--"               → i/characters/.@seri-- + i/characters/@seri--/*
// "plans.some-plan"       → i/.plans + i/plans/.some-plan + i/plans/some-plan/.@selected
// "~food.candy:snickers"  → i/rings/[ring]/[zone]/[triangle]/.food + food/.candy + ...
// "qShread.IRLBar"        → q/.Shread + q/Shread/.IRLBar

var hyph = require('./hyph.handlers')

var resolve = {}

// ─── POINTERS ───
resolve.pointers = ["!", "~", "%", "@", ".", ":", "/", "^", "°"]

// ─── PARSER ───
// irlink string → flat irpath array
// "%i.init"               → ["%", "i", ".", "init"]
// "@seri--"               → ["@", "seri--"]
// "plans.some-plan"       → ["plans", ".", "some-plan"]
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

    var irlink = data.irlink
    var flags = {}

    // semicolon at end = shallow (file only, no folder)
    if (irlink.endsWith(";")) {
        flags.shallow = true
        irlink = irlink.slice(0, -1)
    }

    var irpath = resolve.parse(irlink)
    if (irpath.length === 0) throw new Error("empty irlink")

    // override irlink in data so sub-functions get the clean version
    var clean = { irlink: irlink, selected: data.selected, ring: data.ring }

    var first = irpath[0]

    if (first === "%") return resolve.base(clean, irpath, flags)
    if (first === "@") return resolve.entity(clean, irpath, flags)
    if (first === "~") return resolve.strand(clean, irpath, flags)
    if (first === "q") return resolve.que(clean, irpath, flags)
    if (first === "!") return resolve.rune(clean, irpath, flags)

    return resolve.plain(clean, irpath, flags)
}

// ─── WALK ───
// generic dot-file walker: reads .point at each level, descends into folder
// returns { dir, files: { [path]: content } }
resolve.walk = function (base, points, flags) {
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

    // folder contents at deepest level (unless shallow)
    if (!flags || !flags.shallow) {
        var folder = hyph.ead.folder({ irpath: dir })
        if (folder.exists && folder.data) {
            for (var key in folder.data) {
                results[dir + "/" + key] = folder.data[key]
            }
        }
    }

    return { dir: dir, files: results }
}

// ─── BASE (%) ───
// %i.init → hyph/i/.init (dot file) + hyph/i/init/* (folder)
// %i.init; → hyph/i/.init only
// % enters the irlink address from hyph root
resolve.base = function (data, irpath, flags) {
    var points = resolve.points(irpath, 1) // skip %
    if (points.length === 0) return { exists: false, irlink: data.irlink, type: "base", error: "empty base path" }

    var dir = points.join("/")
    var results = {}

    if (flags && flags.shallow) {
        // file only — just the dot file
        var last = points[points.length - 1]
        var parent = points.length > 1 ? points.slice(0, -1).join("/") : ""
        var dotpath = parent ? parent + "/." + last : "." + last

        var df = hyph.ead({ irpath: dotpath })
        if (!df.exists) return { exists: false, irlink: data.irlink, type: "base" }
        return { exists: true, irlink: data.irlink, type: "base", data: { ".": df.data } }
    }

    // normal — hyph.ead.folder gets dot file (as ".") + all folder contents
    var folder = hyph.ead.folder({ irpath: dir })
    if (!folder.exists) {
        // folder does not exist — try just the dot file
        var last2 = points[points.length - 1]
        var parent2 = points.length > 1 ? points.slice(0, -1).join("/") : ""
        var dotpath2 = parent2 ? parent2 + "/." + last2 : "." + last2

        var df2 = hyph.ead({ irpath: dotpath2 })
        if (!df2.exists) return { exists: false, irlink: data.irlink, type: "base" }
        return { exists: true, irlink: data.irlink, type: "base", data: { ".": df2.data } }
    }

    return { exists: true, irlink: data.irlink, type: "base", data: folder.data }
}

// ─── ENTITY (@) ───
// "@seri--" → characters, "@--berlin" → trybes, "@IRL" → namespaces
resolve.entity = function (data, irpath, flags) {
    var handle = "@" + irpath[1]
    var etype = resolve.entity.type(handle)
    var base = "i/" + (etype === "character" ? "characters" : etype === "trybe" ? "trybes" : "namespaces")

    // extra points after the entity name?
    var extra = resolve.points(irpath, 2)

    if (extra.length === 0) {
        if (flags && flags.shallow) {
            // file only
            var df = hyph.ead({ irpath: base + "/." + handle })
            if (!df.exists) return { exists: false, irlink: data.irlink, type: "entity", entity: etype }
            return { exists: true, irlink: data.irlink, type: "entity", entity: etype, data: { ".": df.data } }
        }

        // dot file + full folder — hyph.ead.folder reads both
        var folder = hyph.ead.folder({ irpath: base + "/" + handle })
        if (!folder.exists) {
            // try just the dot file
            var df2 = hyph.ead({ irpath: base + "/." + handle })
            if (!df2.exists) return { exists: false, irlink: data.irlink, type: "entity", entity: etype }
            return { exists: true, irlink: data.irlink, type: "entity", entity: etype, data: { ".": df2.data } }
        }

        return { exists: true, irlink: data.irlink, type: "entity", entity: etype, data: folder.data }
    }

    // walk deeper: @seri--.conditions.active
    var walked = resolve.walk(base + "/" + handle, extra, flags)

    // also include the entity dot file
    var dotfile = hyph.ead({ irpath: base + "/." + handle })
    if (dotfile.exists) walked.files["."] = dotfile.data

    return { exists: true, irlink: data.irlink, type: "entity", entity: etype, data: walked.files }
}

resolve.entity.type = function (handle) {
    if (handle.startsWith("@--")) return "trybe"
    if (handle.endsWith("--")) return "character"
    return "namespace"
}

// ─── PLAIN ───
// "plans.some-plan" → i/.plans + i/plans/.some-plan + i/plans/some-plan/.@selected
resolve.plain = function (data, irpath, flags) {
    var points = resolve.points(irpath)
    var walked = resolve.walk("i", points, flags)

    // viewpoint: selected character at deepest level
    if (data.selected && (!flags || !flags.shallow)) {
        var viewpath = walked.dir + "/." + data.selected
        var vf = hyph.ead({ irpath: viewpath })
        if (vf.exists) walked.files[viewpath] = vf.data
    }

    return { exists: true, irlink: data.irlink, type: "plain", data: walked.files }
}

// ─── STRAND (~) ───
// "~food.candy:snickers bar" → i/rings/[ring]/[zone-addr]/[triangle-addr]/.food + ...
resolve.strand = function (data, irpath, flags) {
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
    //   zone.addr = ringdata.zones[turbo].address
    //   triangle.addr = ringdata.zones[turbo].triangle
    //   base = "i/rings/" + ring + "/" + zone.addr + "/" + triangle.addr
    // for now: walk directly under the ring folder
    var base = "i/rings/" + ring
    var walked = resolve.walk(base, points, flags)

    return { exists: true, irlink: data.irlink, type: "strand", ring: ring, data: walked.files }
}

// ─── QUE (q) ───
// "qShread.IRLBar" → q/.Shread + q/Shread/.IRLBar
resolve.que = function (data, irpath, flags) {
    var points = resolve.points(irpath)
    var walked = resolve.walk("q", points, flags)

    return { exists: true, irlink: data.irlink, type: "que", data: walked.files }
}

// ─── RUNE (!) ───
// "!tabs.click" → rune reference (not a file read, returns the path)
resolve.rune = function (data, irpath) {
    var points = resolve.points(irpath, 1)
    return { exists: true, irlink: data.irlink, type: "rune", points: points }
}

module.exports = resolve
