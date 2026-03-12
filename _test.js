const { eggs, egg } = require("./logic/egg")
const sig = require("./logic/signal")
const route = require("./logic/route")
const hyph = require("./logic/hyph")
const fs = require("fs")
const path = require("path")

eggs.init()

// simulate real App links
let links = [
    "q.Center",
    "q.IRLinkbar",
    "q.ContextBar",
    "q.Center",
    "character.conditions.selected",
    "~Napp.tab",
    "colors.weak:gray"
]

links.forEach(link => {
    console.log("\n--- routing:", link, "---")
    try {
        let signal = sig.walk(link)
        route(signal)
        console.log("  walked:", signal.walked)
    } catch (e) {
        console.log("  ERROR:", e.message)
    }
})

// now check the chicken
console.log("\n\n========= CHICKEN AUDIT =========")
function listDir(dir, prefix) {
    if (!fs.existsSync(dir)) { console.log(prefix + "(not found)"); return }
    fs.readdirSync(dir).forEach(f => {
        let full = path.join(dir, f)
        let stat = fs.statSync(full)
        if (stat.isDirectory()) {
            console.log(prefix + f + "/")
            listDir(full, prefix + "  ")
        } else {
            console.log(prefix + f)
        }
    })
}
listDir("D:/hyph/chicken", "  ")

// check specific files
console.log("\n\n========= SPECIFIC FILES =========")
let files = ["☷.1.q", "☷q/.1.Center", "☷q/.1.conditions", "☷.1.character", "☷character/.1.conditions", "~.1.Napp", "~.1.tab"]
files.forEach(f => {
    let data = hyph.get(f)
    if (data) {
        console.log("\n" + f + ":", JSON.stringify(data, null, 2).slice(0, 300))
    } else {
        console.log("\n" + f + ": NOT FOUND")
    }
})
