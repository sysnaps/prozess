const { egg } = require("./egg")
const conops = require("./conops")

// non-enumerable property — in-memory shortcut, not serialized to chicken
function ref(host, key, value) {
    Object.defineProperty(host, key, { value, writable: true, configurable: true })
}

// route(signal) — walk through the egg following the irpath
// signal = sig.walk(link) → { link, walked, irpath, payload }
function route(signal) {
    let current = egg
    let mode = "root"

    while (signal.irpath.length > 0) {
        let step = signal.irpath[0]

        signal.irpath.shift()
        signal.walked.push(step)

        let host = current
        let dispatched = handle(current, step, signal, mode)
        current = dispatched.current
        mode = dispatched.mode

        // grammatik: alias counterpart on host (e.g. host["character"] = host["characters"])
        route.alias(host, step, current, signal)
    }

    route.finish(signal, current)
    return { signal, endpoint: current }
}

// post-walk: dispatch to strand or irlink finish
route.finish = function (signal, endpoint) {
    if (signal.vorzeichen === "~") return route.finish.strand(signal, endpoint)
    if (signal.fofu && signal.mofu) return route.finish.irlink(signal, endpoint)
}

// strand finish: save zone/cosmos, handle nype
route.finish.strand = function (signal, endpoint) {
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

// irlink finish: build viewpoint from accumulated payload
route.finish.irlink = function (signal, endpoint) {
    let well = {}
    well.fofu = signal.fofu.endpoint
    well.mofu = signal.mofu.endpoint
    well.lofu = endpoint

    let has = {}
    has.thrigits = well.fofu.thrigit && well.mofu.thrigit && well.lofu.thrigit
    if (!has.thrigits) return

    let { viewpoints } = require("./viewpoints")
    let lookups = require("./lookups")
    let spherename = well.fofu.sphere || well.fofu.globe || "default globe"
    let realmnum = lookups.realmnum(spherename)
    if (realmnum.sig) realmnum = 1

    // check cache first
    let cached = lookups.get(spherename, realmnum, well.fofu.thrigit.fofu, well.mofu.thrigit.mofu, well.lofu.thrigit.lofu)
    if (!cached.sig) return cached

    // create new viewpoint — reconstruct signal.irpath for viewpoints.create
    route.finish.irlink.signal(signal)
    let vp = viewpoints.create(signal, well.fofu, well.mofu, well.lofu, realmnum)
    console.log("route.finish: irlink viewpoint created for", signal.link)
    return vp
}

// reconstruct irpath on signal for viewpoints.path
route.finish.irlink.signal = function (signal) {
    if (signal.irpath.fofu) return
    let parsed = require("./signal").nal(signal.link)
    signal.irpath = parsed.irpath
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
// walked order: [vorzeichen?, , realm, ...concepts, conop?, ...]
// skip conops and realm, collect  + concepts until next conop
route.finish.fofu = function (signal) {
    let conops = require("./conops")
    let fofu = []
    let past = {}
    past.realm = false
    past.zone = false
    for (let step of signal.walked) {
        if (conops.includes(step)) {
            if (past.realm) break
            continue
        }
        // first non-conop = zone concept
        if (!past.zone) { past.zone = true; fofu.push(step); continue }
        // second non-conop = realm — skip it
        if (!past.realm) { past.realm = true; continue }
        fofu.push(step)
    }
    return fofu
}

// handle a single step in the route walk
function handle(current, step, signal, mode) {
    let is = {}
    is.conop = conops.includes(step)
    is.zone = mode === "zone"
    is.continent = mode === "continent"
    is.realm = mode === "conop"
    is.lofu = mode === "lofu"
    is.last = peek.last(signal)

    if (is.conop) return conop(current, step, signal)
    if (is.zone) return zone(current, step, signal)
    if (is.continent) return continent(current, step, signal)
    if (is.realm) return realm(current, step, signal)
    if (is.lofu) return lofu(current, step, signal)
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
// first conop: ~ → zone, ☷ → continent, ! → command
// mid-walk: ° → groups root, @ → lofu, : → cosmos root
function conop(current, step, signal) {
    let is = {}
    is.first = !signal.vorzeichen
    signal.vorzeichen = signal.vorzeichen || step

    if (is.first) return conop.first(step)
    return conop.mid(current, step, signal)
}

// each vorzeichen dispatches to the handler that owns its sphere
conop.first = function (step) {
    let root = egg[step]
    if (!root) { ref(egg, step, {}); root = egg[step] }
    let modes = { "~": "zone", "☷": "continent" }
    let mode = modes[step] || "concept"
    return { current: root, mode }
}

conop.mid = function (current, step, signal) {
    // ° → save fofu endpoint, reset chickenpath, switch to groups root
    if (step === "°") {
        signal.fofu = {}
        signal.fofu.endpoint = current
        signal.chickenpath = null
        let root = egg["°"]
        if (!root) { ref(egg, "°", {}); root = egg["°"] }
        // init groups root as a well so .work handles mofu walking
        if (!root._zinit) {
            root.zell = "well"
            root.well = "mofu"
            root.tofu = "mofu"
            root.is = "irlink"
            let { zells } = require("./zells")
            zells.init(root)
        }
        return { current: root, mode: "concept" }
    }
    // @ → save mofu endpoint, reset chickenpath, switch to lofu handling
    if (step === "@") {
        signal.mofu = {}
        signal.mofu.endpoint = current
        signal.chickenpath = null
        // lofu wells live inside the mofu endpoint's lofu collection
        // prepare lofu collection if needed
        let { groups } = require("./groups")
        if (!current.lofu || !current.lofu.add) {
            let { collection } = require("./collection")
            current.lofu = collection({
                unit: "collection",
                collection: (current.concept || "mofu") + ".lofu",
                maps: "concept",
                items: current.lofu ? current.lofu.items || [] : []
            })
        }
        return { current: current, mode: "lofu" }
    }
    // : → cosmos of the current zone's realm
    if (step === ":") return conop.cosmos(signal)
    // fallback — unknown mid-walk conop
    return { current: current, mode: "concept" }
}

// navigate to egg[vorzeichen][][realm][":"] — the cosmos
conop.cosmos = function (signal) {
    let zone = egg[signal.vorzeichen]
    if (!zone) return { current: {}, mode: "concept" }
    let namespace = zone[signal.]
    if (!namespace) return { current: {}, mode: "concept" }
    let realmobj = namespace[signal.realm]
    if (!realmobj) return { current: {}, mode: "concept" }
    if (!realmobj[":"]) {
        ref(realmobj, ":", { zell: "cosmos", concept: ":" })
        let { zells } = require("./zells")
        zells.init(realmobj[":"])
    }
    return { current: realmobj[":"], mode: "concept" }
}

// zone step — first concept after ~ vorzeichen (strands only)
// zones live on rings
function zone(current, step, signal) {
    signal. = step
    if (!current[step]) ref(current, step, {})
    let target = current[step]
    // carry ring reference from the ~ root (non-enumerable to avoid circular JSON)
    if (current.ring && !target.ring) Object.defineProperty(target, "ring", { value: current.ring, writable: true, configurable: true })
    meta(step, signal)
    return { current: target, mode: "conop" }
}

// continent step — first concept after ☷ vorzeichen (irlinks only)
// continents live on globes
function continent(current, step, signal) {
    signal. = step
    if (!current[step]) ref(current, step, {})
    let target = current[step]
    // carry globe reference from the ☷ root (non-enumerable to avoid circular JSON)
    if (current.globe && !target.globe) Object.defineProperty(target, "globe", { value: current.globe, writable: true, configurable: true })
    continent.init(target, step)
    meta(step, signal)
    return { current: target, mode: "conop" }
}

// init continent as a well, register as midwell of globe
continent.init = function (target, concept) {
    if (target._zinit) return
    let { zells } = require("./zells")
    target.zell = "well"
    target.well = "continent"
    target.tofu = "fofu"
    target.is = "irlink"
    target.concept = concept
    if (!target.midwells) target.midwells = { items: [] }
    target.minwell = target.minwell ?? null
    target.maxwell = target.maxwell ?? null
    zells.init(target)
    continent.register(target, concept)
}

// register continent as midwell of globe — globe redistributes unschärfe
continent.register = function (target, concept) {
    let globe = target.globe
    if (!globe || !globe.midwells) return
    if (globe.midwells[concept]) return
    globe.midwells.add(target)
    ref(globe, concept, target)
    globe.recalculate()
}

// create mega and super for the first concept (zone or continent)
// mega at .{concept} — sphere-spanning
// super at {vorzeichen}.{concept} — sphere-specific
function meta(concept, signal) {
    let hyph = require("./hyph")
    let { megas } = require("./Megas")
    megas.get(concept)
    let megapath = "." + concept
    if (!hyph.get(megapath)) {
        hyph.save(megapath, { zell: "mega", concept })
    }
    let vorzeichen = signal.vorzeichen
    let superpath = vorzeichen + "." + concept
    if (!hyph.get(superpath)) {
        let is = vorzeichen === "~" ? "zone" : "continent"
        hyph.save(superpath, { zell: "super", super: is, concept })
    }
}

// lofu step — create/find lofu well on the mofu endpoint
function lofu(current, step, signal) {
    let { groups } = require("./groups")
    let lofuwell = groups.lofu.handle(signal, current, step)
    if (lofuwell && lofuwell.thrigit) {
        signal.payload.push(lofuwell.thrigit)
    }
    return { current: lofuwell || current, mode: "endpoint" }
}

// realm step — strands: navigate into realm namespace. irlinks: stay on continent
function realm(current, step, signal) {
    signal.realm = step
    // irlinks: realm is the globe name, not a child — stay on continent
    if (signal.vorzeichen === "☷") {
        return { current: current, mode: "concept" }
    }
    // strands: create realm namespace object
    if (!current[step]) ref(current, step, {})
    let realmobj = current[step]
    if (current.ring && !realmobj.ring) Object.defineProperty(realmobj, "ring", { value: current.ring, writable: true, configurable: true })
    realm.init(realmobj, signal)
    return { current: realmobj, mode: "concept" }
}

// init realm as strand namespace zell
realm.init = function (realmobj, signal) {
    if (realmobj._zinit) return
    let { zells } = require("./zells")
    realmobj.zell = "realm"
    zells.init(realmobj)
}

// concept .get step — delegates to current.get if available, else navigates
function get(current, step, signal) {
    if (current.get && typeof current.get === "function") {
        let spore = current.get(step, signal)
        return { current: spore, mode: "concept" }
    }
    if (!current[step]) ref(current, step, {})
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
    if (!current[step]) ref(current, step, {})
    return { current: current[step], mode: "endpoint" }
}

// grammatik aliasing — after navigating, create counterpart reference on host
route.alias = function (host, step, navigated, signal) {
    if (conops.includes(step)) return
    if (!signal.grammatik || !signal.grammatik[step]) return
    let { grammatiks } = require("./grammatiks")
    let gdna = grammatiks.create(signal.grammatik[step])
    // alias on egg host: host["character"] = host["characters"]
    gdna.alias.egg(host, step)
    // set grammatik on the navigated object
    if (navigated && typeof navigated === "object") {
        navigated.grammatik = gdna
    }
    // chicken shortcut if the navigated object has a stamped path
    if (navigated && navigated.chicken) {
        gdna.alias.chicken(navigated.chicken, step)
    }
}

module.exports = route
