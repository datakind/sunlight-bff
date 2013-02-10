from sunlight.legislation.parser import paragraphs_to_sha, paragraphs_with_shas
from sunlight.utilities import ProgressBar
import sunlight.runtime as runtime

from argparse import FileType

import json
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
	shas_parser.add_argument('directories', type=str, nargs='+', 
		help='The directory to find legislative xml to parse.')
	shas_parser.add_argument('-r', action='store_true', dest='recursive', 
		default=False,
		help="Recursively search directories for xml files")
	shas_parser.add_argument('--outfile', type=FileType('w'),
		help='If given, the file to output to.', dest='outfile')
	shas_parser.set_defaults(func=_shas_parser)

	# paragraph
	p_parser = sparser.add_parser('paragraph',
		help="From shas get text of associated paragraphs")
	p_parser.add_argument("directories", type=str, nargs='+',
		help="Where to find the raw XML")
	p_parser.add_argument('-r', action='store_true', dest='recursive', 
		default=False,
		help="Recursively search directories for xml files")
	p_parser.add_argument("--infile", type=FileType('r'),
		help="Where to get the list of shas", dest='infile')
	p_parser.add_argument("--outfile", type=FileType('w'),
		help="Where to put the sha,text pairs", dest='outfile')
	p_parser.set_defaults(func=_paragraph_parser)

	# all
	a_parser = sparser.add_parser('all',
		help="Executes this workflow from beginning to end")
	a_parser.add_argument("directories", type=str, nargs='+',
		help="Where to find the raw XML")
	a_parser.add_argument('-r', action='store_true', dest='recursive', 
		default=False,
		help="Recursively search directories for xml files")
	a_parser.add_argument("--outfile", type=FileType('w'),
		help="Where to put the output", dest='outfile')
	a_parser.set_defaults(func=_all_parser)

def _get_files_from_directories(directories, recursive=False, filter_func=lambda v: True):
	"""
	Return a list of files from directories.

	Parameters
	----------
	directories		list of strings		Which directories to search
	recursive		bool				Recursively search directories?
	filter_func		function			Only keep files satisfying filter_func

	Raises
	------
	TypeError
		If there is d in directories which is *not* a directory
	"""
	files = []
	subdirectories = []
	for directory in directories:
		if not os.path.isdir(directory):
			raise "%s is not a directory" % directory
		tmp_files = [os.path.join(directory, f) for f in os.listdir(directory)]
		subdirectories.extend(filter(lambda v: os.path.isdir(v), tmp_files))
		tmp_files = filter(lambda v: os.path.isfile(v), tmp_files)
		files.extend(filter(filter_func, tmp_files))

	if recursive and len(subdirectories) > 0:
		new_files = _get_files_from_directories(subdirectories, 
													True, filter_func) 
		files.extend(new_files)

	return files

def _paragraph_parser(args):
	outfile = csv.writer(args.outfile)

	# Get shas
	infile = args.infile
	shas = set(s.strip() for s in infile.readlines())

	files = _get_files_from_directories(args.directories, 
										args.recursive, 
										lambda v: 'xml' in v)
	if runtime.verbose:
		range_over = ProgressBar(files, which_tick=True)
	else:
		range_over = iter(files)

	for filename in range_over:
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
	files = _get_files_from_directories(args.directories, 
										args.recursive, 
										lambda v: 'xml' in v)

	if runtime.verbose:
		range_over = ProgressBar(files, which_tick=True)
	else:
		range_over = iter(files)

	for f in range_over:
		try:
			to_write = paragraphs_to_sha(open(f, 'r'))
			outfile.writerows(to_write)
		except Exception, e:
			sys.stderr.write("Error with %s: %s\n" % (f, str(e)))

def _all_parser(args):
	outfile = args.outfile
	files = _get_files_from_directories(args.directories, 
										args.recursive, 
										lambda v: 'xml' in v)

	if runtime.verbose:
		range_over = ProgressBar(files, which_tick=True)
	else:
		range_over = iter(files)

	sha_to_ids = {}
	for f in range_over:
		try:
			triples = paragraphs_to_sha(open(f, 'r'), keep_paragraphs=True)
			for triple in triples:
				sha_to_ids.setdefault(triple[2], [])\
					.append((triple[0], triple[1], triple[3]))
		except Exception, e:
			sys.stderr.write("Error with %s: %s\n" % (f, str(e)))

	json.dump(sha_to_ids, outfile)

