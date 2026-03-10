const { buffgits } = require("./buffgits")
const { zells } = require("./zells")

const version = 1

function cap(cdna) {
    cdna.unit = "cap"
    zells.init(cdna)

    cdna.strands.add = caps.strands.add(cdna)
    cdna.check.version(version)

    if (!cdna.buffgits) {
        cdna.buffgits = []
        cdna.strands.forEach(function (strand) {
            let strandbuffgit = caps.buffgit.from(strand)
            if (strandbuffgit) cdna.buffgits.push(strandbuffgit)
        })
    }
    return cdna
}

const caps = {}

caps.create = function ({ concept, strandlink, ring }) {
    return cap({
        cap: concept,
        version,
        ring,
        realm: ring || "default",
        strands: [strandlink],
        minwell: 0,
        maxwell: 0,
        unschärfe: 0
    })
}

caps.buffgit = {}

// look up a strand's buffgit from its chicken file
caps.buffgit.from = function (strandlink) {
    let sig = require("./signal")
    let hyph = require("./hyph")
    let chickenpath = sig.chicken(strandlink)
    if (!chickenpath) return null
    let chickdata = hyph.get(chickenpath)
    if (!chickdata || !chickdata.buffgit) return null
    return chickdata.buffgit
}

caps.strands = {}

caps.strands.add = function (cdna) {
    return function (link) {
        if (!cdna.strands.includes(link)) {
            cdna.strands.push(link)
            let strandbuffgit = caps.buffgit.from(link)
            if (strandbuffgit) cdna.buffgits.push(strandbuffgit)
        }
    }
}

module.exports = { cap, caps }
