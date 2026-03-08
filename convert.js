// convert.js — one-time conversion of hyph files to bee-compatible format
// removes ink properties, restructures inline data, fixes old prototypes
//
// called via !convert.* messages from the App or directly:
//   !convert.all       — runs full conversion
//   !convert.ink       — removes ink from a folder
//   !convert.character — restructures inline character data into separate files
//   !convert.bees      — fixes old bee prototype format

var fs = require('fs')
var path = require('path')
var hyph = require('./hyph.handlers')

var convert = {}

// ─── REMOVE INK ───
// walks a directory recursively and removes ink properties from all JSON files
convert.ink = function ({ folder }) {
    var full = path.join(hyph.root, folder)
    if (!fs.existsSync(full)) return { error: "folder not found: " + folder }

    var changed = []

    function walk(dir) {
        var entries = fs.readdirSync(dir, { withFileTypes: true })
        for (var idx = 0; idx < entries.length; idx++) {
            var entry = entries[idx]
            var abs = path.join(dir, entry.name)

            if (entry.isDirectory()) {
                walk(abs)
                continue
            }

            if (entry.isFile()) {
                var raw = fs.readFileSync(abs, 'utf-8').trim()
                if (!raw) continue

                try {
                    var obj = JSON.parse(raw)
                    if (obj.ink) {
                        delete obj.ink
                        fs.writeFileSync(abs, JSON.stringify(obj, null, 4), 'utf-8')
                        changed.push(path.relative(hyph.root, abs))
                    }
                } catch (e) {
                    // not JSON, skip
                }
            }
        }
    }

    walk(full)
    return { changed: changed }
}

// ─── FIX OLD BEE PROTOTYPES ───
// converts old { cap: "buffer", "irlink+": { bee: { key, value } } } to simple { wert: value }
convert.bees = function ({ folder }) {
    var full = path.join(hyph.root, folder)
    if (!fs.existsSync(full)) return { error: "folder not found: " + folder }

    var fixed = []

    function walk(dir) {
        var entries = fs.readdirSync(dir, { withFileTypes: true })
        for (var idx = 0; idx < entries.length; idx++) {
            var entry = entries[idx]
            var abs = path.join(dir, entry.name)

            if (entry.isDirectory()) {
                walk(abs)
                continue
            }

            if (entry.isFile()) {
                var raw = fs.readFileSync(abs, 'utf-8').trim()
                if (!raw) continue

                try {
                    var obj = JSON.parse(raw)

                    // detect old bee prototype: has "cap" property
                    if (obj.cap === "buffer") {
                        var beekey = null
                        var objkeys = Object.keys(obj)
                        for (var k = 0; k < objkeys.length; k++) {
                            if (objkeys[k].endsWith("+")) {
                                beekey = objkeys[k]
                                break
                            }
                        }

                        if (beekey && obj[beekey] && obj[beekey].bee && obj[beekey].bee.value) {
                            var wert = obj[beekey].bee.value.wert
                            fs.writeFileSync(abs, JSON.stringify({ wert: wert }, null, 4), 'utf-8')
                            fixed.push({ file: path.relative(hyph.root, abs), wert: wert })
                        }
                    }
                } catch (e) {
                    // not JSON, skip
                }
            }
        }
    }

    walk(full)
    return { fixed: fixed }
}

// ─── RESTRUCTURE CHARACTER ───
// takes inline character data and splits into separate files + builds TOC
convert.character = function ({ handle }) {
    var etype = handle.startsWith("@--") ? "trybes" : handle.endsWith("--") ? "characters" : "namespaces"
    var base = path.join(hyph.root, "i", etype)
    var dotfile = path.join(base, "." + handle)

    if (!fs.existsSync(dotfile)) return { error: "dot-file not found: " + handle }

    var raw = fs.readFileSync(dotfile, 'utf-8').trim()
    if (!raw) return { error: "empty dot-file for: " + handle }

    var obj = JSON.parse(raw)

    // remove ink
    delete obj.ink

    // already converted? (has bumbers array)
    if (obj.bumbers) return { already: true, handle: handle }

    // find the inline data key — the key matching the handle
    var datakey = null
    var keys = Object.keys(obj)
    for (var k = 0; k < keys.length; k++) {
        if (keys[k] === handle) {
            datakey = keys[k]
            break
        }
    }

    if (!datakey || typeof obj[datakey] !== 'object') {
        return { error: "no inline data found for: " + handle }
    }

    var data = obj[datakey]

    // create folder structure
    var chardir = path.join(base, handle)
    if (!fs.existsSync(chardir)) fs.mkdirSync(chardir, { recursive: true })

    var created = []

    function writedeep(parentdir, obj, prefix) {
        var objkeys = Object.keys(obj)

        for (var idx = 0; idx < objkeys.length; idx++) {
            var key = objkeys[idx]
            var value = obj[key]
            var irlink = prefix + "." + key

            if (value === null || value === undefined) {
                // null leaf — empty dot-file
                var nullfile = path.join(parentdir, "." + key)
                if (!fs.existsSync(nullfile)) {
                    fs.writeFileSync(nullfile, '', 'utf-8')
                    created.push(path.relative(hyph.root, nullfile))
                }
            } else if (Array.isArray(value)) {
                // collection — check if objects or primitives
                var collfile = path.join(parentdir, "collection." + key)
                if (!fs.existsSync(collfile)) {
                    fs.writeFileSync(collfile, JSON.stringify({
                        unit: "collection",
                        collection: value
                    }, null, 4), 'utf-8')
                    created.push(path.relative(hyph.root, collfile))
                }
            } else if (typeof value === 'object') {
                // nested object — create subfolder + dot-file + recurse
                var subdir = path.join(parentdir, key)
                if (!fs.existsSync(subdir)) fs.mkdirSync(subdir, { recursive: true })

                var subdot = path.join(parentdir, "." + key)
                if (!fs.existsSync(subdot)) {
                    fs.writeFileSync(subdot, '', 'utf-8')
                    created.push(path.relative(hyph.root, subdot))
                }

                writedeep(subdir, value, irlink)
            } else {
                // primitive leaf — wert file
                var wertfile = path.join(parentdir, "." + key)
                if (!fs.existsSync(wertfile)) {
                    fs.writeFileSync(wertfile, JSON.stringify({ wert: value }, null, 4), 'utf-8')
                    created.push(path.relative(hyph.root, wertfile))
                }
            }
        }
    }

    writedeep(chardir, data, handle)

    // build TOC
    var toc = convert.toc(data, handle)

    // get bumber from registry
    var bumbersfile = path.join(hyph.root, "i", "init", "collection.buffers")
    var bumber = null
    if (fs.existsSync(bumbersfile)) {
        var bumbersdata = JSON.parse(fs.readFileSync(bumbersfile, 'utf-8'))
        if (bumbersdata.collection) bumber = bumbersdata.collection[handle]
    }

    // rebuild dot-file as TOC
    var name = handle.replace(/^@/, '').replace(/^--/, '')
    var newdot = {}
    newdot.bumbers = bumber ? [bumber] : []
    newdot[name] = [handle, toc]

    fs.writeFileSync(dotfile, JSON.stringify(newdot, null, 4), 'utf-8')
    created.push(path.relative(hyph.root, dotfile) + " (rebuilt as TOC)")

    return { handle: handle, created: created }
}

// ─── BUILD TOC ───
// recursively builds table of contents from nested object
convert.toc = function (obj, prefix) {
    var toc = []
    var keys = Object.keys(obj)

    for (var idx = 0; idx < keys.length; idx++) {
        var key = keys[idx]
        var value = obj[key]
        var irlink = prefix + "." + key

        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
            // nested object — parent entry with children
            var subtoc = convert.toc(value, irlink)
            toc.push([irlink + "+", subtoc])
        } else {
            // leaf
            toc.push(irlink)
        }
    }

    return toc
}

// ─── FULL CONVERSION ───
// runs all conversion steps across the entire hyph (except init files)
convert.all = function () {
    var results = {}

    // 1. remove ink from all non-init folders
    results.ink = {}
    var folders = ["i/characters", "i/trybes", "i/namespaces", "i/rings", "q"]
    for (var f = 0; f < folders.length; f++) {
        var full = path.join(hyph.root, folders[f])
        if (fs.existsSync(full)) {
            results.ink[folders[f]] = convert.ink({ folder: folders[f] })
        }
    }

    // 2. fix old bee prototypes in characters
    results.bees = convert.bees({ folder: "i/characters" })

    // 3. restructure inline characters
    results.characters = []
    var chardir = path.join(hyph.root, "i", "characters")
    if (fs.existsSync(chardir)) {
        var entries = fs.readdirSync(chardir, { withFileTypes: true })
        for (var idx = 0; idx < entries.length; idx++) {
            if (entries[idx].isFile() && entries[idx].name.startsWith(".@")) {
                var handle = entries[idx].name.slice(1) // remove leading dot
                var raw = fs.readFileSync(path.join(chardir, entries[idx].name), 'utf-8').trim()
                if (!raw) continue

                try {
                    var obj = JSON.parse(raw)
                    // needs conversion if has ink or no bumbers array
                    if (obj.ink || !obj.bumbers) {
                        results.characters.push(convert.character({ handle: handle }))
                    } else {
                        results.characters.push({ handle: handle, already: true })
                    }
                } catch (e) {
                    results.characters.push({ handle: handle, error: e.message })
                }
            }
        }
    }

    // 4. restructure inline trybes
    results.trybes = []
    var trybedir = path.join(hyph.root, "i", "trybes")
    if (fs.existsSync(trybedir)) {
        var tentries = fs.readdirSync(trybedir, { withFileTypes: true })
        for (var t = 0; t < tentries.length; t++) {
            if (tentries[t].isFile() && tentries[t].name.startsWith(".@")) {
                var thandle = tentries[t].name.slice(1)
                var traw = fs.readFileSync(path.join(trybedir, tentries[t].name), 'utf-8').trim()
                if (!traw) continue

                try {
                    var tobj = JSON.parse(traw)
                    if (tobj.ink) {
                        delete tobj.ink
                        fs.writeFileSync(path.join(trybedir, tentries[t].name), JSON.stringify(tobj, null, 4), 'utf-8')
                        results.trybes.push({ handle: thandle, cleaned: true })
                    } else {
                        results.trybes.push({ handle: thandle, already: true })
                    }
                } catch (e) {
                    results.trybes.push({ handle: thandle, error: e.message })
                }
            }
        }
    }

    return results
}

module.exports = convert
