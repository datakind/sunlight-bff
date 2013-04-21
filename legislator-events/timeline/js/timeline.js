var w = 90000,
    h = 400,
    p = 250

var vis = d3.select("#vis_container")
	.append("svg:svg")
	.attr("width", w + p * 2)
	.attr("height", h + 300)
  	.append("svg:g")
	.attr("transform", "translate(" + p + "," + 450 + ")")


d3.json('../data/john_a_boehner.json', function(data){	

	// sort the objects by timestamp
	var sorted = data.data.sort(compare).reverse()

	// get the min and timestamp values 
	var minTime = sorted[0].time,
		maxTime = sorted[sorted.length - 1].time

	// create dates from the min and max timestamps
	var startDate = new Date(minTime * 1000),
		endDate = new Date(maxTime * 1000)

	// set the d3 scale by min and max times
	var t = d3.time.scale().domain([startDate, endDate]).range([ w - (2 * p), 0 ])

	// select the events elements, append legis event data
	// and translate element based on time
	var event_ = vis.selectAll(".event_")
		.data(sorted)
	  .enter().append('svg:g')
	  	.attr('class', 'event')	
	  	.attr("transform", function(d) { return "translate(" + t(d.time * 1000) + ",75)"; })
	  	.attr('class', function(d) { 
			return d.event.split(" ")[0]
		})

	// create the d3 x axis based on the t scale
	var xAxis = d3.svg.axis()
        .scale(t)
        .orient('bottom')
        .ticks(200)
        .tickFormat(d3.time.format('%B %d %Y'))
        .tickSize(5);

    // create the axis g and append it to the vis svg
    vis.append('svg:g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0, ' + 75 + ')')
        .call(xAxis);

    // select the text of the axis ticks and add styling
    d3.selectAll('.axis').selectAll('text')
    	.attr("transform", "rotate(90)")
    	.attr("x", 10)
    	.attr("y", -5)
    	.style('font-size', 12)
    	.style('fill', 'gray')
    	.attr("text-anchor", "start");

    // append tick line to each event element
	event_.append('line')
	  	.attr('class', 'mark')
	  	.attr('x1', 0)
	  	.attr('x2', 0)
	  	.attr('y1', -20)
	  	.attr('y2', 0)
	  	.style('stroke', 'black');

	// append text to each event element
	event_.append('g').append('text')
		.text( function(d) {
			var text = eventText(d)
			return text
		})
		.attr('class', 'event-text')
		.attr("text-anchor", "end")
		.attr("transform", "rotate(40)")
		.attr("y", -20)
		.attr("x", -20)
		.on('mouseover', function(){
			d3.select(this.parentNode.parentNode).select('.event-date').classed('shown', true)
		})
		.on('mouseout', function(){
			d3.select(this.parentNode.parentNode).select('.event-date').classed('shown', false)
		});

	event_.selectAll('text')
		.insert("g", ":first-child")
		.append('tspan')
		.text(function(d){
			return eventType(d)
		})
		.attr('class', 'event-type')

	event_.append('g').append('rect')
		.attr('width', 400)
		.attr('height', 300)
		.attr('class', 'event-info')
		.attr('x', -50)
		.attr('y', -400)
		.style('stroke', 'hsl(0, 100%, 67%)')
		.style('fill', 'white')
		.attr('rx', 10)
		.attr('ry', 10)

	var format = d3.time.format('%B %d %Y')
	
	event_.append('text')
		.text( function(d) {
			return format(new Date(d.time * 1000))
		})
		.attr('class', 'event-date')
		.attr("transform", "rotate(90)")
		.attr("x", 10)

	// on click show event info
	event_.select('.event-text').on('click', function(d){
		console.log(d)
		var rect = d3.select(this.parentNode.parentNode).select('rect')
		if ( !rect.classed('shown') ){
			// showEventInfo(d)
			d3.select(this).classed('bold', true)
			console.log("hasn't shown", d3.select(this).classed('shown'))
			rect.classed('shown', true)
		} else {
			d3.select(this).classed('bold', false)
			console.log("has shown", d3.select(this).classed('shown'))
			rect.classed('shown', false)
		}
	})
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