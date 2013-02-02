def set_verbose(v):
	"""
	Set the value of verbose
	"""
	verbose = v


_verbose=False

@property
def verbose():
	return _verbose

@verbose.setter
def verbose(v):
	_verbose = v

