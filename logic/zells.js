const { counters } = require("./counters")
const hyph = require("./hyph")
const { collection, collections } = require("./collection")
const version = 3
function zell(dna) {
    const fullzell = zells.init(dna)
    fullzell.runebook.each(rune => {
        // here we find the methods we have described with those runes and attach it to the zell
    })
}

zell.teilung = function (track, sdna, base) {
    const zdna = {
        version
    }
    /* 
            link received it is - q#a new realm
            track -  [ '☷' ]  | buffgit -  {
            sphere: [ 1, [ '☷' ] ],
            realm: [ 2, [ '#', 'a new realm' ] ],
            fofu: [ 900001, [ 'q' ] ],
            mofu: [ 900001, [] ],
            lofu: [ 900001, [] ]
            }
    */
    // turns into .☷ 
    const last = track[track.length - 1]
    // so in here I can't find a way to abstract it further for now
    // you just need to tell it that "☷" is a collection of globes
    if (last == "☷") {
        // when we need to create this then this means no globes exist yet!
        // just empty space. chicken has no content - oh not true we already have conops in there
        // which is very poetic. kind of crazy. i was writing about how the universe started a couple months ago
        // about a thought that the first thing was a split between concepts. not the concepts but the split
        // and the conops are just that. they split points. huh. makes you think.
        const Default = {
            zell: "globe",
            globe: "default",
            continents: collections.create("globes", "continents", "deltas") //collections.create = function (title, takes, kind = "peers") {
        } // our default globe - ok we should put what a globe needs
        // oh our globe is already a well! well well well

        const globes = collections.create("atlas", "globes", "peers")
        // so this globe can already get saved. it is not a well. it is a collection
        // I reworked the well creation. you come with me into wells
        // I found out what the base is ! it is the current eggdress that we creating
        // the zell for ! 
        // into the chick that we create. 


    }
}


const zells = {}

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
    if (dna._zinit) return dna
    Object.defineProperty(dna, "_zinit", { value: true })
    dna.check = {}
    dna.check.version = zells.check.version(dna)
    dna.stamp = zells.stamp(dna)
    dna.get = zells.get(dna)
    dna.exe = zells.exe(dna)
    dna.grammatik = zells.grammatik()
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
    zells.init.stammzell(dna)
    return dna
}

zells.init.stammzell = function (dna) {
    let kind = dna.zell
    if (!kind || kind === "unit") return
    let factories = {
        realm: () => require("./zones").realm(dna),
        zone: () => require("./zones").zone(dna),
        pascal: () => require("./pascals").pascal(dna),
        ring: () => require("./rings").ring(dna),
        well: () => require("./wells").well(dna),
        triangle: () => require("./triangles").triangle(dna),
        pyramid: () => require("./pyramids").pyramid(dna),
        super: () => require("./supers").SuPeR(dna),
        mega: () => require("./Megas").mega(dna),
        gap: () => require("./gaps").gap(dna),
        viewpoint: () => require("./viewpoints").viewpoint(dna),
        cap: () => require("./caps").cap(dna),
        cosmos: () => require("./cosmi").cosmos(dna)
    }
    let factory = factories[kind]
    if (factory) factory()
    // sub-dispatch: well types (continent, etc.)
    zells.init.stammzell.sub(dna)
    // hardcode stammzell grammatik
    let { grammatiks } = require("./grammatiks")
    let stammform = grammatiks.stammzellen[kind]
    if (stammform) dna.grammatik = grammatiks.create(stammform)
}

// well sub-types: continent gets its own factory after well()
zells.init.stammzell.sub = function (dna) {
    if (dna.zell !== "well") return
    let subs = {
        continent: () => require("./continents").continent(dna)
    }
    let sub = subs[dna.well]
    if (sub) sub()
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



// .get(concept, signal) — hub: work or generic find/load/create
zells.get = function (dna) {
    return (concept, signal) => {
        let spore

        if (dna.work) {
            spore = dna.work(concept, signal)
        } else {
            spore = zells.get.find(dna, concept, signal)
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

zells.get.find = function (dna, concept, signal) {
    if (dna[concept] && typeof dna[concept] !== "string") return dna[concept]
    // grammatik: try counterpart name
    let other = zells.get.find.counterpart(dna, concept, signal)
    if (other) return other
    return null
}

// check if the counterpart name (singular↔plural) exists on dna
zells.get.find.counterpart = function (dna, concept, signal) {
    let { grammatiks } = require("./grammatiks")
    let resolved = grammatiks.resolve(dna, concept, signal)
    if (resolved !== concept && dna[resolved] && typeof dna[resolved] !== "string") {
        Object.defineProperty(dna, concept, { value: dna[resolved], writable: true, configurable: true })
        return dna[concept]
    }
    return null
}

zells.get.load = function (dna, concept) {
    let chickenpath = zells.get.chickenpath(dna, concept)
    if (!chickenpath) return null
    let loaded = hyph.get(chickenpath)
    if (!loaded) return null
    // follow shortcuts — small JSON files pointing to the original chick
    let followed = zells.get.shortcut(loaded, chickenpath)
    loaded = followed.data
    chickenpath = followed.path
    zells.init(loaded)
    zells.stamp(loaded)(chickenpath)
    Object.defineProperty(dna, concept, { value: loaded, writable: true, configurable: true })
    return loaded
}

// if loaded data is a shortcut, follow the target path
zells.get.shortcut = function (loaded, chickenpath) {
    if (loaded.unit === "shortcut" && loaded.target) {
        let target = hyph.get(loaded.target)
        if (target) return { data: target, path: loaded.target }
    }
    return { data: loaded, path: chickenpath }
}

zells.get.create = function (dna, concept) {
    let spore = zells.create(concept)
    Object.defineProperty(dna, concept, { value: spore, writable: true, configurable: true })
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

// .exe(concept, signal) — hub: work or generic find/load/create
zells.exe = function (dna) {
    return (concept, signal) => {
        let endpoint

        if (dna.work) {
            endpoint = dna.work(concept, signal)
        } else {
            endpoint = zells.get.find(dna, concept, signal)
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

// default grammatik — placeholder until stammzell factory or signal provides data
zells.grammatik = function () {
    let { grammatiks } = require("./grammatiks")
    return grammatiks.empty()
}

module.exports = { zell, zells }
