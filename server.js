var WebSocket = require('ws')
var fs = require('fs')
var path = require('path')
var crypto = require('crypto')
var verfassung = require('./verfassung/verfassung_handlers')

var PORT = 3000

// ════════════════════════════════════════════
// PROZESS — the databrains server
// ════════════════════════════════════════════
// we are not joseph k. we are the prozess.
// we know why he's being prosecuted.
//
// responsibilities:
// 1. actor authentication (signup / signin)
// 2. thrigimental table (mint / lookup / resolve)
// 3. WebSocket bridge between hypr clients

// ════════════════════════════════════════════
// ACTOR STORAGE — flat json file for now
// ════════════════════════════════════════════
var ACTORS_PATH = path.join(__dirname, 'actors.json')

function loadActors() {
    try {
        if (fs.existsSync(ACTORS_PATH)) {
            return JSON.parse(fs.readFileSync(ACTORS_PATH, 'utf-8'))
        }
    } catch (e) {
        console.log('prozess: could not load actors — ' + e.message)
    }
    return {}
}

function saveActors(actors) {
    fs.writeFileSync(ACTORS_PATH, JSON.stringify(actors, null, 2), 'utf-8')
}

function hashPassword(password, salt) {
    if (!salt) salt = crypto.randomBytes(16).toString('hex')
    var hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
    return { hash: hash, salt: salt }
}

var actors = loadActors()

// ════════════════════════════════════════════
// THRIGIMENTAL TABLE
// ════════════════════════════════════════════
// Thrigit ranges (unicode codepoints):
//   Plain:   150k - 500k (0x249F0 - 0x7A120) — for birdfiles, 350k³ address space
//   Hyph:    500k - 900k (0x7A120 - 0xDBBA0) — 40x10k topic ranges per hyph
//   Cluster: 900k - 1M   (0xDBBA0 - 0xF4240) — 10x10k highest value concepts

var PLAIN_START = 0x249F0   // 150,000
var PLAIN_END = 0x7A120     // 500,000
var PLAIN_SIZE = PLAIN_END - PLAIN_START  // 350,000

var TABLE_PATH = path.join(__dirname, 'thrigimental.table.json')

var table = {}      // irpath → thrigit (hex array)
var reverse = {}    // thrigit key → irpath

function loadTable() {
    try {
        if (fs.existsSync(TABLE_PATH)) {
            var data = JSON.parse(fs.readFileSync(TABLE_PATH, 'utf-8'))
            if (data.entries) {
                data.entries.forEach(function (entry) {
                    table[entry[0]] = entry[1]
                    reverse[entry[1].join(',')] = entry[0]
                })
            }
            console.log('prozess: loaded ' + Object.keys(table).length + ' thrigits')
        }
    } catch (e) {
        console.log('prozess: fresh thrigimental table')
    }
}

function saveTable() {
    var entries = []
    for (var word in table) {
        entries.push([word, table[word]])
    }
    fs.writeFileSync(TABLE_PATH, JSON.stringify({
        range: { plain: [PLAIN_START, PLAIN_END], size: PLAIN_SIZE },
        count: entries.length,
        entries: entries
    }, null, 2), 'utf-8')
}

function randomPlainValue() {
    // Random value in plain range, returned as hex string
    var value = PLAIN_START + Math.floor(Math.random() * PLAIN_SIZE)
    return '0x' + value.toString(16).toUpperCase()
}

function generateThrigit() {
    // Generate 3 random hex values from plain range
    var thrigit = [randomPlainValue(), randomPlainValue(), randomPlainValue()]
    var key = thrigit.join(',')

    // Check for collision (extremely rare with 350k³ space)
    var attempts = 0
    while (reverse[key] && attempts < 10) {
        thrigit = [randomPlainValue(), randomPlainValue(), randomPlainValue()]
        key = thrigit.join(',')
        attempts++
    }

    return thrigit
}

function mint(word) {
    if (table[word]) return { word: word, thrigit: table[word], minted: false }
    var thrigit = generateThrigit()
    table[word] = thrigit
    reverse[thrigit.join(',')] = word
    return { word: word, thrigit: thrigit, minted: true }
}

function resolve(thrigit) {
    if (!thrigit || thrigit.length !== 3) return null
    return reverse[thrigit.join(',')] || null
}

var tableDirty = false
var saveTimer = null

function markTableDirty() {
    tableDirty = true
    if (!saveTimer) {
        saveTimer = setInterval(function () {
            if (tableDirty) {
                saveTable()
                tableDirty = false
            }
        }, 5000)
    }
}

loadTable()

// ════════════════════════════════════════════
// ACTOR AUTH HANDLERS
// ════════════════════════════════════════════
function actorKey(name) {
    return [name.first, name.middle || '', name.last].join('.').toLowerCase()
}

function handleAuth(data) {
    var key = actorKey(data.name)
    var actor = actors[key]

    if (!actor) {
        // signup — new actor
        var result = hashPassword(data.password)
        actors[key] = {
            name: data.name,
            hash: result.hash,
            salt: result.salt,
            created: Date.now()
        }
        saveActors(actors)
        console.log('prozess: new actor — ' + key)

        return {
            name: data.name,
            rom: {
                manual: {
                    home: 'actor.' + data.name.first.toLowerCase(),
                    is: [{ clade: 'identity', nucleo: 'actor' }]
                },
                mehr: {
                    name: {
                        first: [data.name.first],
                        middle: [data.name.middle || ''],
                        last: [data.name.last]
                    }
                }
            },
            cap: {
                manual: {
                    home: 'actor.' + data.name.first.toLowerCase() + '.active',
                    is: [{ clade: 'identity', nucleo: 'actor.session' }]
                },
                werte: {
                    authenticated: [true],
                    session: [Date.now()]
                }
            }
        }
    }

    // signin — existing actor
    var check = hashPassword(data.password, actor.salt)
    if (check.hash !== actor.hash) {
        throw new Error('wrong password')
    }

    console.log('prozess: actor signed in — ' + key)
    return {
        name: actor.name,
        rom: {
            manual: {
                home: 'actor.' + actor.name.first.toLowerCase(),
                is: [{ clade: 'identity', nucleo: 'actor' }]
            },
            mehr: {
                name: {
                    first: [actor.name.first],
                    middle: [actor.name.middle || ''],
                    last: [actor.name.last]
                }
            }
        },
        cap: {
            manual: {
                home: 'actor.' + actor.name.first.toLowerCase() + '.active',
                is: [{ clade: 'identity', nucleo: 'actor.session' }]
            },
            werte: {
                authenticated: [true],
                session: [Date.now()]
            }
        }
    }
}

// ════════════════════════════════════════════
// WEBSOCKET SERVER
// ════════════════════════════════════════════
var wss = new WebSocket.Server({ port: PORT })

// ════════════════════════════════════════════
// PRESENCE TRACKING
// ════════════════════════════════════════════
var clientId = 0
var clients = new Map()   // ws → { id, actor, connectedAt }

function broadcastPresence() {
    var activeActors = []
    clients.forEach(function (info) {
        if (info.actor) activeActors.push(info.actor)
    })
    var msg = JSON.stringify({
        type: 'presence.update',
        data: {
            activeCount: clients.size,
            authenticatedCount: activeActors.length,
            characters: activeActors
        }
    })
    clients.forEach(function (info, ws) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(msg)
        }
    })
}

function broadcastToOthers(senderWs, eventType, eventData) {
    var msg = JSON.stringify({
        type: eventType,
        data: eventData
    })
    clients.forEach(function (info, ws) {
        if (ws !== senderWs && ws.readyState === WebSocket.OPEN) {
            ws.send(msg)
        }
    })
}

wss.on('listening', function () {
    console.log('prozess: listening on port ' + PORT)
})

wss.on('connection', function (ws) {
    var thisId = ++clientId
    clients.set(ws, { id: thisId, actor: null, connectedAt: Date.now() })
    console.log('prozess: client ' + thisId + ' connected (' + clients.size + ' total)')
    broadcastPresence()

    ws.on('message', function (msg) {
        var parsed = null
        try {
            parsed = JSON.parse(msg.toString())
            var type = parsed.type
            var data = parsed.data
            var id = parsed.id

            var response = { id: id }
            var clientInfo = clients.get(ws)

            switch (type) {
                case 'actor.auth':
                    try {
                        response.data = handleAuth(data)
                        // Track authenticated actor for presence
                        if (clientInfo) {
                            clientInfo.actor = actorKey(data.name)
                        }
                        broadcastPresence()
                    } catch (e) {
                        response.error = e.message
                    }
                    break

                case 'thrigit.mint':
                    response.data = mint(data.word)
                    markTableDirty()
                    break

                case 'thrigit.bulk':
                    var results = { existing: [], minted: [] }
                    data.words.forEach(function (word) {
                        var result = mint(word)
                        if (result.minted) results.minted.push(result)
                        else results.existing.push(result)
                    })
                    if (results.minted.length > 0) markTableDirty()
                    response.data = results
                    break

                case 'thrigit.resolve':
                    response.data = { word: resolve(data.thrigit) }
                    break

                case 'files.sync':
                    var syncResults = []
                    data.files.forEach(function (file) {
                        var mintResult = mint(file.irpath)
                        syncResults.push({
                            irpath: file.irpath,
                            thrigit: mintResult.thrigit,
                            minted: mintResult.minted
                        })
                    })
                    if (syncResults.some(function (r) { return r.minted })) markTableDirty()
                    response.data = { files: syncResults, cursor: cursor, total: Object.keys(table).length }
                    console.log('prozess: synced ' + syncResults.length + ' files (' + syncResults.filter(function (r) { return r.minted }).length + ' new)')
                    break

                // ════════════════════════════════════
                // VERFASSUNG CRUD
                // ════════════════════════════════════
                case 'verfassung.save':
                    response.data = verfassung.handleSave(data, clientInfo ? clientInfo.actor : null)
                    // Broadcast to other clients for live sync
                    broadcastToOthers(ws, 'verfassung.event', {
                        action: 'save',
                        path: response.data.path,
                        data: data.data,
                        actor: clientInfo ? clientInfo.actor : null
                    })
                    break

                case 'verfassung.load':
                    response.data = verfassung.handleLoad(data)
                    break

                case 'verfassung.list':
                    response.data = verfassung.handleList(data)
                    break

                case 'verfassung.delete':
                    response.data = verfassung.handleDelete(data)
                    broadcastToOthers(ws, 'verfassung.event', {
                        action: 'delete',
                        path: data.path,
                        type: data.type,
                        concept: data.concept,
                        actor: clientInfo ? clientInfo.actor : null
                    })
                    break

                case 'verfassung.append_log':
                    response.data = verfassung.handleAppendLog(data)
                    break

                // ════════════════════════════════════
                // PREPLANNER CRUD
                // ════════════════════════════════════
                case 'preplanner.save':
                    // reuse verfassung save — path like 'preplanner/tasks/task/my-task/my-task.lile'
                    response.data = verfassung.handleSave(data, clientInfo ? clientInfo.actor : null)
                    break

                case 'preplanner.load':
                    response.data = verfassung.handleLoad(data)
                    break

                case 'preplanner.list': {
                    // list all .lile files under preplanner/
                    var preplannerDir = path.join(PROZESS_ROOT, 'preplanner')
                    var lileFiles = []
                    var walkLiles = function (dir) {
                        if (!fs.existsSync(dir)) return
                        var entries2 = fs.readdirSync(dir, { withFileTypes: true })
                        entries2.forEach(function (entry2) {
                            var full2 = path.join(dir, entry2.name)
                            if (entry2.isDirectory()) walkLiles(full2)
                            else if (entry2.name.endsWith('.lile')) {
                                var relPath = path.relative(PROZESS_ROOT, full2).replace(/\\/g, '/')
                                try {
                                    var content2 = fs.readFileSync(full2, 'utf-8')
                                    lileFiles.push({ path: relPath, data: content2.trim() ? JSON.parse(content2) : {} })
                                } catch (e2) {
                                    lileFiles.push({ path: relPath, data: {} })
                                }
                            }
                        })
                    }
                    walkLiles(preplannerDir)
                    console.log('preplanner: listed ' + lileFiles.length + ' liles')
                    response.data = { items: lileFiles }
                    break
                }

                case 'preplanner.create': {
                    // create a new lile with singular/plural folder structure
                    var kind2 = data.kind
                    var toqe2 = data.toqe
                    var singular2 = kind2.replace(/s$/, '')
                    var safeName2 = toqe2.toLowerCase().replace(/[^a-z0-9\s@\-.]/g, '').trim()
                    var relPath2 = 'preplanner/' + kind2 + '/' + singular2 + '/' + safeName2 + '/' + safeName2 + '.lile'
                    var lileData = {
                        iddress: [kind2, '.' + singular2, '.' + safeName2],
                        cap: singular2,
                        [singular2]: safeName2,
                        [safeName2]: data.body || {}
                    }
                    response.data = verfassung.handleSave({ path: relPath2, data: lileData }, clientInfo ? clientInfo.actor : null)
                    response.data.lile = lileData
                    response.data.relativePath = relPath2
                    break
                }

                case 'preplanner.delete':
                    response.data = verfassung.handleDelete(data)
                    break

                case 'presence.status':
                    var activeActors = []
                    clients.forEach(function (info) {
                        if (info.actor) activeActors.push(info.actor)
                    })
                    response.data = {
                        activeCount: clients.size,
                        authenticatedCount: activeActors.length,
                        characters: activeActors
                    }
                    break

                default:
                    response.error = 'unknown type: ' + type
            }

            ws.send(JSON.stringify(response))

        } catch (e) {
            console.log('prozess: message error — ' + e.message)
            ws.send(JSON.stringify({ error: e.message, id: parsed ? parsed.id : null }))
        }
    })

    ws.on('close', function () {
        var info = clients.get(ws)
        clients.delete(ws)
        console.log('prozess: client ' + (info ? info.id : '?') + ' disconnected (' + clients.size + ' remaining)')
        broadcastPresence()
    })
})

process.on('SIGINT', function () {
    if (tableDirty) saveTable()
    saveActors(actors)
    process.exit(0)
})
