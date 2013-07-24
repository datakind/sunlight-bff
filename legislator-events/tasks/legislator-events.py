#!/usr/bin/env python
import subprocess
import requests
import yaml
import time
import json
import io as IO
import sys
import os
import string
import csv
import uuid
import datetime as dt
import dateutil.parser as dup

from pandas import *

class LegisEvents():
    """ a class for building a json object containing events,
        legislative actions, and influence (money, etc) 
        related to a associated with a given legislator """

    def __init__(self, options):
        self.legis_list = []
        self.legis_name = options["legislator"].lower()
        self.legislator = None
        self.chamber = None
        self.crp_catcodes = None
        self.events = [
            self.add_terms,
            self.add_sponsored_bills, self.add_parties,
            self.add_cosponsored_bills, self.add_committee_memberships,
            self.add_campaign_contributions, self.add_speeches,
            self.add_votes
        ]

        self.legis_name = self.legis_name.translate(string.maketrans("",""),
                                                     string.punctuation)

        self.event_attributes = {
            "campaign_contribution" : None,
            "sponsored_legislation" : None,
            "cosponsored_legislation" : None,
            "events_and_parties" : None,
            "committee_assignment" : None,
            "speeches" : None
        }

        f = open('cached/crp_pap_crosswalk.csv')
        self.crp_pap_crosswalk = [row for row in csv.reader(f, delimiter='|')]                                             
        
        pap_bill_info = csv.reader(open('cached/bills93-111.csv', 'rb'), 
                                        delimiter="|")
        pap_bills = [row for row in pap_bill_info]
        self.bill_topic_dict = dict( ( "%s-%s-%s" % (row[7].encode('utf-8'), 
                                    row[3].encode('utf-8'), 
                                    row[2].encode('utf-8')),
                                    [row[10], row[11]] ) for row in pap_bills)

        # create data file if it doesn't exist
        if not os.path.exists('data'):
            os.makedirs('data')

        print """add biographical data from 
            https://github.com/unitedstates/congress-legislators"""

        # creates the current legislators yaml and 
        # cached folder if they don't already exist.        
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
            with IO.open('cached/legislators-current.yaml',
                         'wb') as outfile:
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
        except Exception:
            print ('Sorry, not a recognized legislator.  Please try '
                    './run list-legislators to see available legislators')


    def add_birthday(self):
        """ add selected legislator's birthday to the events object """

        t = str(int(time.mktime(
            time.strptime(self.legislator["bio"]["birthday"], '%Y-%m-%d'))))
        self.legislator["bio"].update(self.legislator["name"])
        birth = { 
            "time" : t , 
            "event" : "born",
            "event_type" : "life_event", 
            "info" : self.legislator["bio"], 
            "event_id" : str(uuid.uuid4()) 
        }
        self.legis_list.append(birth)


    def add_terms(self):
        """ add selected legislators terms to the events object"""
        for term in self.legislator["terms"][:-1]:
            t = str(int(time.mktime(
                time.strptime(term["start"], '%Y-%m-%d'))))
            cong_sess = { 
                "time" : t, 
                "event" : "start congressional term",
                "event_type" : "start_congressional_term",
                "info" : term, 
                "event_id" : str(uuid.uuid4()) 
            }
            self.legis_list.append(cong_sess)


    def add_sponsored_bills(self):
        """ add selected legislator's cosponsored legislation """
        print "adding sponsored legislation from Govtrack.us api"
        bills = []
        pap_key = None

        legis_id = self.legislator["id"]["govtrack"]
        sponsored_url = ('http://www.govtrack.us/api/v2/bill?sponsor=%s'
                         '&limit=600') % legis_id
        r = requests.get(sponsored_url)
        self.sponsored_bills = r.json()

        print "adding PAP/CRP metadata to sponsored bills"
        for bill in self.sponsored_bills['objects']:
            #add the crp_apa crosswalk attributes to the bill object
            bill = dict(crp_dict.items() + bill.items())
            if bill["bill_type"] == "house_bill":
                pap_key = "%s-HR-%s" % (str(bill["congress"]), 
                                        str(bill["number"]))
            elif bill["bill_type"] == "senate_bill":
                pap_key = "%s-S-%s" % (str(bill["congress"]), 
                                       str(bill["number"]))
         
            try:
                bill["major_topic"] = self.bill_topic_dict[pap_key][0]
                bill["minor_topic"] = self.bill_topic_dict[pap_key][1]
                # print "got cosponsored topic one %r" % pap_key
            except:
                bill["major_topic"] = ""
                bill["minor_topic"] = ""

            maj = bill['major_topic']
            min = bill['minor_topic']
            for row in self.crp_pap_crosswalk:
                if pap_topic_subtopic([maj, min], 
                   [row[3], row[4], row[6], row[7], row[8]]):
                    bill['crp_catcode'] = row[0]
                    bill['crp_catname'] = row[1]
                    bill['crp_description'] = row[2]
                    bill['pap_major_topic'] = row[3]
                    bill['pap_subtopic_code'] = row[4]
                    bill['fit'] = row[5]
                    bill['pap_subtopic_2'] = row[6]
                    bill['pap_subtopic_3'] = row[7]
                    bill['pap_subtopic_4'] = row[8]
                    bill['notes_chad'] = row[9]
                    bill['pa_subtopic_code'] = row[10]
                    bill['note'] = row[11]

            t = str(int(time.mktime(time.strptime(bill["introduced_date"], 
                    '%Y-%m-%d'))))
            sponsored_bill = { 
                "time" : t, 
                "event" : "sponsored legislation",
                "event_type" : "sponsored_legislation",
                "info" : bill, 
                "event_id" : str(uuid.uuid4()) 
            }
            self.legis_list.append(sponsored_bill)
            bills.append(bill)

        bills = [ prepBills(bill) for bill in bills]
        filtered = dict((key, list(set([bill[key] for bill in bills]))) 
                        for key in bills[0].keys())
        self.event_attributes["sponsored_legislation"] = filtered


    def add_parties(self):
        """ add selected legislator's fundraising parties and events """
        #fetch parties ADD CACHING!
        if hasattr(self.legislator['id'], 'opensecrets'):
            print "fetching parties"
            parties_url = ('http://politicalpartytime.org/api/v1/event/'
                           '?beneficiaries__crp_id=%s&format=json&apikey='
                           '7ed8089422bd4022bb9c236062377'
                           'c5b' ) % self.legislator['id']['opensecrets']
            p = requests.get(parties_url)
            self.parties = p.json()

            for party in self.parties['objects']:
                t = str(int(time.mktime(time.strptime(party["start_date"],
                      '%Y-%m-%d'))))
                party = { 
                    "time" : t , 
                    "event" : "event/party",
                    "event_type" : "event_or_party",
                    "info" : party, 
                    "event_id" : str(uuid.uuid4()) 
                }
                print "adding party/event"
                self.legis_list.append(party)


    def add_cosponsored_bills(self):
        """ add selected legilsator's cosponsored legislation"""
        print "adding cosponsored bills from Sunlight Congress api"
        cosponsored_bills = []
        pap_key = None
        #make initial request to get number of cosponsored bills
        cosponsor_url = ('http://congress.api.sunlightfoundation.com/'
                         'bills?cosponsor_ids__all=%s&per_page=50'
                         '&apikey=7ed8089422bd4022bb9c236062377'
                         'c5b') % self.legislator['id']['bioguide']
        res = requests.get(cosponsor_url)
        total_pages = (res.json()["count"]/50) + 1
        page = 2
        for result in res.json()["results"]:
            cosponsored_bills.append(result)
        
        #this should probably use generators
        print "adding CRP/PAP metadata to cosponsored bills"
        while page <= total_pages:
            cosponsor_url = ('http://congress.api.sunlightfoundation.com/'
                             'bills?cosponsor_ids__all=%s&per_page=50'
                             '&page=%s&apikey='
                             '7ed8089422bd4022bb9c236062377c5b'
                             ) % (self.legislator['id']['bioguide'], page)
            res = requests.get(cosponsor_url)
            for result in res.json()["results"]:
                cosponsored_bills.append(result)
            page += 1

        for cs in cosponsored_bills:
            cs = dict(crp_dict.items() + cs.items())
            if cs["bill_type"] == "hr":
                pap_key = "%s-HR-%s" % (str(cs["congress"]), str(cs["number"]))
                # print "pap key is %r" % pap_key
            elif cs["bill_type"] == "s":
                pap_key = "%s-S-%s" % (str(cs["congress"]), str(cs["number"]))

            try:
                cs["major_topic"] = self.bill_topic_dict[pap_key][0]
                cs["minor_topic"] = self.bill_topic_dict[pap_key][1]
                # print "got cosponsored topic one %r" % pap_key
            except:
                cs["major_topic"] = ""
                cs["minor_topic"] = ""

            maj = cs['major_topic']
            min = cs['minor_topic']
            for row in self.crp_pap_crosswalk:
                if pap_topic_subtopic([maj, min], [row[3], row[4], row[6], row[7], row[8]]):                    
                    # print "gots a cs topic"
                    cs['crp_catcode'] = row[0]
                    cs['crp_catname'] = row[1]
                    cs['crp_description'] = row[2]
                    cs['pap_major_topic'] = row[3]
                    cs['pap_subtopic_code'] = row[4]
                    cs['fit'] = row[5]
                    cs['pap_subtopic_2'] = row[6]
                    cs['pap_subtopic_3'] = row[7]
                    cs['pap_subtopic_4'] = row[8]
                    cs['notes_chad'] = row[9]
                    cs['pa_subtopic_code'] = row[10]
                    cs['note'] = row[11]
      
            t = str(int(time.mktime(time.strptime(cs["introduced_on"],
                     '%Y-%m-%d'))))
            cosponsorship = { 
                "time" : t , 
                "event" : "bill cosponsorship",
                "event_type" : "bill_cosponsorship",
                "info" : cs, 
                "event_id" : str(uuid.uuid4()) 
            }
            self.legis_list.append(cosponsorship)

        # cs_bills = [ prepCosponsored(cs) for cs in cosponsored_bills ]
        # filtered = dict( (key, list(set([bill[key] for bill in cs_bills]))) for key in cs_bills[0].keys() )
        # self.event_attributes["cosponsored_legislation"] = filtered


    def add_committee_memberships(self):
        """ add selected legsilator's committee memberships"""
        print "adding committee memberships from Charles Stewart committee data"
        # GIST MAPPING CURRENT MEMBERS OF CONGRESS' ICPSR NO'S TO
        # BIOGUIDE IDS https://gist.github.com/konklone/1642406        
        if not os.path.exists('cached/icpsr_to_bioguide.csv'):
            # fetch the csv from konklone's gist  
            # THIS BLOCK IS NOT WORKING PROPERLY!  
            # THE CSV IS READ IN AS A UNICODE STRING 
            # AND THE CSV PARSE IS PARSING IT WIERDLY 
            icpsr_to_bioguide_url = ('https://gist.github.com/'
                                     'konklone/1642406/raw/'
                                     'ca9da4f53efb39d35e37cf19'
                                     'a0129ec5eb7b8ff8/'
                                     'results_plus_hand_entry.csv')

            r = requests.get(icpsr_to_bioguide_url)
            mappingcsv = csv.reader(r.text, delimiter=',')
            
            legis_and_codes = []
            rows = r.text.encode('utf-8').split("\n")
            for row in rows:
                split_row = row.split(",")
                if split_row[1] == self.legislator["id"]["bioguide"]:
                    self.legislator["id"]["icpsr"] = row[2]

        else:
            # read in the icpsr to bioguide csv 
            mappingcsv = csv.reader(open('cached/icpsr_to_bioguide.csv', 'rb'), 
                                            delimiter=',')
            # iterate throug the ids and set the current legislator's icpsr id 
            for row in mappingcsv:
                if row[1] == self.legislator["id"]["bioguide"]:
                    self.legislator["id"]["icpsr"] = row[2]

        #refactor: add fetching if not cached
        house_assignments_codes = open('cached/charles_stewart_assignment_data.json')
        house_assignments_codes = json.load(house_assignments_codes)
        house_member_codes = open('cached/charles_stewart_member_data.json')
        house_member_codes = json.load(house_member_codes)

        # if the house committee assignment list csv is not cached
        # fetch it from gists.github.com
        if self.chamber == "rep":
            if not os.path.exists('cached/house_assignments_103-112.csv'):
                
                house_comm_url = ('https://gist.github.com/pdarche/5383752/raw/'
                                  '07e27469b1f787ae3ba262b613c6bac4b1ba5fc6'
                                  '/house_committee_assignments_103_112.csv')
                r = requests.get(house_comm_url)
                housecsv = csv.reader(r.text, delimiter=',')

            else:
                housecsv = csv.reader(open('cached/house_assignments_103-112.csv',
                                           'rb'),delimiter=',')
                houserows = [x for x in housecsv]                                           
                assignments = []                                               
                assignment_dates = []                                                       
                # create two lists: one with all the rows containing
                # a committee record for the given legislator and
                # another with the assignment dates
                for row in houserows[1:]:
                    if row[2] == str(float(self.legislator["id"]["icpsr"])):
                        committee_key = str(int(float(row[1]))) 
                        party_status_code = str(int(float(row[4])))
                        party_code_key = str(int(float(row[6]))) if len(row[6]) > 0 else "404"
                        senior_party_member_key = str(int(float(row[9])))
                        period_of_service_key = str(int(float(row[11])))
                        csaec_key = str(int(float(row[12]))) if len(row[12]) > 0 else ""
                        ccanc_key = row[13]
                        committe = {
                            "congress" : str(int(float(row[0]))),
                            "committee_code" : house_assignments_codes["committeeCodes"][committee_key],
                            "id_num" : str(int(float(row[2]))),
                            "name" : row[3],
                            "party_status_code" : house_assignments_codes["partyStatusCode"],
                            "rank_within_party" : str(int(float(row[5]))),
                            "party" : house_member_codes["partyCode"][party_code_key],
                            "date_of_assignment" : row[7],
                            "date_of_termination" : row[8],
                            # "senior_party_member" : house_assignments_codes["seniorPartyMember"][senior_party_member_key],
                            "committee_seniority" : row[10],
                            # "committee_period_of_service" : house_assignments_codes["committeePeriodOfService"][period_of_service_key],
                            # "committee_status_at_end_of_congress" : house_member_codes["committeeStatusAtEndOfThisCongress"][csaec_key],
                            # "committee_continuity_of_assignment_next_congress" : house_member_codes["committeeContinuityOfAssignmentInNextCongress"][ccanc_key],
                            "appointment_citation" : row[14],
                            "committee_name" : row[15],
                            "state" : row[16],
                            "notes" : ""
                        }
                        assignments.append(row)
                        assignment_dates.append(row[7])                                     

                # create list of unique assignment dates
                dates = list(set(assignment_dates))
                
                # for each unique date, iterate through assignments
                # and look for assignemtn matches.  add matches 
                # to unique date list and create an assignment object  
                for u_date in dates:
                    u_date_list = []
                    for row in assignments:
                        if u_date == row[7]:
                            u_date_list.append(row)
                    t = str(int(time.mktime(time.strptime(u_date, 
                            '%Y-%m-%d %H:%M:%S')))) 
                    committee_assignment = { 
                            "time" : t, 
                            "event" : "joined committee",
                            "event_type" : "joined_committee",
                            "info" : u_date_list, 
                            "event_id" : str(uuid.uuid4()) 
                        }
                    # print ("adding committee")
                    self.legis_list.append(committee_assignment)

        elif self.chamber == "sen":
            print "chamber is senate"
            if not os.path.exists('cached/senate_assignments_103-112.csv'):
                senate_comm_url = ('https://gist.github.com/pdarche/5383745/raw/'
                                         '164ada45a82755e5ced80ff1029c801fd9c79c7d/'
                                         'senate_committee_assignments_103_112.csv')

                r = requests.get(senate_comm_url)
                senatecsv = csv.reader(r.text, delimiter=',')
            else:
                senatecsv = csv.reader(open('cached/senate_assignments_103-112.csv',
                                           'rb'),delimiter=',')
                senaterows = [x for x in senatecsv]                                     
                assignments = []                                                       
                assignment_dates = []                                             
                # create two lists: one with all the rows containing
                # a committee record for the given legislator and
                # another with the assignment dates
                for row in senaterows[1:]:
                    if row[2] == str(float(self.legislator["id"]["icpsr"])):       
                        assignments.append(row)                                             
                        assignment_dates.append(row[7])                                     

                # create list of unique assignment dates
                dates = list(set(assignment_dates))
                
                # for each unique date, iterate through assignments
                # and look for assignemtn matches.  add matches
                # to unique date list and create an assignment object
                for u_date in dates:
                    u_date_list = []
                    for row in assignments:
                        if u_date == row[7]:
                            u_date_list.append(row)
                    t = str(int(time.mktime(time.strptime(u_date, 
                            '%Y-%m-%d %H:%M:%S')))) 
                    committee_assignment = { 
                            "time" : t, 
                            "event" : "joined committee",
                            "event_type" : "joined_committee",
                            "info" : u_date_list, 
                            "event_id" : str(uuid.uuid4()) 
                        }
                    self.legis_list.append(committee_assignment)


    def add_campaign_contributions(self):
        """add selected legislator's campaign contributiosn recieved"""
        print "adding campaign contribution data from Sunlight Influence Explorer api"
        contributions = []
        contribution_events = []
        legis_cycles = []
        for term in self.legislator["terms"]:
            start_date = term["start"].split("-")
            cycle = int(start_date[0]) - 1
            legis_cycles.append(cycle)

        name = self.legis_name.split(" ")[-1]
        codes = csv.reader(open('cached/catcodes.csv', 'rb'))
        rows = [ row for row in codes ]
        d = dict(  ( v[1], [ v[2], v[3], v[4] ] ) for v in rows )
        self.crp_catcodes = d

        for cycle in legis_cycles:
            contribution_url = ('http://transparencydata.com/api/1.0/contribution'
                                's.json?apikey=7ed8089422bd4022bb9c236062377c5b'
                                '&recipient_ft=%s&cycle=%s') % ( name, cycle )                                

            res = requests.get(contribution_url)
            for contribution in res.json():
                try:
                    t = str(int(time.mktime(time.strptime(
                        contribution["date"].decode('utf-8'), '%Y-%m-%d'))))
                    catcode = contribution["contributor_category"].encode('utf-8')            
                    try: 
                        contribution["contributor_category_name"] = d[catcode][0]
                        contribution["contributor_category_industry"] = d[catcode][1]
                        contribution["contributor_category_order"] = d[catcode][2]
                    except:
                        contribution["contributor_category_name"] = ""
                        contribution["contributor_category_industry"] = ""
                        contribution["contributor_category_order"] = ""

                    contribution_event = {
                        "time" : t,
                        "event" : "recieved campaign contribution",
                        "event_type" : "recieved_campaign_contribution",
                        "info" : contribution,
                        "event_id" : str(uuid.uuid4()),
                        "amount" : contribution["amount"]
                    }

                    self.legis_list.append(contribution_event)
                    contribution_events.append(contribution_event)
                    contributions.append(contribution)
                except:
                    print "somethings wong with this thing"

        #REFACTOR!
        my_string = [ str(dt.datetime.fromtimestamp(int(c["time"])).month) + "_" + str(dt.datetime.fromtimestamp(int(c["time"])).year) for c in contribution_events ]
        unique_month_year_string = list(set(my_string))

        for myt in unique_month_year_string:
            month = []
            for event in contribution_events:
                event_dt = dt.datetime.fromtimestamp(int(event["time"]))
                event_my = str(event_dt.month) + "_" + str(event_dt.year)  
                if myt == event_my:                    
                    month.append(event)

            my_split = myt.split("_")
            t = dt.datetime(year=int(my_split[1]), month=int(my_split[0]), day=1)
            t = int(time.mktime(t.timetuple()))
            c_sum = 0
            for c in month:
                try:
                    c_sum += int(float(c["amount"]))
                except ValueError:
                    pass

            contributions_month = {
                "time" : t,
                "event" : "month of campaign contributions",
                "event_type" : "recieved_campaign_contributions",
                "children" : month,
                "event_id" : str(uuid.uuid4()),
                "amount" : c_sum
            }

            self.legis_list.append(contributions_month)

        filtered = dict( (key, list(set([contribution[key] for contribution in contributions]))) for key in contributions[0].keys() )
        self.event_attributes["campaign_contribution"] = filtered

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
        lobbied_bills['bill_no'] = lobbied_bills['bill_no'].map(
                                        lambda x: x.replace('|',''))
        lobbied_bills['cong_no'] = lobbied_bills['cong_no'].map(
                                        lambda x: x.replace('|',''))

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

    def add_speeches(self):
        """ add selected legislator's floor speeches"""
        print "adding speech data from Sunlight Capitol Words api"
        speeches = []
        #make initial request to get number of cosponsored bills
        speeches_url = ('http://capitolwords.org/api/1/text.json?'
                        'bioguide_id=%s&per_page=50'
                        '&apikey=7ed8089422bd4022bb9c236062377'
                        'c5b') % self.legislator['id']['bioguide']

        res = requests.get(speeches_url)
        total_pages = (res.json()["num_found"]/50) + 1
        page = 2
        for result in res.json()["results"]:
            speeches.append(result)

        #this should probably use generators
        while page <= total_pages:
            speeches_url = ('http://capitolwords.org/api/1/text.json?'
                        'bioguide_id=%s&per_page=50&page=%s'
                        '&apikey=7ed8089422bd4022bb9c236062377'
                        'c5b') % (self.legislator['id']['bioguide'], page)
            res = requests.get(speeches_url)
            for result in res.json()["results"]:
                speeches.append(result)
            page += 1

        for s in speeches:
            if s['bills'] != None:
                s['bill_codes'] = []
                for bill in s['bills']:
                    split = bill.split(' ')
                    chamber = split[0].upper().replace('.','')
                    number = split[1]
                    pap_key = '%s-%s-%s' % (s['congress'], chamber, number)
                    bill = {}
                    # REFACTOR: THE BELOW CODE IS DUPLICATED 
                    try:
                        bill["major_topic"] = self.bill_topic_dict[pap_key][0]
                        bill["minor_topic"] = self.bill_topic_dict[pap_key][1]
                        # print "got cosponsored topic one %r" % pap_key
                    except:
                        bill["major_topic"] = ""
                        bill["minor_topic"] = ""

                    maj = bill['major_topic']
                    min = bill['minor_topic']
                    for row in self.crp_pap_crosswalk:
                        if pap_topic_subtopic([maj, min], [row[3], row[4], row[6], row[7], row[8]]):
                            # print "got a speech bill topic for bill %r" % pap_key
                            bill['crp_catcode'] = row[0]
                            bill['crp_catname'] = row[1]
                            bill['crp_description'] = row[2]
                            bill['pap_major_topic'] = row[3]
                            bill['pap_subtopic_code'] = row[4]
                            bill['fit'] = row[5]
                            bill['pap_subtopic_2'] = row[6]
                            bill['pap_subtopic_3'] = row[7]
                            bill['pap_subtopic_4'] = row[8]
                            bill['notes_chad'] = row[9]
                            bill['pa_subtopic_code'] = row[10]
                            bill['note'] = row[11]
                    s['bill_codes'].append(bill)

            t = str(int(time.mktime(time.strptime(s["date"],
                     '%Y-%m-%d'))))
            speech = { 
                "time" : t , 
                "event" : "speech",
                "event_type" : "speech",
                "info" : s, 
                "event_id" : str(uuid.uuid4()) 
            }
            self.legis_list.append(speech)

        print "adding CRP/PAP metadata to speeches"
        # speeches = [ prep_speech(speech) for speech in speeches ]
        # filtered = dict( (key, list(set([speech[key] for speech in speeches]))) for key in speeches[0].keys() )
        # self.event_attributes["speeches"] = filtered

    def add_votes(self):
        """ add selected legilsator's votes cast"""
        print "adding vote data from Sunlight Congress api"
        votes = []
        #make initial request to get number of cosponsored bills
        votes_url = ('http://congress.api.sunlightfoundation'
                     '.com/votes?&fields=bill,voters.%s,voted_at'
                     '&per_page=50&apikey=7ed8089422bd4022bb9c236062'
                     '377c5b') % self.legislator['id']['bioguide']

        res = requests.get(votes_url)
        total_pages = (res.json()["count"]/50) + 1
        page = 2
        # votes = [ vote for vote in res.json()['results'] ]
        for result in res.json()["results"]:
            votes.append(result)
        
        # this should probably use generators
        while page <= total_pages:
            # print "adding votes"
            votes_url = ('http://congress.api.sunlightfoundation.com'
                         '/votes?&fields=bill,voters.%s,voted_at&per_page=50'
                         '&page=%s&apikey=7ed8089422bd4022bb9c2360623'
                         '77c5b') % (self.legislator['id']['bioguide'], page)

            res = requests.get(votes_url)
            for result in res.json()["results"]:
                votes.append(result)
            page += 1

        for v in votes:
            bioguide = self.legislator['id']['bioguide']
            if (bioguide in v['voters'].keys() and 
                'bill' in v.keys()):
                v['bill']['vote'] = ''
                v['bill']['vote'] = v['voters'][bioguide]['vote']
                del v['voters']
                v = dict(v['bill'].items() + v.items())
                del v['bill']
                v = dict(crp_dict.items() + v.items())
                
                # if the bill comes from the house
                if v["bill_type"] == "hr":
                    #set the pap key
                    pap_key = "%s-HR-%s" % (str(v["congress"]), str(v["number"]))
                elif v["bill_type"] == "s":
                    pap_key = "%s-S-%s" % (str(v["congress"]), str(v["number"]))
                # else set the pap key to None
                else:
                    pap_key = None

                # if the pap key is not none
                if pap_key != None:
                    # try to get a major topic
                    try:
                        v["major_topic"] = self.bill_topic_dict[pap_key][0]
                        v["minor_topic"] = self.bill_topic_dict[pap_key][1]
                    except:
                        pass
                # else set the major topic to nothing
                else:
                    v["major_topic"] = ""
                    v["minor_topic"] = ""

                # iterate through the crosswalk and look for rows that match
                # bill's major and minor topic
                maj = v['major_topic']
                min = v['minor_topic']
                for row in self.crp_pap_crosswalk:
                    if pap_topic_subtopic([maj, min], [row[3], row[4], row[6], row[7], row[8]]):
                        # print "gots a vote topic with pap code %r %r %r" % ( pap_key, row[3], v['major_topic'])
                        v['crp_catcode'] = row[0]
                        v['crp_catname'] = row[1]
                        v['crp_description'] = row[2]
                        v['pap_major_topic'] = row[3]
                        v['pap_subtopic_code'] = row[4]
                        v['fit'] = row[5]
                        v['pap_subtopic_2'] = row[6]
                        v['pap_subtopic_3'] = row[7]
                        v['pap_subtopic_4'] = row[8]
                        v['notes_chad'] = row[9]
                        v['pa_subtopic_code'] = row[10]
                        v['note'] = row[11]

                dt = dup.parse(v["voted_at"])
                timestamp = str(int(time.mktime(dt.timetuple())) - 14400) # remove 4 hours to convert from utc to est
                vote = { 
                    "time" : timestamp, 
                    "event" : "vote",
                    "event_type" : "vote",
                    "info" : v, 
                    "event_id" : str(uuid.uuid4()) 
                }
                self.legis_list.append(vote)

        print "adding CRP/PAP metadata to votes"
        # speeches = [ prep_speech(speech) for speech in speeches ]
        # filtered = dict( (key, list(set([speech[key] for speech in speeches]))) for key in speeches[0].keys() )
        # self.event_attributes["speeches"] = filtered

    def create_object(self):
        for event in self.events:
            event()


def run(options):
    print "building json for %s" % options["legislator"]

    legis = LegisEvents(options)
    legis.create_object()

    times = [ obj["time"] for obj in legis.legis_list ]
    unique_times = list(set(times))
    events_list = []

    # order events by timestamp
    print "ordering events"
    for time in unique_times:
        time_list = []        
        for event in legis.legis_list:            
            if event["time"] == time:
                time_list.append(event)
        ev_collection = { "time" : time, "events" : time_list}
        events_list.append(ev_collection)

    final_dict = {
        "data" : events_list, 
        "bio" : legis.legislator,
        "event_attributes" : legis.event_attributes,
        "crp_catcodes" : legis.crp_catcodes
    }

    filename = './timeline/data/%s.json' % legis.legis_name.replace(" ", "_")
    
    with IO.open(filename, 'wb') as outfile:
      json.dump(final_dict, outfile)

    print "done!"


def prepBills(bill):
    del bill["major_actions"]
    del bill["titles"]
    del bill["sponsor"]
    del bill["sponsor_role"]

    return bill

def prepCosponsored(bill):

    # del bill["last_version"]
    del bill["history"]
    del bill["related_bill_ids"]
    del bill["committee_ids"]
    del bill["urls"]
    del bill["enacted_as"]

    if hasattr(bill, "last_version"):
        del bill["last_version"]

    return bill

def prep_speech(speech):
    del speech["speaking"]
    del speech["bills"]

    return speech

def pap_topic_subtopic(maj_min, topics):
    if maj_min[0] == topics[0]:
        if (maj_min[1] == topics[1] or 
            maj_min[1] == topics[2] or 
            maj_min[1] == topics[3] or 
            maj_min[1] == topics[4]):
            return True
        else: 
            return False

crp_dict = {
    'crp_catcode' : '',
    'crp_catname' : '',
    'crp_description' : '',
    'pap_major_topic' : '',
    'pap_subtopic_code' : '',
    'fit' : '',
    'pap_subtopic_2' : '',
    'pap_subtopic_3' : '',
    'pap_subtopic_4' : '',
    'notes_chad' : '',
    'pa_subtopic_code' : '',
    'note' : '',
    "major_topic" : '',
    "minor_topic" : '',
}

