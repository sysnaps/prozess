// globe.js — globe calculation engine
// the globe maps thrigit numbers to names in the tofu address space
// zerox realm 1 = irlinks (globe)
// zerox realm 2 = strands (ring)
// zerox realm 3 = demons (Maxwell's Demons — counters/occurrences)
//
// files live at D:\hyph\r\globes\[entity]\[number]\...
// dot-files: .700001 → {"700001": "q"}
// folders: 700001/ → children of that concept
//
// partition logic:
//   start = minschärfe (the concept as a whole)
//   children assigned bottom-up after minschärfe
//   remainder → restschärfe at the top

var fs = require('fs')
var path = require('path')
var hyph = require('./hyph.handlers')

var globe = {}

// ─── READ ───
// read all dot-files in a globe folder
// returns sorted array: [{number, name}, ...]
// restschärfe is always last (it marks the upper bound)
globe.read = function (folder) {
    var dir = path.join(hyph.root, ...folder.split("/"))
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return []

    var entries = fs.readdirSync(dir, { withFileTypes: true })
    var results = []

    for (var idx = 0; idx < entries.length; idx++) {
        var entry = entries[idx]
        if (!entry.isFile() || !entry.name.startsWith(".")) continue

        var key = entry.name.slice(1) // strip dot prefix
        var full = path.join(dir, entry.name)

        try {
            var raw = fs.readFileSync(full, 'utf-8')
            var data = JSON.parse(raw)
            var name = data[key]
            if (name !== undefined) {
                results.push({ number: parseInt(key), name: name })
            }
        } catch (e) {
            continue
        }
    }

    // sort by number ascending
    results.sort(function (a, b) { return a.number - b.number })
    return results
}

// ─── RANGES ───
// takes a sorted children array (from globe.read) and calculates ranges
// the parent's minschärfe is the first child's number - 1
// restschärfe (last entry named "restschärfe") marks the ceiling
// returns [{name, number, start, end}, ...]
globe.ranges = function (children) {
    if (children.length === 0) return []

    var result = []

    for (var idx = 0; idx < children.length; idx++) {
        var child = children[idx]
        var start = child.number
        var end = null

        if (idx + 1 < children.length) {
            end = children[idx + 1].number - 1
        } else {
            // last entry — its end IS its number (single point or restschärfe)
            end = child.number
        }

        result.push({
            name: child.name,
            number: child.number,
            start: start,
            end: end
        })
    }

    return result
}

// ─── PARTITION ───
// purely mathematical: divide range [start, end] among names
// start IS the minschärfe (position 1 of the range)
// children get equal slices after minschärfe
// remainder → restschärfe at the top
globe.partition = function (start, end, names) {
    var total = end - start       // positions after minschärfe
    var first = start + 1         // first allocatable position
    var count = names.length

    if (count === 0) {
        return {
            min: start,
            children: [],
            rest: { name: "restschärfe", start: first, end: end }
        }
    }

    var each = Math.floor(total / count)
    var remainder = total - (each * count)

    var children = []
    var cursor = first

    for (var idx = 0; idx < count; idx++) {
        children.push({
            name: names[idx],
            start: cursor,
            end: cursor + each - 1
        })
        cursor = cursor + each
    }

    var rest = { name: "restschärfe", start: cursor, end: end }

    return { min: start, children: children, rest: rest }
}

// ─── WALK ───
// traverse the globe tree from entity root following named points
// returns the concept's address and range at the deepest level
// entity = "000000000003", points = ["q", "IRLBar"]
globe.walk = function (entity, points) {
    var base = "r/globes/" + entity
    var result = { entity: entity, points: points, steps: [], exists: false }

    var folder = base

    for (var idx = 0; idx < points.length; idx++) {
        var name = points[idx]
        var children = globe.read(folder)

        if (children.length === 0) {
            result.error = "empty folder: " + folder
            return result
        }

        // find the entry with this name
        var found = null
        var found_idx = -1
        for (var c = 0; c < children.length; c++) {
            if (children[c].name === name) {
                found = children[c]
                found_idx = c
                break
            }
        }

        if (!found) {
            result.error = "not found: " + name + " at " + folder
            return result
        }

        // determine range using ceiling from restschärfe or next sibling
        var range_start = found.number
        var range_end = found.number

        // find restschärfe for ceiling
        var ceiling = null
        for (var ri = children.length - 1; ri >= 0; ri--) {
            if (children[ri].name === "restschärfe") {
                ceiling = children[ri].number
                break
            }
        }

        // find next non-restschärfe sibling
        var next_sib = null
        for (var ni = found_idx + 1; ni < children.length; ni++) {
            if (children[ni].name !== "restschärfe") {
                next_sib = children[ni]
                break
            }
        }

        if (next_sib) {
            range_end = next_sib.number - 1
        } else if (ceiling) {
            range_end = ceiling - 1
        } else {
            // no restschärfe, no next sibling — open range
            range_end = 1110000
        }

        result.steps.push({
            name: name,
            number: found.number,
            start: range_start,
            end: range_end
        })

        folder = folder + "/" + found.number
    }

    result.exists = true
    var last = result.steps[result.steps.length - 1]
    result.tofu = last ? last.number : null
    result.start = last ? last.start : null
    result.end = last ? last.end : null

    return result
}

// ─── FIND ───
// find a concept by name at a specific folder level
// returns {number, name, start, end} or null
globe.find = function (folder, name) {
    var children = globe.read(folder)
    var ranges = globe.ranges(children)

    for (var idx = 0; idx < ranges.length; idx++) {
        if (ranges[idx].name === name) return ranges[idx]
    }

    return null
}

// ─── THRIGIT ───
// calculate the full thrigit [tofu, mofu, lofu] for an irlink
// tofu = globe address from walking the tree
// mofu = group encoding (global, uses ° pointer)
// lofu = entity ownership
//
// data = { entity, points, group, owner }
// entity = "000000000003" (globe owner)
// points = ["q", "IRLBar"] (path to concept)
// group = optional group pointer (° path)
// owner = optional entity entnum for ownership
globe.thrigit = function (data) {
    var entity = data.entity
    var points = data.points || []

    // walk the globe tree for tofu
    var walked = globe.walk(entity, points)
    if (!walked.exists) {
        return { error: walked.error, zerox: 1 }
    }

    var tofu = walked.tofu
    var mofu = data.group || 1  // 1 = no group
    var lofu = data.owner || 1  // 1 = no specific owner

    return {
        zerox: 1,
        thrigit: [tofu, mofu, lofu],
        tofu: tofu,
        mofu: mofu,
        lofu: lofu,
        walk: walked
    }
}

// ─── DEMON ───
// create a Maxwell's Demon structure
// demons track counters and occurrences without increasing entropy
// they share the parent's thrigit address but with zerox 3
//
// parent = { tofu, mofu, lofu } (the thrigit this demon belongs to)
// type = "counter" | "collection" (what kind of demon)
globe.demon = function (parent, type) {
    return {
        unit: "demon",
        zerox: 3,
        thrigit: [parent.tofu, parent.mofu, parent.lofu],
        demon: type || "counter",
        indo: {},
        collection: []
    }
}

// ─── DEMON VALUE ───
// demon values are thrigit strands, not plain integers
// counter.read.0 → [read_tofu, 1, 0]
// we need the globe address for the counter type
globe.demon.value = function (entity, type, amount) {
    // walk the globe to find the type's address
    var type_points = type.split(".")
    var walked = globe.walk(entity, type_points)

    var tofu = walked.exists ? walked.tofu : 1
    var nype = amount || 0

    return {
        zerox: 3,
        thrigit: [tofu, 1, nype],
        strand: type,
        amount: nype
    }
}

// ─── PLACE ───
// place a new concept on the globe
// reslices all siblings at that level
//
// data = { entity, parent (points array), name }
// returns the new partition after placement
globe.place = function (data) {
    var entity = data.entity
    var parent = data.parent || []
    var name = data.name

    // find the parent folder
    var folder = "r/globes/" + entity
    for (var idx = 0; idx < parent.length; idx++) {
        var walked = globe.find(folder, parent[idx])
        if (!walked) return { error: "parent not found: " + parent[idx] }
        folder = folder + "/" + walked.number
    }

    // read existing children at this level
    var existing = globe.read(folder)

    // check if name already exists
    for (var check = 0; check < existing.length; check++) {
        if (existing[check].name === name) {
            return { error: "already exists: " + name, number: existing[check].number }
        }
    }

    // get parent range
    var parent_start = null
    var parent_end = null

    if (parent.length === 0) {
        // entity root — use full range for now
        // in practice this would come from the entity's globe config
        parent_start = 1
        parent_end = 900000
    } else {
        // get range from walking to parent
        var parent_walk = globe.walk(entity, parent)
        if (!parent_walk.exists) return { error: "could not walk to parent" }
        parent_start = parent_walk.start
        parent_end = parent_walk.end
    }

    // collect current child names (excluding restschärfe)
    var current_names = []
    for (var e = 0; e < existing.length; e++) {
        if (existing[e].name !== "restschärfe") {
            current_names.push(existing[e].name)
        }
    }

    // add new name
    current_names.push(name)

    // reslice
    var partition = globe.partition(parent_start, parent_end, current_names)

    // write new dot-files and clean up old ones
    globe.write.partition(folder, partition)

    // cascade: reslice children of each child that had subchildren
    for (var ci = 0; ci < partition.children.length; ci++) {
        var child = partition.children[ci]
        var old_entry = null

        // find old entry for this name
        for (var oe = 0; oe < existing.length; oe++) {
            if (existing[oe].name === child.name) {
                old_entry = existing[oe]
                break
            }
        }

        // if this child existed before and had subchildren, reslice them
        if (old_entry) {
            var old_folder = folder + "/" + old_entry.number
            var sub = globe.read(old_folder)

            if (sub.length > 0) {
                // child moved — need to move folder and reslice
                var new_folder = folder + "/" + child.start
                globe.move(old_folder, new_folder)
                globe.reslice(new_folder, child.start, child.end)
            }
        }
    }

    return {
        placed: name,
        partition: partition,
        entity: entity,
        parent: parent
    }
}

// ─── RESLICE ───
// recalculate all children at a folder level
// cascades recursively when children also have subchildren
// start/end define the available range
globe.reslice = function (folder, start, end) {
    var existing = globe.read(folder)
    if (existing.length === 0) return

    // collect names (excluding restschärfe)
    var names = []
    for (var idx = 0; idx < existing.length; idx++) {
        if (existing[idx].name !== "restschärfe") {
            names.push(existing[idx].name)
        }
    }

    // recalculate partition
    var partition = globe.partition(start, end, names)

    // check if children need moving
    for (var ci = 0; ci < partition.children.length; ci++) {
        var child = partition.children[ci]
        var old_number = null

        // find original number for this name
        for (var oe = 0; oe < existing.length; oe++) {
            if (existing[oe].name === child.name) {
                old_number = existing[oe].number
                break
            }
        }

        if (old_number !== null && old_number !== child.start) {
            // number changed — move folder
            var old_path = folder + "/" + old_number
            var new_path = folder + "/" + child.start
            globe.move(old_path, new_path)

            // cascade reslice into this child's subchildren
            globe.reslice(new_path, child.start, child.end)
        }
    }

    // write the new partition files
    globe.write.partition(folder, partition)
}

// ─── WRITE ───
globe.write = {}

// write a full partition as dot-files in a folder
// removes old dot-files first, writes new ones
globe.write.partition = function (folder, partition) {
    var dir = path.join(hyph.root, ...folder.split("/"))

    // ensure folder exists
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

    // remove existing dot-files (numbers only, not entity/name files)
    var entries = fs.readdirSync(dir, { withFileTypes: true })
    for (var idx = 0; idx < entries.length; idx++) {
        var entry = entries[idx]
        if (entry.isFile() && entry.name.startsWith(".")) {
            var key = entry.name.slice(1)
            // only remove if it looks like a number
            if (/^\d+$/.test(key)) {
                fs.unlinkSync(path.join(dir, entry.name))
            }
        }
    }

    // write children
    for (var ci = 0; ci < partition.children.length; ci++) {
        var child = partition.children[ci]
        var filename = "." + child.start
        var content = {}
        content[child.start] = child.name
        fs.writeFileSync(
            path.join(dir, filename),
            JSON.stringify(content, null, 4),
            'utf-8'
        )

        // ensure child folder exists
        var child_dir = path.join(dir, String(child.start))
        if (!fs.existsSync(child_dir)) fs.mkdirSync(child_dir, { recursive: true })
    }

    // write restschärfe
    var rest = partition.rest
    var rest_filename = "." + rest.start
    var rest_content = {}
    rest_content[rest.start] = rest.name
    fs.writeFileSync(
        path.join(dir, rest_filename),
        JSON.stringify(rest_content, null, 4),
        'utf-8'
    )
}

// write a single entry
globe.write.entry = function (folder, number, name) {
    var dir = path.join(hyph.root, ...folder.split("/"))
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

    var filename = "." + number
    var content = {}
    content[number] = name
    fs.writeFileSync(
        path.join(dir, filename),
        JSON.stringify(content, null, 4),
        'utf-8'
    )
}

// ─── MOVE ───
// move a globe folder (rename) when a concept's number changes
// this is a range migration (zerox first digit = 2)
globe.move = function (from, to) {
    var from_dir = path.join(hyph.root, ...from.split("/"))
    var to_dir = path.join(hyph.root, ...to.split("/"))

    if (!fs.existsSync(from_dir)) return

    // if same path, nothing to do
    if (from_dir === to_dir) return

    // recursive copy then remove
    globe.copy.recursive(from_dir, to_dir)
    globe.remove.recursive(from_dir)
}

// ─── COPY RECURSIVE ───
globe.copy = {}
globe.copy.recursive = function (src, dest) {
    if (!fs.existsSync(src)) return

    var stat = fs.statSync(src)
    if (stat.isFile()) {
        var dir = path.dirname(dest)
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
        fs.copyFileSync(src, dest)
        return
    }

    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true })

    var entries = fs.readdirSync(src, { withFileTypes: true })
    for (var idx = 0; idx < entries.length; idx++) {
        var entry = entries[idx]
        globe.copy.recursive(
            path.join(src, entry.name),
            path.join(dest, entry.name)
        )
    }
}

// ─── REMOVE RECURSIVE ───
globe.remove = {}
globe.remove.recursive = function (target) {
    if (!fs.existsSync(target)) return

    var stat = fs.statSync(target)
    if (stat.isFile()) {
        fs.unlinkSync(target)
        return
    }

    var entries = fs.readdirSync(target, { withFileTypes: true })
    for (var idx = 0; idx < entries.length; idx++) {
        globe.remove.recursive(path.join(target, entries[idx].name))
    }

    fs.rmdirSync(target)
}

// ─── ENTITY GLOBE ───
// get or create an entity's globe
// entity = "000000000003", name = "eastwesteros"
globe.entity = function (entity, name) {
    var folder = "r/globes"
    var dot = path.join(hyph.root, "r", "globes", "." + entity)

    if (fs.existsSync(dot)) {
        try {
            var raw = fs.readFileSync(dot, 'utf-8')
            var data = JSON.parse(raw)
            return { entity: entity, name: data[entity], exists: true }
        } catch (e) {
            // fall through to create
        }
    }

    // create
    if (name) {
        var content = {}
        content[entity] = name
        var dir = path.join(hyph.root, "r", "globes")
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
        fs.writeFileSync(dot, JSON.stringify(content, null, 4), 'utf-8')

        // create entity folder
        var entity_dir = path.join(dir, entity)
        if (!fs.existsSync(entity_dir)) fs.mkdirSync(entity_dir, { recursive: true })

        return { entity: entity, name: name, exists: true, created: true }
    }

    return { entity: entity, exists: false }
}

// ─── LOOKUP ───
// reverse lookup: given a number, find its name in a globe folder
globe.lookup = function (folder, number) {
    var dot = path.join(hyph.root, ...folder.split("/"), "." + number)

    if (!fs.existsSync(dot)) return null

    try {
        var raw = fs.readFileSync(dot, 'utf-8')
        var data = JSON.parse(raw)
        return data[String(number)] || null
    } catch (e) {
        return null
    }
}

// ─── DEEP LOOKUP ───
// given a tofu number and entity, find the full path of names
// walks the tree until the number is found at a leaf
globe.lookup.deep = function (entity, tofu) {
    var folder = "r/globes/" + entity
    var names = []

    var searching = true
    while (searching) {
        var children = globe.read(folder)
        if (children.length === 0) break

        // find restschärfe to know the ceiling of this level
        var ceiling = null
        for (var ri = children.length - 1; ri >= 0; ri--) {
            if (children[ri].name === "restschärfe") {
                ceiling = children[ri].number
                break
            }
        }

        var found = false
        for (var idx = 0; idx < children.length; idx++) {
            var child = children[idx]
            if (child.name === "restschärfe") continue

            // find next non-restschärfe sibling
            var next = null
            for (var ni = idx + 1; ni < children.length; ni++) {
                if (children[ni].name !== "restschärfe") {
                    next = children[ni]
                    break
                }
            }

            // is our tofu this child's exact number?
            if (child.number === tofu) {
                names.push(child.name)
                found = true
                searching = false
                break
            }

            // range end: next sibling - 1, or ceiling - 1, or open (1110000)
            var range_end = next ? next.number - 1 : (ceiling ? ceiling - 1 : 1110000)

            if (tofu >= child.number && tofu <= range_end) {
                names.push(child.name)
                folder = folder + "/" + child.number
                found = true
                break
            }
        }

        if (!found) {
            searching = false
        }
    }

    if (names.length === 0) return null
    return { entity: entity, tofu: tofu, names: names, irlink: names.join(".") }
}

module.exports = globe
