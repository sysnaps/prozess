
const version = 1
const funk = function (fdna) {
    fdna.unit = "funk"
    return fdna
}

const funks = {}

funks.create = function () {
    let fdna = {
        version,
        unit: "funk"
    }
    return funk(fdna)
}

module.exports = { funk, funks }
