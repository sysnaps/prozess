// local-brain.js — runs on the laptop, connects to render for signaling
// then serves data over WebRTC data channels directly to browsers
//
// Usage: node local-brain.js
// Optional: node local-brain.js --brain-id my-brain --signal wss://databrain-we87.onrender.com

var wrtc = require('wrtc')
var WebSocket = require('ws')
var irl = require('./irl_handlers')

// ─── CONFIG ───
var BRAIN_ID = process.argv.includes('--brain-id')
    ? process.argv[process.argv.indexOf('--brain-id') + 1]
    : 'default-brain'

var SIGNAL_URL = process.argv.includes('--signal')
    ? process.argv[process.argv.indexOf('--signal') + 1]
    : 'wss://databrain-we87.onrender.com'

// ─── INIT ───
irl.init()
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
        // register as a brain
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
            // a client wants to connect
            console.log('local-brain: connection request from client ' + msg.clientId)
            createPeerConnection(msg.clientId)
            break

        case 'signal.offer':
            // client sent an SDP offer
            handleOffer(msg.clientId, msg.sdp)
            break

        case 'signal.ice':
            // client sent an ICE candidate
            handleIceCandidate(msg.clientId, msg.candidate)
            break

        case 'relay.message':
            // fallback: client is relaying through render
            handleRelayMessage(msg.clientId, msg.payload)
            break

        default:
            // ignore unknown
            break
    }
}

// ─── WEBRTC PEER CONNECTION ───
function createPeerConnection(clientId) {
    var config = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    }

    var pc = new wrtc.RTCPeerConnection(config)

    pc.onicecandidate = function (event) {
        if (event.candidate) {
            sendSignal({
                type: 'signal.ice',
                clientId: clientId,
                candidate: event.candidate
            })
        }
    }

    pc.ondatachannel = function (event) {
        var channel = event.channel
        console.log('local-brain: data channel opened with client ' + clientId)

        peers[clientId] = { pc: pc, dataChannel: channel }

        channel.onmessage = function (evt) {
            handleDataMessage(clientId, evt.data)
        }

        channel.onclose = function () {
            console.log('local-brain: data channel closed for client ' + clientId)
            cleanupPeer(clientId)
        }
    }

    pc.onconnectionstatechange = function () {
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
            console.log('local-brain: peer ' + clientId + ' ' + pc.connectionState)
            cleanupPeer(clientId)
        }
    }

    peers[clientId] = { pc: pc, dataChannel: null }
}

function handleOffer(clientId, sdp) {
    var peer = peers[clientId]
    if (!peer) {
        createPeerConnection(clientId)
        peer = peers[clientId]
    }

    var pc = peer.pc
    var desc = new wrtc.RTCSessionDescription({ type: 'offer', sdp: sdp })

    pc.setRemoteDescription(desc)
        .then(function () { return pc.createAnswer() })
        .then(function (answer) { return pc.setLocalDescription(answer) })
        .then(function () {
            sendSignal({
                type: 'signal.answer',
                clientId: clientId,
                sdp: pc.localDescription.sdp
            })
        })
        .catch(function (err) {
            console.error('local-brain: offer handling failed — ' + err.message)
        })
}

function handleIceCandidate(clientId, candidate) {
    var peer = peers[clientId]
    if (!peer || !peer.pc) return

    peer.pc.addIceCandidate(new wrtc.RTCIceCandidate(candidate))
        .catch(function (err) {
            console.error('local-brain: ICE candidate failed — ' + err.message)
        })
}

function cleanupPeer(clientId) {
    var peer = peers[clientId]
    if (!peer) return
    try { if (peer.dataChannel) peer.dataChannel.close() } catch (e) {}
    try { peer.pc.close() } catch (e) {}
    delete peers[clientId]
}

// ─── DATA MESSAGE HANDLER ───
// same protocol as the WebSocket messages, just over the data channel
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
            case 'irl.signup':
                response.data = irl.handleSignUp(data)
                break
            case 'irl.signin':
                response.data = irl.handleSignIn(data)
                break
            case 'irl.ship.save':
                response.data = irl.handleShipSave(data)
                break
            case 'irl.ship.load':
                response.data = irl.handleShipLoad(data)
                break
            case 'irl.ship.list':
                response.data = irl.handleShipList(data)
                break
            case 'irl.fassung.save':
                response.data = irl.handleFassungSave(data)
                break
            case 'irl.fassung.list':
                response.data = irl.handleFassungList(data)
                break
            case 'ping':
                response.data = { pong: true }
                break
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
    // same as handleDataMessage but response goes back through render
    var parsed = payload
    var response = { id: parsed.id || null, data: null, error: null }
    var type = parsed.type
    var data = parsed.data || {}

    try {
        switch (type) {
            case 'irl.signup': response.data = irl.handleSignUp(data); break
            case 'irl.signin': response.data = irl.handleSignIn(data); break
            case 'irl.ship.save': response.data = irl.handleShipSave(data); break
            case 'irl.ship.load': response.data = irl.handleShipLoad(data); break
            case 'irl.ship.list': response.data = irl.handleShipList(data); break
            case 'irl.fassung.save': response.data = irl.handleFassungSave(data); break
            case 'irl.fassung.list': response.data = irl.handleFassungList(data); break
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
    if (!peer || !peer.dataChannel || peer.dataChannel.readyState !== 'open') {
        // fallback: relay through render
        sendSignal({
            type: 'relay.response',
            clientId: clientId,
            payload: msg
        })
        return
    }
    peer.dataChannel.send(JSON.stringify(msg))
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
