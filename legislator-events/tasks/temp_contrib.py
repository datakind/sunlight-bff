### Basic structure of function which gets contributions data
### Needs to be merged with [legislator-events.py?]

import urllib
import json

# Query InfluenceExplorer API
#self.legis_name instead of example, also take out cycle
query = 'http://transparencydata.com/api/1.0/contributions.json?apikey=7ed8089422bd4022bb9c236062377c5b&cycle=2010&recipient_ft=%s' % 'mikulski' 
data = urllib.urlopen(query).read()
results = json.loads(data)

# format this data into sunlight-bff's already created structure
for result in results:
	## Likely want to keep
	result['amount']
	result['date']
	result['contributor_name']
	result['contributor_ext_id']
	result['contributor_category']
	result['contributor_employer']
	
	## Maybe want to keep
	results['transaction_id'] # unique transaction ID
	results['transaction_type'] # loan, contribution, etc.
	results['is_amendment'] # links to previous result -- we'll have to handle this specially if we include it
	results['committee_name'] # This seems redundant - probably we'll already have this associated with the recipient
	
	## There's a ton of info about the contributors: gender, occupation, employer, city, state, zip, etc.
	## Other possible fields:  http://data.influenceexplorer.com/docs/contributions/ 

	## Should also think about error-handling duplicate names, but perhaps Influence Explorer's ID system will help
