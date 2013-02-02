class LegislationError(Exception):
	def __init__(self, message):
		super(LegislationError, self).__init__(message)
