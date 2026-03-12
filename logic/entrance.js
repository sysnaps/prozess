//const sig = require("./signal")
//const route = require("./route")
const { signals } = require("./signals")

// entrance accepts strings (links) or objects (link + grammatik + optional irpath)

/* Scottland Yard:
    case 1: "q"
    case 2: "q@seri--"
    case 3: "q@claude--"
    case 4: "q.Center.Middle.SevenSeas°pirates@One-Eyed-Willy"
    case 5: "~treasure.gold:coins.10000"
    case 6: "~treasure.gold"
    case 7: "~treasure.chests.old"
    case 8: "+pyramids.coding"
    case 9: "+pyramids.coding:providence<louvre<castillo<sun<luxor<gizeh"
    case 10: "+triangle:pyramids.coding"
    case 11: "+pyramids.coding:^pyramid*unschärfe*height*strands"
    case 12: "~colors:red|blue|orange|green|blue"
    case 13: "~colors:grey"
    case 14: "conditions.active:Napp|Nide|+Contexts|"
    case 15: "@seri--"
    case 16: energy:color|strength|potential
    case 17: "!click"
    case 18: "[1(f)]=!click"
    case 19: "-display:flex"
    case 20: "-backgroundColor:"

    pre-cases to calibrate the signal: 
    hyph.send("continent.country.county°cat.group.subgroup@first-middle-last")
    hyph.send("continent.country.county°cat.group.subgroup@first-middle-last#seris globus")
    hyph.send("~zone.pascal.another pascal:item.9")
    hyph.send("~zone.pascal.another pascal:item9")
    hyph.send("zone.pascal.another pascal:item:22")
    */
function entrance(link) {
    // case 1 - creating a signal
    console.log("link received it is -", link)
    // follow me into signals.js
    const signal = signals.create(link)
    // so now the signal gets build 
    // the signal is almost calibrated. 
    // we build the eggdresses!
    signal.build()
    return
    let parsed = sig.nal(link)
    if (parsed.is === "strand") return entrance.strand(link)
    if (typeof link === "object") return entrance.object(link)
}

// string link — parse type, dispatch to strand/irlink/command
entrance.string = function (link) {
    let parsed = sig.nal(link)
    if (parsed.is === "strand") return entrance.strand(link)
    if (parsed.is === "irlink") return entrance.irlink(link)
    if (parsed.is === "command") return entrance.command(parsed)
}

// object signal — carries link, grammatik, optional pre-parsed irpath
// { link: "~llms:claude", grammatik: { llms: {singular:"llm", plural:"llms"} } }
entrance.object = function (data) {
    let signal = sig.walk(data.link)
    if (data.irpath) signal.irpath = data.irpath
    if (data.grammatik) signal.grammatik = data.grammatik
    return route(signal)
}

entrance.strand = function (link) {
    let signal = sig.walk(link)
    return route(signal)
}

entrance.irlink = function (link) {
    let signal = sig.walk(link)
    return route(signal)
}

entrance.command = function (signal) {
    console.log("entrance: command —", signal.link)
}

module.exports = entrance
