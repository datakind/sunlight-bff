#!/usr/bin/env python
import requests
import yaml
import time
import json
import io
import sys
import os

to_lower = [x.lower() for x in sys.argv[1:]]
legis_name = '_'.join(to_lower)

if not os.path.exists('data'):
    os.makedirs('data')

legis_list = []

if not os.path.exists('cached/legislators-current.yaml'):
    if not os.path.exists('cached'):
        os.makedirs('cached')
    #read in legislator yaml
    legislator_url = 'https://raw.github.com/unitedstates/congress-legislators/master/legislators-current.yaml'
    r = requests.get(legislator_url)
    legis_yaml = yaml.load(r.text)
    with io.open('cached/legislators-current.yaml', 'wb') as outfile:
        yaml.dump(legis_yaml, outfile)
    #save the legislator yaml
else:
    yaml_file = open('cached/legislators-current.yaml', 'r')
    legis_yaml = yaml.load(yaml_file)    

#creat dict of legislators
#from the legis yaml
legis_dict = {}
for l in legis_yaml:
    name = "%s_%s" % (l["name"]["first"].lower(), l["name"]["last"].lower())
    legis_dict[name] = l

try:
    legislator = legis_dict[legis_name]
except KeyError:
    print "Sorry, %s is not a recognized legislator" % legis_name

#fetch sponosred bills
legis_id = legis_dict[legis_name]["id"]["govtrack"]
sponsored_url = 'http://www.govtrack.us/api/v2/bill?sponsor=%s&limit=1000' % legis_id
r = requests.get(sponsored_url)
sponsored_bills = r.json

#fetch parties
parties_url = 'http://politicalpartytime.org/api/v1/event/?beneficiaries__crp_id=%s&format=json&apikey=7ed8089422bd4022bb9c236062377c5b' % legislator['id']['opensecrets']
p = requests.get(parties_url)
parties = p.json

t = str(int(time.mktime(time.strptime(legislator["bio"]["birthday"], '%Y-%m-%d'))))
legislator["bio"].update(legislator["name"])
birth = { "time" : t , "event" : "born" , "info" : legislator["bio"]  }
legis_list.append(birth)

for term in legislator["terms"][:-1]:
    t = str(int(time.mktime(time.strptime(term["start"], '%Y-%m-%d'))))
    cong_sess = { "time" : t, "event" : "start congressional term", "info" : term }
    legis_list.append(cong_sess)

for bill in sponsored_bills()['objects']:
    t = str(int(time.mktime(time.strptime(bill["introduced_date"], '%Y-%m-%d'))))
    sponsored_bill = { "time" : t, "event" : "sponsored legislation", "info" : bill }
    legis_list.append(sponsored_bill)

for party in p.json()['objects']:
    t = str(int(time.mktime(time.strptime(party["start_date"], '%Y-%m-%d'))))
    party = { "time" : t , "event" : "event/party", "info" : party }
    legis_list.append(party)

sorted_events = sorted(legis_list, key=lambda k: int(k['time']))

final_dict = { "data" : sorted_events }

filename = 'data/%s.json' % legis_name
with io.open(filename, 'wb') as outfile:
  json.dump(final_dict, outfile)

