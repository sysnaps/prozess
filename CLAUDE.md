
***rules***

## no camelCase no snake_case
use dot.case by attaching the relevant variables onto the dna. 
when instantiating variable with let or const and you feel the need to have a camelCase variable name create an object . so instead of const lofuWell = ... 
do const well = {} well.lofu = ... 
do the properties in big endian style (endian.big) where the more complex concepts come first. 

## create a lot of smaller functions 
especially after if statements and for loops. 
These are good markers to indicate that the logic can be split into granular functions. 
this does not only increase readability of the code but also allows for a sharing of functions
in between different pipelines. 
Try to attach that function onto the objects in the egg or the plural factories where they make the most sense. 

## using globals is a sign 
when you feel the urge to use a global variable - that is a good sign the we need a zell for that to get it out of the chicken. 

## IF-thens
in the same vain as creating a lot of smaller functions. i created IF.js :
D:\prozess\logic\IF.js

I wont rigorously enforce this. It would be nice though if you use the IF().then() syntax and have the "thens" be their own functions. 


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