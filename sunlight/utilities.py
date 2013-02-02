import time
import sys


class ProgressBar(object):
	"""
	Simple progress bar for loops.
	
	Usage
	-----
	for i in ProgressBar(total_ticks, number_displays=40, which_tick=True):
		LOOP_BODY
	
	Parameters
	----------
	total_ticks		The length of the loop OR the thing to iterate over
	number_displays	The width of the progress bar
	which_tick		If True, displays the value of i as "Tick i/total_ticks"
	"""
	
	def __init__(self, total_ticks, number_displays=40, which_tick=False):
		if hasattr(total_ticks, '__iter__'):
			self.iter_over = iter(total_ticks)
			self.total_ticks = len(total_ticks)
		else:
			self.iter_over = iter(range(total_ticks))
			self.total_ticks = total_ticks
		self.ticks_remain = self.total_ticks
		self.number_displays = number_displays
		self.counter = 0
		self.which_tick = which_tick
		
		# Set up show points
		self.show_points = [ int(float(self.total_ticks)/number_displays*i) 
								for i in xrange(1,number_displays+1) ]
		self.show_points.reverse()
		self.next_update = self.show_points.pop()
		self.displays_done = 0
		
		# Set up timer
		self.time_start = self.time_before = time.time()
		sys.stdout.write( '[' + ' '*number_displays + '] ' )
	
	def __iter__(self):
		return self
	
	def next(self):
		# Are we done?
		if self.ticks_remain == 0:
			sys.stdout.write("\n")
			sys.stdout.flush()
			raise StopIteration
		
		self.counter += 1
		self.ticks_remain -= 1
		
		# Compute remaining time estimate and display
		curtime = time.time()
		if curtime - self.time_before > 2:
			base = ''
			if self.which_tick:
				base = 'Tick %d/%d: ' % (self.counter, self.total_ticks)
		        
			rate = (time.time() - self.time_start) / self.counter
			time_remain = self.ticks_remain * rate
			if time_remain > 60:
				time_remain /= 60
				if time_remain > 60:
					time_remain /= 60
					timestr = '%s%d hours remain' % (base,int(time_remain))
				else:
					timestr = '%s%d minutes remain' % (base,int(time_remain))
			else:
				timestr = '%s%d seconds remain' % (base,int(time_remain))
			
			sys.stdout.write(timestr)
			sys.stdout.write('\b'*len(timestr))
			sys.stdout.flush()
			self.time_before = curtime
		
		# Should we add a tick to the bar?
		if self.counter == self.next_update:
			sys.stdout.write('\b'*(self.number_displays - self.displays_done + 2))
			sys.stdout.write('=')
			self.displays_done += 1
			sys.stdout.write(' '*(self.number_displays - self.displays_done) + '] ')
			sys.stdout.flush()
			
			# Sometimes rounding causes us to "finish" before we're actually
			# done. Just ignore this error.
			try:
				self.next_update = self.show_points.pop()
			except IndexError:
				pass
		
		return self.iter_over.next()
