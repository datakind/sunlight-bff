Sunlight BFF

This is a set of libraries and command line utilities for parsing information 
from Congress, the Sunlight Foundation, and others. The purpose is to track the
influence of money in politics.

Wiki
====
If you want to contribute to this project, you should join the wiki at
????????

Components
==========

This describes the various components of the utilities. Currently there are
very few. You should add some!!!!!

Leglislation (legis)
------------

This trolls through legislative xml trying to find identical paragraphs of
bills. Outputs a json file which contains a dictionary whose keys are the
sha1 of the text of the paragraphs of the legislation fed in and whose values
are lists of appearance in the order (name\_of\_bill, paragraph\_id,
full\_text\_of\_paragraph).

Note the sha is computed from text of a paragraph stripped of the lowercased
text of a paragraph stripped of all numbers, symbols and subtags. Hence, the
full text of paragraphs may differ significantly. For example, you will quickly
see that there is a very large number of pargraphs which read like

For the fiscal year 2012, $10,000,0000.

but have different years and values. This is an artifact of the fact that
Congress set's the budget and that this is the standard phrasing for budget
bills.
