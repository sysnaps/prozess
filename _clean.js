const fs = require('fs')
const path = require('path')

function rmrf(d) {
    if (!fs.existsSync(d)) return
    if (fs.statSync(d).isDirectory()) {
        fs.readdirSync(d).forEach(f => rmrf(path.join(d, f)))
        fs.rmdirSync(d)
    } else {
        fs.unlinkSync(d)
    }
}

// remove everything except .egg (if it exists)
let c = 'D:/hyph/chicken'
fs.readdirSync(c).forEach(f => {
    if (f === '.egg') return
    rmrf(path.join(c, f))
    console.log('rm', f)
})
console.log('remaining:', fs.readdirSync(c))
