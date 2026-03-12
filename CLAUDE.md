
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

## Methods > Static functions

The Plural factories are there to attach methods to zells.
When implementing the Pipelines it is necessary that you use the methods provided by the zells and not static functions . the Factories should be there to take the dna of a zell 
and then return a function that we attach to that zell inside its direct call (like zone() or pascal()) as a method - by calling that function and passing the dna to it.  
and the function that gets returned takes more function specific parameter and handles the specific tasks needed for the pipeline to work whenever we need a zell of its kind . 