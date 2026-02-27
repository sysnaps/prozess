import lee from '../lee.js'
function hub(verfassung) {
    // so we create the hub on the @screen shread.
    // yeah lets not have a @not-logged-in character
    // we have the @Screen namespace. it is not a character because we dont use a hyphen in the name
    // but it acts just like a character
    // so we need logic to create a character 
    // where do we get that? from
    // D:\prozess\verfassung\characters\characters.lile
    // and we can create init in here
    function init(cap) {
        if (!this[cap.cap]) {
            throw new Error('compiler error 4 : i think we always have that cap')
        }
        this[cap.cap] = cap

        // ok we first get init from the verfassung
        verfassung.load(['init'])
            // then we and that is the big one a pipeline that turns this:
            /*
            "exe": {
                    "arguments": [
                        "@",
                        "$vane",
                        "$rest"
                    ],
                    "units": [
                        {
                            "cap": "unit",
                            "instruction": "resolve @",
                            "unit": "lee",
                            
                            "lee": [
                                "resolve",
                                [
                                    "@"
                                ]
                            ]
                        }
                    ]
                }, */
            // the exe there into:
            (function exe(character, vane, rest) {
                this.exe.units.forEach(unit => {
                    if (unit.lee) {
                        const leebel = unit.lee[0]
                        // here we need a pipeline that has info about what "resolve" needs and where we find the arguments
                        const rune = hub.register.check(leebel)
                        if (!rune) {
                            const resolve = lee[unit.lee[0]]
                            unit.lee[1].forEach(conop => {
                                if (conop == "@") {
                                    const rune = { name: "resolve", function: (character) => { resolve(character) } }
                                    this[cap.cap].resolve = rune
                                    hub.register.push(rune)
                                }
                            })
                        } else {
                            this[cap.cap].resolve = rune
                        }

                    }
                })
            })

        this.init = init

    }
}

export default hub
