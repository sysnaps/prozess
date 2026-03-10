const { egg } = require("./egg")
const conops = require("./conops")

// route(signal) — walk through the egg following the irpath
// signal = sig.walk(link) → { link, walked, irpath, payload }
function route(signal) {
    let current = egg
    let mode = "root"

    while (signal.irpath.length > 0) {
        let step = signal.irpath.shift()
        signal.walked.push(step)

        let dispatched = handle(current, step, signal, mode)
        current = dispatched.current
        mode = dispatched.mode
    }

    route.finish(signal, current)
    return { signal, endpoint: current }
}

// post-walk: save zone/cosmos, handle nype
route.finish = function (signal, endpoint) {
    if (!signal.zone) return
    let strands = require("./strands")
    let ringwell = signal.ring
    if (!ringwell) return

    route.finish.nype(signal, strands)
    strands.save.zone(ringwell, signal.zone)
    if (signal.capname) {
        let realmnum = signal.realmnum || 1
        strands.save.cosmos(ringwell, signal.zone, signal.capname, realmnum)
    }
}

// if the last walked step is numeric and follows a cap → it's a nype
route.finish.nype = function (signal, strands) {
    if (!signal.capname) return
    let last = signal.walked[signal.walked.length - 1]
    if (!last || isNaN(last)) return

    // reconstruct fofu from walked (between realm and first conop after vorzeichen)
    let fofu = route.finish.fofu(signal)
    let realmnum = signal.realmnum || 1
    let turbo = signal.turbo
    let pyramid = {}
    pyramid.kind = require("./pyramids").pyramids.which(fofu.length)
    let point = signal.payload.length > 0 ? signal.payload[signal.payload.length - 2] : null

    strands.nype(signal.zone, signal, fofu, signal.chickenpath, pyramid.kind, point, turbo, realmnum, last)
    signal.nype = last
}

// extract fofu concepts from walked path
route.finish.fofu = function (signal) {
    let conops = require("./conops")
    let fofu = []
    let past = {}
    past.realm = false
    for (let step of signal.walked) {
        if (conops.includes(step)) {
            if (past.realm) break
            continue
        }
        if (!past.realm) { past.realm = true; continue }
        fofu.push(step)
    }
    return fofu
}

// handle a single step in the route walk
function handle(current, step, signal, mode) {
    let is = {}
    is.conop = conops.includes(step)
    is.realm = mode === "root" || mode === "conop"
    is.last = peek.last(signal)
    is.before = {}
    is.before.conop = peek.conop(signal)

    if (is.conop) return conop(current, step, signal)
    if (is.realm) return realm(current, step, signal)
    if (is.last) return exe(current, step, signal)
    return get(current, step, signal)
}

// peek at the next step without consuming it
const peek = {}

peek.last = function (signal) {
    return signal.irpath.length === 0
}

peek.conop = function (signal) {
    if (signal.irpath.length === 0) return false
    return conops.includes(signal.irpath[0])
}

// conop step — switch to the right egg root, track vorzeichen on signal
// first conop (~ or none) → mode "conop" (realm follows)
// mid-walk conop (: ° @) → mode "concept" (next step is a concept, not a realm)
function conop(current, step, signal) {
    let is = {}
    is.first = !signal.vorzeichen
    signal.vorzeichen = signal.vorzeichen || step

    let root = egg[step]
    if (!root) {
        egg[step] = {}
        root = egg[step]
    }

    let mode = is.first ? "conop" : "concept"
    return { current: root, mode }
}

// realm step — navigate into current[realm], store realm on signal
function realm(current, step, signal) {
    signal.realm = step
    if (!current[step]) current[step] = {}
    return { current: current[step], mode: "concept" }
}

// concept .get step — delegates to current.get if available, else navigates
function get(current, step, signal) {
    if (current.get && typeof current.get === "function") {
        let spore = current.get(step, signal)
        return { current: spore, mode: "concept" }
    }
    if (!current[step]) current[step] = {}
    return { current: current[step], mode: "concept" }
}

// endpoint .exe step — delegates to current.exe if available
function exe(current, step, signal) {
    if (current.exe && typeof current.exe === "function") {
        let endpoint = current.exe(step, signal)
        return { current: endpoint, mode: "endpoint" }
    }
    if (current.get && typeof current.get === "function") {
        let spore = current.get(step, signal)
        return { current: spore, mode: "endpoint" }
    }
    if (!current[step]) current[step] = {}
    return { current: current[step], mode: "endpoint" }
}

module.exports = route
