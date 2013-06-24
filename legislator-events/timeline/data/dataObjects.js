var labelData = [
		{
			y: 60,
			fill: 'steelblue',
			text: 'Sponsored Legislation',
			targetClass: '.sponsored'
		},
		{
			y: 120,
			fill: 'red',
			text: 'Cosponsored Legislation',
			targetClass: '.cosponsored'	
		},
		{
			y: 180,
			fill: 'orange',
			text: 'Speeches',
			targetClass: '.speech'	
		},
		{
			y: 270,
			fill: 'yellow',
			text: 'Committee Memberships',
			targetClass: '.committee'
		},						
		{
			y: 420,
			fill: 'green',
			text: 'Campaign Contributions',
			targetClass: '.recieved'
		}
]

var eventToSelectorMapping = {
	"campaign_contribution" : ".recieved",
	"sponsored_legislation" : ".sponsored, .context-sponsored",
	"cosponsored_legislation" : ".cosponsored, .context-cosponsored",
	"committee" : ".committee"
}

var committeeAttributes = [
	
]

var sponsoredAttributes = [
		"bill_resolution_type",
		"bill_type", "bill_type_label",
		"congress", "contributor_type",
		"current_status", "current_status_date",
		"current_status_description", "current_status_label",
		"display_number", "docs_house_gov_postdate",
		"id", "introduced_date",
		"is_alive", "is_current", "noun",
		"number", "senate_floor_schedule_postdate",
		"sliplawnum", "sliplawpubpriv", "sponsor",
		"sponsor_role", "title",
		"title_without_number", "time",
		"crp_catname"
	]

var contributionAttributes = [ 
		"amount", "candidacy_status", "committee_ext_id",
		"committee_name", "committee_party", "contributor_address",
		"contributor_category", "contributor_category_name", "contributor_city",
		"contributor_category_industry", "contributor_category_order",
		"contributor_employer", "contributor_ext_id",
		"contributor_gender", "contributor_name",
		"contributor_occupation", "contributor_state", 
		"contributor_type", "contributor_zipcode",
		"cycle", "date", "district", "district_held",
		"filing_id", "is_amendment", "organization_ext_id",
		"organization_name", "parent_organization_ext_id",
		"parent_organization_name", "recipient_category", 
		"recipient_state_held", "recipient_type",
		"seat", "seat_held", "seat_result", "seat_status", 
		"transaction_id", "transaction_namespace", 
		"transaction_type", "transaction_type_description"
	]
