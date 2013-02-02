from sunlight.legislation.parser import paragraphs_to_sha, paragraphs_with_shas
from sunlight.utilities import ProgressBar
import sunlight.runtime as runtime

from argparse import FileType

import csv
import sys
import os

def _add_legislation_parsers(subparsers):
	parser = subparsers.add_parser('legis', 
		help="Parse some legislative arguments")

	sparser = parser.add_subparsers()

	# shas
	shas_parser = sparser.add_parser('shas', 
		help="Parse LegisXML to triples: bill_name, paragraph_id, sha_of_text")
	shas_parser.add_argument('directory', type=str, nargs=1, 
		help='The directory to find legislative xml to parse.')
	shas_parser.add_argument('--outfile', type=FileType('w'),
		help='If given, the file to output to.', dest='outfile')
	shas_parser.set_defaults(func=_shas_parser)

	# paragraph
	p_parser = sparser.add_parser('paragraph',
		help="From shas get text of associated paragraphs")
	p_parser.add_argument("directories", type=str, nargs='+',
		help="Where to find the raw XML")
	p_parser.add_argument("--infile", type=FileType('r'),
		help="Where to get the list of shas", dest='infile')
	p_parser.add_argument("--outfile", type=FileType('w'),
		help="Where to put the sha,text pairs", dest='outfile')
	p_parser.set_defaults(func=_paragraph_parser)

def _paragraph_parser(args):
	outfile = csv.writer(args.outfile)

	# Get shas
	infile = args.infile
	shas = set(s.strip() for s in infile.readlines())

	directories = []
	for d in args.directories:
		if not os.path.isdir(d):
			print "Error: %s is not a directory" % d
			exit(-1)
		directories.append(d)

	files = []
	for d in directories:
		for f in os.listdir(d):
			fullname = os.path.join(d, f)
			if not (os.path.isfile(fullname) and 'xml' in f):
				continue
			files.append(fullname)

	if runtime.verbose:
		for filename in ProgressBar(files):
			f = open(filename, 'r')
			try:
				outfile.writerows(paragraphs_with_shas(f, shas))
			except:
				pass
	else:
		for filename in files:
			f = open(filename, 'r')
			try:
				outfile.writerows(paragraphs_with_shas(f, shas))
			except:
				pass

def _shas_parser(args):
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
