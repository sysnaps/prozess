// prozess.js — runs on the laptop, connects to render for signaling
// then serves data over WebRTC data channels directly to browsers
//
// Usage: node prozess.js
// Optional: node prozess.js --brain-id my-brain --signal wss://databrain-we87.onrender.com

var werift = require('werift')
var WebSocket = require('ws')
var incoming = require('./seri/incoming')
const { eggs } = require('./seri/egg')

// ─── CONFIG ───
var BRAIN_ID = process.argv.includes('--brain-id')
    ? process.argv[process.argv.indexOf('--brain-id') + 1]
    : 'default-brain'

var SIGNAL_URL = process.argv.includes('--signal')
    ? process.argv[process.argv.indexOf('--signal') + 1]
    : 'wss://databrain-we87.onrender.com'

// ─── INIT ───
eggs.init()
console.log('prozess: brain-id = ' + BRAIN_ID)
console.log('prozess: connecting to signaling server at ' + SIGNAL_URL)

// ─── ACTIVE PEER CONNECTIONS ───
var peers = {} // clientId → { pc, dataChannel }

// ─── SIGNALING CONNECTION ───
var ws = null
var reconnectTimer = null
var keepaliveTimer = null

function connectSignaling() {
    ws = new WebSocket(SIGNAL_URL)

    ws.on('open', function () {
        console.log('prozess: connected to signaling server')
        ws.send(JSON.stringify({
            type: 'brain.register',
            brainId: BRAIN_ID
        }))

        if (keepaliveTimer) clearInterval(keepaliveTimer)
        keepaliveTimer = setInterval(function () {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'brain.ping', brainId: BRAIN_ID }))
            }
        }, 25000)
    })

    ws.on('message', function (raw) {
        try {
            var msg = JSON.parse(raw)
            handleSignalingMessage(msg)
        } catch (e) {
            console.error('prozess: bad message — ' + e.message)
        }
    })

    ws.on('close', function () {
        if (keepaliveTimer) clearInterval(keepaliveTimer)
        keepaliveTimer = null
        console.log('prozess: signaling disconnected, reconnecting in 4s...')
        scheduleReconnect()
    })

    ws.on('error', function (err) {
        console.error('prozess: signaling error — ' + err.message)
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
            console.log('prozess: registered as ' + BRAIN_ID)
            break
        case 'signal.request':
            console.log('prozess: connection request from client ' + msg.clientId)
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

// ─── WEBRTC PEER CONNECTION ───
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
            console.log('prozess: data channel opened with client ' + clientId)
            peers[clientId] = { pc: pc, dataChannel: channel }

            channel.onMessage.subscribe(function (data) {
                var str = typeof data === 'string' ? data : data.toString('utf-8')
                handleDataMessage(clientId, str)
            })

            channel.stateChanged.subscribe(function (state) {
                if (state === 'closed') {
                    console.log('prozess: data channel closed for client ' + clientId)
                    cleanupPeer(clientId)
                }
            })
        })

        pc.connectionStateChange.subscribe(function () {
            var state = pc.connectionState
            if (state === 'failed' || state === 'disconnected' || state === 'closed') {
                console.log('prozess: peer ' + clientId + ' ' + state)
                cleanupPeer(clientId)
            }
        })

        await pc.setRemoteDescription({ type: 'offer', sdp: sdp })
        var answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)

        sendSignal({
            type: 'signal.answer',
            clientId: clientId,
            sdp: pc.localDescription.sdp
        })

        if (!peers[clientId]) {
            peers[clientId] = { pc: pc, dataChannel: null }
        }

        console.log('prozess: sent answer to client ' + clientId)

    } catch (err) {
        console.error('prozess: offer handling failed — ' + err.message)
    }
}

async function handleIceCandidate(clientId, candidate) {
    var peer = peers[clientId]
    if (!peer || !peer.pc) return
    try {
        await peer.pc.addIceCandidate(candidate)
    } catch (err) {
        console.error('prozess: ICE candidate failed — ' + err.message)
    }
}

function cleanupPeer(clientId) {
    var peer = peers[clientId]
    if (!peer) return
    try { if (peer.dataChannel) peer.dataChannel.close() } catch (e) { }
    try { peer.pc.close() } catch (e) { }
    delete peers[clientId]
}

// ─── MESSAGE HANDLER (shared by WebRTC and relay) ───
function handleMessage(type, data) {
    switch (type) {
        case 'seri.incoming':
            incoming(data)
            return { received: true }
        case 'ping':
            return { pong: true }
        default:
            return null
    }
}

// ─── DATA CHANNEL MESSAGES ───
function handleDataMessage(clientId, raw) {
    var parsed = null
    try {
        parsed = JSON.parse(raw)
    } catch (e) {
        sendToClient(clientId, { error: 'invalid JSON' })
        return
    }

    var response = { id: parsed.id || null, data: null, error: null }

    try {
        response.data = handleMessage(parsed.type, parsed.data || {})
        if (!response.data) response.error = 'unknown type: ' + parsed.type
    } catch (e) {
        response.error = e.message
    }

    sendToClient(clientId, response)
}

// ─── RELAY FALLBACK ───
function handleRelayMessage(clientId, payload) {
    var response = { id: payload.id || null, data: null, error: null }

    try {
        response.data = handleMessage(payload.type, payload.data || {})
        if (!response.data) response.error = 'unknown type: ' + payload.type
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
        sendSignal({ type: 'relay.response', clientId: clientId, payload: msg })
        return
    }
    try {
        peer.dataChannel.send(JSON.stringify(msg))
    } catch (e) {
        sendSignal({ type: 'relay.response', clientId: clientId, payload: msg })
    }
}

function sendSignal(msg) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg))
    }
}

// ─── START ───
connectSignaling()

process.on('SIGINT', function () {
    console.log('prozess: shutting down...')
    Object.keys(peers).forEach(cleanupPeer)
    if (ws) ws.close()
    process.exit(0)
})

console.log('prozess: running. press Ctrl+C to stop.')
