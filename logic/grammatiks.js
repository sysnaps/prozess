const version = 1

// hydrate a grammatik unit with methods
function grammatik(gdna) {
    gdna.zell = "unit"
    gdna.unit = "grammatik"
    gdna.counterpart = grammatiks.counterpart(gdna)
    gdna.alias = {}
    gdna.alias.egg = grammatiks.alias.egg(gdna)
    gdna.alias.chicken = grammatiks.alias.chicken(gdna)
    return gdna
}

const grammatiks = {}

grammatiks.create = function ({ singular, plural, type }) {
    let gdna = {
        zell: "unit",
        unit: "grammatik",
        singular: singular || null,
        plural: plural || null,
        type: type || null,
        version
    }
    grammatik(gdna)
    return gdna
}

// default empty grammatik — placeholder for non-stammzellen until signal provides data
grammatiks.empty = function () {
    return grammatiks.create({})
}

// hardcoded stammzell singular/plural forms
grammatiks.stammzellen = {
    zone:      { singular: "zone",      plural: "zones" },
    well:      { singular: "well",      plural: "wells" },
    pascal:    { singular: "pascal",    plural: "pascals" },
    ring:      { singular: "ring",      plural: "rings" },
    triangle:  { singular: "triangle",  plural: "triangles" },
    pyramid:   { singular: "pyramid",   plural: "pyramids" },
    gap:       { singular: "gap",       plural: "gaps" },
    viewpoint: { singular: "viewpoint", plural: "viewpoints" },
    cap:       { singular: "cap",       plural: "caps" },
    realm:     { singular: "realm",     plural: "realms" },
    mega:      { singular: "mega",      plural: "megas" },
    super:     { singular: "super",     plural: "supers" },
    cosmos:    { singular: "cosmos",    plural: "cosmi" },
    funk:      { singular: "funk",      plural: "funks" },
    continent: { singular: "continent", plural: "continents" }
}

// given a concept string, return the other form (singular↔plural)
grammatiks.counterpart = function (gdna) {
    return function (concept) {
        if (!gdna.singular || !gdna.plural) return null
        if (concept === gdna.singular) return gdna.plural
        if (concept === gdna.plural) return gdna.singular
        return null
    }
}

grammatiks.alias = {}

// attach counterpart reference on the host object in egg
// host["characters"] exists → also set host["character"] = host["characters"]
grammatiks.alias.egg = function (gdna) {
    return function (host, concept) {
        let other = gdna.counterpart(concept)
        if (!other) return null
        if (host[concept]) host[other] = host[concept]
        return other
    }
}

// create a shortcut file in chicken at the counterpart path
// shortcut = small JSON pointing to the original chick
grammatiks.alias.chicken = function (gdna) {
    return function (chickenpath, concept) {
        let hyph = require("./hyph")
        let other = gdna.counterpart(concept)
        if (!other) return
        let shortcutpath = grammatiks.alias.chicken.path(chickenpath, concept, other)
        if (!shortcutpath || shortcutpath === chickenpath) return
        hyph.save(shortcutpath, { unit: "shortcut", target: chickenpath })
    }
}

// build the counterpart chicken path by replacing concept in the filename
grammatiks.alias.chicken.path = function (chickenpath, concept, counterpart) {
    let parts = chickenpath.split("/")
    let filename = parts[parts.length - 1]
    if (!filename.includes(concept)) return null
    parts[parts.length - 1] = filename.replace(concept, counterpart)
    return parts.join("/")
}

// resolve a concept against grammatik data on a signal
// if "characters" doesn't exist on host but "character" does, returns "character"
grammatiks.resolve = function (host, concept, signal) {
    if (host[concept] && typeof host[concept] !== "string") return concept
    let form = grammatiks.resolve.form(concept, signal)
    if (!form) return concept
    let other = grammatiks.resolve.other(concept, form)
    if (!other) return concept
    if (host[other] && typeof host[other] !== "string") return other
    return concept
}

// extract the grammatik form for a concept from signal
grammatiks.resolve.form = function (concept, signal) {
    if (!signal || !signal.grammatik) return null
    return signal.grammatik[concept] || null
}

// get the counterpart name from a grammatik form
grammatiks.resolve.other = function (concept, form) {
    if (concept === form.singular) return form.plural
    if (concept === form.plural) return form.singular
    return null
}

module.exports = { grammatik, grammatiks }
