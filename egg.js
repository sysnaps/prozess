// egg.js — auto-registration of concepts in globe and ring
//
// hyph    = the actual files and folders on disk
// chicken = the hyph expressed in the prozess cache
// egg     = the hyph expressed in the App cache
//
// globe children = continents (proportional partition)
// ring  children = zones      (fixed 919 unschärfe each)
//
// zone grouping is based on co-occurrence in chains:
// concepts that appear together in a chain belong in the same zone.
// when multiple zones match, pick the one with the most co-occurring pascals.
// ties go to the first zone (lowest address).
//
// new zones leave 2 reserved neighbor slots for overflow.
// zone 1 at 260001, reserved at 260920 and 261839, zone 2 at 262758.
//
// cosmos depths: gala > orbit > star > planet > moon
// cosmos starts at 900000 with 1 reserved for addressing the whole cosmos.

var fs = require('fs')
var path = require('path')
var globe = require('./globe')
var hyph = require('./hyph.handlers')
var entnum = require('./entnum')

var egg = {}

// ring constants
var RING_START = 260001
var ZONE_UNSCHÄRFE = 919   // 918 triangle slots + 1 minschärfe
var PASCALS_PER_ZONE = 6
var PASCAL_SIZE = 153      // 120 + 24 + 6 + 2 + 1
var ZONE_SPACING = 3       // 1 zone + 2 reserved neighbors

// cosmos constants
var COSMOS_START = 900000
// cosmos depths: gala(1) > orbit(2) > star(3) > planet(4) > moon(5)
// 1 unschärfe reserved for addressing the cosmos without a gala selected

// ─── EXTRACT ───
// extract all unique concept chains from a nested data object
// skips metadata (bumbers, TOC entries)
// returns { chains, concepts }
// chains  = [["name"], ["name","full"], ["conditions","active","ring"], ...]
// concepts = ["name", "full", "first", ...] (unique, first-seen order)
egg.extract = function (data) {
    var chains = []
    var unique = {}
    var concepts = []

    function walk(obj, prefix) {
        if (!obj || typeof obj !== 'object') return

        var keys = Object.keys(obj)
        for (var index = 0; index < keys.length; index++) {
            var key = keys[index]
            if (key === 'bumbers' || key === 'entnums' || key === 'thrindex') continue

            var value = obj[key]

            // skip TOC entries
            if (Array.isArray(value) && value.length >= 2 && typeof value[0] === 'string' && value[0].startsWith("@")) continue

            var chain = prefix.concat([key])
            chains.push(chain)

            if (!unique[key]) {
                unique[key] = true
                concepts.push(key)
            }

            if (value && typeof value === 'object' && !Array.isArray(value)) {
                walk(value, chain)
            }
        }
    }

    walk(data, [])
    return { chains: chains, concepts: concepts }
}

// ─── CO-OCCURRENCE ───
// build a map: concept → { concept: true, ... }
// two concepts co-occur when they appear in the same chain
egg.cooccur = function (chains) {
    var map = {}

    for (var c = 0; c < chains.length; c++) {
        var chain = chains[c]
        for (var i = 0; i < chain.length; i++) {
            if (!map[chain[i]]) map[chain[i]] = {}
            for (var j = 0; j < chain.length; j++) {
                if (i !== j) map[chain[i]][chain[j]] = true
            }
        }
    }

    return map
}

// ─── SEED ───
// ensure all concepts from entity data exist in globe and ring
//
// entity = "000000000003" (entnum — 1 entity = 1 globe)
// ring   = "000000000003" (entnum — 1 entity = 1 ring)
// data   = the assembled entity object
egg.seed = function (entity, ring, data) {
    var extracted = egg.extract(data)

    var results = {
        globe: { created: [], existing: 0 },
        ring: { zones: [], created: [], existing: 0 },
        chains: extracted.chains.length,
        concepts: extracted.concepts.length
    }

    // 1. globe: ensure all chain paths exist (hierarchical, proportional continents)
    for (var g = 0; g < extracted.chains.length; g++) {
        var gr = egg.ensure.globe(entity, extracted.chains[g])
        if (gr.created) results.globe.created.push(extracted.chains[g].join("."))
        else results.globe.existing++
    }

    // 2. ring: ensure all concepts exist in zones (flat, co-occurrence grouped)
    var zr = egg.ensure.ring(ring, extracted.chains)
    results.ring = zr

    return results
}

// ─── ENSURE ───
egg.ensure = {}

// ensure an irlink path exists in the globe, placing missing segments
egg.ensure.globe = function (entity, segments) {
    var walked = globe.walk(entity, segments)
    if (walked.exists) return { exists: true }

    var existing = []
    var folder = "r/globes/" + entity

    for (var idx = 0; idx < segments.length; idx++) {
        var found = globe.find(folder, segments[idx])
        if (found) {
            existing.push(segments[idx])
            folder = folder + "/" + found.number
        } else {
            globe.place({
                entity: entity,
                parent: existing,
                name: segments[idx]
            })
            found = globe.find(folder, segments[idx])
            if (found) {
                existing.push(segments[idx])
                folder = folder + "/" + found.number
            }
        }
    }

    return { created: true }
}

// ─── RING: ZONE-BASED CO-OCCURRENCE GROUPING ───
// concepts that appear together in chains go into the same zone.
// when placing a concept:
//   1. find the zone with the most co-occurring pascals (that isn't full)
//   2. if tie: pick lowest address (first zone)
//   3. if no co-occurring zone: create new zone
//   4. if best zone is full: try reserved neighbors, then create new
// new zones skip 2 slots for overflow: spacing = 3 × 919

egg.ensure.ring = function (ring, chains) {
    var ringfolder = path.join(hyph.root, "i", "rings", ring)
    if (!fs.existsSync(ringfolder)) fs.mkdirSync(ringfolder, { recursive: true })

    var zones = egg.ring.read(ringfolder)

    // build co-occurrence from chains
    var cooccur = egg.cooccur(chains)

    // collect unique concepts in first-seen order
    var unique = {}
    var order = []
    for (var c = 0; c < chains.length; c++) {
        for (var i = 0; i < chains[c].length; i++) {
            if (!unique[chains[c][i]]) {
                unique[chains[c][i]] = true
                order.push(chains[c][i])
            }
        }
    }

    var results = { zones: [], created: [], existing: 0 }

    // find which concepts already exist in a zone
    var missing = []
    for (var m = 0; m < order.length; m++) {
        var found = false
        for (var z = 0; z < zones.length; z++) {
            if (zones[z].pascals.indexOf(order[m]) !== -1) {
                found = true
                break
            }
        }
        if (found) results.existing++
        else missing.push(order[m])
    }

    // place missing concepts using co-occurrence grouping
    for (var mi = 0; mi < missing.length; mi++) {
        var concept = missing[mi]
        var neighbors = cooccur[concept] || {}

        // find zone with most co-occurring pascals
        var best = null
        var best_count = 0

        for (var zi = 0; zi < zones.length; zi++) {
            if (zones[zi].pascals.length >= PASCALS_PER_ZONE) continue

            var count = 0
            for (var pi = 0; pi < zones[zi].pascals.length; pi++) {
                if (neighbors[zones[zi].pascals[pi]]) count++
            }

            if (count > best_count) {
                best = zones[zi]
                best_count = count
            }
            // tie: first zone wins (zones sorted by address)
        }

        if (best && best_count > 0) {
            // co-occurring zone found with room
            best.pascals.push(concept)
            best.sysnapse = egg.ring.sysnapse(best.pascals)
            egg.ring.write(ringfolder, best)
            results.created.push(concept + " → zone " + best.address)
        } else {
            // no co-occurrence match — create new zone with spacing
            var address = egg.ring.next(zones)
            var zone = {
                address: address,
                pascals: [concept],
                enemies: [],
                sysnapse: egg.ring.sysnapse([concept])
            }
            zones.push(zone)
            egg.ring.write(ringfolder, zone)
            results.created.push(concept + " → zone " + address + " (new)")
        }
    }

    results.zones = zones.map(function (z) { return { address: z.address, pascals: z.pascals } })
    return results
}

// ─── RING HELPERS ───
egg.ring = {}

// read all zone dot-files from ring folder
egg.ring.read = function (ringfolder) {
    if (!fs.existsSync(ringfolder)) return []

    var zones = []
    var entries = fs.readdirSync(ringfolder, { withFileTypes: true })

    for (var idx = 0; idx < entries.length; idx++) {
        var entry = entries[idx]
        if (!entry.isFile() || !entry.name.startsWith(".")) continue

        var key = entry.name.slice(1)
        if (!/^\d+$/.test(key)) continue

        try {
            var raw = fs.readFileSync(path.join(ringfolder, entry.name), 'utf-8')
            var data = JSON.parse(raw)
            var zone = data[key]
            if (zone && zone.pascals) {
                zone.address = parseInt(key)
                zones.push(zone)
            }
        } catch (e) {
            continue
        }
    }

    zones.sort(function (a, b) { return a.address - b.address })
    return zones
}

// write a zone dot-file
egg.ring.write = function (ringfolder, zone) {
    var filename = "." + zone.address
    var content = {}
    content[zone.address] = {
        pascals: zone.pascals,
        enemies: zone.enemies || [],
        sysnapse: zone.sysnapse
    }
    fs.writeFileSync(
        path.join(ringfolder, filename),
        JSON.stringify(content, null, 4),
        'utf-8'
    )
}

// build sysnapse from pascal list
// each pascal gets 153 slots (120 + 24 + 6 + 2 + 1)
// the 1 at the bottom is the pascal's minschärfe
egg.ring.sysnapse = function (pascals) {
    var sysnapse = []
    for (var p = 0; p < pascals.length; p++) {
        var offset = p * PASCAL_SIZE
        sysnapse.push([offset, offset + PASCAL_SIZE - 1, pascals[p], []])
    }
    return sysnapse
}

// next zone address with 2 reserved neighbor slots
// zone at 260001 → reserved 260920, 261839 → next at 262758
egg.ring.next = function (existing) {
    if (existing.length === 0) return RING_START

    var max = RING_START
    for (var z = 0; z < existing.length; z++) {
        if (existing[z].address > max) max = existing[z].address
    }

    return max + ZONE_SPACING * ZONE_UNSCHÄRFE
}

// ─── REGISTRY ───
// look up ring/globe numbers by name from dot-files in D:\hyph\rings\ and D:\hyph\globes\
egg.registry = {}

egg.registry.ring = function (name) {
    return egg.registry.scan(path.join(hyph.root, "rings"), name)
}

egg.registry.globe = function (name) {
    return egg.registry.scan(path.join(hyph.root, "globes"), name)
}

// scan dot-files in a directory: find which number maps to the given name
egg.registry.scan = function (dir, name) {
    if (!fs.existsSync(dir)) return null
    var entries = fs.readdirSync(dir, { withFileTypes: true })
    for (var idx = 0; idx < entries.length; idx++) {
        if (!entries[idx].isFile() || !entries[idx].name.startsWith(".")) continue
        try {
            var raw = fs.readFileSync(path.join(dir, entries[idx].name), 'utf-8')
            var data = JSON.parse(raw)
            var keys = Object.keys(data)
            for (var k = 0; k < keys.length; k++) {
                if (data[keys[k]] === name) return keys[k]
            }
        } catch (e) { continue }
    }
    return null
}

// ─── LOOKUPS ───
egg.lookup = {}

// find zone containing a specific address
egg.lookup.ring = function (ring, address) {
    var ringfolder = path.join(hyph.root, "i", "rings", ring)
    var zones = egg.ring.read(ringfolder)

    for (var z = 0; z < zones.length; z++) {
        var zone_end = zones[z].address + ZONE_UNSCHÄRFE - 1

        if (address === zones[z].address) {
            return { zone: zones[z], slot: "minschärfe" }
        }

        if (address > zones[z].address && address <= zone_end) {
            var offset = address - zones[z].address - 1
            var pascal_index = Math.floor(offset / PASCAL_SIZE)
            if (pascal_index < zones[z].pascals.length) {
                return {
                    zone: zones[z],
                    pascal: zones[z].pascals[pascal_index],
                    slot: offset % PASCAL_SIZE
                }
            }
            return { zone: zones[z], slot: "unassigned" }
        }
    }

    return null
}

// find which zone a concept name lives in
egg.lookup.concept = function (ring, concept) {
    var ringfolder = path.join(hyph.root, "i", "rings", ring)
    var zones = egg.ring.read(ringfolder)

    for (var z = 0; z < zones.length; z++) {
        var pi = zones[z].pascals.indexOf(concept)
        if (pi !== -1) {
            return {
                zone: zones[z],
                pascal: concept,
                address: zones[z].address + 1 + (pi * PASCAL_SIZE)
            }
        }
    }

    return null
}

// ─── HATCH ───
// the full pipeline: raw hyph files → enriched bees ready for the egg
// called once per entity on load. checks which files need transformation
// and does it automatically. writes enriched files back to hyph.
//
// 1. resolve entity type and hyph path
// 2. ensure entity has a bumber (via prozess bumbers registry)
// 3. read all entity files recursively
// 4. assign thrindex to files that don't have one (persistent, stored in hyph)
// 5. seed globe + ring (ensure all concepts exist)
// 6. look up globe addresses for each concept's keygit
// 7. write enriched files back to hyph
// 8. return everything the App needs to populate the buffer

egg.hatch = function (handle) {
    // 1. resolve entity type
    var type = egg.entity.type(handle)
    var toc_base = egg.entity.toc(handle)

    // 2. ensure entnum
    var entnum_result = entnum.assign(handle)
    var ent = entnum_result.entnum

    // 3. read the TOC dot-file for this entity
    var toc_path = toc_base + "/." + handle
    var toc_result = hyph.read({ irpath: toc_path })
    if (!toc_result.exists) return { error: "entity not found: " + handle, path: toc_path }
    var toc = toc_result.data

    // 4. read entity files from egg/ using TOC irlinks
    // TOC has irlinks like "@seri--.name.first" → egg file at "egg/names/.first"
    // we walk the TOC tree to collect all irlinks, then read each file
    var irlinks = egg.toc.collect(toc, handle)
    var files = { ".": toc }

    for (var fi = 0; fi < irlinks.length; fi++) {
        var irlink = irlinks[fi]
        // strip the entity handle prefix: "@seri--.name.first" → "name.first"
        var stripped = irlink
        if (stripped.startsWith(handle + ".")) {
            stripped = stripped.slice(handle.length + 1)
        }

        // convert irlink segments to egg file path
        var segments = stripped.split(".")
        var last = segments[segments.length - 1]
        var middle = segments.slice(0, -1)

        // check for collection (irlinks ending with +)
        var prefix = "."
        if (last.endsWith("+")) {
            last = last.slice(0, -1)
            prefix = "collection."
        }

        var file_rel = middle.join("/")
        if (file_rel) file_rel += "/"
        file_rel += prefix + last

        var file_irpath = "egg/" + file_rel
        var file_result = hyph.read({ irpath: file_irpath })
        if (file_result.exists) {
            files[file_rel] = file_result.data
        }
    }

    // also read the full egg/ folder to catch files not in TOC
    var egg_folder = hyph.read.folder({ irpath: "egg" })
    if (egg_folder.exists) {
        var ekeys = Object.keys(egg_folder.data)
        for (var ek = 0; ek < ekeys.length; ek++) {
            var erel = ekeys[ek]
            if (erel === ".") continue
            // skip q/ subdirectory (qdna loaded separately by shread)
            if (erel.startsWith("q/") || erel === "q") continue
            // skip entities/ subdirectory (TOC files)
            if (erel.startsWith("entities/")) continue
            // skip .lnk shortcuts (already resolved by folder read)
            if (erel.endsWith(".lnk")) continue

            if (!files[erel]) {
                files[erel] = egg_folder.data[erel]
            }
        }
    }

    // 5. assign thrindexes
    var max_thrindex = 0
    var file_keys = Object.keys(files)
    for (var fk = 0; fk < file_keys.length; fk++) {
        var file = files[file_keys[fk]]
        if (file && typeof file === 'object' && file.thrindex && file.thrindex > max_thrindex) {
            max_thrindex = file.thrindex
        }
    }

    var enriched = 0
    for (var ek2 = 0; ek2 < file_keys.length; ek2++) {
        var rel = file_keys[ek2]
        var entry = files[rel]

        if (!entry || typeof entry !== 'object') continue
        if (rel === '.') continue
        if (Array.isArray(entry)) continue
        if (entry.thrindex) continue

        max_thrindex++
        entry.thrindex = max_thrindex
        enriched++

        hyph.ite({ irpath: "egg/" + rel, data: entry })
    }

    // update TOC with max thrindex count
    if (enriched > 0) {
        if (!toc.thrindex) toc.thrindex = {}
        toc.thrindex.count = max_thrindex
        hyph.ite({ irpath: toc_path, data: toc })
    }

    // 6. seed globe + ring using CORRECT numbers from entity's conditions
    var nested = egg.assemble(files)

    // find ring/globe numbers from entity's active ring, NOT from entnum
    var ring_num = null
    var globe_num = null

    if (nested.conditions && nested.conditions.active) {
        var ring_val = nested.conditions.active.ring
        if (ring_val && typeof ring_val === "string") {
            // "My Precious@--IRL" → ring name "My Precious"
            var ring_name = ring_val
            var at_pos = ring_name.lastIndexOf("@")
            if (at_pos > 0) ring_name = ring_name.slice(0, at_pos)
            ring_num = egg.registry.ring(ring_name)
        }

        var globe_val = nested.conditions.active.globe
        if (globe_val && typeof globe_val === "string") {
            var globe_name = globe_val
            var at_pos2 = globe_name.lastIndexOf("@")
            if (at_pos2 > 0) globe_name = globe_name.slice(0, at_pos2)
            globe_num = egg.registry.globe(globe_name)
        }
    }

    // fallback: ring and globe often share the same number
    if (!globe_num && ring_num) globe_num = ring_num
    if (!ring_num && globe_num) ring_num = globe_num

    var seeded = null
    if (ring_num && globe_num) {
        seeded = egg.seed(globe_num, ring_num, nested)
        console.log("egg.hatch: seeded", handle, "globe:", globe_num, "ring:", ring_num)
    } else {
        console.warn("egg.hatch: no ring/globe for", handle, "— skipping seed")
        seeded = { skipped: true }
    }

    // 7. look up globe/ring addresses for each concept
    var addresses = {}
    for (var ak = 0; ak < file_keys.length; ak++) {
        var arel = file_keys[ak]
        if (arel === '.') continue
        if (!files[arel] || typeof files[arel] !== 'object') continue
        if (Array.isArray(files[arel])) continue

        var irlink_parts = arel.split("/").map(function (seg) {
            if (seg.startsWith(".")) return seg.slice(1)
            if (seg.startsWith("collection.")) return seg.slice(11)
            return seg
        })
        var addr_irlink = irlink_parts.join(".")

        // use correct globe number for globe.walk
        if (globe_num) {
            var walked = globe.walk(globe_num, irlink_parts)
            if (walked.exists) {
                addresses[addr_irlink] = {
                    globe: walked.tofu,
                    steps: walked.steps
                }
            }
        }

        // use correct ring number for zone lookup
        if (ring_num) {
            var ring_address = egg.lookup.concept(ring_num, irlink_parts[irlink_parts.length - 1])
            if (ring_address) {
                if (!addresses[addr_irlink]) addresses[addr_irlink] = {}
                addresses[addr_irlink].zone = ring_address.address
                addresses[addr_irlink].pascal = ring_address.pascal
            }
        }
    }

    // 8. extract group from viewpoint filenames
    // viewpoint files: eastwesteros°character.admin.irl.@seri--
    // the part between ° and @ is the group (mofu)
    var group = null
    var mofu = null

    for (var vk = 0; vk < file_keys.length; vk++) {
        var vrel = file_keys[vk]
        if (vrel.indexOf("\u00B0") === -1) continue // no ° separator

        var vparts = vrel.split("/")
        var vfilename = vparts[vparts.length - 1]
        var vdeg = vfilename.indexOf("\u00B0")
        if (vdeg === -1) continue

        var vrest = vfilename.slice(vdeg + 1)
        var vat = vrest.lastIndexOf("@")
        if (vat > 0) {
            group = vrest.slice(0, vat).replace(/\.$/, "")
            break
        }
    }

    // seed the group path on the globe and get its address (mofu)
    if (group && globe_num) {
        var group_parts = group.split(".")
        egg.ensure.globe(globe_num, group_parts)
        var group_walked = globe.walk(globe_num, group_parts)
        if (group_walked.exists) {
            mofu = group_walked.tofu
        }
        console.log("egg.hatch: group", group, "→ mofu", mofu)
    }

    return {
        handle: handle,
        type: type,
        entnum: ent,
        thrindex: { count: max_thrindex },
        files: files,
        addresses: addresses,
        seeded: seeded,
        enriched: enriched,
        ring: ring_num,
        globe: globe_num,
        group: group,
        mofu: mofu
    }
}

// ─── TOC HELPERS ───
egg.toc = {}

// collect all irlinks from a TOC tree structure
// TOC format: { "seri--": ["@seri--", [["@seri--.name+", [...]], ...]] }
egg.toc.collect = function (toc, handle) {
    var results = []
    var name = handle.replace(/^@/, "")

    var tree = toc[name]
    if (!tree || !Array.isArray(tree)) return results

    function walk(arr) {
        for (var idx = 0; idx < arr.length; idx++) {
            var item = arr[idx]
            if (typeof item === "string") {
                results.push(item)
            } else if (Array.isArray(item)) {
                // [irlink, [children]]
                if (typeof item[0] === "string") results.push(item[0])
                if (Array.isArray(item[1])) walk(item[1])
            }
        }
    }

    // tree[1] is the children array
    if (Array.isArray(tree[1])) walk(tree[1])

    return results
}

// ─── ENTITY HELPERS ───
egg.entity = {}

egg.entity.type = function (handle) {
    if (handle.startsWith("@--")) return "trybe"
    if (handle.endsWith("--")) return "character"
    return "namespace"
}

// toc.path — where the TOC dot-file lives for this entity
// egg/entities/characters/.@seri-- , egg/entities/trybes/.@--berlin
egg.entity.toc = function (handle) {
    var type = egg.entity.type(handle)
    if (type === "character") return "egg/entities/characters"
    if (type === "trybe") return "egg/entities/trybes"
    return "egg/entities/namespaces"
}

// base path for all entity data — everything under egg/
egg.entity.path = function () {
    return "egg"
}

// ─── ASSEMBLE ───
// converts flat file map into nested object (same as init.attach on App)
// { "conditions/.active": {...} } → { conditions: { active: {...} } }
egg.assemble = function (files) {
    var node = {}

    // spread root dot-file
    if (files['.'] && typeof files['.'] === 'object' && !Array.isArray(files['.'])) {
        var dkeys = Object.keys(files['.'])
        for (var d = 0; d < dkeys.length; d++) {
            node[dkeys[d]] = files['.'][dkeys[d]]
        }
    }

    var paths = Object.keys(files)
    for (var idx = 0; idx < paths.length; idx++) {
        var rel = paths[idx]
        if (rel === '.') continue

        var segments = rel.split("/")
        var target = node

        for (var s = 0; s < segments.length; s++) {
            var segment = segments[s]
            if (segment.startsWith(".")) segment = segment.slice(1)
            if (segment.startsWith("collection.")) segment = segment.slice(11)

            if (s === segments.length - 1) {
                var content = files[rel]
                // unwrap wert: { wert: "value" } → "value" (only if wert is the ONLY key besides thrindex/bumber)
                if (content && typeof content === 'object') {
                    var ckeys = Object.keys(content).filter(function (k) { return k !== 'thrindex' })
                    if (ckeys.length === 1 && ckeys[0] === 'wert') {
                        content = content.wert
                    }
                }
                if (!content && target[segment] && typeof target[segment] === 'object') {
                    // skip empty over existing
                } else if (content && typeof content === 'object' && target[segment] && typeof target[segment] === 'object') {
                    var mkeys = Object.keys(content)
                    for (var m = 0; m < mkeys.length; m++) {
                        target[segment][mkeys[m]] = content[mkeys[m]]
                    }
                } else {
                    target[segment] = content
                }
            } else {
                if (!target[segment] || typeof target[segment] !== 'object') {
                    target[segment] = {}
                }
                target = target[segment]
            }
        }
    }

    return node
}

module.exports = egg
