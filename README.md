This is a set of libraries and command line utilities for parsing information 
from Congress, the Sunlight Foundation, and others. The purpose is to track the
influence of money in politics.

Wiki
====
Information about the project, as well as code documentation
can be found [here](https://github.com/datakind/sunlight-bff/wiki) 

Components
==========

This describes the various components of the utilities. Currently there are
very few. You should add some!!!!!

Legislation (legis)
------------

This trolls through legislative xml trying to find identical paragraphs of
bills. Outputs a json file which contains a dictionary whose keys are the
sha1 of the text of the paragraphs of the legislation fed in and whose values
are lists of appearance in the order (name\_of\_bill, paragraph\_id,
full\_text\_of\_paragraph).

To use this you will need to get the full text of the bills that congress
passed. You can either scrape this yourself from Thomas (which is painful)
OR you can get it from GovTrack.us. They like to use the rsync protocol, so
make sure you have rsync, and then do

```bash
mkdir -p bill_directory/congress_number
rsync -avz --delete --delete-excluded govtrack.us::govtrackdata/us/congress_number/bills.text
```

For example, if you want to compare the 110th through 112th congresses, you 
would first rsync as follows:

```bash
for c in {110, 111, 112};
do
    mkdir -p bill_directory/${c};
    rsync -avz --delete --delete-excluded govtrack.us::govtrackdata/us/${c}/bills.text;
done;
```


Note the sha is computed from text of a paragraph stripped of the lowercased
text of a paragraph stripped of all numbers, symbols and subtags. Hence, the
full text of paragraphs may differ significantly. For example, you will quickly
see that there is a very large number of pargraphs which read like

For the fiscal year 2012, $10,000,0000.

but have different years and values. This is an artifact of the fact that
Congress sets the budget and that this is the standard phrasing for budget
bills and I sha only _forthefiscalyear_.

Legislator Events
------------

This does two things: 1) creates a json object with info about all of the 
actions taken by, or events relating to, a given legislator and 2) visualizes 
those actions and events on an interactive timeline.

The CLI is inspired by https://github.com/unitedstates/congress.  To see the list of
available senators:

```bash
./run list-legislators --chamber=senate
```
Available representatives can be listed by passing 'house' to the chamber flag.
Both chambers will be listed if one or the other is not specified.

To see the list of available events/actions to include in the output object:

```bash
./run list-events
```

To generate the json for a given legislator:

```bash
./run legislator-events --legislator="John A. Boehner"
```
This command will create a data folder to store the output json (and subsequent output files)
as well as a cached folder for reusable data files that aren't output files themselves. 

Note: the legislator names are the full official names listed by the list-legislators task.  This
is usually First Last, but sometimes names deviate.   
 

