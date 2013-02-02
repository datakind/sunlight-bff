from sunlight.legislation import _add_legislation_parsers
import sunlight.runtime as runtime

import sys
from argparse import ArgumentParser

def main():
	parser = ArgumentParser(prog='sunlight')
	parser.add_argument('--verbose', action='store_true', default=False,
		help="Turn on verbosity", dest='verbose')
	subparsers = parser.add_subparsers()

	# Add the parsers
	_add_legislation_parsers(subparsers)

	args = parser.parse_args(sys.argv[1:])
	runtime.verbose = args.verbose
	args.func(args)

if __name__=='__main__':
	main()
