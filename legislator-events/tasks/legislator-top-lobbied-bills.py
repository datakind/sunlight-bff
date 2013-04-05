from pandas import *
import requests
import yaml
import time


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


#####

r = requests.get('https://raw.github.com/unitedstates/congress-legislators/master/legislators-current.yaml')
legis_yaml = yaml.load(r.text)

legis_dict = {}
for l in legis_yaml:
    name = "%s_%s" % (l["name"]["first"].lower(), l["name"]["last"].lower())
    legis_dict[name] = l


legis_id = legis_dict["charles_schumer"]["id"]["govtrack"]
url = 'http://www.govtrack.us/api/v2/bill?sponsor=%s&limit=1000' % legis_id
r = requests.get(url)
sponsored_bills = r.json['objects']

#####

to_sort = []
for bill in sponsored_bills:
    try:
        number = bill["display_number"].replace(" ", "").encode('utf-8')
        cong = bill["congress"]
        start_date = bill['sponsor_role']['startdate'].encode('utf-8')
        start_date_utc = time.mktime(time.strptime(start_date, '%Y-%m-%d'))
        lobbyings = lobbyings_issues_bills[ (lobbyings_issues_bills['bill_no'] == number ) & (lobbyings_issues_bills['cong_no'] == str(cong))]
        lobbying_counts = lobbied_bills[ (lobbied_bills['bill_no'] == number ) & (lobbied_bills['cong_no'] == str(cong))]['bill_no'].value_counts()
        bill = {
            "lobbying_instances" : lobbying_counts[number], 
            "title" : bill["title"].encode('utf-8'),
            "start_date" : start_date,
            "start_date_utc" : start_date_utc
        }
        to_sort.append(bill)
    except KeyError:
        pass

#change key to change sorting
s = sorted(to_sort, key=lambda k: k['lobbying_instances'])
s.reverse()

for b in s:
    print b