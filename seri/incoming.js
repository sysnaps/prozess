const sig = require("./signal")
const irlinks = require("./irlinks")
const strands = require("./strands")

function incoming(link, sphere = "default") {
    console.log('incoming link is -', link, " |  sphere - ", sphere)
    let signal = sig.nal(link)

    if (signal.is === "irlink") {
        return irlinks.create(signal)
    }

    if (signal.is === "strand") {
        return strands.create(signal)
    }

    if (signal.is === "command") {
        console.log("incoming: command —", signal.link)
    }
}

module.exports = incoming
