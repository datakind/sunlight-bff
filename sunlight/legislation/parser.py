from sunlight.errors import LegislationError

import xml.dom.minidom as domdom
from hashlib import sha1 as sha
import operator

def get_text(x):
	"""
	Get the text from a minidom node or from each of its child nodes.
	Return appended version.

	Recurses on x.
	"""
	if hasattr(x, 'wholeText'):
		# TEXT NODE
		return x.wholeText

	if hasattr(x, 'childNodes'):
		# OTHER NODE WITH CHILDREN
		return reduce(operator.__add__, map(get_text, x.childNodes))

	# I DON'T KNOW WHAT KIND OF NODE THIS IS
	return ''

def strip_text(s):
	"""
	From a string s, only keep around A-z and make everything lowercase.
	"""
	return reduce(operator.__add__, [ss for ss in s if ss.isalpha()]).lower()
	
def get_sha_of_text(x):
	"""
	Returns the hexdigest of the sha1 hash of get_text(x)
	"""
	return sha(strip_text(get_text(x))).hexdigest()

def paragraphs_to_sha(f):
	"""
	Takes as input a file handle which is a piece of legislative xml and returns
	a list of lists containing shaed versions of paragraphs.

	Methodology
	-----------
	Takes the paragraph tags and first:
		1. Strips out all subtags
		2. Only keeps [A-z]
		3. Makes all lowercase

	Returns
	-------
	List of lists where the sublists are:
		bill_id, paragraph_id, sha_of_manipulated_paragraph
		bill_id = number_of_congress, type_of_bill, number_of_bill, subtype_of_bill

	Raises
	------
	If f is a malformed xml file will raise an
		xml.parsers.expat.ExpatError

	If f doesn't have certain tags (e.g., a title), raises
		sunlight.errors.LegislationError
	"""

	tree = domdom.parse(f)
	bill_name = tree.getElementsByTagName("dc:title")
	if len(bill_name) == 0:
		raise LegislationError("%s doesn't have a title tag" % f.name)
	elif len(bill_name) > 1:
		raise LegislationError("%s has more than one title tag" % f.name)

	bill_name = bill_name[0].firstChild.wholeText	

	# Bill names are structured as
	# 	number_of_congress type_of_bill number_of_bill subtype_of_bill: full_name_of_bill
	#	e.g. 112 HR 7 HR: American Energy and Infrasturcture Jobs Act of 2012
	bill_id = bill_name.split(':')[0]
	number_of_congress, type_of_bill, number_of_bill, subtype_of_bill = bill_id.split(' ')
	number_of_congress = int(number_of_congress)
	number_of_bill = int(number_of_bill)

	paragraphs = tree.getElementsByTagName("paragraph")
	paragraphs = [ (number_of_congress, 
					type_of_bill, 
					number_of_bill, 
					subtype_of_bill, 
					p.attributes['id'].value.lower(),
					get_sha_of_text(p)) for p in paragraphs ]
	return paragraphs
