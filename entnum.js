// entnum.js — entity number assignment
// sequential counter for entities (characters, trybes, namespaces)
// separate from bumber — entnum identifies entities, not buffers.
//
// entnum = [1000000, 1000000 + N] → 12-digit id: "000000000001"
// the first digit of entnum[0] encodes arrival type:
//   1 = new thrigit
//   2 = range migration (value unchanged, address moved)
//
// registry lives at D:\hyph\i\init\collection.entnums
// { count: N, collection: { "@handle": num, ... } }

var hyph = require('./hyph.handlers')

var entnum = {}

// ─── REGISTRY PATH ───
entnum.path = "i/init/collection.entnums"

// ─── LOAD ───
entnum.registry = null

entnum.load = function () {
    var result = hyph.read({ irpath: entnum.path })
    if (result.exists && result.data) {
        entnum.registry = result.data
    } else {
        entnum.registry = { count: 0, collection: {} }
    }
    return entnum.registry
}

// ─── SAVE ───
entnum.save = function () {
    if (!entnum.registry) return
    hyph.ite({ irpath: entnum.path, data: entnum.registry })
}

// ─── ASSIGN ───
// assign an entnum for an entity handle
// if already assigned, return the existing one
// returns { entnum: [1000000, 1000000 + N], handle, created }
entnum.assign = function (handle) {
    if (!entnum.registry) entnum.load()

    if (entnum.registry.collection[handle] !== undefined) {
        var existing = entnum.registry.collection[handle]
        return {
            entnum: [1000000, 1000000 + existing],
            handle: handle,
            num: existing,
            created: false
        }
    }

    entnum.registry.count++
    var num = entnum.registry.count
    entnum.registry.collection[handle] = num

    entnum.save()

    console.log("entnum.assign:", handle, "→", num)

    return {
        entnum: [1000000, 1000000 + num],
        handle: handle,
        num: num,
        created: true
    }
}

// ─── GET ───
// lookup entnum without assigning
entnum.get = function (handle) {
    if (!entnum.registry) entnum.load()

    var num = entnum.registry.collection[handle]
    if (num === undefined) return { entnum: null, handle: handle }

    return {
        entnum: [1000000, 1000000 + num],
        handle: handle,
        num: num
    }
}

// ─── STRING ───
// entnum to 12-digit string: num 2 → "000000000002"
entnum.string = function (num) {
    return String(num).padStart(12, '0')
}

// ─── LIST ───
entnum.list = function () {
    if (!entnum.registry) entnum.load()
    return entnum.registry
}

// ─── INIT ───
entnum.init = function () {
    entnum.load()
    console.log("entnum: loaded", entnum.registry.count, "entities")
}

module.exports = entnum
