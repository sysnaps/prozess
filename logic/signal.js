const sig = {}

sig.nal = function (link) {
    let object = {
        is: null,
        link,
        irpath: {
            fofu: [],
            mofu: [],
            lofu: [],
            ring: null,
            globe: null
        }
    }
    let rest = link

    // detect type by prefix
    if (link.startsWith("~")) {
        object.is = "strand"
        rest = rest.slice(1)
    } else if (link.startsWith("!")) {
        object.is = "command"
        rest = rest.slice(1)
    } else {
        object.is = "irlink"
    }

    // extract globe (+value) before type-specific parsing
    if (rest.includes("+")) {
        let plusIdx = rest.indexOf("+")
        let afterPlus = rest.slice(plusIdx + 1)
        let globeEnd = afterPlus.length
        for (let op of ["@", "°", ":", "(", "!"]) {
            let idx = afterPlus.indexOf(op)
            if (idx !== -1 && idx < globeEnd) globeEnd = idx
        }
        object.irpath.globe = afterPlus.slice(0, globeEnd)
        rest = rest.slice(0, plusIdx) + afterPlus.slice(globeEnd)
    }

    // dispatch to type-specific parser
    if (object.is === "irlink") sig.irlink(rest, object)
    else if (object.is === "command") sig.command(rest, object)
    else if (object.is === "strand") sig.strand(rest, object)

    return object
}

// irlink: fofu.mofu°groups@lofu
sig.irlink = function (rest, object) {
    // lofu is @... at the end
    if (rest.includes("@")) {
        let atIdx = rest.indexOf("@")
        object.irpath.lofu = [rest.slice(atIdx)]
        rest = rest.slice(0, atIdx)
    }
    // ° splits fofu from mofu
    if (rest.includes("°")) {
        let parts = rest.split("°")
        object.irpath.fofu = parts[0].split(".").filter(Boolean)
        object.irpath.mofu = parts[1].split(".").filter(Boolean)
    } else {
        object.irpath.fofu = rest.split(".").filter(Boolean)
    }
}

// command: !fofu.mofu(lofu)
sig.command = function (rest, object) {
    // lofu is inside ()
    let openParen = rest.indexOf("(")
    let closeParen = rest.indexOf(")")
    if (openParen !== -1 && closeParen !== -1) {
        object.irpath.lofu = [rest.slice(openParen + 1, closeParen)]
        rest = rest.slice(0, openParen)
    }
    // last . segment before () is mofu, rest is fofu
    let segments = rest.split(".").filter(Boolean)
    if (segments.length > 1) {
        object.irpath.mofu = [segments.pop()]
        object.irpath.fofu = segments
    } else {
        object.irpath.fofu = segments
    }
}

// strand: ~fofu.concepts:mofu.caps.nype
sig.strand = function (rest, object) {
    // : separates fofu from mofu (caps)
    if (rest.includes(":")) {
        let colonIdx = rest.indexOf(":")
        let before = rest.slice(0, colonIdx)
        let after = rest.slice(colonIdx + 1)
        object.irpath.fofu = before.split(".").filter(Boolean)
        let segments = after.split(".").filter(Boolean)
        // last segment is a number → nype
        let last = segments.length > 0 ? segments[segments.length - 1] : null
        if (last !== null && last.length > 0 && !isNaN(last)) {
            object.irpath.lofu = [segments.pop()]
        }
        object.irpath.mofu = segments
    } else {
        let segments = rest.split(".").filter(Boolean)
        // last segment is a number → nype
        let last = segments.length > 0 ? segments[segments.length - 1] : null
        if (last !== null && last.length > 0 && !isNaN(last)) {
            object.irpath.lofu = [segments.pop()]
        }
        object.irpath.fofu = segments
    }
}

// build egg walk route from a raw link
// "~name.nick:seri" → ["~", "default", "name", "nick", ":", "seri"]
// "q.Center°admins@seri--" → ["default", "q", "Center", "°", "admins", "@", "seri--"]
sig.route = function (link) {
    let signal = sig.nal(link)
    let route = []

    // vorzeichen
    if (signal.is === "strand") route.push("~")
    else if (signal.is === "command") route.push("!")

    // realm (from +realm or default)
    let realm = signal.irpath.globe || "default"
    route.push(realm)

    // fofu concepts
    signal.irpath.fofu.forEach(function (concept) {
        route.push(concept)
    })

    // mofu with separator
    if (signal.irpath.mofu.length > 0) {
        let separator = signal.is === "strand" ? ":" : "°"
        route.push(separator)
        signal.irpath.mofu.forEach(function (concept) {
            route.push(concept)
        })
    }

    // lofu with separator
    if (signal.irpath.lofu.length > 0) {
        if (signal.is !== "strand" || signal.irpath.mofu.length === 0) {
            route.push("@")
        }
        signal.irpath.lofu.forEach(function (value) {
            route.push(value)
        })
    }

    return route
}

// build chicken filepath for the endpoint chick of a link
// "~name.nick:seri" → "~name/.1.nick" (strips mofu, builds fofu path with realmnum)
sig.chicken = function (link, realmnum) {
    let signal = sig.nal(link)
    let fofu = signal.irpath.fofu
    if (fofu.length === 0) return null
    let num = realmnum || 1
    let prefix = signal.is === "strand" ? "~" : signal.is === "command" ? "!" : ""
    let chickenpath = prefix
    for (let i = 0; i < fofu.length - 1; i++) {
        chickenpath += fofu[i] + "/"
    }
    chickenpath += "." + num + "." + fofu[fofu.length - 1]
    return chickenpath
}

// wrap sig.route() output with walked/payload for the route walker
sig.walk = function (link) {
    let irpath = sig.route(link)
    return {
        link,
        walked: [],
        irpath,
        payload: []
    }
}

module.exports = sig
