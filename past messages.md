1:

incoming link is -  entities.user@seri--
incoming link is -  !this.is.a(command)
incoming link is -  ~this.is:a.nype.9
incoming link is - preplanner.plans°jobs.tippster+eastwesteros@seri--

when we have an irlink or a command
the lofu always is the @ 
so what we destructure here:
entities.user@seri--
= 
fofu:[entities,user]
mofu:[]
lofu:[@seri--] 

!this.is.a(command) =
fofu:[this,is]
mofu:[a]
lofu:[command]

~this.is:a.nype.9 = 
fofu:[this,is]
mofu:[a,nype]
lofu:[9]

preplanner.plans°jobs.tippster+eastwesteros@seri-- = 

fofu:[preplanner,plans]
mofu:[jobs,tippster]
lofu: [@seri--]
globe:[eastwesteros]

could you split those strings correctly for me ? 

2:

ty. what i need now is 
to check in D:\hyph\egg
if 
entities.user exists. 
lets start the check if
entities exists! 

existence.js
 

lets do this here. 
for now lets just check 
the first point in our irlink .
can you do that? 

3:

ok it does not exist! 
so let's create it 
k i first need to load the eggistry from the hyph
"D:\hyph\.eggistry"

(funny name, right? 🥚📃)

but I do not want to do that with every incoming call 
can we load it into the cache when we start the local brain ?

4:

uhm why isnt it logging false anymore ?
prozess: running. press Ctrl+C to stop.
prozess: connected to signaling server
prozess: registered as default-brain
incoming link is -  entities.user@seri--
incoming link is -  !this.is.a(command)
does it exist? -  null
incoming link is -  ~this.is:a.nype.9
does it exist? -  null
incoming link is -  preplanner.plans°jobs.tippster+eastwesteros@seri--
prozess: sent answer to client 15
prozess: data channel opened with client 15

5:

wait ok what i want is 
actually a check 
how deep an irlink does not exists
so lets not return true/false but lets return an object with a report so 
yeah that is good. 
so those points inside an irlink are "pees"
because of the word play i just invented:
entrypee for the first point (a nod to entropy)

so as soon as a pee does not exists we return the report with the file of the latest pee we were in. 
for instance if
preplanner.plans
if preplanner exists 
because we create a folder as soon as a pee has children. 
so it would be
\hyph\.preplanner
and if we had children it would be
\hyph\preplanner\.plans 
for instance 
and if we are on entrypee level we just return {peerent: null}
yeah. the peerent is the previous pee 
so 
{
status: exists or error,
peerent: the peerent object if exists
}

6:

uhm:

does it exist? -  {"status":"error","peerent":null,"missing":"entities","depth":0}
irpath is -  [ 'entities', 'user' ]
incoming link is -  !this.is.a(command)
does it exist? -  null
incoming link is -  ~this.is:a.nype.9
does it exist? -  null
incoming link is -  preplanner.plans°jobs.tippster+eastwesteros@seri--
existence.check - .preplanner not found at D:\hyph\egg
does it exist? -  {"status":"error","peerent":null,"missing":"preplanner","depth":0}
irpath is -  [ 'preplanner', 'plans' ]
prozess: sent answer to client 24
prozess: data channel opened with client 24


why doesnt the log below fire ? 


7:

alright:
pee -  {
  is: 'irlink',
  entrypee: 'entities',
  midwells: [],
  minwell: 1,
  maxwell: 300000,
  'unschärfe': 299999,
  thrigit: { fofu: 1, mofu: 0, lofu: 0 }
}
pee -  {
  is: 'irlink',
  entrypee: 'preplanner',
  midwells: [],
  minwell: 300000,
  maxwell: 599999,
  'unschärfe': 299999,
  thrigit: { fofu: 300000, mofu: 0, lofu: 0 }
}
pee -  {
  is: 'irlink',
  entrypee: 'verfassung',
  midwells: [],
  minwell: 599999,
  maxwell: 899998,
  'unschärfe': 299999,
  thrigit: { fofu: 599999, mofu: 0, lofu: 0 }
}

alright now we need to outsource this and make it more abstract because: 

"irpath is -  [ 'entities', 'user' ]"

- when the irpath has a child 
then we ...
ok here is my attempt :


pees.js
 

wells.js
 

do you see what i am trying to do here?

so we need to create well objects 
that have a name (like preplanner or user)
and midwells (the children) 
yeah i think that's it.
I mean we then store those objects as the content of the file. 
so we have a form of eggistry on every pee level 
and when we add a pee we ... hmmm

8:

so these well objects are the pees ! 
and after the recalculation we store them back in the egg ! 

so we only need a new pee (well object)
when we do the run when an unknown irlink arrives. 

so lets say we store
q.Center.Middle 

now q exists . then we store
q.Center.LeftPillar 

q did not change no new child arrived 
but Center now has to divide its unschärfe
among MIddle and LeftPillar. 
and we always need to leave 1 unschärfe as the identifier for the Center itself - the minschärfe. 
and we need to do Math.floor this way wenns nicht ganz aufgeht then we just have some spillage at the top. 
and then when we add
q.IRLinkBar

then we need to recalculate q.Center as well because now it has less unschärfe to distribute among its children. not only less but also the height where the unschärfe starts changes. 

we are partitioning the 900000 available unschärfe of the fofu 
(do not worry - we also have the mofu and the lofu for another 900k each)

9:

uhm yeah about the entrypee :
how do we do that ?

so pess.entry.new
means that we on egg level - where the q goes and preplanner etc... 
the first pee in our chain. 
the entrypee. 

and we need to handle the cache I think so we do not add duplicates to it. 

also sadly i have to rename
.eggistry to .egg 
because that is the format:
the file at base level and then we have a folder with the children of the file. 

so when we load the cache
we load .egg 
where we can see the entrypees 
and their maxschärfen
and the 
unschärfe of the egg per se
which is 900000 the entire egg 

and irlinks are partitioned that way
next we do strands which have a more elaborate partitioning! 


10:

aah i see yo u did:
    let existing = eggistry.cache.irlinks.find(p => p.name === name)


that reminded me: 
 "irlinks": {
        "unit": "collection",
        "collection": "irlinks",
        "maps": "name",
        "items": []
    },

this is how a collection should look like.
across the entire IRL .
and the maps property checks the item for that key and then attaches that key to the collection like this:
    let existing = eggistry.cache.irlinks.name

so our collections need a method!


collections.js
 
does this work? 

and when we later add an item to that collection we do that with the add method

then we can also notify subscribers of that collection but lets defer any subscriber logic.

so the midwells should also be collections like this! so i added a creates funcion

any collection needs to be an official collection build with collections.create 

ok i also tried myself on pees.child.add 
does this look right ? 


11:

ok now let's see where were we. 
we get the irlinks from the main App.
oh i just saw a change in .egg directly
but there are acouple of bugs:
first of: i did not say that yet but the items of 
the irlinks collection 
should be the puh oh boy nonono 
you cant store the items attached to 
the object like this...
ok i see they got removed again from
the .egg 
lets see if they ... yeah no
when we save the collection to the database we do not save the attached objects! 

only the array itself. 
lets fix that first then i look at the rest

12:

ok nice. 
a couple of things:
the minwell off the entrypees overlaps with the maxwell of the previous item on the same height. 
that is wrong there cant be ANY overlap between the ranges. 
we should have the whole irlinks collection 
also have minwell maxwell 
the thing is the minwell and the maxwell are both included in the range. 
and irlinks needs to distribute its 900000 unschärfe - and then leave a restschärfe wenn die items nicht aufgehen . 

and then what is missing: 
the files inside the actual folder:
D:\hyph\egg

look what i did there. 
this is how i want our wells stored. 

which is pretty cool if you ask me. 
and then when we load it from the hyph
we do the same thing with the items like we turn those irlinks into a signal 
and get the actual item out of the the hyph and attach it to the "collection" 

so we have a cascading tree of big objects 
but only inside the cache. 