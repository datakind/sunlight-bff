from sunlight.legislation import _get_files_from_directories
import unittest
import operator
import uuid
import os

class InitTest(unittest.TestCase):
	
	def setUp(self):
		"""
		Make files for testing
		"""
		self.directories = [uuid.uuid1().get_hex() for _ in range(3)]
		files = [[os.path.join(self.directories[i], uuid.uuid1().get_hex()) 
						for j in range(i+1)] 
					for i in range(3)]
		self.files = reduce(operator.add, files)
		for d in self.directories:
			os.mkdir(d)

		for f in self.files:
			ff = open(f, 'w')
			ff.write("Hello %s\n" % f)
			ff.close()

		# Make a subdirectory and file there
		self.subdirectory = os.path.join(self.directories[0], uuid.uuid1().get_hex())
		os.mkdir(self.subdirectory)
		self.subfile = os.path.join(self.subdirectory, uuid.uuid1().get_hex())
		ff = open(self.subfile, 'w')
		ff.write("Hellow %s\n" % self.subfile)

	def tearDown(self):
		os.remove(self.subfile)
		os.rmdir(self.subdirectory)

		for f in self.files:
			os.remove(f)
		for d in self.directories:
			os.rmdir(d)

	def test__get_files_from_directories_flat(self):
		flat_files =  _get_files_from_directories(self.directories)
		self.assertEquals(set(flat_files), set(self.files))

	def test__get_files_from_directories_recursive(self):
		recursed_files = _get_files_from_directories(self.directories, recursive=True)
		self.assertEquals(set(recursed_files), set(self.files + [self.subfile]))

	def test__get_files_from_directories_filter(self):

		def my_filter(v):
			return self.files[0] not in v

		filtered_files = _get_files_from_directories(self.directories, 
			filter_func=my_filter)
		self.assertEquals(set(filtered_files), set(self.files[1:]))

if __name__=='__main__':
	unittest.main()
