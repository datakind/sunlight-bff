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

	var legis_data = { 
		"name" : data.bio.name.official_full,
		"osid" : data.bio.id.opensecrets,
		"type" : data.bio.terms[data.bio.terms.length-1].type,
		"party" : data.bio.terms[data.bio.terms.length-1].party,
		"district" : data.bio.terms[data.bio.terms.length-1].district,
		"state" : data.bio.terms[data.bio.terms.length-1].state,
		"eventTypes" : [ 
			"Sponsored Legislation", "Cosponsored Legislation", 
			"Event or Party", "Joined Committee", "Elected to Office" 
		]
	}

    var source = $('#legislator').html()
    var template = Handlebars.compile( source )
    $('body').append( template(legis_data) )

	console.log("the data is", data)

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

	// select the events elements, append legis event data
	// and translate element based on time
	var event_ = focus.selectAll(".event")
		.data(sorted)
	  .enter().append('svg:g')
	  	.attr('class', 'event')	
	  	.attr("transform", function(d) { return "translate(" + x(d.time * 1000) + ",75)"; })

	addCircles( values )
	addContextCircles( values )

})

$(document).ready(function(){

	window.removePopup = true
	window.hoverable = true

	$('#filter').click(function(){
		toggleFilter()
	})

	$('body').delegate('svg', 'click', function(ev){
		
		if ( !($(ev.target).is('circle')) ){
			
			hoverable = !hoverable
			removePopup = !removePopup

			$('.event-popup').remove()
			d3.select('.selected')
				.classed('selected', false)
				.transition()
				.attr('r', function(){
					return d3.select(this).attr('r') / 2
				})

			d3.selectAll('.not-connected')
				.classed('not-connected', false)

			d3.selectAll('.connected')
				.classed('connected', false)

		}

	})

	$('body').delegate('.contributor-name', 'click', function(ev){
		
		ev.preventDefault()
		console.log("clicking this name", $(ev.target).attr('class').split(" ")[1] )

		var targetName = $(ev.target).attr('class').split(" ")[1]

		d3.selectAll('.recieved')[0].forEach(function(d, i){
			var data = d3.select(d)[0][0].__data__

			var stripped = data.info.contributor_name.replace(/ /g, ""),
				el = d3.select(d)

			if ( stripped !== targetName ){
				el.classed('not-connected', true)
			} else {		
				el.classed('connected', true)
			}

		})
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
			return d.event.split(" ")[0] + ' ' + 'focus-circle'
		})
		.attr('r', function(d){
			var r = 600 * ( 1/data.length )
			return r
		})
		.attr('cx', 0)
		.style('stroke', function(d){ 
			var color
			color = getColor(d)
			return color
		})
		.style('fill', function(d){ 
			var color
			color = getColor(d)
			return color
		})
		.on('mouseover', function(d){
			
			if ( hoverable ){		
				var self = this
				d3.select(this.parentNode.parentNode).select('.event-date').classed('shown', true)
				d3.select(this).transition().attr('r', function(){
					return d3.select(self).attr('r') * 2
				})

				var el = d3.select(this),
					r = el.attr('r'),
					top = $(this).position().top - 50,
					left = $(this).position().left >= 800 ? $(this).position().left - 400 : $(this).position().left + 50

				console.log("the position is", $(this).position())


				el.classed(d.event_id, true)
				  .classed('hovered', true)

				var templateData = templateId(d)
				console.log(d)
				console.log("the template info is", templateData)				

				var eventId = '#' + d.event_id,
					templateSelector = '#' + templateData[0]
					// source = $(templateSelector).html(),
					// template = Handlebars.compile( source )
				
				$('.event-popup').remove()
				// $('body').append(template(templateData[1]))

				var popup = new PopupView({
					el : $('body'),
					model : templateData[1],
					tmpl : $(templateSelector),
					top : top,
					left : left
				})
				
			}

		})
		.on('mouseout', function(){

			removePopup ? $('.event-popup').remove() : null
			
			d3.select(this.parentNode.parentNode)
				.select('.event-date')
				.classed('shown', false)				

			d3.select(this).classed('hovered', false)				

			if (!(d3.select(this).classed('selected'))){

				d3.select(this).transition().attr('r', function(d){
					var r = 600 * (1/data.length) 
					return r
				})						
			}

		})
		.on('click', function(d){
			
			d3.select(this).classed('selected', true)

			hoverable = false
			removePopup = false

			$('.event-popup').addClass('expanded')
			$('.hidden-content').removeClass('hidden-content')

			var expanded = new ExpandedView({
				el : '#popup_content_container',
				model : d
			})
		})

}

function templateId (d){
	var data 
	switch(d.event) {
		case "sponsored legislation":
			data = {
				"title" : d.info.title,
				"thomas_link" : d.info.thomas_link,
				"govtrack_link" : d.info.link,
				"id" : d.event_id
			}

			return [ "sponsored_legislation", data ] 
			break;
		case "event/party":
			return "red"
			break;
		case "bill cosponsorship":
			data = {
				"title" : d.info.official_title,
				"thomas_link" : d.info.thomas_link,
				"govtrack_link" : d.info.link,
				"id" : d.event_id
			}

			return [ "cosponsored_legislation", data ]
			break
		case "start congressional term":
			return "green"
			break
		case "joined committee":
			data = {
				"committee" : d.info[0][14],
				"id" : d.event_id
			}

			return [ "joined_committee", data ]
			break
		case "recieved campaign contribution":
			var contributor_name
			if ( d.info.contributor_type == "I" ) {
				var contributor_name = fixContributorName( d.info.contributor_name )
			} else {
				contributor_name = d.info.contributor_name
			}

			data = {
				"date" : new Date( Number(d.time) * 1000).toString('dddd,MMMM,yyyy'),
				"contributor_name" : contributor_name,
				"contributor_string" : d.info.contributor_name.replace(/ /g, ""),
				"contributor_occupation" : d.info.contributor_occupation,
				"contributor_city" : d.info.contributor_city,
				"contributor_state" : d.info.contributor_state,
				"conributor_zipcode" : d.info.contributor_zipcode,
				"cycle" : d.info.cycle,
				"amount" : d.info.amount,
				"id" : d.event_id
			}

			return [ "campaign_contribution", data ]
			break
	}
}

function fixContributorName( name ){
	var split = name.toLowerCase().split(" "),
		first, last

	first = split[1].charAt(0).toUpperCase() + split[1].slice(1);
	last = split[0].charAt(0).toUpperCase() + split[0].slice(1);
	last.replace(",", "")

	return first + ' ' + last
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
	  		return -40 + (-2 * i)
	  	})
		.attr('class', function(d) { 
			return d.event.split(" ")[0] + ' ' + d.event_id + ' ' + 'context-circle'
		})
		.attr('r', 2 )
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

function getColor(d){

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
		case "recieved campaign contribution":
			return "#333"
			break
	}
}

var PopupView = Backbone.View.extend({
	

	initialize : function(){

		this.render()

	},

	render : function(){

		var source = $(this.options.tmpl).html(),
			template = Handlebars.compile( source ),
			eventId = '#' + this.model.id

		$('body').append( template(this.model) )
		$(eventId).css({ top : this.options.top, left : this.options.left })

	},

	events : {

		"click .received" : "renderExpanded",
		"click svg" : "renderExpanded"

	},

	renderExpanded : function(){

		console.log("doin dis")
		

	}

})

var ExpandedView = Backbone.View.extend({
	
	initialize : function(){
		
		$('#popup_content_container').empty()
		this.render()

	},

	render : function(){

		console.log("doin dis bitch")

	},

	events : {

	}
})

Handlebars.registerHelper('formatDate', function(v){
    console.log("rounding this mother", v)
    var number = round(v)
    return number
})
