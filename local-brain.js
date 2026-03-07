// local-brain.js — runs on the laptop, connects to render for signaling
// then serves data over WebRTC data channels directly to browsers
//
// Usage: node local-brain.js
// Optional: node local-brain.js --brain-id my-brain --signal wss://databrain-we87.onrender.com

var werift = require('werift')
var WebSocket = require('ws')
var irl = require('./irl_handlers')
var hyph = require('./hyph.handlers')
var resolve = require('./resolve')
var globe = require('./globe')
var bumbers = require('./bumbers')
var stripeEnergy = require('./stripe-energy')

// ─── CONFIG ───
var BRAIN_ID = process.argv.includes('--brain-id')
    ? process.argv[process.argv.indexOf('--brain-id') + 1]
    : 'default-brain'

var SIGNAL_URL = process.argv.includes('--signal')
    ? process.argv[process.argv.indexOf('--signal') + 1]
    : 'wss://databrain-we87.onrender.com'

// ─── INIT ───
irl.init()
bumbers.init()
console.log('local-brain: data root at ' + irl.IRL_ROOT)
console.log('local-brain: brain-id = ' + BRAIN_ID)
console.log('local-brain: connecting to signaling server at ' + SIGNAL_URL)

// ─── ACTIVE PEER CONNECTIONS ───
var peers = {} // clientId → { pc, dataChannel }

// ─── SIGNALING CONNECTION ───
var ws = null
var reconnectTimer = null

function connectSignaling() {
    ws = new WebSocket(SIGNAL_URL)

    ws.on('open', function () {
        console.log('local-brain: connected to signaling server')
        ws.send(JSON.stringify({
            type: 'brain.register',
            brainId: BRAIN_ID
        }))
    })

    ws.on('message', function (raw) {
        try {
            var msg = JSON.parse(raw)
            handleSignalingMessage(msg)
        } catch (e) {
            console.error('local-brain: bad message — ' + e.message)
        }
    })

    ws.on('close', function () {
        console.log('local-brain: signaling disconnected, reconnecting in 4s...')
        scheduleReconnect()
    })

    ws.on('error', function (err) {
        console.error('local-brain: signaling error — ' + err.message)
    })
}

function scheduleReconnect() {
    if (reconnectTimer) clearTimeout(reconnectTimer)
    reconnectTimer = setTimeout(connectSignaling, 4000)
}

// ─── SIGNALING MESSAGE HANDLER ───
function handleSignalingMessage(msg) {
    switch (msg.type) {
        case 'brain.registered':
            console.log('local-brain: registered as ' + BRAIN_ID)
            break

        case 'signal.request':
            console.log('local-brain: connection request from client ' + msg.clientId)
            break

        case 'signal.offer':
            handleOffer(msg.clientId, msg.sdp)
            break

        case 'signal.ice':
            handleIceCandidate(msg.clientId, msg.candidate)
            break

        case 'relay.message':
            handleRelayMessage(msg.clientId, msg.payload)
            break

        default:
            break
    }
}

// ─── WEBRTC PEER CONNECTION (werift API) ───
async function handleOffer(clientId, sdp) {
    try {
        var pc = new werift.RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        })

        pc.onIceCandidate.subscribe(function (candidate) {
            sendSignal({
                type: 'signal.ice',
                clientId: clientId,
                candidate: candidate.toJSON()
            })
        })

        pc.onDataChannel.subscribe(function (channel) {
            console.log('local-brain: data channel opened with client ' + clientId)
            peers[clientId] = { pc: pc, dataChannel: channel }

            channel.message.subscribe(function (data) {
                // data comes as Buffer from werift
                var str = typeof data === 'string' ? data : data.toString('utf-8')
                handleDataMessage(clientId, str)
            })

            channel.onClose.subscribe(function () {
                console.log('local-brain: data channel closed for client ' + clientId)
                cleanupPeer(clientId)
            })
        })

        pc.onConnectionStateChange.subscribe(function () {
            var state = pc.connectionState
            if (state === 'failed' || state === 'disconnected' || state === 'closed') {
                console.log('local-brain: peer ' + clientId + ' ' + state)
                cleanupPeer(clientId)
            }
        })

        // set remote offer
        await pc.setRemoteDescription({
            type: 'offer',
            sdp: sdp
        })

        // create and send answer
        var answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)

        sendSignal({
            type: 'signal.answer',
            clientId: clientId,
            sdp: pc.localDescription.sdp
        })

        // store peer (channel will be added when ondatachannel fires)
        if (!peers[clientId]) {
            peers[clientId] = { pc: pc, dataChannel: null }
        }

        console.log('local-brain: sent answer to client ' + clientId)

    } catch (err) {
        console.error('local-brain: offer handling failed — ' + err.message)
    }
}

async function handleIceCandidate(clientId, candidate) {
    var peer = peers[clientId]
    if (!peer || !peer.pc) return

    try {
        await peer.pc.addIceCandidate(candidate)
    } catch (err) {
        console.error('local-brain: ICE candidate failed — ' + err.message)
    }
}

function cleanupPeer(clientId) {
    var peer = peers[clientId]
    if (!peer) return
    try { if (peer.dataChannel) peer.dataChannel.close() } catch (e) {}
    try { peer.pc.close() } catch (e) {}
    delete peers[clientId]
}

// ─── DATA MESSAGE HANDLER ───
function handleDataMessage(clientId, raw) {
    var parsed = null
    try {
        parsed = JSON.parse(raw)
    } catch (e) {
        sendToClient(clientId, { error: 'invalid JSON' })
        return
    }

    var response = { id: parsed.id || null, data: null, error: null }
    var type = parsed.type
    var data = parsed.data || {}

    try {
        switch (type) {
            case 'hyph.ead':
                response.data = hyph.ead(data)
                break
            case 'hyph.ead.folder':
                response.data = hyph.ead.folder(data)
                break
            case 'hyph.ite':
                response.data = hyph.ite(data)
                break
            case 'hyph.resolve':
                response.data = resolve.irlink(data)
                break
            case '!globe.walk':
                response.data = globe.walk(data.entity, data.points)
                break
            case '!globe.thrigit':
                response.data = globe.thrigit(data)
                break
            case '!globe.place':
                response.data = globe.place(data)
                break
            case '!globe.reslice':
                response.data = globe.reslice(data.folder, data.start, data.end)
                break
            case '!globe.read':
                response.data = globe.read(data.folder)
                break
            case '!globe.find':
                response.data = globe.find(data.folder, data.name)
                break
            case '!globe.lookup':
                response.data = globe.lookup.deep(data.entity, data.tofu)
                break
            case '!globe.entity':
                response.data = globe.entity(data.entity, data.name)
                break
            case '!globe.demon':
                response.data = globe.demon(data.parent, data.type)
                break
            case '!globe.demon.value':
                response.data = globe.demon.value(data.entity, data.type, data.amount)
                break
            case '!bumbers.assign':
                response.data = bumbers.assign(data)
                break
            case '!bumbers.get':
                response.data = bumbers.get(data)
                break
            case '!bumbers.list':
                response.data = bumbers.list()
                break
            case '!bumbers.batch':
                response.data = bumbers.batch(data)
                break
            case 'ping':
                response.data = { pong: true }
                break
            case 'irl.energy.buy':
                stripeEnergy.createCheckoutSession(data.character || 'unknown', function (err, result) {
                    var resp = { id: parsed.id, data: null, error: null }
                    if (err) resp.error = err.message
                    else resp.data = result
                    sendToClient(clientId, resp)
                })
                return // async — don't send response now
            case 'irl.energy.check':
                stripeEnergy.checkSession(data.sessionId, function (err, result) {
                    var resp = { id: parsed.id, data: null, error: null }
                    if (err) resp.error = err.message
                    else resp.data = result
                    sendToClient(clientId, resp)
                })
                return // async
            default:
                response.error = 'unknown type: ' + type
        }
    } catch (e) {
        response.error = e.message
    }

    sendToClient(clientId, response)
}

// ─── RELAY FALLBACK ───
function handleRelayMessage(clientId, payload) {
    var parsed = payload
    var response = { id: parsed.id || null, data: null, error: null }
    var type = parsed.type
    var data = parsed.data || {}

    // async handlers
    if (type === 'irl.energy.buy') {
        stripeEnergy.createCheckoutSession(data.character || 'unknown', function (err, result) {
            var resp = { id: parsed.id, data: null, error: null }
            if (err) resp.error = err.message
            else resp.data = result
            sendSignal({ type: 'relay.response', clientId: clientId, payload: resp })
        })
        return
    }
    if (type === 'irl.energy.check') {
        stripeEnergy.checkSession(data.sessionId, function (err, result) {
            var resp = { id: parsed.id, data: null, error: null }
            if (err) resp.error = err.message
            else resp.data = result
            sendSignal({ type: 'relay.response', clientId: clientId, payload: resp })
        })
        return
    }

    try {
        switch (type) {
            case 'hyph.ead': response.data = hyph.ead(data); break
            case 'hyph.ead.folder': response.data = hyph.ead.folder(data); break
            case 'hyph.ite': response.data = hyph.ite(data); break
            case 'hyph.resolve': response.data = resolve.irlink(data); break
            case '!globe.walk': response.data = globe.walk(data.entity, data.points); break
            case '!globe.thrigit': response.data = globe.thrigit(data); break
            case '!globe.place': response.data = globe.place(data); break
            case '!globe.reslice': response.data = globe.reslice(data.folder, data.start, data.end); break
            case '!globe.read': response.data = globe.read(data.folder); break
            case '!globe.find': response.data = globe.find(data.folder, data.name); break
            case '!globe.lookup': response.data = globe.lookup.deep(data.entity, data.tofu); break
            case '!globe.entity': response.data = globe.entity(data.entity, data.name); break
            case '!globe.demon': response.data = globe.demon(data.parent, data.type); break
            case '!globe.demon.value': response.data = globe.demon.value(data.entity, data.type, data.amount); break
            case '!bumbers.assign': response.data = bumbers.assign(data); break
            case '!bumbers.get': response.data = bumbers.get(data); break
            case '!bumbers.list': response.data = bumbers.list(); break
            case '!bumbers.batch': response.data = bumbers.batch(data); break
            case 'ping': response.data = { pong: true }; break
            default: response.error = 'unknown type: ' + type
        }
    } catch (e) {
        response.error = e.message
    }

    sendSignal({
        type: 'relay.response',
        clientId: clientId,
        payload: response
    })
}

// ─── SEND HELPERS ───
function sendToClient(clientId, msg) {
    var peer = peers[clientId]
    if (!peer || !peer.dataChannel) {
        // fallback: relay through render
        sendSignal({
            type: 'relay.response',
            clientId: clientId,
            payload: msg
        })
        return
    }
    try {
        peer.dataChannel.send(JSON.stringify(msg))
    } catch (e) {
        // data channel broken, relay instead
        sendSignal({
            type: 'relay.response',
            clientId: clientId,
            payload: msg
        })
    }
}

function sendSignal(msg) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg))
    }
}

// ─── START ───
connectSignaling()

// graceful shutdown
process.on('SIGINT', function () {
    console.log('local-brain: shutting down...')
    Object.keys(peers).forEach(cleanupPeer)
    if (ws) ws.close()
    process.exit(0)
})

console.log('local-brain: running. press Ctrl+C to stop.')
