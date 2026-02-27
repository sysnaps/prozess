// generates leelang lile files for every lee function
const fs = require('fs')
const path = require('path')

const LEELANG_DIR = path.join(__dirname, 'leelang')

// parse lee.js to extract all lees
const src = fs.readFileSync(path.join(__dirname, 'lee.js'), 'utf8')

// extract iddress and function signature
const leePattern = /\{\s*iddress:\s*(\[[^\]]+\]),\s*function:\s*(\([^)]*\))\s*=>/g
const lees = []
let match

while ((match = leePattern.exec(src)) !== null) {
    const iddress = JSON.parse(match[1].replace(/"/g, '"'))
    const params = match[2].replace(/[()]/g, '').split(',').map(s => s.trim()).filter(Boolean)
    lees.push({ iddress, params })
}

console.log(`Found ${lees.length} lee functions`)

for (const lee of lees) {
    // create folder path from iddress: ["not","equals"] → leelang/not/equals/
    const folderPath = path.join(LEELANG_DIR, ...lee.iddress)
    fs.mkdirSync(folderPath, { recursive: true })

    const name = lee.iddress[lee.iddress.length - 1]

    // build the object form (unit in an object)
    const objectForm = {
        unit: "lee",
        lee: lee.iddress,
        arguments: lee.params.map(p => "$" + p)
    }
    // add the chain key with arguments
    objectForm[name] = lee.params.map(p => "$" + p)

    // build the array form (unit as array items)
    // ["lee", "increment", "$target", "$value"]
    const arrayForm = ["lee", ...lee.iddress, ...lee.params.map(p => "$" + p)]

    const lileContent = {
        iddress: ["leelang", ...lee.iddress],
        cap: "lee",
        lee: lee.iddress,
        arguments: lee.params.map(p => "$" + p),
        forms: {
            object: objectForm,
            array: arrayForm
        }
    }

    const filePath = path.join(folderPath, name + '.lile')
    fs.writeFileSync(filePath, JSON.stringify(lileContent, null, 4))
    console.log(`  ${lee.iddress.join('.')}`)
}

console.log(`\nDone. Created ${lees.length} leelang lile files.`)
