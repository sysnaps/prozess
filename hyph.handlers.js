// hyph.handlers.js — reads from D:\hyph
// the hyph is the new data home. files have no extension.
// they are dot-prefixed: .@seri-- , .NappTabs , .buffers

var fs = require('fs')
var path = require('path')

var hyph = {}

hyph.root = process.platform === 'win32'
    ? path.join('D:', 'hyph')
    : (process.env.HYPH_ROOT || './hyph-data')

hyph.ead = function (data) {
    if (!data.irpath) throw new Error('irpath required')

    var segments = data.irpath
        .replace(/^\\?hyph\\?/i, '')
        .replace(/^\/?/, '')
        .split(/[\\\/]/)
        .filter(Boolean)

    var full = path.join(hyph.root, ...segments)

    if (!fs.existsSync(full)) {
        return { exists: false, irpath: data.irpath }
    }

    var stat = fs.statSync(full)

    if (stat.isFile()) {
        var raw = fs.readFileSync(full, 'utf-8')
        try {
            return { exists: true, irpath: data.irpath, data: JSON.parse(raw) }
        } catch (e) {
            return { exists: true, irpath: data.irpath, data: raw }
        }
    }

    if (stat.isDirectory()) {
        var entries = fs.readdirSync(full, { withFileTypes: true })
        var children = entries.map(function (entry) {
            return { name: entry.name, type: entry.isDirectory() ? 'dir' : 'file' }
        })
        return { exists: true, irpath: data.irpath, data: { type: 'dir', children: children } }
    }

    return { exists: false, irpath: data.irpath }
}

// recursive read — returns the dot-prefixed file + all subfolders with their files
// { exists: true, data: { ".": {...}, "conditions/.active": {...}, ... } }
hyph.ead.folder = function (data) {
    if (!data.irpath) throw new Error('irpath required')

    var segments = data.irpath
        .replace(/^\\?hyph\\?/i, '')
        .replace(/^\/?/, '')
        .split(/[\\\/]/)
        .filter(Boolean)

    var full = path.join(hyph.root, ...segments)

    if (!fs.existsSync(full)) {
        return { exists: false, irpath: data.irpath }
    }

    var stat = fs.statSync(full)
    if (!stat.isDirectory()) {
        return { exists: false, irpath: data.irpath, error: 'not a directory' }
    }

    var files = {}

    function walk(dir, prefix) {
        var entries = fs.readdirSync(dir, { withFileTypes: true })
        for (var idx = 0; idx < entries.length; idx++) {
            var entry = entries[idx]
            var rel = prefix ? prefix + '/' + entry.name : entry.name
            var abs = path.join(dir, entry.name)

            if (entry.isFile()) {
                var raw = fs.readFileSync(abs, 'utf-8')
                try {
                    files[rel] = JSON.parse(raw)
                } catch (e) {
                    files[rel] = raw
                }
            } else if (entry.isDirectory()) {
                walk(abs, rel)
            }
        }
    }

    // also read the dot-prefixed file at the parent level
    var parent = path.dirname(full)
    var dot = path.join(parent, '.' + path.basename(full))
    if (fs.existsSync(dot) && fs.statSync(dot).isFile()) {
        var dotraw = fs.readFileSync(dot, 'utf-8')
        try {
            files['.'] = JSON.parse(dotraw)
        } catch (e) {
            files['.'] = dotraw
        }
    }

    walk(full, '')

    return { exists: true, irpath: data.irpath, data: files }
}

hyph.ite = function (data) {
    if (!data.irpath) throw new Error('irpath required')

    var segments = data.irpath
        .replace(/^\\?hyph\\?/i, '')
        .replace(/^\/?/, '')
        .split(/[\\\/]/)
        .filter(Boolean)

    var full = path.join(hyph.root, ...segments)

    // no extension added — hyph files have none
    var dir = path.dirname(full)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

    var content = typeof data.data === 'string'
        ? data.data
        : JSON.stringify(data.data, null, 2)

    fs.writeFileSync(full, content, 'utf-8')

    console.log('hyph.ite:', full)
    return { written: true, irpath: data.irpath }
}

module.exports = hyph
