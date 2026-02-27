
const lee = {}

lee.array = [

    // ── math ──
    { iddress: ["increment"], function: (target, value) => target.value += value },
    { iddress: ["decrement"], function: (target, value) => target.value -= value },
    { iddress: ["add"], function: (a, b) => a + b },
    { iddress: ["subtract"], function: (a, b) => a - b },
    { iddress: ["multiply"], function: (a, b) => a * b },
    { iddress: ["divide"], function: (a, b) => a / b },
    { iddress: ["modulo"], function: (a, b) => a % b },
    { iddress: ["negate"], function: (a) => -a },
    { iddress: ["floor"], function: (a) => a | 0 },
    { iddress: ["clamp"], function: (value, min, max) => value < min ? min : value > max ? max : value },

    // ── comparison ──
    { iddress: ["equals"], function: (a, b) => a === b },
    { iddress: ["not", "equals"], function: (a, b) => a !== b },
    { iddress: ["greater"], function: (a, b) => a > b },
    { iddress: ["less"], function: (a, b) => a < b },
    { iddress: ["greater", "equal"], function: (a, b) => a >= b },
    { iddress: ["less", "equal"], function: (a, b) => a <= b },
    { iddress: ["between"], function: (value, low, high) => value >= low && value <= high },

    // ── logic ──
    { iddress: ["and"], function: (a, b) => a && b },
    { iddress: ["or"], function: (a, b) => a || b },
    { iddress: ["not"], function: (a) => !a },
    { iddress: ["if", "else"], function: (condition, yes, no) => condition ? yes : no },
    { iddress: ["exists"], function: (a) => a !== null && a !== undefined },
    { iddress: ["fallback"], function: (a, b) => a ?? b },

    // ── property ──
    { iddress: ["has"], function: (cap, key) => key in cap },
    { iddress: ["get"], function: (cap, key) => cap[key] },
    { iddress: ["set"], function: (cap, key, value) => cap[key] = value },
    { iddress: ["delete"], function: (cap, key) => delete cap[key] },
    { iddress: ["type", "of"], function: (a) => typeof a },

    // ── walk ── (dot.case property access)
    { iddress: ["walk"], function: (cap, path) => path.reduce((obj, key) => obj?.[key], cap) },
    { iddress: ["walk", "set"], function: (cap, path, value) => path.slice(0, -1).reduce((obj, key) => obj[key] ??= {}, cap)[path[path.length - 1]] = value },

    // ── array ──
    { iddress: ["for", "each"], function: (array, fn) => array.forEach(fn) },
    { iddress: ["map"], function: (array, fn) => array.map(fn) },
    { iddress: ["filter"], function: (array, fn) => array.filter(fn) },
    { iddress: ["find"], function: (array, fn) => array.find(fn) },
    { iddress: ["find", "index"], function: (array, fn) => array.findIndex(fn) },
    { iddress: ["some"], function: (array, fn) => array.some(fn) },
    { iddress: ["every"], function: (array, fn) => array.every(fn) },
    { iddress: ["push"], function: (array, item) => array.push(item) },
    { iddress: ["pop"], function: (array) => array.pop() },
    { iddress: ["shift"], function: (array) => array.shift() },
    { iddress: ["at"], function: (array, index) => array[index] },
    { iddress: ["length"], function: (array) => array.length },
    { iddress: ["includes"], function: (array, item) => array.includes(item) },
    { iddress: ["slice"], function: (array, start, end) => array.slice(start, end) },
    { iddress: ["concat"], function: (a, b) => a.concat(b) },
    { iddress: ["flat"], function: (array) => array.flat() },
    { iddress: ["reverse"], function: (array) => [...array].reverse() },
    { iddress: ["sort"], function: (array, fn) => [...array].sort(fn) },
    { iddress: ["splice"], function: (array, start, count) => array.splice(start, count) },

    // ── string ──
    { iddress: ["split"], function: (string, delimiter) => string.split(delimiter) },
    { iddress: ["join"], function: (array, delimiter) => array.join(delimiter) },
    { iddress: ["starts", "with"], function: (string, prefix) => string.startsWith(prefix) },
    { iddress: ["ends", "with"], function: (string, suffix) => string.endsWith(suffix) },
    { iddress: ["trim"], function: (string) => string.trim() },
    { iddress: ["lower"], function: (string) => string.toLowerCase() },
    { iddress: ["upper"], function: (string) => string.toUpperCase() },
    { iddress: ["replace"], function: (string, from, to) => string.replace(from, to) },
    { iddress: ["char", "at"], function: (string, index) => string.charAt(index) },
    { iddress: ["code", "point"], function: (string, index) => string.codePointAt(index) },
    { iddress: ["from", "code"], function: (code) => String.fromCodePoint(code) },
    { iddress: ["template"], function: (string, cap) => string.replace(/\{([^}]+)\}/g, (_, key) => cap[key] ?? '') },

    // ── object ──
    { iddress: ["keys"], function: (cap) => Object.keys(cap) },
    { iddress: ["values"], function: (cap) => Object.values(cap) },
    { iddress: ["entries"], function: (cap) => Object.entries(cap) },
    { iddress: ["assign"], function: (target, source) => Object.assign(target, source) },
    { iddress: ["merge"], function: (a, b) => ({ ...a, ...b }) },
    { iddress: ["freeze"], function: (cap) => Object.freeze(cap) },
    { iddress: ["empty"], function: () => ({}) },
    { iddress: ["empty", "array"], function: () => [] },

    // ── cap attachment ──
    { iddress: ["attach"], function: (lee, cap) => cap[lee.iddress] = lee.function },
    { iddress: ["attach", "all"], function: (lees, cap) => lees.forEach(l => cap[l.iddress] = l.function) },

    // ── buffer (SharedArrayBuffer) ──
    { iddress: ["buffer", "read"], function: (buffer, index) => Atomics.load(buffer, index) },
    { iddress: ["buffer", "write"], function: (buffer, index, value) => Atomics.store(buffer, index, value) },
    { iddress: ["buffer", "add"], function: (buffer, index, value) => Atomics.add(buffer, index, value) },
    { iddress: ["buffer", "wait"], function: (buffer, index, expected) => Atomics.wait(buffer, index, expected) },
    { iddress: ["buffer", "notify"], function: (buffer, index) => Atomics.notify(buffer, index) },

    // ── conop check (first character) ──
    { iddress: ["is", "conop"], function: (string) => "!@+/$|%:".includes(string[0]) },
    { iddress: ["is", "self"], function: (string) => string[0] === "+" },
    { iddress: ["is", "character"], function: (string) => string[0] === "@" },
    { iddress: ["is", "active"], function: (string) => string[0] === "!" },
    { iddress: ["is", "stack"], function: (string) => string[0] === "!" && string[1] === "!" },
    { iddress: ["is", "dollar"], function: (string) => string[0] === "$" },
    { iddress: ["is", "iteration"], function: (string) => string[0] === "/" },
    { iddress: ["is", "pipe"], function: (string) => string[0] === "|" },
    { iddress: ["is", "rest"], function: (string) => string[0] === "%" },
    { iddress: ["is", "island"], function: (string) => string[0] === ":" },
    { iddress: ["strip", "conop"], function: (string) => string.replace(/^[!@+/$|%:]+/, "") },

    // ── conop resolve ──
    { iddress: ["resolve", "self"], function: (path, cap) => path.slice(1).split(".").reduce((obj, key) => obj?.[key], cap) },
    { iddress: ["resolve", "active"], function: (path, active) => path.slice(1).split(".").reduce((obj, key) => obj?.[key], active) },
    { iddress: ["resolve", "stack"], function: (path, stack) => path.slice(2).split(".").reduce((obj, key) => obj?.[key], stack) },
    { iddress: ["resolve", "iteration"], function: (path, item) => path.slice(1).split(".").reduce((obj, key) => obj?.[key], item) },

    // ── vane ──
    { iddress: ["vane", "create"], function: (action, origin, character) => ({ action, origin, character, body: {}, trace: [] }) },
    { iddress: ["vane", "trace"], function: (vane, street) => vane.trace.push(street) },

    // ── body ──
    { iddress: ["body", "set"], function: (vane, key, value) => vane.body[key] = value },
    { iddress: ["body", "get"], function: (vane, key) => vane.body[key] },
    { iddress: ["body", "has"], function: (vane, key) => key in vane.body },
    { iddress: ["body", "merge"], function: (vane, source) => Object.assign(vane.body, source) },

    // ── flow ──
    { iddress: ["noop"], function: () => { } },
    { iddress: ["identity"], function: (a) => a },
    { iddress: ["log"], function: (label, value) => console.log(label, value) },
    { iddress: ["warn"], function: (label, value) => console.warn(label, value) },
    { iddress: ["throw"], function: (code, message) => { throw `compiler error ${code}: ${message}` } },

    // ── timing ──
    { iddress: ["now"], function: () => performance.now() },
    { iddress: ["defer"], function: (fn) => queueMicrotask(fn) },



]

export default lee