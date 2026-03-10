const sig = require("./signal")
const route = require("./route")
const irlinks = require("./irlinks")

function incoming(link) {
    console.log("incoming:", link)
    let parsed = sig.nal(link)

    if (parsed.is === "strand") return incoming.strand(link)
    if (parsed.is === "irlink") return incoming.irlink(parsed)
    if (parsed.is === "command") return incoming.command(parsed)
}

incoming.strand = function (link) {
    let signal = sig.walk(link)
    return route(signal)
}

// irlinks still use old pipeline (Phase 3 moves them to route walker)
incoming.irlink = function (signal) {
    return irlinks.create(signal)
}

incoming.command = function (signal) {
    console.log("incoming: command —", signal.link)
}

module.exports = incoming
