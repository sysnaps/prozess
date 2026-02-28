// irl_handlers.js — Server-side handlers for the I.R.L. filesystem
// Manages .ship and .fassung files in D:\I\R\L

var fs = require('fs')
var path = require('path')

// detect OS — use D:\I\R\L on Windows, ./irl-data on Linux (render.com)
var IRL_ROOT = process.platform === 'win32' ? path.join('D:', 'I', 'R', 'L') : (process.env.IRL_ROOT || './irl-data')

// base path for preplanner ships
// D:\I\R\L\Higherrarchies\Higherrarchy\preplanner\Highrarchy\plans\archy\complexity
var PREPLANNER_BASE = path.join(
    IRL_ROOT, 'Higherrarchies', 'Higherrarchy', 'preplanner',
    'Highrarchy', 'plans', 'archy', 'complexity'
)

// base path for backstage characters
// D:\I\R\L\Higherrarchies\Higherrarchy\backstage\Highrarchy\characters\archy\collection\users
var BACKSTAGE_BASE = path.join(
    IRL_ROOT, 'Higherrarchies', 'Higherrarchy', 'backstage',
    'Highrarchy', 'characters', 'archy', 'collection', 'users'
)

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }
}

// create base directories on startup
function init() {
    ensureDir(PREPLANNER_BASE)
    ensureDir(BACKSTAGE_BASE)
    console.log('irl: directories ready at ' + IRL_ROOT)
}

// ─── CHARACTER (SIGN UP / SIGN IN) ────────────────────

function characterPath(name) {
    // @first-middle-last → saved as first.last.middle
    // @first-last → saved as first.last
    // @first → saved as first
    var clean = name.replace(/^@/, '')
    var parts = clean.split('-').filter(Boolean)

    var first = parts[0] || 'unknown'
    var middle = parts.length > 2 ? parts.slice(1, -1).join('.') : null
    var last = parts.length > 1 ? parts[parts.length - 1] : null

    // folder order: first.last.middle
    var segments = [first]
    if (last) segments.push(last)
    if (middle) segments.push(middle)

    var folderPath = path.join(BACKSTAGE_BASE, ...segments)
    var fileName = '@' + clean + '.fassung'
    return path.join(folderPath, fileName)
}

function handleSignUp(data) {
    if (!data.name || !data.password) {
        throw new Error('name and password required')
    }

    var name = data.name
    if (!name.startsWith('@')) name = '@' + name

    var filePath = characterPath(name)

    // check if character already exists
    if (fs.existsSync(filePath)) {
        throw new Error('character already exists')
    }

    var crypto = require('crypto')
    var salt = crypto.randomBytes(16).toString('hex')
    var hash = crypto.pbkdf2Sync(data.password, salt, 10000, 64, 'sha512').toString('hex')

    var character = {
        name: {
            full: name,
            first: data.first || '',
            middle: data.middle || '',
            last: data.last || ''
        },
        auth: {
            hash: hash,
            salt: salt
        },
        time: {
            created: Date.now()
        }
    }

    ensureDir(path.dirname(filePath))
    fs.writeFileSync(filePath, JSON.stringify(character, null, 2), 'utf-8')
    console.log('irl: character created — ' + name + ' at ' + filePath)

    return {
        name: character.name,
        time: character.time
    }
}

function handleSignIn(data) {
    if (!data.name || !data.password) {
        throw new Error('name and password required')
    }

    var name = data.name
    if (!name.startsWith('@')) name = '@' + name

    var filePath = characterPath(name)

    if (!fs.existsSync(filePath)) {
        throw new Error('character not found')
    }

    var raw = fs.readFileSync(filePath, 'utf-8')
    var character = JSON.parse(raw)

    var crypto = require('crypto')
    var check = crypto.pbkdf2Sync(data.password, character.auth.salt, 10000, 64, 'sha512').toString('hex')

    if (check !== character.auth.hash) {
        throw new Error('wrong password')
    }

    console.log('irl: signed in — ' + name)

    return {
        name: character.name,
        time: character.time
    }
}

// ─── SHIP SAVE / LOAD / LIST ──────────────────────────

function shipFolderPath(level, title, dotcase) {
    // level is the archy level like 'everests', 'tasks', etc
    if (dotcase) {
        // dot.case → folders
        var segments = dotcase.split('.').map(function (s) { return s.trim() }).filter(Boolean)
        return path.join(PREPLANNER_BASE, level, ...segments)
    }
    // no dot.case → title as folder name (spaces preserved)
    var folderName = title || 'untitled'
    return path.join(PREPLANNER_BASE, level, 'ships', folderName)
}

function handleShipSave(data) {
    if (!data.character) throw new Error('not signed in')
    if (!data.title) throw new Error('ship needs a title')

    var level = data.level || 'tasks'
    var title = data.title
    var dotcase = data.dotcase || null
    var character = data.character

    var folder = shipFolderPath(level, title, dotcase)
    var fileName = character + '.ship'
    var filePath = path.join(folder, fileName)

    ensureDir(folder)

    var shipData = data.data || {}

    // stamp time
    if (!shipData.time) shipData.time = {}
    if (!shipData.time.created) shipData.time.created = Date.now()
    shipData.time.modified = Date.now()

    fs.writeFileSync(filePath, JSON.stringify(shipData, null, 2), 'utf-8')
    console.log('irl: ship saved — ' + filePath)

    // relative path from IRL_ROOT for client reference
    var relPath = path.relative(IRL_ROOT, filePath).replace(/\\/g, '/')

    return { saved: true, path: relPath }
}

function handleShipLoad(data) {
    if (!data.path) throw new Error('path required')

    var filePath = path.join(IRL_ROOT, data.path)
    if (!fs.existsSync(filePath)) {
        return { data: null }
    }

    var raw = fs.readFileSync(filePath, 'utf-8')
    return { data: raw.trim() ? JSON.parse(raw) : {} }
}

function handleShipList(data) {
    var ships = []
    var searchDir = PREPLANNER_BASE

    // optionally filter by level
    if (data && data.level) {
        searchDir = path.join(PREPLANNER_BASE, data.level)
    }

    walkFiles(searchDir, '.ship', function (filePath) {
        var relPath = path.relative(IRL_ROOT, filePath).replace(/\\/g, '/')
        try {
            var raw = fs.readFileSync(filePath, 'utf-8')
            var parsed = raw.trim() ? JSON.parse(raw) : {}
            ships.push({ path: relPath, data: parsed })
        } catch (e) {
            ships.push({ path: relPath, data: {} })
        }
    })

    console.log('irl: listed ' + ships.length + ' ships')
    return { items: ships }
}

// ─── FASSUNG SAVE / LOAD / LIST ──────────────────────

function handleFassungSave(data) {
    if (!data.path) throw new Error('path required')

    var filePath = path.join(IRL_ROOT, data.path)
    ensureDir(path.dirname(filePath))

    var fassungData = data.data || {}
    if (!fassungData.time) fassungData.time = {}
    if (!fassungData.time.created) fassungData.time.created = Date.now()
    fassungData.time.modified = Date.now()

    fs.writeFileSync(filePath, JSON.stringify(fassungData, null, 2), 'utf-8')
    console.log('irl: fassung saved — ' + filePath)

    return { saved: true, path: data.path }
}

function handleFassungList(data) {
    var fassungen = []
    var searchDir = IRL_ROOT

    if (data && data.base) {
        searchDir = path.join(IRL_ROOT, data.base)
    }

    walkFiles(searchDir, '.fassung', function (filePath) {
        var relPath = path.relative(IRL_ROOT, filePath).replace(/\\/g, '/')
        try {
            var raw = fs.readFileSync(filePath, 'utf-8')
            var parsed = raw.trim() ? JSON.parse(raw) : {}
            fassungen.push({ path: relPath, data: parsed })
        } catch (e) {
            fassungen.push({ path: relPath, data: {} })
        }
    })

    return { items: fassungen }
}

// ─── UTILS ────────────────────────────────────────────

function walkFiles(dir, extension, callback) {
    if (!fs.existsSync(dir)) return

    var entries = fs.readdirSync(dir, { withFileTypes: true })
    entries.forEach(function (entry) {
        var full = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            walkFiles(full, extension, callback)
        } else if (entry.name.endsWith(extension)) {
            callback(full)
        }
    })
}

// ─── EXPORTS ──────────────────────────────────────────

module.exports = {
    init: init,
    handleSignUp: handleSignUp,
    handleSignIn: handleSignIn,
    handleShipSave: handleShipSave,
    handleShipLoad: handleShipLoad,
    handleShipList: handleShipList,
    handleFassungSave: handleFassungSave,
    handleFassungList: handleFassungList,
    IRL_ROOT: IRL_ROOT,
    PREPLANNER_BASE: PREPLANNER_BASE,
    BACKSTAGE_BASE: BACKSTAGE_BASE
}
