from argparse import ArgumentParser
from legislation import _add_legislation_parsers
import sys

def main():
	parser = ArgumentParser(prog='sunlight')
	subparsers = parser.add_subparsers()

	# Add the parsers
	_add_legislation_parsers(subparsers)

	parser.parse_args(sys.argv[1:])

if __name__=='__main__':
	main()
