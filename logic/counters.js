
const version = 1
const counter = function (cdna) {
    cdna.add = counters.add(cdna)
    cdna.increment = counters.increment(cdna)
    return cdna
}

const counters = {}

counters.create = function ({ links = [], counter: name }) {
    let cdna = { version, zell: "unit", unit: "counter", counter: name }
    links.forEach(function (link) {
        cdna[link] = 0
    })
    return counter(cdna)
}

counters.add = function (cdna) {
    return (link, start = 0) => {
        cdna[link] = start
    }
}

counters.increment = function (cdna) {
    return (link) => {
        if (cdna[link]) cdna[link]++
        else cdna.add(link, 1)
    }
}

// re-attach .add/.increment to a counter loaded from JSON
counters.hydrate = function (cdna) {
    return counter(cdna)
}

module.exports = { counter, counters }
