#!/usr/bin/env python

available_events = [
	"birthday", "terms", "sponsored bills",
	"parties and events", "campaign contributions",
	"cosponored bills"
]

def run(options):
	print "EVENTS/ACTIONS AVAILABLE FOR INCLUSION IN OBJECT"
	for ev in available_events:
		print ev
