// sigs are the smallest moving parts of the IRL
// zell > unit > sig
// irpaths, signets, and nulls are all sigs

const sig = function (sdna) {
    return sdna
}

const sigs = {}

sigs.create = function (kind, concept) {
    return sig({
        sig: kind,
        [kind]: concept
    })
}

// instead of returning null, return a sig that explains why
sigs.null = function (reason) {
    return sig({
        sig: "signal",
        signal: "null",
        null: reason
    })
}

// a signet wraps a link with its parsed signal and buffgit
sigs.signet = function (link, signal, buffgit) {
    return sig({
        sig: "signet",
        link,
        signal,
        buffgit
    })
}

module.exports = { sig, sigs }
