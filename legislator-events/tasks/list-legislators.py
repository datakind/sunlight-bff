import requests
import yaml
import time
import json
import io
import sys
import os

def list_legislators(options):
    # create data file if it doesn't exist
    if not os.path.exists('data'):
        os.makedirs('data')
    
    # creates the current legislators yaml and cached folder 
    # if they don't already exist.
    if not os.path.exists('cached/legislators-current.yaml'):
        #create cached file if it doesn't exist
        if not os.path.exists('cached'):
            os.makedirs('cached')
        #read in legislator yaml
        legislator_url = 'https://raw.github.com/unitedstates/congress-legislators/master/legislators-current.yaml'
        r = requests.get(legislator_url)
        legis_yaml = yaml.load(r.text)
        #cache the current legislator yam
        with io.open('cached/legislators-current.yaml', 'wb') as outfile:
            yaml.dump(legis_yaml, outfile)
        #save the legislator yaml

    else:
        yaml_file = open('cached/legislators-current.yaml', 'r')
        legis_yaml = yaml.load(yaml_file)

	reps = []
	sens = []
	for l in legis_yaml:
		if l["terms"][-1]["type"] == "sen":
			sens.append(l["name"]["official_full"])
		elif l["terms"][-1]["type"] == "rep":
			reps.append(l["name"]["official_full"])

	if hasattr(options, "champber"):
		if options["chamber"] == "senate":
			print "SENATORS:"
			for sen in sens:
				print sen
		elif options["chamber"] == "house":
			print "REPRESENTATIVES:"
			for rep in reps:
				print rep
	else:
		print "No chamber specificed.  Listing legislators from both."
		print "SENATORS:"
		for sen in sens:
			print sen

		print "REPRESENTATIVES:"
		for rep in reps:
			print rep

def run(options):
	list_legislators(options)

