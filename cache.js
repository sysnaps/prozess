// cache.js — Level-backed cache for \I\R\L reads
//
// pipeline:
//   1. check Level (fast key-value lookup by irlink)
//   2. if miss → read from \I\R\L filesystem
//   3. store what we read into Level
//   4. return
//
// Level is a flat lookup table. keys are irlinks, values are JSON strings.
// this sits between the App and the filesystem so repeated reads
// skip disk entirely.

var path = require('path')
var fs = require('fs')

var cache = {}
cache.db = null
cache.root = null   // I_ROOT path for filesystem fallback

cache.init = function (root) {
    cache.root = root

    var dbpath = path.join(root, '.cache')

    // Level v10 is ESM-only — we use the level package
    // which re-exports classic for require()
    var Level = require('level').Level
    cache.db = new Level(dbpath, { valueEncoding: 'json' })

    console.log('cache: initialized at ' + dbpath)
}

// ── cache.get ──
// returns data from Level or null
cache.get = function (irlink) {
    if (!cache.db) return Promise.resolve(null)

    return cache.db.get(irlink).catch(function () {
        return null
    })
}

// ── cache.set ──
// stores data in Level
cache.set = function (irlink, data) {
    if (!cache.db) return Promise.resolve()

    return cache.db.put(irlink, data).catch(function (err) {
        console.log('cache: set error — ' + err.message)
    })
}

// ── cache.drop ──
// removes a key from Level (when data changes on disk)
cache.drop = function (irlink) {
    if (!cache.db) return Promise.resolve()

    return cache.db.del(irlink).catch(function () {
        // key might not exist, that is fine
    })
}

// ── cache.through ──
// the main pipeline: Level first, filesystem fallback, backfill Level.
//
// irlink: the irlink string (used as cache key)
// segments: the parsed path segments for filesystem lookup
//
// returns: { source: "cache"|"disk"|"miss", data: ... }
cache.through = function (irlink, segments) {
    if (!cache.db) {
        // no cache available — go straight to disk
        return Promise.resolve(cache.disk(segments))
    }

    return cache.get(irlink).then(function (cached) {
        if (cached !== null && cached !== undefined) {
            return { source: 'cache', data: cached }
        }

        // cache miss — read from filesystem
        var result = cache.disk(segments)

        if (result.data !== null) {
            // backfill: store in Level for next time
            return cache.set(irlink, result.data).then(function () {
                return { source: 'disk', data: result.data }
            })
        }

        return { source: 'miss', data: null }
    })
}

// ── cache.disk ──
// reads from the \I\R\L filesystem directly.
// this is the same logic as handle.ead but returns raw data.
cache.disk = function (segments) {
    if (!cache.root) return { data: null }

    var full = path.join(cache.root, ...segments)

    if (!fs.existsSync(full)) {
        // try known extensions
        var extensions = ['.json', '.lile', '.mdna', '.bumber', '.eggistry']
        for (var idx = 0; idx < extensions.length; idx++) {
            if (fs.existsSync(full + extensions[idx])) {
                full = full + extensions[idx]
                break
            }
        }
        if (!fs.existsSync(full)) {
            return { data: null }
        }
    }

    var stat = fs.statSync(full)

    if (stat.isFile()) {
        var raw = fs.readFileSync(full, 'utf-8')
        try {
            return { data: JSON.parse(raw) }
        } catch (e) {
            return { data: raw }
        }
    }

    if (stat.isDirectory()) {
        var entries = fs.readdirSync(full, { withFileTypes: true })
        var children = entries.map(function (entry) {
            return {
                name: entry.name,
                type: entry.isDirectory() ? 'dir' : 'file'
            }
        })
        return { data: { type: 'dir', children: children } }
    }

    return { data: null }
}

// ── cache.invalidate ──
// called after a write to \I\R\L — drops the cached version
// so the next read picks up the fresh data.
cache.invalidate = function (irlink) {
    return cache.drop(irlink)
}

module.exports = cache
