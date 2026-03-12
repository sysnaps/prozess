
const version = 1
function cosmos(cdna) {
    cdna.zell = cdna.zell || "cosmos"
    cdna.work = cosmi.work(cdna)
    return cdna
}

const cosmi = {}

// cosmos work: cap creation in a zone's mofu space
// route walker calls egg[":"].exe("seri", signal) → hub → dna.work
cosmi.work = function (dna) {
    return function (capname, signal) {
        let z = signal.zone
        if (!z) {
            console.log("cosmos work: no zone on signal")
            return dna
        }

        let capobj = z.cap(capname, signal.link)
        signal.capname = capname

        let zonename = z.concept
        if (!dna[zonename]) dna[zonename] = {}
        let realm = signal.realm || "default"
        if (!dna[zonename][realm]) dna[zonename][realm] = {}
        dna[zonename][realm][capname] = capobj

        cosmi.work.payload(capobj, signal)

        console.log("cosmos work:", capname, "in zone", z.concept, "minwell:", capobj ? capobj.minwell : null)
        return capobj
    }
}

cosmi.work.payload = function (capobj, signal) {
    if (capobj && capobj.minwell !== undefined) {
        signal.payload.push(capobj.minwell)
    }
}

cosmi.create = function ({ zone, unschärfe, realm }) {
    let { zells } = require("./zells")
    let cdna = { zell: "cosmos", zone, unschärfe, version, realm }
    zells.init(cdna)
    return cdna
}

module.exports = { cosmos, cosmi }
