// bumbers.js — buffer number assignment
// the prozess is the single source of truth for bumber counting
// bumber = buffer number. a unique identifier for a SharedArrayBuffer.
// bumber assignment happens via async await so no two buffers get the same number.
//
// the registry lives at D:\hyph\i\init\collection.buffers
// { count: N, collection: { "irlink": bumber, ... } }

var fs = require('fs')
var path = require('path')
var hyph = require('./hyph.handlers')

var bumbers = {}

// ─── REGISTRY PATH ───
bumbers.path = "i/init/collection.buffers"

// ─── LOAD ───
// reads the registry from hyph into memory
bumbers.registry = null

bumbers.load = function () {
    var result = hyph.read({ irpath: bumbers.path })
    if (result.exists && result.data) {
        bumbers.registry = result.data
    } else {
        bumbers.registry = { count: 0, collection: {} }
    }
    return bumbers.registry
}

// ─── SAVE ───
// writes the registry back to hyph
bumbers.save = function () {
    if (!bumbers.registry) return
    hyph.ite({ irpath: bumbers.path, data: bumbers.registry })
}

// ─── ASSIGN ───
// assign a new bumber for an irlink
// if the irlink already has a bumber, return the existing one
// otherwise increment count, assign, save, return
bumbers.assign = function ({ irlink }) {
    if (!bumbers.registry) bumbers.load()

    // already assigned?
    if (bumbers.registry.collection[irlink] !== undefined) {
        return {
            bumber: bumbers.registry.collection[irlink],
            irlink: irlink,
            created: false
        }
    }

    // increment and assign
    bumbers.registry.count++
    var bumber = bumbers.registry.count
    bumbers.registry.collection[irlink] = bumber

    // persist
    bumbers.save()

    console.log("bumbers.assign:", irlink, "→", bumber)

    return {
        bumber: bumber,
        irlink: irlink,
        created: true
    }
}

// ─── GET ───
// get the bumber for an irlink without assigning
bumbers.get = function ({ irlink }) {
    if (!bumbers.registry) bumbers.load()

    var bumber = bumbers.registry.collection[irlink]
    if (bumber === undefined) return { bumber: null, irlink: irlink }

    return { bumber: bumber, irlink: irlink }
}

// ─── LIST ───
// return the full registry
bumbers.list = function () {
    if (!bumbers.registry) bumbers.load()
    return bumbers.registry
}

// ─── BATCH ───
// assign bumbers for multiple irlinks at once
// returns { assigned: [{irlink, bumber, created}, ...] }
bumbers.batch = function ({ irlinks }) {
    if (!bumbers.registry) bumbers.load()

    var assigned = []
    var any_new = false

    for (var idx = 0; idx < irlinks.length; idx++) {
        var irlink = irlinks[idx]

        if (bumbers.registry.collection[irlink] !== undefined) {
            assigned.push({
                bumber: bumbers.registry.collection[irlink],
                irlink: irlink,
                created: false
            })
        } else {
            bumbers.registry.count++
            var bumber = bumbers.registry.count
            bumbers.registry.collection[irlink] = bumber
            assigned.push({
                bumber: bumber,
                irlink: irlink,
                created: true
            })
            any_new = true
        }
    }

    // only write if something changed
    if (any_new) bumbers.save()

    return { assigned: assigned }
}

// ─── INIT ───
// load registry on startup
bumbers.init = function () {
    bumbers.load()
    console.log("bumbers: loaded", bumbers.registry.count, "bumbers")
}

module.exports = bumbers
