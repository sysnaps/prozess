
and if you are motivated you can even give the if conditions a name. ok that is actually easy enough. 
hook them onto the dna or egg like 
instead of 
```js
let midwells = well.midwells && well.midwells.items ? well.midwells.items : []
        if (midwells.length > 0) {...}
```
so
well.midwells.amount.greater["0"] = midwells.length > 0
if (midwells.length > 0)

or how about:
runes.ifs.amount.greater["0"] = function(amount) {return amount > 0}

if(runes.ifs.amount.greater["0"](midwells.length))

which seems tedious. this is why I wont strictly enforce this.
But have in the back of your mind that once the App runs the goal is that we can create stammzells . 
we cant create viewpoints.js or triangles.js or rings.js and put it inside app\src at runtime. 
but we can create good syntax and generic ifs and thens and encode that into json and our
zells.js can turn generic stammzellen dna into zells similar to the ones we describe with ours files
by picking and choosing our methods and mdnas. then during the creation we attach those methods (runes) to the dna ,
feed it the argument the callback needs (or the whole dna) and then during the .get walks we can have a 
runebook.each run calling the runes creating very zell specific behavior