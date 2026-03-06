// verfassung/qugit.js — server-side qugit storage and lookup
//
// the app (i.verfassung) handles wrapping and creation.
// the prozess stores the irlink → thrigit mappings
// and handles lookups when the app asks "does this irlink already have a thrigit?"
//
// for now every thrigit is [211001, 211001, 211001] (meaningless valid).
// the registry tracks what has been registered so we can
// reassign meaningful thrigits later.

var fs = require('fs')
var path = require('path')

var qugit = {}

// ── storage ──
qugit.registry = {}        // irlink → { thrigit, type, value }
qugit.path = null           // filepath for persistence

qugit.init = function (root) {
    qugit.path = path.join(root, '.qugit.registry.json')

    if (fs.existsSync(qugit.path)) {
        try {
            qugit.registry = JSON.parse(fs.readFileSync(qugit.path, 'utf-8'))
            console.log('qugit: loaded ' + Object.keys(qugit.registry).length + ' entries')
        } catch (e) {
            qugit.registry = {}
            console.log('qugit: fresh registry')
        }
    }
}

qugit.save = function () {
    if (!qugit.path) return
    fs.writeFileSync(qugit.path, JSON.stringify(qugit.registry, null, 2), 'utf-8')
}

// ── qugit.lookup ──
// checks if an irlink already has a registered qugit.
// returns the entry or null.
qugit.lookup = function (irlink) {
    if (qugit.registry[irlink]) {
        return qugit.registry[irlink]
    }
    return null
}

// ── qugit.register ──
// stores a new irlink → qugit mapping.
// if the irlink is already registered, returns the existing one.
// type: "key" or "value"
qugit.register = function (irlink, value, type) {
    var existing = qugit.lookup(irlink)
    if (existing) return { registered: false, entry: existing }

    var entry = {
        irlink: irlink,
        value: value,
        type: type,
        thrigit: [211001, 211001, 211001]
    }

    qugit.registry[irlink] = entry
    qugit.dirty = true
    return { registered: true, entry: entry }
}

// ── qugit.replace ──
// replaces the value at an irlink with a new value.
// the thrigit changes to the new value's thrigit (meaningless for now).
qugit.replace = function (irlink, value) {
    var existing = qugit.lookup(irlink)
    if (!existing) {
        return qugit.register(irlink, value, 'value')
    }

    existing.value = value
    existing.thrigit = [211001, 211001, 211001]
    qugit.dirty = true
    return { replaced: true, entry: existing }
}

// ── batch registration ──
// the app sends an entire wrapped object.
// we walk it and register every irlink we find.
qugit.register.batch = function (wrapped, results) {
    if (!results) results = []

    if (wrapped === null || wrapped === undefined) return results

    // leaf qugit
    if (wrapped.fofu !== undefined && wrapped.irlink) {
        var result = qugit.register(wrapped.irlink, wrapped.value, wrapped.thrigit)
        results.push(result)
        return results
    }

    // wrapped object node: { key: {qugit}, value: ... }
    if (wrapped.key && wrapped.value !== undefined) {
        if (wrapped.key.irlink) {
            results.push(qugit.register(wrapped.key.irlink, wrapped.key.value, 'key'))
        }
        qugit.register.batch(wrapped.value, results)
        return results
    }

    // object with multiple wrapped keys
    if (typeof wrapped === 'object' && !Array.isArray(wrapped)) {
        var keys = Object.keys(wrapped)
        for (var idx = 0; idx < keys.length; idx++) {
            qugit.register.batch(wrapped[keys[idx]], results)
        }
        return results
    }

    // array
    if (Array.isArray(wrapped)) {
        for (var a = 0; a < wrapped.length; a++) {
            qugit.register.batch(wrapped[a], results)
        }
    }

    return results
}

// ── periodic save ──
qugit.dirty = false
qugit.timer = null

qugit.start = function () {
    qugit.timer = setInterval(function () {
        if (qugit.dirty) {
            qugit.save()
            qugit.dirty = false
        }
    }, 5000)
}

module.exports = qugit
