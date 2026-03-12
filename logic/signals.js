const { hyph, chicken } = require("./hyph")
const { irpaths } = require("./irpaths")
const { zells, zell } = require("./zells")
const { egg } = require("./egg")

const signals = {}

const signal = function (sdna) {
    sdna.build = signals.build(sdna)
    sdna.realm = {}
    sdna.realm.factor = signals.realm.factor(sdna)
    sdna.buffgits = {}
    sdna.buffgits.create = signals.buffgits.create(sdna)
    return sdna
}
signals.create = function (link) {
    // case 1 we have "q" just a single point
    if (link.length == 0 || link.length == undefined) return
    const sdna = {
        link,
        walked: 0,
        irpath: irpaths.create(link)
    }
    const Signal = signal(sdna)

    // now we have to factor in the realm factor! 
    Signal.realm.factor()
    Signal.buffgits.create()
    return Signal
}

signals.realm = {}

signals.buffgits = {}
signals.buffgits.create = function (sdna, base) {
    return () => {
        // ok we have our irpath - now we need to distribute
        const vorzeichen = {
            combobreaker: ["°", "@", ":", "№", "|", "+"],
        }

        const { egg } = require("./egg")
        function fake() {
            return (realm) => {
                const blub = {
                    "default": 1,
                    "a new realm": 2
                }
                return blub[realm]
            }
        }
        const rosetta = {
            sphere: {
                "☷": 1,
                "~": 2,
                '+': 3
            },
            realm: fake()
        }
        let realmValue = sdna.realm || "default";

        sdna.buffgit = {
            sphere: [rosetta.sphere[sdna.irpath[0]], [sdna.irpath[0]]],
            realm: [rosetta.realm(realmValue), ["#", realmValue]],
            fofu: [900001, []],
            mofu: [900001, []],
            lofu: [900001, []]
        }
        const bucket = {}
        bucket.current = sdna.buffgit.fofu;

        // Iterate from where the actual path content begins (index 1)
        for (let i = 1; i < sdna.irpath.length; i++) {
            let point = sdna.irpath[i];
            // If we hit a combobreaker, advance the bucket
            if (vorzeichen.combobreaker.includes(point)) {
                // The @ symbol always forces the bucket to lofu
                if (point === "@") {
                    bucket.current = sdna.buffgit.lofu;
                } else {
                    if (bucket.current === sdna.buffgit.fofu) bucket.current = sdna.buffgit.mofu;
                    else if (bucket.current === sdna.buffgit.mofu) bucket.current = sdna.buffgit.lofu;
                }
            }

            bucket.current[1].push(point);
        }

        sdna.qugit = [sdna.buffgit.sphere[0], sdna.buffgit.realm[0], sdna.buffgit.fofu[0], sdna.buffgit.mofu[0], sdna.buffgit.lofu[0]]

        return sdna
    }
}

signals.realm.factor = function (sdna, base) {
    return () => {
        // so let's check if our path has a realm!
        return irpaths.realm.factor(sdna, base)
    }
}

signals.hatch = function (egg, sdna, base) {
    return (eggdress) => {
        if (eggdress === null) eggdress = egg[sdna.irpath[sdna.walked]]
        else eggdress = eggdress[sdna.irpath[sdna.walked]]
        sdna.walked++
        if (eggdress === undefined) {
            "oh noes there is no street on this eggdress!"
            "lets check the chicken"
            "so what do we need : hyph.get needs to accept signals!"
            const tracks = sdna.irpath.slice(0, sdna.walked)
            const { chick, chickenpath } = chicken.get(tracks, sdna, base)
            // D:\hyph\chicken\.☷ does not exist 
            // which means you need to create it
            Object.defineProperty(sdna, "chickenpath", { value: chickenpath, writable: true, configurable: true })
            // now I had the chickenpath carved onto the object .
            // "☷" alone should be the overall Collection for globes!
            // you should get the last item of the track because that is the one that we need
            if (!chick) {
                // it's time for zellteilung!
                zell.teilung(tracks, sdna, base)
            }
        }
        eggdress = {}
        return eggdress
    }
}

signals.build = function (sdna, base) {
    return () => {
        const { egg } = require("./egg")
        const irpath = sdna.irpath
        sdna.walked = 0
        // now you have the egg and the irpath.
        // a great combination!
        // let's check if our first eggdress exist:
        let eggdress = null
        const hatch = signals.hatch(egg, sdna, base)
        while (sdna.walked < irpath.length) {
            hatch(eggdress)
        }
        sdna.walked = 0
    }
}

module.exports = { signals }