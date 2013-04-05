#!/usr/bin/env python
import requests
import yaml
import time
import json
import io
import sys
import os

from pandas import *


class LegisEvents():
    """ a class for building a json object containing events
        and actions associated with a given legislator """

    def __init__(self, options):
        self.legis_list = []
        self.legis_name = options["legislator"].replace(" ", "_").lower()
        self.events = [
            self.add_birthday, self.add_terms, 
            self.add_sponsored_bills, self.add_parties,
            self.add_cosponsored_bills
        ]

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
            with io.open('cached/legislators-current.yaml', 'wb') as outfile:
                yaml.dump(legis_yaml, outfile)
            #save the legislator yaml

        else:
            yaml_file = open('cached/legislators-current.yaml', 'r')
            legis_yaml = yaml.load(yaml_file)

        for l in legis_yaml:
            if l["name"]["official_full"] == options["legislator"]:
                self.legislator = l


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
                         'bills?cosponsor_ids__all=S000148&per_page=50' 
                         '&apikey=7ed8089422bd4022bb9c236062377c5b')
        res = requests.get(cosponsor_url)
        total_pages = (res.json()["count"]/50) + 1
        page = 2
        for result in res.json()["results"]:
            cosponsored_bills.append(result)
        
        #this should probably use generators
        while page <= total_pages:
            cosponsor_url = ('http://congress.api.sunlightfoundation.com/'
                             'bills?cosponsor_ids__all=S000148&per_page=50'
                             '&page=%s&apikey=7ed8089422bd4022bb9c236062377c5b') % page
            res = requests.get(cosponsor_url)
            for result in res.json()["results"]:
                cosponsored_bills.append(result)
            page += 1

        for cs in cosponsored_bills:
            t = str(int(time.mktime(time.strptime(cs["introduced_on"], '%Y-%m-%d'))))
            cosponsorship = { "time" : t , "event" : "bill cosponsorship", "info" : cs }
            self.legis_list.append(cosponsorship)


    def add_sponsored_bill_lobbying(self):
        """ this function will take a lot of time and 
            resources.  It reads in multiple 100+ mb
            files and then manipulates them """

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

        sorted_events = sorted(self.legis_list, key=lambda k: int(k['time']))
        final_dict = { "data" : sorted_events }

        filename = './data/%s.json' % self.legis_name
        with io.open(filename, 'wb') as outfile:
          json.dump(final_dict, outfile)


def run(options):
    print "building json for %s" % options["legislator"]

    legis = LegisEvents(options)
    legis.create_object()

    sorted_events = sorted(legis.legis_list, key=lambda k: int(k['time']))
    final_dict = { "data" : sorted_events }

    filename = './data/%s.json' % legis.legis_name
    with io.open(filename, 'wb') as outfile:
      json.dump(final_dict, outfile)


