// i.handlers.js — handlers for i.r.ead, i.r.walk, i.bumber.mint, i.r.ite
// operates on D:\I (or ./i-data on linux)
// reads go through the Level cache layer

var fs = require('fs')
var path = require('path')
var cache = require('./cache')
var qugit = require('./verfassung/qugit')

var handlers = {}

handlers.root = process.platform === 'win32'
    ? path.join('D:', 'I')
    : (process.env.I_ROOT || './i-data')

handlers.bumber = {}
handlers.bumber.path = path.join(handlers.root, '.bumber')

function ensure(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

// ── helpers ──
handlers.segments = function (irpath) {
    return irpath
        .replace(/^\\I\\?/, '')
        .replace(/^\/?/, '')
        .split(/[\\\/]/)
        .filter(Boolean)
}

handlers.resolve = function (segments) {
    return path.join(handlers.root, ...segments)
}

handlers.extensions = ['.json', '.lile', '.mdna', '.bumber', '.eggistry']

handlers.find = function (full) {
    if (fs.existsSync(full)) return full

    for (var idx = 0; idx < handlers.extensions.length; idx++) {
        if (fs.existsSync(full + handlers.extensions[idx])) {
            return full + handlers.extensions[idx]
        }
    }

    return null
}

// ── i.r.ead ──
// read a file or folder at an irpath.
// goes through Level cache first.
handlers.ead = function (data) {
    if (!data.irpath) throw new Error('irpath required')

    var segs = handlers.segments(data.irpath)

    // try cache first, fall back to disk, backfill cache
    return cache.through(data.irpath, segs).then(function (result) {
        if (result.source === 'miss') {
            return { exists: false, irpath: data.irpath }
        }

        return {
            exists: true,
            irpath: data.irpath,
            source: result.source,
            data: result.data
        }
    })
}

// ── i.r.walk ──
// recursively walk a tree under an irpath, return all files.
// walk does not go through cache — it reads the tree fresh.
handlers.walk = function (data) {
    if (!data.irpath) throw new Error('irpath required')

    var segs = handlers.segments(data.irpath)
    var full = handlers.resolve(segs)

    if (!fs.existsSync(full)) {
        return { exists: false, irpath: data.irpath, items: [] }
    }

    var items = []
    var depth = data.depth || 10

    function walk(dir, level) {
        if (level > depth) return
        if (!fs.existsSync(dir)) return

        var entries = fs.readdirSync(dir, { withFileTypes: true })
        entries.forEach(function (entry) {
            var entrypath = path.join(dir, entry.name)
            var rel = path.relative(full, entrypath).replace(/\\/g, '/')

            if (entry.isFile()) {
                var raw = null
                try {
                    raw = fs.readFileSync(entrypath, 'utf-8')
                    raw = JSON.parse(raw)
                } catch (e) {
                    // keep as string if not json
                }
                items.push({ path: rel, name: entry.name, type: 'file', data: raw })
            } else if (entry.isDirectory()) {
                items.push({ path: rel, name: entry.name, type: 'dir' })
                walk(entrypath, level + 1)
            }
        })
    }

    walk(full, 0)
    return { exists: true, irpath: data.irpath, items: items }
}

// ── i.bumber.mint ──
// read .bumber, increment, write back, return [n, 1]
handlers.bumber.mint = function () {
    ensure(handlers.root)

    var current = { bumber: 0 }

    if (fs.existsSync(handlers.bumber.path)) {
        try {
            current = JSON.parse(fs.readFileSync(handlers.bumber.path, 'utf-8'))
        } catch (e) {
            current = { bumber: 0 }
        }
    }

    var next = current.bumber + 1
    current.bumber = next

    fs.writeFileSync(handlers.bumber.path, JSON.stringify(current), 'utf-8')

    console.log('i.bumber.mint:', next)
    return { bumber: [next, 1] }
}

// ── i.r.ite ──
// write data to an irpath.
// after writing, invalidate the cache for that irpath.
handlers.ite = function (data) {
    if (!data.irpath) throw new Error('irpath required')

    var segs = handlers.segments(data.irpath)
    var full = handlers.resolve(segs)

    // if no extension, default to .json
    if (!path.extname(full)) full = full + '.json'

    ensure(path.dirname(full))

    var content = typeof data.data === 'string'
        ? data.data
        : JSON.stringify(data.data, null, 2)

    fs.writeFileSync(full, content, 'utf-8')

    // invalidate cache so next read gets fresh data
    cache.invalidate(data.irpath)

    console.log('i.r.ite:', full)

    return { written: true, irpath: data.irpath }
}

// ── qugit handlers ──
handlers.qugit = {}

handlers.qugit.lookup = function (data) {
    if (!data.irlink) throw new Error('irlink required')
    var result = qugit.lookup(data.irlink)
    return { found: result !== null, entry: result }
}

handlers.qugit.register = function (data) {
    if (!data.irlink) throw new Error('irlink required')
    return qugit.register(data.irlink, data.value, data.type || 'value')
}

handlers.qugit.replace = function (data) {
    if (!data.irlink) throw new Error('irlink required')
    return qugit.replace(data.irlink, data.value)
}

handlers.qugit.batch = function (data) {
    if (!data.wrapped) throw new Error('wrapped object required')
    var results = qugit.register.batch(data.wrapped)
    return { registered: results.length, results: results }
}

module.exports = handlers
