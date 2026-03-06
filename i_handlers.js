// i_handlers.js — handlers for i.r.ead, i.r.walk, i.bumber.mint
// operates on D:\I (or ./irl-data on linux)

var fs = require('fs')
var path = require('path')

var I_ROOT = process.platform === 'win32'
    ? path.join('D:', 'I')
    : (process.env.I_ROOT || './i-data')

var BUMBER_PATH = path.join(I_ROOT, '.bumber')

function ensure(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

// ── i.r.ead ──
// read a file or folder at an irpath
// irpath like '\\I\\R\\q\\Reusables\\Pointput' → D:\I\R\q\Reusables\Pointput
function handle_ead(data) {
    if (!data.irpath) throw new Error('irpath required')

    // normalize irpath to filesystem path
    var segments = data.irpath
        .replace(/^\\I\\?/, '')
        .replace(/^\/?/, '')
        .split(/[\\\/]/)
        .filter(Boolean)

    var full = path.join(I_ROOT, ...segments)

    if (!fs.existsSync(full)) {
        // check if its a file with a known extension
        var extensions = ['.json', '.lile', '.mdna', '.bumber', '.eggistry']
        for (var ext of extensions) {
            if (fs.existsSync(full + ext)) {
                full = full + ext
                break
            }
        }
        if (!fs.existsSync(full)) {
            return { exists: false, irpath: data.irpath }
        }
    }

    var stat = fs.statSync(full)

    if (stat.isFile()) {
        var raw = fs.readFileSync(full, 'utf-8')
        var parsed = null
        try { parsed = JSON.parse(raw) } catch (e) { parsed = raw }
        return { exists: true, irpath: data.irpath, type: 'file', data: parsed }
    }

    if (stat.isDirectory()) {
        var entries = fs.readdirSync(full, { withFileTypes: true })
        var children = entries.map(function (entry) {
            return {
                name: entry.name,
                type: entry.isDirectory() ? 'dir' : 'file'
            }
        })
        return { exists: true, irpath: data.irpath, type: 'dir', children: children }
    }
}

// ── i.r.walk ──
// recursively walk a tree under an irpath, return all files
function handle_walk(data) {
    if (!data.irpath) throw new Error('irpath required')

    var segments = data.irpath
        .replace(/^\\I\\?/, '')
        .replace(/^\/?/, '')
        .split(/[\\\/]/)
        .filter(Boolean)

    var full = path.join(I_ROOT, ...segments)

    if (!fs.existsSync(full)) {
        return { exists: false, irpath: data.irpath, items: [] }
    }

    var items = []
    var depth = data.depth || 10

    function walk(dir, current_depth) {
        if (current_depth > depth) return
        if (!fs.existsSync(dir)) return

        var entries = fs.readdirSync(dir, { withFileTypes: true })
        entries.forEach(function (entry) {
            var entry_path = path.join(dir, entry.name)
            var rel = path.relative(full, entry_path).replace(/\\/g, '/')

            if (entry.isFile()) {
                var raw = null
                try {
                    raw = fs.readFileSync(entry_path, 'utf-8')
                    raw = JSON.parse(raw)
                } catch (e) {
                    // keep as string if not json
                }
                items.push({ path: rel, name: entry.name, type: 'file', data: raw })
            }
            else if (entry.isDirectory()) {
                items.push({ path: rel, name: entry.name, type: 'dir' })
                walk(entry_path, current_depth + 1)
            }
        })
    }

    walk(full, 0)
    return { exists: true, irpath: data.irpath, items: items }
}

// ── i.bumber.mint ──
// read .bumber, increment the count, write back, return [n, 1]
// the bumber file is { bumber: N } where N is the last assigned number
// returns [N+1, 1] — first number is the bumber id, second is buffer page 1
function handle_bumber_mint(data) {
    ensure(I_ROOT)

    var current = { bumber: 0 }

    if (fs.existsSync(BUMBER_PATH)) {
        try {
            current = JSON.parse(fs.readFileSync(BUMBER_PATH, 'utf-8'))
        } catch (e) {
            current = { bumber: 0 }
        }
    }

    var next = current.bumber + 1
    current.bumber = next

    fs.writeFileSync(BUMBER_PATH, JSON.stringify(current), 'utf-8')

    console.log('i.bumber.mint:', next)
    return { bumber: [next, 1] }
}

// ── i.r.ite ──
// write data to an irpath (ite because w.r.ite and the r is in i.r)
function handle_ite(data) {
    if (!data.irpath) throw new Error('irpath required')

    var segments = data.irpath
        .replace(/^\\I\\?/, '')
        .replace(/^\/?/, '')
        .split(/[\\\/]/)
        .filter(Boolean)

    var full = path.join(I_ROOT, ...segments)

    // if no extension, default to .json
    if (!path.extname(full)) full = full + '.json'

    ensure(path.dirname(full))

    var content = typeof data.data === 'string'
        ? data.data
        : JSON.stringify(data.data, null, 2)

    fs.writeFileSync(full, content, 'utf-8')
    console.log('i.r.ite:', full)

    return { written: true, irpath: data.irpath }
}

module.exports = {
    I_ROOT: I_ROOT,
    handle_ead: handle_ead,
    handle_walk: handle_walk,
    handle_bumber_mint: handle_bumber_mint,
    handle_ite: handle_ite
}
