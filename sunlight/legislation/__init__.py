from sunlight.legislation.parser import paragraphs_to_sha
from sunlight.utilities import ProgressBar
import sunlight.runtime as runtime

from argparse import FileType

import csv
import sys
import os

def _add_legislation_parsers(subparsers):
	parser = subparsers.add_parser('legis', 
		help="Parse some legislative arguments")

	parser.add_argument('directory', type=str, nargs=1, 
		help='The directory to find legislative xml to parse.')
	parser.add_argument('--outfile', type=FileType('w'),
		help='If given, the file to output to.', dest='outfile')

	parser.set_defaults(func=_parser)

def _parser(args):
	"""
	Globs the files from the given directory and outputs the 
	"""
	outfile = csv.writer(args.outfile)

	directory = args.directory[0]
	if not os.path.isdir(directory):
		print "Error: %s is not a directory" % directory
		exit(-1)

	files = [os.path.join(directory, f) for f in os.listdir(directory)]
	files = filter(lambda v: os.path.isfile(v), files)
	files = filter(lambda v: 'xml' in v, files)

	if runtime.verbose:
		for f in ProgressBar(files, which_tick=True):
			try:
				to_write = paragraphs_to_sha(open(f, 'r'))
				outfile.writerows(to_write)
			except Exception, e:
				sys.stderr.write("Error with %s: %s\n" % (f, str(e)))
	else:
		for f in files:
			try:
				to_write = paragraphs_to_sha(open(f, 'r'))
				outfile.writerows(to_write)
			except Exception, e:
				sys.stderr.write("Error with %s: %s\n" % (f, str(e)))
