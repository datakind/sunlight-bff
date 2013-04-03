var w = 50000,
    h = 400,
    p = 250

var vis = d3.select("#vis_container")
	.append("svg:svg")
	.attr("width", w + p * 2)
	.attr("height", h + p)
  	.append("svg:g")
	.attr("transform", "translate(" + p + "," + p + ")")


d3.json('../data/john_boehner.json', function(data){
	
    console.log(data)

	var sorted = data.data.sort(compare).reverse()

	var minTime = sorted[0].time,
		maxTime = sorted[sorted.length - 1].time

	var x = d3.scale.linear().domain([minTime, maxTime]).range([ w - (2 * p), 0 ])

	var action = vis.selectAll(".action")
		.data(sorted)
	  .enter().append('svg:g')
	  	.attr('class', 'action')
	  	.attr("transform", function(d) { return "translate(" + x(d.time) + ",50)"; })

	action.append('line')
	  	.attr('class', 'mark')
	  	.attr('x1', 0)
	  	.attr('x2', 0)
	  	.attr('y1', 0)
	  	.attr('y2', 20)
	  	.style('stroke', 'black')

	action.append('text')
		.text( function(d) { 
			var date = new Date( Number( d.time ) * 1000 )
			return date 
		})
		.attr('class', 'date')
		.attr("text-anchor", "end")
		.attr("transform", "rotate(45)")

	action.append('text')
		.text( function(d) {
			return d.event
		})
		.attr('class', function(d) { 
			return d.event 
		})
		.attr("transform", "rotate(90)")
		.attr("x", 30)

	action.on('click', function(d){
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