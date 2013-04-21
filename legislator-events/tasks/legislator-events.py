#!/usr/bin/env python
import requests
import yaml
import time
import json
import io as IO
import sys
import os
import string
import csv

from pandas import *


class LegisEvents():
    """ a class for building a json object containing events
        and actions associated with a given legislator """

    def __init__(self, options):
        self.legis_list = []
        self.legis_name = options["legislator"].lower()
        self.legislator = None
        self.chamber = None
        self.events = [
            self.add_terms,
            self.add_sponsored_bills, self.add_parties,
            self.add_cosponsored_bills, self.add_committee_memberships
        ]

        self.legis_name = self.legis_name.translate(string.maketrans("",""), string.punctuation)

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
            legislator_url = ('https://raw.github.com/unitedstates/congress-'
                              'legislators/master/legislators-current.yaml')
            r = requests.get(legislator_url)
            legis_yaml = yaml.load(r.text)
            #cache the current legislator yam
            with IO.open('cached/legislators-current.yaml', 'wb') as outfile:
                yaml.dump(legis_yaml, outfile)
            #save the legislator yaml

        else:
            yaml_file = open('cached/legislators-current.yaml', 'r')
            legis_yaml = yaml.load(yaml_file)

        for l in legis_yaml:
            if l["name"]["official_full"] == options["legislator"]:
                self.legislator = l
                self.chamber = l["terms"][-1]["type"]

        try:
            self.legislator["name"]
            print self.legislator["id"]
        except Exception:
            print ('Sorry, not a recognized legislator.  Please'
                    ' try ./run list-legislators to see available legislators')


    def add_birthday(self):
        t = str(int(time.mktime(
            time.strptime(self.legislator["bio"]["birthday"], '%Y-%m-%d'))))
        self.legislator["bio"].update(self.legislator["name"])
        birth = { "time" : t , "event" : "born" , "info" : self.legislator["bio"]  }
        self.legis_list.append(birth)


    def add_terms(self):
        for term in self.legislator["terms"][:-1]:
            t = str(int(time.mktime(
                time.strptime(term["start"], '%Y-%m-%d'))))
            cong_sess = { "time" : t, "event" : "start congressional term", "info" : term }
            self.legis_list.append(cong_sess)


    def add_sponsored_bills(self):
        #fetch sponosred bills ADD CACHING!
        legis_id = self.legislator["id"]["govtrack"]
        sponsored_url = 'http://www.govtrack.us/api/v2/bill?sponsor=%s&limit=1000' % legis_id
        r = requests.get(sponsored_url)
        self.sponsored_bills = r.json()

        for bill in self.sponsored_bills['objects']:
            t = str(int(time.mktime(time.strptime(bill["introduced_date"], '%Y-%m-%d'))))
            sponsored_bill = { "time" : t, "event" : "sponsored legislation", "info" : bill }
            self.legis_list.append(sponsored_bill)


    def add_parties(self):
        #fetch parties ADD CACHING!
        if hasattr(self.legislator['id'], 'opensecrets'):        
            parties_url = ('http://politicalpartytime.org/api/v1/event/'
                           '?beneficiaries__crp_id=%s&format=json&apikey='
                           '7ed8089422bd4022bb9c236062377c5b' ) % self.legislator['id']['opensecrets']
            p = requests.get(parties_url)
            self.parties = p.json()

            for party in self.parties['objects']:
                t = str(int(time.mktime(time.strptime(party["start_date"], '%Y-%m-%d'))))
                party = { "time" : t , "event" : "event/party", "info" : party }
                self.legis_list.append(party)


    def add_cosponsored_bills(self):
        cosponsored_bills = []
        #make initial request to get number of cosponsored bills
        cosponsor_url = ('http://congress.api.sunlightfoundation.com/'
                         'bills?cosponsor_ids__all=%s&per_page=50'
                         '&apikey=7ed8089422bd4022bb9c236062377c5b') % self.legislator['id']['bioguide']
        res = requests.get(cosponsor_url)
        total_pages = (res.json()["count"]/50) + 1
        page = 2
        for result in res.json()["results"]:
            cosponsored_bills.append(result)
        
        #this should probably use generators
        while page <= total_pages:
            cosponsor_url = ('http://congress.api.sunlightfoundation.com/'
                             'bills?cosponsor_ids__all=%s&per_page=50'
                             '&page=%s&apikey=7ed8089422bd4022bb9c236062377c5b') % (self.legislator['id']['bioguide'], page)
            res = requests.get(cosponsor_url)
            for result in res.json()["results"]:
                cosponsored_bills.append(result)
            page += 1

        for cs in cosponsored_bills:
            t = str(int(time.mktime(time.strptime(cs["introduced_on"], '%Y-%m-%d'))))
            cosponsorship = { "time" : t , "event" : "bill cosponsorship", "info" : cs }
            self.legis_list.append(cosponsorship)


    def add_committee_memberships(self):
        # GIST MAPPING CURRENT MEMBERS OF CONGRESS' ICPSR NO'S TO
        # BIOGUIDE IDS https://gist.github.com/konklone/1642406
        
        if not os.path.exists('cached/icpsr_to_bioguide.csv'):
            #fetch the csv from konklone's gist  THIS BLOCK IS NOT CURRENTLY WORKING!  
            #THE CSV IS READ IN AS A UNICODE STRING AND THE CSV PARSE IS PARSING IT WIERDLY 
            icpsr_to_bioguide_url = ('https://gist.github.com/konklone/1642406/raw/'
                                     'ca9da4f53efb39d35e37cf19a0129ec5eb7b8ff8/'
                                     'results_plus_hand_entry.csv')

            r = requests.get(icpsr_to_bioguide_url)
            mappingcsv = csv.reader(r.text, delimiter=',')

        else:
            mappingcsv = csv.reader(open('cached/icpsr_to_bioguide.csv', 'rb'), delimiter=',')
            for row in mappingcsv:
                if row[1] == self.legislator["id"]["bioguide"]:
                    self.legislator["id"]["icpsr"] = row[2]


        if not os.path.exists('cached/house_assignments_103-112.csv'):
            # if self.chamber == "rep":
            house_committees_url = ('https://gist.github.com/pdarche/5383752/raw/'
                                    '07e27469b1f787ae3ba262b613c6bac4b1ba5fc6/'
                                    'house_committee_assignments_103_112.csv')
    
            r = requests.get(house_committees_url)
            housecsv = csv.reader(r.text, delimiter=',')

        else:
            housecsv = csv.reader(open('cached/house_assignments_103-112.csv', 'rb'), delimiter=',')
            houserows = [x for x in housecsv]
            assignments = []
            assignment_dates = []

            for row in houserows[1:]:
                if row[2] == str(float(self.legislator["id"]["icpsr"])):
                # if int(float(row[2])) == int(self.legislator["id"]["icpsr"]):
                    assignments.append(row)
                    assignment_dates.append(row[7])

            dates = []
            for date in assignment_dates:
                if date not in dates:
                    dates.append(date)
            
            for u_date in dates:
                assignment_dict = {}
                u_date_list = []
                for row in assignments:
                    if u_date == row[7]:
                        u_date_list.append(row)
                t = str(int(time.mktime(time.strptime(u_date, '%Y-%m-%d %H:%M:%S'))))
                committee_assignment = { "time" : t, "event" : "joined committee", "info" : u_date_list }
                self.legis_list.append(committee_assignment)

        # if not os.path.exists('cached/senate_assignments_103-112.csv'):
        # else:
        #     seante_committees_url = ('https://gist.github.com/pdarche/5383745/raw/'
        #                              '164ada45a82755e5ced80ff1029c801fd9c79c7d/'
        #                              'senate_committee_assignments_103_112.csv')

        # iterate through lines of csv.  if row id equals
        # legislator id, create committee dict and append it
        # to legis-dict list


    def add_sponsored_bill_lobbying(self):
        issues = read_csv(
            '/Users/pdarche/Downloads/Lobby/lob_issue.txt', 
            quotechar='|',
            names = [ 'si_id', 'uniq_id', 'issue_id', 
                      'issue', 'specific_issue', 'year' ]
        )

        lobbied_bills = read_csv(
            '/Users/pdarche/Downloads/Lobby/lob_bills.txt', 
            names = [ 'b_id', 'si_id', 'cong_no', 'bill_no' ]
        )

        # strip pipe delimiters from bill
        # and congress number strings
        lobbied_bills['bill_no'] = lobbied_bills['bill_no'].map(lambda x: x.replace('|',''))
        lobbied_bills['cong_no'] = lobbied_bills['cong_no'].map(lambda x: x.replace('|',''))

        lobbyings = read_csv(
            '/Users/pdarche/Downloads/Lobby/lob_lobbying.txt',
            quotechar = '|',
            names = [ 'uniq_id', 'registrant_raw', 'registrant', 
                      'is_firm', 'client_raw', 'client', 'ultorg',
                      'amaount', 'catcode', 'source', 'self', 
                      'include_NSFS', 'use', 'ind', 'year', 'type',
                      'type_long', 'affiliate' ]
        )

        catcodes = read_csv('/Users/pdarche/Desktop/catcodes.csv')
        catcodes.columns = ['source', 'catcode', 'name', 'industry', 'order']

        lobbyings_issues_merged = merge(lobbyings, issues, on='uniq_id')
        lobbyings_issues_bills = merge(lobbyings_issues_merged, lobbied_bills, on='si_id')
        lob_iss_bill_catcodes = merge(lobbyings_issues_bills, catcodes, on='catcode')

        #open secrets lobbying data
        #http://www.opensecrets.org/MyOS/download.php?f=Lobby.zip

    def create_object(self):
        for event in self.events:
            event()


def run(options):
    print "building json for %s" % options["legislator"]

    legis = LegisEvents(options)
    legis.create_object()

    sorted_events = sorted(legis.legis_list, key=lambda k: int(k['time']))
    final_dict = { "data" : sorted_events }

    filename = './data/%s.json' % legis.legis_name.replace(" ", "_")
    
    with IO.open(filename, 'wb') as outfile:
      json.dump(final_dict, outfile)


