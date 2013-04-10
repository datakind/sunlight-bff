var w = 70000,
    h = 400,
    p = 250

var vis = d3.select("#vis_container")
	.append("svg:svg")
	.attr("width", w + p * 2)
	.attr("height", h + p)
  	.append("svg:g")
	.attr("transform", "translate(" + p + "," + p + ")")


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

	// create the d3 x axis based on the t scale
	var xAxis = d3.svg.axis()
            .scale(t)
            .orient('bottom')
            .ticks(150)
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
    	.attr("text-anchor", "start")

    // append tick line to each event element
	event_.append('line')
	  	.attr('class', 'mark')
	  	.attr('x1', 0)
	  	.attr('x2', 0)
	  	.attr('y1', -20)
	  	.attr('y2', 0)
	  	.style('stroke', 'black')

	// append text to each event element
	event_.append('text')
		.text( function(d) { 
			return d.event
		})
		.attr('class', function(d) { 
			return d.event 
		})
		.attr('class', 'date')
		.attr("text-anchor", "end")
		.attr("transform", "rotate(45)")
		.attr("y", -20)
		.attr("x", -20)

	// event_.append('text')
	// 	.text( function(d) {
	// 		return d.event
	// 	})
	// 	.attr('class', function(d) { 
	// 		return d.event 
	// 	})
	// 	.attr("transform", "rotate(90)")
	// 	.attr("x", 30)

	// on click show event info
	event_.on('click', function(d){
		console.log(d)
		showEventInfo(d)
	})
})

function showEventInfo( eventObj ){

    var eventType = eventObj.event

    console.log(eventObj)

    $('#event_info').empty()

    switch(eventType){
        case "event/party":
            var source = $('#eventOrParty').html()
            var template = Handlebars.compile( source )
            $('#event_info').append( template(eventObj) )
            break
    }

}

function compare(a,b) {
  if ( Number(a.time) < Number(b.time))
     return -1;
  if (Number(a.time) > Number(b.time))
    return 1;
  return 0;
}