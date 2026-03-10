const { counters } = require("./counters")
const hyph = require("./hyph")
const { collection } = require("./collection")

function zell(dna) {
    const fullzell = zells.init(dna)
    fullzell.runebook.each(rune => {
        // here we find the methods we have described with those runes and attach it to the zell
    })
}


const zells = {}
const version = 2
zells.create = function (concept) {
    const spore = {
        "concept": concept,
        "version": version
    }
    zells.init(spore)
    return spore
}

// initialize a zell with standard methods
zells.init = function (dna) {
    dna.check = {}
    dna.check.version = zells.check.version(dna)
    dna.stamp = zells.stamp(dna)
    dna.get = zells.get(dna)
    dna.exe = zells.exe(dna)
    if (!dna.counter) {
        dna.counter = {}
    }
    if (!dna.counter.get) {
        dna.counter.get = counters.create({ counter: "get" })
    } else if (!dna.counter.get.increment) {
        counters.hydrate(dna.counter.get)
    }
    if (!dna.counter.exe) {
        dna.counter.exe = counters.create({ counter: "exe" })
    } else if (!dna.counter.exe.increment) {
        counters.hydrate(dna.counter.exe)
    }
    if (dna.buffgit) {
        dna.tofu = zells.thrigit.return(dna)
    }
    if (!dna.runebook) {
        dna.runebook = zells.runebook.create()
    }
    if (!dna.cage) {
        dna.cage = zells.cage.create()
    }
    return dna
}

zells.check = {}

zells.check.version = function (dna) {
    return (version) => {
        if (dna.version !== version) {
            dna.version = version
            if (dna.chicken) {
                hyph.save(dna.chicken, dna)
            }
        }
    }
}

// .get(concept, signal) — hub: dispatch to street or generic find/load/create
zells.get = function (dna) {
    return (concept, signal) => {
        let street = zells.get.dispatch(dna)
        let spore

        if (street) {
            spore = street.get(dna, concept, signal)
        } else {
            spore = zells.get.find(dna, concept)
            if (!spore) spore = zells.get.load(dna, concept)
            if (!spore) spore = zells.get.create(dna, concept)
            zells.get.payload(spore, signal)
        }

        let link = signal ? signal.link : concept
        dna.counter.get.increment(link)
        zells.get.save(dna)

        return spore
    }
}

zells.get.find = function (dna, concept) {
    if (dna[concept] && typeof dna[concept] !== "string") return dna[concept]
    return null
}

zells.get.load = function (dna, concept) {
    let chickenpath = zells.get.chickenpath(dna, concept)
    if (!chickenpath) return null
    let loaded = hyph.get(chickenpath)
    if (!loaded) return null
    zells.init(loaded)
    zells.stamp(loaded)(chickenpath)
    dna[concept] = loaded
    return loaded
}

zells.get.create = function (dna, concept) {
    let spore = zells.create(concept)
    dna[concept] = spore
    return spore
}

zells.get.chickenpath = function (dna, concept) {
    if (!dna.chicken) return null
    return dna.chicken + "/" + "." + concept
}

zells.get.save = function (dna) {
    if (dna.chicken) {
        hyph.update(dna.chicken, "counter.get", dna.counter.get)
    }
}

zells.get.payload = function (spore, signal) {
    if (!signal) return
    if (spore.buffgit && spore.buffgit.thrigit) {
        signal.payload.push(spore.buffgit.thrigit)
    }
}

zells.get.dispatch = function (dna) {
    let kind = dna.zell
    if (!kind) return null
    let { streets } = require("./streets")
    if (kind === "realm" || kind === "pascal") return streets.strand
    if (kind === "cosmos") return streets.cosmos
    return null
}

// .exe(concept, signal) — hub: dispatch to street or generic find/load/create
zells.exe = function (dna) {
    return (concept, signal) => {
        let street = zells.get.dispatch(dna)
        let endpoint

        if (street) {
            endpoint = street.exe(dna, concept, signal)
        } else {
            endpoint = zells.get.find(dna, concept)
            if (!endpoint) endpoint = zells.get.load(dna, concept)
            if (!endpoint) endpoint = zells.get.create(dna, concept)
            zells.exe.buffgit(endpoint, signal)
        }

        let link = signal ? signal.link : concept
        dna.counter.exe.increment(link)
        zells.exe.save(dna)

        return endpoint
    }
}

zells.exe.save = function (dna) {
    if (dna.chicken) {
        hyph.update(dna.chicken, "counter.exe", dna.counter.exe)
    }
}

zells.exe.buffgit = function (endpoint, signal) {
    if (!signal) return
    if (!signal.payload || signal.payload.length === 0) return
    let { buffgits } = require("./buffgits")
    endpoint.buffgit = buffgits.create({
        sphere: "route",
        realmnum: 1,
        fofu: signal.payload[0] ? signal.payload[0][0] : 900001,
        mofu: signal.payload[1] ? signal.payload[1][1] : 900001,
        lofu: signal.payload[2] ? signal.payload[2][2] : 900001
    })
}

zells.thrigit = {}

zells.cage = {}

zells.cage.create = function () {
    return collection({ "unit": "cage", items: [] })
}

zells.runebook = {}

zells.runebook.create = function () {
    return collection({ "unit": "runebook", items: [] })
}


zells.thrigit.return = function (dna) {
    return (position) => {
        return dna.buffgit.thrigit[position]
    }
}

// stamp a chicken path on dna (non-enumerable so JSON.stringify skips it)
zells.stamp = function (dna) {
    return function (chickenpath) {
        Object.defineProperty(dna, "chicken", { value: chickenpath, writable: true, configurable: true })
    }
}

module.exports = { zell, zells }
