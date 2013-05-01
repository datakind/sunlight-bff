	var margin = {top: 10, right: 10, bottom: 100, left: 40},
	    margin2 = {top: 630, right: 10, bottom: 20, left: 40},
	    width = 1400 - margin.left - margin.right,
	    height = 700 - margin.top - margin.bottom,
	    height2 = 700 - margin2.top - margin2.bottom;

	var format = d3.time.format('%B %d %Y')

	var x = d3.time.scale().range([0, width]),
	    x2 = d3.time.scale().range([0, width]),
	    y = d3.scale.linear().range([height, 0]),
	    y2 = d3.scale.linear().range([height2, 0]);

	var xAxis = d3.svg.axis().scale(x).orient("bottom"),
	    xAxis2 = d3.svg.axis().scale(x2).orient("bottom")

	var brush = d3.svg.brush()
	    .x(x2)
	    .on("brush", brushed);

	var svg = d3.select("body").append("svg")
	    .attr("width", width + margin.left + margin.right)
	    .attr("height", height + margin.top + margin.bottom);

	svg.append("defs").append("clipPath")
	    .attr("id", "clip")
	  .append("rect")
	    .attr("width", width)
	    .attr("height", height);

	var focus = svg.append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	var context = svg.append("g")
	    .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

	var values

d3.json('john_a_boehner.json', function(data){

	// sort the objects by timestamp
	var sorted = data.data.sort(compare).reverse()
		values = sorted

	x.domain(d3.extent(sorted.map(function(d) { return d.time * 1000; })));	 
	x2.domain(x.domain());

	focus.append("g")
	  .attr("class", "x axis")
	  .attr("transform", "translate(0," + ( height - 50 ) + ")")
	  .call(xAxis);

	context.append("g")
	  .attr("class", "x axis")
	  .attr("transform", "translate(0," + height2 + ")")
	  .call(xAxis2);

	context.append("g")
	  .attr("class", "x brush")
	  .call(brush)
	.selectAll("rect")
	  .attr("y", -6)
	  .attr("height", height2 + 7);

	// get the min and timestamp values 
	var minTime = sorted[0].time,
		maxTime = sorted[sorted.length - 1].time

	// create dates from the min and max timestamps
	var startDate = new Date(minTime * 1000),
		endDate = new Date(maxTime * 1000)

	// // select the events elements, append legis event data
	// // and translate element based on time
	var event_ = focus.selectAll(".event")
		.data(sorted)
	  .enter().append('svg:g')
	  	.attr('class', 'event')	
	  	.attr("transform", function(d) { return "translate(" + x(d.time * 1000) + ",75)"; })

	addCircles( values )
	addContextCircles( values )

    // select the text of the axis ticks and add styling
	// d3.selectAll('.axis').selectAll('text')
	// 	.attr("transform", "rotate(90)")
	// 	.attr("x", 10)
	// 	.attr("y", -5)
	// 	.style('font-size', 12)
	// 	.style('fill', 'gray')
	// 	.attr("text-anchor", "start");

	// append text to each event element
	// event_.append('g').append('text')
	// 	.text( function(d) {
	// 		var text = eventText(d)
	// 		return text
	// 	})
	// 	.attr('class', 'event-text')
	// 	.attr("text-anchor", "end")
	// 	.attr("transform", "rotate(40)")
	// 	.attr("y", -20)
	// 	.attr("x", -20)
	// 	.on('mouseover', function(){
	// 		d3.select(this.parentNode.parentNode).select('.event-date').classed('shown', true)
	// 	})
	// 	.on('mouseout', function(){
	// 		d3.select(this.parentNode.parentNode).select('.event-date').classed('shown', false)
	// 	});

	// event_.selectAll('text')
	// 	.insert("g", ":first-child")
	// 	.append('tspan')
	// 	.text(function(d){
	// 		return eventType(d)
	// 	})
	// 	.attr('class', 'event-type')

	// event_.append('g').append('rect')
	// 	.attr('width', 400)
	// 	.attr('height', 300)
	// 	.attr('class', 'event-info')
	// 	.attr('x', -50)
	// 	.attr('y', -400)
	// 	.style('stroke', 'hsl(0, 100%, 67%)')
	// 	.style('fill', 'white')
	// 	.attr('rx', 10)
	// 	.attr('ry', 10)
	
	// event_.append('text')
	// 	.text( function(d) {
	// 		return format(new Date(d.time * 1000))
	// 	})
	// 	.attr('class', 'event-date')
	// 	.attr("transform", "rotate(90)")
	// 	.attr("x", 10)

	// on click show event info
	// event_.select('.event-text').on('click', function(d){
	// 	console.log(d)
	// 	var rect = d3.select(this.parentNode.parentNode).select('rect')
	// 	if ( !rect.classed('shown') ){
	// 		// showEventInfo(d)
	// 		d3.select(this).classed('bold', true)
	// 		console.log("hasn't shown", d3.select(this).classed('shown'))
	// 		rect.classed('shown', true)
	// 	} else {
	// 		d3.select(this).classed('bold', false)
	// 		console.log("has shown", d3.select(this).classed('shown'))
	// 		rect.classed('shown', false)
	// 	}
	// })
})

$(document).ready(function(){
	$('#filter').click(function(){
		toggleFilter()
	})

	$('.filter-events-input').click(function(){

		if ( !$(this).is(':checked') ){
			
			var clas = $(this).attr('class').split(" ")[1]
			switch(clas){
				case "sponsor":
					$('.sponsored').hide()
					break
				case "cosponsored":
					$('.bill').hide()
					break
				case "party":
					$('.party/event').hide()
				case "committee":
					$('.joined').hide()
					break
				case "election":
					$('.start').hide()

			}

		} else {
			
			var clas = $(this).attr('class').split(" ")[1]
			switch(clas){
				case "sponsor":
					$('.sponsored').fadeIn()
					break
				case "cosponsored":
					$('.bill').fadeIn()
					break
				case "party":
					$('.party/event').fadeIn()
				case "committee":
					$('.joined').fadeIn()
					break
				case "election":
					$('.start').fadeIn()

			}

		}
	})
})

function toggleFilter(){

	$('#filter_options').hasClass('shown-filter') ? $('#filter_options').slideUp().removeClass('shown-filter') :
													$('#filter_options').slideDown().addClass('shown-filter')

}

function showEventInfo( eventObj ){ 
    var eventType = eventObj.event

    $('#event_info').empty()

    switch(eventType){
        case "event/party":
            var source = $('#eventOrParty').html()
            var template = Handlebars.compile( source )
            $('#event_info').append( template(eventObj) )
            break
    }
}

function eventText( eventObj ){
	var eventType = eventObj.event,
		text;
	
	switch(eventType){
		case "event/party":
			break
		case "sponsored legislation":
			text = eventObj.info.titles[0][2]
			break
		case "bill cosponsorship":
			text = eventObj.info.official_title
			break
		case "start congressional term":
			text = eventObj.info.party + " " + eventObj.info.type + " from District " + eventObj.info.district + " of " + eventObj.info.state 
			break
		case "joined committee":
			text = "JC"
			break
	}

	return text
}

function eventType( eventObj ){
	var eventType = eventObj.event,
		text;
	
	switch(eventType){
		case "event/party":
			text = " P"
			break
		case "sponsored legislation":
			text = " SL"
			break
		case "bill cosponsorship":
			text = " CSL"
			break
		case "start congressional term":
			text = " BCT"
			break
		case "joined committee":
			text = " JC"
			break
	}

	return text
}

function compare(a,b) {
  if ( Number(a.time) < Number(b.time))
     return -1;
  if (Number(a.time) > Number(b.time))
    return 1;
  return 0;
}

function brushed(){

	d3.selectAll('.event').remove()

	x.domain(brush.empty() ? x2.domain() : brush.extent());
	var start = new Date( String(x.domain()[0]) ).getTime() / 1000,
		end = new Date( String(x.domain()[1]) ).getTime() / 1000,
		data = []

	var dataFiltered = values.filter(function(d, i) {
		if ( (d.time >= start) && (d.time <= end) ) {
		  data.push(d);
		}
	})

	addCircles( data )
	focus.select(".x.axis").call(xAxis);

}

function addCircles( data ) {

	var event_ = focus.selectAll(".event")
		.data(data)
	  .enter().append('svg:g')
	  	.attr('class', 'event')	
	  	.attr("transform", function(d) { return "translate(" + x(d.time * 1000) + ",75)"; })

	// append the shape 
	event_.append('g').selectAll("ev")
		.data(function(d){
			return d.events
		})
		.enter().append('circle')
	  	.attr('cy', function(d, i){
	  		var yVal = 460 -  ( ( (i + 1) * 20 ) + ( (831 * (1/data.length)) / 2 ) ) 
	  		return yVal
	  	})
		.attr('class', function(d) { 
			return d.event.split(" ")[0]
		})
		.attr('r', function(){
			var r = 600 * (1/data.length) 
			return r
		})
		.attr('cx', 0)
		.style('fill', function(d){
			switch(d.event) {
				case "sponsored legislation":
					return "yellow"
					break;
				case "event/party":
					return "red"
					break;
				case "bill cosponsorship":
					return "blue"
					break
				case "start congressional term":
					return "green"
					break
				case "joined committee":
					return "purple"
					break
			}
		})
		.style('fill-opacity', .5)
		.on('mouseover', function(){
			// console.log(d3.select(this).data())			
			var self = this
			d3.select(this.parentNode.parentNode).select('.event-date').classed('shown', true)
			d3.select(this).transition().attr('r', function(){
				return d3.select(self).attr('r') * 2
			})
		})
		.on('mouseout', function(){
			var self = this
			d3.select(this.parentNode.parentNode).select('.event-date').classed('shown', false)
		
			d3.select(this).transition().attr('r', function(d){
				var r = 600 * (1/data.length) 
				return r
			})

		});

}

function addContextCircles( data ) {

	console.log("the data is", data )

	var event_ = context.selectAll(".context-event")
		.data(data)
	  .enter().append('svg:g')
	  	.attr('class', 'context-event')	
	  	.attr("transform", function(d) { return "translate(" + x(d.time * 1000) + ",75)"; })

	// append the shape 
	event_.append('g').selectAll("ev")
		.data(function(d){
			console.log("appending")
			return d.events
		})
		.enter().append('circle')
	  	.attr('cy', function(d, i){
	  		return -40 + (-20 * i)
	  	})
		.attr('class', function(d) { 
			return d.event.split(" ")[0]
		})
		.attr('r', 3 )
		.attr('cx', 0)
		.style('fill', function(d){
			switch(d.event) {
				case "sponsored legislation":
					return "yellow"
					break;
				case "event/party":
					return "red"
					break;
				case "bill cosponsorship":
					return "blue"
					break
				case "start congressional term":
					return "green"
					break
				case "joined committee":
					return "purple"
					break
			}
		})

}

function getTimestamp(str) {
  var d = str.match(/\d+/g); // extract date parts
  return +new Date(d[0], d[1] - 1, d[2], d[3], d[4], d[5]); // build Date object
}