function collection(cdna) {
    cdna.attach = collection.attach(cdna)
    cdna.remove = collection.remove(cdna)
    cdna.add = collection.add(cdna)
    cdna.length = collection.count(cdna.items)
    cdna.each = collection.each(cdna)
    cdna.map = collection.map(cdna)
    cdna.filter = collection.filter(cdna)
    cdna.find = collection.find(cdna)
    cdna.toJSON = collection.toJSON(cdna)
    cdna.walk = collection.walk(cdna)
    for (let i = 0; i < cdna.items.length; i++) {
        const item = cdna.items[i]
        cdna.attach(item, i + 1)
    }
    return cdna
}

const collections = {}

collections.create = function (title, maps, items) {
    return collection({
        "unit": "collection",
        "collection": title,
        "maps": maps,
        "items": items ?? [],
        "refs": true
    })
}

collection.count = function (items) {
    return () => {
        return items.length
    }
}

collection.each = function (cdnas) {
    return (callback) => {
        for (let i = 0; i < cdnas.items.length; i++) {
            callback(cdnas.items[i], i)
        }
    }
}

collection.map = function (cdnas) {
    return (callback) => {
        let results = []
        for (let i = 0; i < cdnas.items.length; i++) {
            results.push(callback(cdnas.items[i], i))
        }
        return results
    }
}

collection.filter = function (cdnas) {
    return (callback) => {
        let results = []
        for (let i = 0; i < cdnas.items.length; i++) {
            if (callback(cdnas.items[i], i)) {
                results.push(cdnas.items[i])
            }
        }
        return results
    }
}

collection.find = function (cdnas) {
    return (callback) => {
        for (let i = 0; i < cdnas.items.length; i++) {
            if (callback(cdnas.items[i], i)) {
                return cdnas.items[i]
            }
        }
        return null
    }
}

// walk a link string: parse it, load the actual chick from the chicken,
// nest the loaded data at the irlink path, replace string in items
collection.walk = function (cdnas) {
    return (link) => {
        if (typeof link !== "string") return link
        let sig = require("./signal")
        let hyph = require("./hyph")
        let zells = require("./zells")
        let signal = sig.nal(link)
        let segments = signal.irpath.fofu
        if (segments.length === 0) return null

        // resolve chicken path from fofu segments
        let last = segments[segments.length - 1]
        let folder = segments.slice(0, -1).join("/")
        let chickenpath = folder ? folder + "/." + last : "." + last

        // add type prefix for strands and commands
        if (signal.is === "strand") chickenpath = "~" + chickenpath
        else if (signal.is === "command") chickenpath = "!" + chickenpath

        // load the actual chick from the chicken
        let chickdata = hyph.get(chickenpath)
        if (!chickdata) return null

        // stamp the chicken path on the loaded data
        zells.stamp(chickdata)(chickenpath)

        // nest at fofu path on collection
        let current = cdnas
        for (let i = 0; i < segments.length - 1; i++) {
            if (!current[segments[i]]) current[segments[i]] = {}
            current = current[segments[i]]
        }
        current[last] = chickdata

        // replace string in items with the loaded object reference
        let idx = cdnas.items.indexOf(link)
        if (idx !== -1) cdnas.items[idx] = chickdata

        return chickdata
    }
}

collection.attach = function (cdnas) {
    return (dna, index) => {
        if (typeof dna === "string") {
            let loaded = cdnas.walk(dna)
            if (loaded && typeof loaded !== "string") {
                let key = loaded[cdnas.maps] ?? index
                cdnas[key] = loaded
            }
        } else {
            let key = dna[cdnas.maps] ?? index
            cdnas[key] = dna
            // replace string ref in items with the actual object
            let str = cdnas.items.indexOf(key)
            if (str !== -1) cdnas.items[str] = dna
        }
    }
}

collection.remove = function (cdnas) {
    return (identifier, isstring = false) => {
        let attached = cdnas[identifier]
        if (attached) {
            delete cdnas[identifier]
            let index = isstring
                ? cdnas.items.indexOf(identifier)
                : cdnas.items.indexOf(attached)
            if (index !== -1) cdnas.items.splice(index, 1)
            if (cdnas.on && cdnas.on.removed) cdnas.on.removed(attached)
        }
    }
}

// only save the structure, not the attached keys or methods
collection.toJSON = function (cdnas) {
    return () => {
        return {
            unit: cdnas.unit,
            collection: cdnas.collection,
            maps: cdnas.maps,
            // refs collections save items as string references, others save as-is
            items: cdnas.refs
                ? cdnas.items.map(function (i) {
                    return typeof i === "string" ? i : (i[cdnas.maps] ?? i)
                })
                : cdnas.items
        }
    }
}

collection.add = function (cdnas) {
    return (item) => {
        let key = typeof item === "string" ? item : item[cdnas.maps]
        let found = cdnas[key]
        if (!found) {
            cdnas.items.push(item)
            cdnas.attach(item, cdnas.items.length)
            if (cdnas.on && cdnas.on.added) cdnas.on.added(item)
        }
    }
}

module.exports = { collection, collections }
