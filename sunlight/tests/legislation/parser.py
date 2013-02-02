import unittest
import hashlib
import xml.dom.minidom as domdom

from sunlight.legislation.parser import get_sha_of_text, get_text, strip_text

class TestParser(unittest.TestCase):

	def setUp(self):
		self.basicXML = '<a><b>A34sdf<c>888]zdTV</c></b><d>8u8u8u</d></a>'

	def test_get_text(self):
		tree = domdom.parseString(self.basicXML)
		self.assertEquals(get_text(tree), 'A34sdf888]zdTV8u8u8u')

	def test_strip_text(self):
		tree = domdom.parseString(self.basicXML)
		self.assertEquals(strip_text(get_text(tree)), 'asdfzdtvuuu')

	def test_get_sha_of_text(self):
		tree = domdom.parseString(self.basicXML)
		sha_should_be = hashlib.sha1('asdfzdtvuuu').hexdigest()
		self.assertEquals(get_sha_of_text(tree), sha_should_be)

if __name__=='__main__':
	unittest.main()
