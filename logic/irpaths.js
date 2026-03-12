
const irpaths = {}

irpaths.realm = {}

irpaths.create = function (link) {
    "you create the path now"
    const irpath = []
    const conops = ["+", "~", "°", "#", "☷", "@", ":", "#", "|", "*"]

    const regex = /([\.°@#~+☷#|:])/
    if (!conops.includes(link[0])) {
        irpath.push("☷")
    }
    const points = {}
    points.raw = link.split(regex).filter(point => point != "" && point != ".");
    points.processed = [];

    for (let point of points.raw) {
        if (!isNaN(point) && point.trim() !== "") {
            let prev = points.processed[points.processed.length - 1];
            // If the standalone number was preceded by a special character (e.g. : or &), pop it
            if (prev && prev.length === 1 && !/[a-zA-Z0-9]/.test(prev)) {
                points.processed.pop();
            }
            points.processed.push("№");
            points.processed.push(point);
        } else {
            // Find numbers attached to the end of a string
            let match = point.match(/^(.*?)([^a-zA-Z0-9_-]?)(-?\d+)$/);
            if (match) {
                if (match[1]) points.processed.push(match[1]);
                points.processed.push("№");
                points.processed.push(match[3]);
            } else {
                points.processed.push(point);
            }
        }
    }

    if (points.processed.includes("@") && !points.processed.includes("°")) {
        points.processed.splice(points.processed.indexOf("@"), 0, "°")
    }

    return [...irpath, ...points.processed]
}

irpaths.realm.factor = function (signal) {
    let realm = {}
    realm.index = signal.irpath.indexOf("#")
    if (realm.index > -1) {
        realm.point = signal.irpath.pop()
        signal.irpath.pop()
    }
    realm = realm.point ?? "default"
    // congrats. all irpath now have a potential realm.
    // and where does the realm play a role? after the zone or continent
    // which is always between index 1 and 2 
    signal.realm = realm    // now you got the streets
    // but before you can .get walk them , you need to build the eggdresses
    return signal
}

module.exports = { irpaths }