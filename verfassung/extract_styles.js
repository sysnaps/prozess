const fs = require('fs')
const path = require('path')

const ELEMENTS_DIR = path.join(__dirname, 'elements', 'element')

// recursively find all .lile files
function findLiles(dir) {
    const results = []
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            results.push(...findLiles(full))
        } else if (entry.name.endsWith('.lile')) {
            results.push(full)
        }
    }
    return results
}

let totalCleaned = 0

for (const filePath of findLiles(ELEMENTS_DIR)) {
    let raw
    try {
        raw = fs.readFileSync(filePath, 'utf8')
    } catch (e) { continue }

    // clean trailing period
    const cleaned = raw.replace(/\}\s*\.\s*$/, '}')
    let data
    try {
        data = JSON.parse(cleaned)
    } catch (e) { continue }

    // only process files that have a style object with nested keys
    if (!data.style || typeof data.style !== 'object') continue

    // check if any value in style is an object (i.e. nested style)
    const hasNested = Object.values(data.style).some(v => typeof v === 'object' && v !== null)
    if (!hasNested) continue

    // remove the style property
    delete data.style

    // write back
    fs.writeFileSync(filePath, JSON.stringify(data, null, 4))
    totalCleaned++
    console.log(`CLEANED: ${path.relative(ELEMENTS_DIR, filePath)}`)
}

console.log(`\nDone. Removed style objects from ${totalCleaned} files.`)
