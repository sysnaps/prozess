const fs = require("fs")
const path = require("path")

const HYPH_ROOT = "D:\\hyph"
const CHICKEN = path.join(HYPH_ROOT, "chicken")

const hyph = {}

// resolve a hyph link to a filesystem path
// % prefix = hyph root, otherwise = chicken folder
// ":" becomes "᛬" (runic colon) in filenames
hyph.resolve = function (link) {
    if (link.startsWith("%"))
        return path.join(HYPH_ROOT, link.slice(1))
    let mapped = link.replace(/:/g, "᛬")
    return path.join(CHICKEN, mapped)
}

// update a nested key in a hyph file (dot-separated path like "counter.get")
hyph.update = function (link, keypath, value) {
    let filePath = hyph.resolve(link)
    if (!fs.existsSync(filePath)) return
    let raw = fs.readFileSync(filePath, "utf-8")
    let data = JSON.parse(raw)
    let keys = keypath.split(".")
    let target = data
    for (let i = 0; i < keys.length - 1; i++) {
        if (!target[keys[i]]) target[keys[i]] = {}
        target = target[keys[i]]
    }
    target[keys[keys.length - 1]] = value
    fs.writeFileSync(filePath, JSON.stringify(data, null, 4), "utf-8")
}

// read a pee file from the chicken
hyph.get = function (link) {
    let filepath = hyph.resolve(link)
    if (!fs.existsSync(filepath)) return null
    let raw = fs.readFileSync(filepath, "utf-8")
    if (!raw || !raw.trim()) return null
    return JSON.parse(raw)
}

// write a pee file to the chicken
hyph.save = function (link, data) {
    let filepath = hyph.resolve(link)
    let dir = path.dirname(filepath)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(filepath, JSON.stringify(data, null, 4), "utf-8")
}

// create a folder in the chicken
hyph.mkdir = function (link) {
    let dirpath = hyph.resolve(link)
    if (!fs.existsSync(dirpath)) fs.mkdirSync(dirpath, { recursive: true })
}

module.exports = hyph