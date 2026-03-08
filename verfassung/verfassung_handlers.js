// verfassung/verfassung_handlers.js
//
// Server-side CRUD handlers for fassungen and connections.
//
// Folder structure:
//   verfassung/plocks/@Seri--/colors.json
//   verfassung/options/@Seri--/red.json
//   verfassung/connections/siblings/@Seri--/⥟⊙blue‡⊙red∈⬡colors@Seri--.json
//   verfassung/connections/plockContainsOption/@Seri--/⥟⬡colors∋⊙red@Seri--.json
//   verfassung/connection_log/log_2026-02-18.json
//
// The client (save_locally.js) builds the full relative path and sends it.
// This handler resolves it relative to D:\prozess and ensures dirs exist.

var fs = require('fs')
var path = require('path')

var BASE_DIR = path.join(__dirname)
var PROZESS_ROOT = path.join(BASE_DIR, '..')

/**
 * Ensures directory exists (sync, recursive).
 */
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }
}

/**
 * Resolves a relative verfassung path to an absolute path.
 * Input:  'verfassung/plocks/@Seri--/colors.json'
 * Output: 'D:\prozess\verfassung\plocks\@Seri--\colors.json'
 */
function resolvePath(relPath) {
    return path.join(PROZESS_ROOT, relPath)
}

/**
 * Recursively finds all .json files in a directory tree.
 * Walks into @owner subdirs and relationship subdirs.
 */
function findJsonFiles(dir) {
    var results = []

    if (!fs.existsSync(dir)) return results

    var entries = fs.readdirSync(dir, { withFileTypes: true })

    entries.forEach(function (entry) {
        var fullPath = path.join(dir, entry.name)

        if (entry.isDirectory()) {
            // Recurse into subdirectories (@owner folders, relationship folders)
            results = results.concat(findJsonFiles(fullPath))
        } else if (entry.isFile() && entry.name.endsWith('.json')) {
            results.push(fullPath)
        }
    })

    return results
}

// ─── SAVE ───────────────────────────────────────────────

/**
 * Handles verfassung.save — write an object to disk.
 *
 * data: { path: string, data: object }
 *
 * The path is a relative path from the prozess root, e.g.:
 *   'verfassung/plocks/@Seri--/colors.json'
 *   'verfassung/connections/siblings/@Seri--/⥟⊙blue‡⊙red∈⬡colors@Seri--.json'
 *
 * Returns: { saved: true, path: string }
 */
function handleSave(data, senderActor) {
    if (!data.path) {
        throw new Error('verfassung.save requires path')
    }

    var filePath = resolvePath(data.path)
    var fassungData = data.data

    // Ensure the directory exists (creates @owner and relationship folders)
    ensureDir(path.dirname(filePath))

    // Stamp metadata
    if (fassungData) {
        if (!fassungData.time) fassungData.time = {}
        if (senderActor && !fassungData.creator) {
            fassungData.creator = senderActor
        }
    }

    fs.writeFileSync(filePath, JSON.stringify(fassungData, null, 2), 'utf-8')

    var relPath = data.path
    console.log('verfassung: saved ' + relPath)

    return { saved: true, path: relPath }
}

// ─── LOAD ───────────────────────────────────────────────

/**
 * Handles verfassung.load — read an object from disk.
 *
 * data: { path: string }
 *
 * Returns: { data: object|null }
 */
function handleLoad(data) {
    if (!data.path) {
        throw new Error('verfassung.load requires path')
    }

    var filePath = resolvePath(data.path)

    if (!fs.existsSync(filePath)) {
        return { data: null }
    }

    try {
        var content = fs.readFileSync(filePath, 'utf-8')
        return { data: JSON.parse(content) }
    } catch (e) {
        console.log('verfassung: load error — ' + e.message)
        return { data: null }
    }
}

// ─── LIST ───────────────────────────────────────────────

/**
 * Handles verfassung.list — list all objects of a given type.
 * Walks the entire directory tree recursively to find all .json files
 * inside @owner subdirs.
 *
 * data: { type: string, owner?: string, relationship?: string }
 *
 * Examples:
 *   { type: 'plock' }                         → all plocks across all owners
 *   { type: 'plock', owner: '@Seri--' }        → only @Seri--'s plocks
 *   { type: 'connection' }                     → all connections
 *   { type: 'connection', relationship: 'siblings' } → only sibling connections
 *
 * Returns: { items: object[] }
 */
function handleList(data) {
    if (!data.type) throw new Error('verfassung.list requires type')

    var dir

    if (data.type === 'connection') {
        if (data.relationship) {
            // Specific relationship subfolder
            dir = path.join(BASE_DIR, 'connections', data.relationship)
        } else {
            // All connections
            dir = path.join(BASE_DIR, 'connections')
        }
    } else {
        dir = path.join(BASE_DIR, data.type + 's')
    }

    // Filter by owner if specified
    if (data.owner) {
        dir = path.join(dir, data.owner)
    }

    var files = findJsonFiles(dir)
    var items = []

    files.forEach(function (file) {
        try {
            var content = fs.readFileSync(file, 'utf-8')
            items.push(JSON.parse(content))
        } catch (e) {
            console.log('verfassung: list skip ' + path.basename(file) + ' — ' + e.message)
        }
    })

    return { items: items }
}

// ─── DELETE ─────────────────────────────────────────────

/**
 * Handles verfassung.delete — remove an object file.
 *
 * data: { path: string }
 *
 * Returns: { deleted: true }
 */
function handleDelete(data) {
    if (!data.path) {
        throw new Error('verfassung.delete requires path')
    }

    var filePath = resolvePath(data.path)

    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
        console.log('verfassung: deleted ' + data.path)
    }

    return { deleted: true }
}

// ─── APPEND LOG ─────────────────────────────────────────

/**
 * Handles verfassung.append_log — append an entry to a daily log file.
 * Creates the file as a JSON array if it doesn't exist.
 *
 * data: { path: string, entry: object }
 *
 * Returns: { appended: true }
 */
function handleAppendLog(data) {
    if (!data.path || !data.entry) {
        throw new Error('verfassung.append_log requires path and entry')
    }

    var filePath = resolvePath(data.path)
    ensureDir(path.dirname(filePath))

    var entries = []

    if (fs.existsSync(filePath)) {
        try {
            var content = fs.readFileSync(filePath, 'utf-8')
            entries = JSON.parse(content)
            if (!Array.isArray(entries)) entries = [entries]
        } catch (e) {
            entries = []
        }
    }

    entries.push(data.entry)
    fs.writeFileSync(filePath, JSON.stringify(entries, null, 2), 'utf-8')

    return { appended: true }
}

module.exports = {
    handleSave: handleSave,
    handleLoad: handleLoad,
    handleList: handleList,
    handleDelete: handleDelete,
    handleAppendLog: handleAppendLog
}
