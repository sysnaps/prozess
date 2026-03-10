

function IF(condition) {
    return {
        then: (callback, ...args) => { if (condition == true) return callback(...args) }
    }
}

module.exports = IF