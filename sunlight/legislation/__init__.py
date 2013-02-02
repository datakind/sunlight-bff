from sunlight.legislation.parser import paragraphs_to_sha
from sunlight.utilities import ProgressBar
import sunlight.runtime as runtime

import csv
import os

def _add_legislation_parsers(subparsers):
	parser = subparsers.add_parser('legis', 
		help="Parse some legislative arguments")

	parser.add_argument('directory', type=str, nargs=1, 
		help='The directory to find legislative xml to parse.')
	parser.add_argument('--outfile', type=str, nargs=1,
		help='If given, the file to output to.', default='----',
		dest='outfile')

	parser.set_defaults(func=_parser)

def _parser(args):
	"""
	Globs the files from the given directory and outputs the 
	"""
	outfile_name = args.outfile[0]
	if outfile_name != '----':
		outfile = csv.writer(open(outfile_name, 'w'))
	else:
		outfile = csv.writer(sys.stdout)

	directory = args.directory[0]
	if not os.path.isdir(directory):
		print "Error: %s is not a directory" % directory
		exit(-1)

	files = [os.path.join(directory, f) for f in os.listdir(directory)]
	files = filter(lambda v: os.path.isfile(v), files)
	files = filter(lambda v: 'xml' in v, files)

	if runtime.verbose:
		for f in ProgressBar(files, which_tick=True):
			outfile.writerows(paragraphs_to_sha(open(f, 'r')))
	else:
		for f in files:
			outfile.writerows(paragraphs_to_sha(open(f, 'r')))

