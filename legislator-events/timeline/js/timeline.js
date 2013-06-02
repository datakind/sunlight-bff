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

	var xAxis = d3.svg.axis().scale(x).orient("bottom").tickSize(-500),
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
	    .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")")
	    .attr('class', 'context-container');

	svg.append("rect")
		.attr("width", 40)
		.attr("height", 40)
		.attr("transform", "translate(0, 100)")
		.style("fill", "steelblue")
		.style("fill-opacity", .6)

	svg.append("rect")
		.attr("width", 40)
		.attr("height", 40)
		.attr("transform", "translate(0, 200)")
		.style("fill", "red")
		.style("fill-opacity", .6)

	svg.append("rect")
		.attr("width", 40)
		.attr("height", 40)
		.attr("transform", "translate(0, 270)")
		.style("fill", "yellow")
		.style("fill-opacity", .6)

	svg.append("rect")
		.attr("width", 40)
		.attr("height", 40)
		.attr("transform", "translate(0, 420)")
		.style("fill", "green")
		.style("fill-opacity", .6)

	var values

d3.json('john_a_boehner.json', function(data){
	window.legislatorData = data
	window.contribs = _.filter(data.data, function(datum){ return datum.events[0].event_type === "recieved_campaign_contributions" })
		   contribs = _.map(contribs, function(ev){return ev.events[0]})
	window.committeeAssignments = _.filter(data.data, function(datum){ return datum.events[0].event_type === "joined_committee" })
		   committeeAssignments = _.map(committeeAssignments, function(ev){ return ev.events[0] })

	var legis_data = { 
		"name" : data.bio.name.official_full,
		"osid" : data.bio.id.opensecrets,
		"type" : capitaliseFirstLetter( data.bio.terms[data.bio.terms.length-1].type ),
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

	// d3.select('.x').selectAll('text')		
	// 	.attr("transform", "rotate(90)")

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

	$('body').on('click', 'svg', function(ev){
		
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
				.attr('r', function(){
					return d3.select(this).attr('r') / 5
				})
				.classed('connected', false)

			$('#options_content').empty().css({ display : "none"})
			$('.white-bg').removeClass('white-bg')

		}

	})

	$('body').on('click', '.contributor-name', function(ev){		
		ev.preventDefault()
		var targetName = $(ev.target).attr('class').split(" ")[1]

		d3.selectAll('.context-container .recieved')[0].forEach(function(circle, i){
			
			if ( i < 10 ) console.log("this is it", circle)

			var data = d3.select(circle)[0][0].__data__,
				stripped = data.info.contributor_name.replace(/ /g, ""),
				el = d3.select(circle)

			if ( stripped !== targetName ){
				el.classed('not-connected', true)
			} else {
				console.log("the stripped name is", stripped)
				console.log("the target name is", targetName)
				el.classed('connected', true)
				el.attr('r', function(){
					return d3.select(this).attr('r') * 5
				})
				console.log(data)
			}

		})
	})

	$('body').on('click', '#key_li, #filter_li', function(){
		toggleOption($(this))
	})

	$('body').on('click', '#add_filter', function(){
		var eventType = $('#event_type_filter_drop option:selected').val()
		console.log("eventtype is", eventType)
		addAttributeFilter[eventType]()
	})

	$('body').on('change', '.attribute-drop', function(){
		var eventType = $('#event_type_filter_drop option:selected').val(),
			eventAttribute = $('.attribute-drop option:selected').val(),
			attrVals = legislatorData["event_attributes"][eventType][eventAttribute],
			valDrop = '<select class="attribute-value-drop">'
			valDrop += '<option>Select Value</option></select>'
		
		$('.attribute-value-drop').remove()
		$(valDrop).insertAfter('.attribute-drop')

		// attrVals = _.map(attrVals, function(n){ return Number(n) }).sort(function(a,b){return a-b})
		eventAttribute === "amount" ? attrVals = attrVals.sort(function(a,b){return a-b}) : attrVals = attrVals.sort()  

		_.each( attrVals, function(val){
			$('.attribute-value-drop').append('<option value="' + val + '">' + val + '</option>')
		})

	})

	$('body').on('click', '#filter_button', function(){

		var attribute = $('#event_type_filter_drop').val(),
			attr = $('.attribute-drop option:selected').val(),
			// attributeOperator = $('.attribute-operator').val(),
			// attributeOperandVal = $('.attribute-operand-value').val(),
			attrVal = $('.attribute-value-drop option:selected').val()
			elements = $('.context-event')
			
		d3.selectAll('.recieved')[0].forEach(function(circle, i){
		
			var data = d3.select(circle)[0][0].__data__,
				amount = Number(data.info.amount),
				el = d3.select(circle)

			if ( data.info.hasOwnProperty(attr) ){
				if (data.info[attr] === attrVal ){
					el.classed('connected', true)
					el.attr('r', function(){
						return d3.select(this).attr('r') * 5
					})
				}
			} else {
				el.classed('not-connected', true)
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

function toggleOption( target ){

	$('.white-bg').removeClass('white-bg')
	$(target).addClass('white-bg')
	$('#options_content').css({ display : 'block'})

	options[target.attr('id')]()

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

	// addCircles( data )
	addBills( data )
	addContributions( data )
	addCosponsored( data )
	addCommittees()
	focus.select(".x.axis").call(xAxis);

}

function addContributions( data ){

	data = _.filter(data, function(datum){ return datum.events[0].event_type === "recieved_campaign_contributions" })
	data = _.map(data, function(ev){return ev.events[0]})

	var diameter = 200,
    	format = d3.format(",d");

	var pack = d3.layout.pack()
	    .size([diameter - 4, diameter - 4])
	    .value(function(d) { return Number(d.amount); });

	var event_ = focus.selectAll(".contrib")
		.data(data)
	  .enter().append('svg:g')
	  	.attr('class', 'event')	
	  	.attr("transform", function(d) { return "translate(" + ( x(d.time * 1000) - 100 ) + "," + 330 + ")"; })

	var node = event_.selectAll(".node")
		  .data(pack.nodes)
		.enter().append("g")		  
		  .attr("class", function(d) { return d.children ? "node" : "leaf node"; })
		  .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

	node.append("circle")
      .attr("r", function(d) { return d.r; })
      .attr("class", "event")
      .style("fill", "green")
      .style("fill-opacity", .2)
      .style("stroke", "green")
      .on('mouseover', function(d){
  //     	var self = this
		// d3.select(this).transition().attr('r', function(){
		// 	return d3.select(self).attr('r') * 2
		// })
      })

}

function addBills( data ){

	data = _.filter(data, function(datum){ return datum.events[0].event_type === "sponsored_legislation" })
	data = _.map(data, function(ev){return ev.events[0]})	

	var event_ = focus.selectAll(".sponsored")
		.data(data)
	  .enter().append('svg:g')
	  	.attr('class', 'event')	
	  	.attr("transform", function(d) { return "translate(" + x(d.time * 1000) + "," + 140 + ")"; })

	 event_.append('rect')
		.attr("width", 80)
		.attr("height", 20)
		.style("fill", "steelblue")
		.style("fill-opacity", .7)
		.style("stroke", "steelblue")
		.attr("transform", function(d) {
	         return "rotate(-135)" 
	     })
		.on('mouseover', function(d){
			console.log("the d is d", d)
		})

	event_.append('svg:line')
		.attr('x1', 0)
		.attr('x2', 0)
		.attr('y1', 0)
		.attr('y2', 390 )
		.style("stroke-opacity", 0)
		.style("stroke-width", 1)
		.style("stroke", "steelblue")

	// event_.append('text')
	// 	.text("Sponsored Legislation")
	// 	.attr("transform", "rotate(-135)")
	// 	.attr("y", 13)
	// 	.attr("x", 5)
	// 	.style("fill", "white")
	// 	.style("font-family", "helvetica")

	event_.on('mouseover', function(d){
		
		var g = d3.select(this)
		g.select('line').transition().style("stroke-opacity", 1)
		g.select('rect').transition().style("fill-opacity", 1)
		g.select('rect').transition().style("stroke-width", 3)


	}).on('mouseout', function(d){
		
		var g = d3.select(this)
		g.select('line').transition().style("stroke-opacity", 0)
		g.select('rect').transition().style("stroke-width", 1)

	})		

}

function addCosponsored( data ) {

	data = _.filter(data, function(datum){ return datum.events[0].event_type === "bill_cosponsorship" })
	data = _.map(data, function(ev){return ev.events[0]})

	var event_ = focus.selectAll(".sponsored")
		.data(data)
	  .enter().append('svg:g')
	  	.attr('class', 'event')	
	  	.attr("transform", function(d) { return "translate(" + x(d.time * 1000) + "," + 240 + ")"; })

	 event_.append('rect')
		.attr("width", 80)
		.attr("height", 20)
		.style("fill", "red")
		.style("fill-opacity", .7)
		.style("stroke", "red")
		.attr("transform", function(d) {
	         return "rotate(-135)" 
	     })
		.on('mouseover', function(d){
			console.log("the d is d", d)
		})

	event_.append('svg:line')
		.attr('x1', 0)
		.attr('x2', 0)
		.attr('y1', 0)
		.attr('y2', 240)
		.style("stroke-opacity", 0)
		.style("stroke-width", 1)
		.style("stroke", "red")

	// event_.append('text')
	// 	.text("Cosponsored Legislation")
	// 	.attr("transform", "rotate(-135)")
	// 	.attr("y", 13)
	// 	.attr("x", 5)
	// 	.style("fill", "white")
	// 	.style("font-family", "helvetica")

	event_.on('mouseover', function(d){
		d3.select(this).selectAll('line')
			.style("stroke-opacity", 1)

	}).on('mouseout', function(d){
		d3.select(this).selectAll('line')
			.style("stroke-opacity", 0)

	})

}

function addCommittees(){

	var event_ = focus.selectAll(".committees")
		.data(committeeAssignments)
	  .enter().append('svg:g')
	  	.attr('class', 'event')	
	  	.attr("transform", function(d) { return "translate(" + x(d.time * 1000) + "," + 100 + ")"; })

	event_.append('g').selectAll(".committee")
		.data(function(d){ return d.info })
		.enter().append("svg:line")
		.attr('x1', 0)
		.attr('x2', function(d){
			var x1, x2
			x1 = x(getTimestamp(d[7]))
			x2 = x(getTimestamp(d[8]))
			return x2 - x1
		})
		.attr('y1', function(d,i){ return 200 - ( i * 30 )})
		.attr('y2', function(d,i){ return 200 - ( i * 30 )})
		.style("stroke-opacity", .5)
		.style("stroke-width", 20)
		.style("stroke", "yellow")
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
	  		return yVal - 100	  		
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
					left = $(this).position().left >= 800 ? $(this).position().left - 400 : 
															$(this).position().left + 50

				console.log("the position is", $(this).position())

				el.classed(d.event_id, true)
				  .classed('hovered', true)

				var templateData = templateId(d)
				console.log(d)
				console.log("the template info is", templateData)				

				var eventId = '#' + d.event_id,
					templateSelector = '#' + templateData[0]
				
				$('.event-popup').remove()

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
				"date" : new Date( Number(d.time) * 1000).toString('dddd,MMMM,yyyy'),
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
	console.log(last.search(/,/g, ""))
	last.replace(/,/g, "")

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
					return "steelblue"
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

function capitaliseFirstLetter(string){
    return string.charAt(0).toUpperCase() + string.slice(1);
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
		case "month of campaign contributions":
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

	}

})

var ExpandedView = Backbone.View.extend({
	
	initialize : function(){
		
		$('#popup_content_container').empty()
		this.render()

	},

	render : function(){

		var source = $('#campaign_contribution_details').html(),
			template = Handlebars.compile( source )
		
		if ( this.model.info.contributor_type === "C" ){
			this.model.info.contribotor_type = "Corporate"
		} else {
			this.model.info.contributor_type = "Individual"
			this.model.info.contributor_name = fixContributorName(this.model.info.contributor_name)
			this.model.info.contributor_string = this.model.info.contributor_name.replace(/ /g, "")
		}

		this.$el.html( template( this.model.info ))

	},

	events : {

	}
})

var options = {

	filter_li : function(){
		console.log("firing")

		var source = $('#filter_template').html(),
			template = Handlebars.compile( source )

		$('#options_content').html( template )

	},

	key_li : function(){

		var source = $('#key_template').html(),
			template = Handlebars.compile( source )

		$('#options_content').html( template )

	}
}

var addAttributeFilter = {

	elected : function(){

	},
	committee : function() {

	},

	campaign_contribution : function(){

		$('<select class="attribute-drop" id="contribution_attributes_drop"><option>Select Attribute</option></select>').insertAfter('#event_type_filter_drop')

		_.each(contributionAttributes, function(attr){
			var option = '<option value="' + attr + '"">' + lowerUnderToUpperSpace( attr ) + '</option>';
			$('.attribute-drop').append(option);
		})

	}, 

	lobbying_contribution : function(){

		

	},

	sponsored_legislation : function(){

		$('<select class="attribute-drop" id="sponsored_bills_attributes_drop"><option>Select Attribute</option></select>').insertAfter('#event_type_filter_drop')

		_.each(sponsoredAttributes, function(attr){
			var option = '<option value="' + attr + '"">' + lowerUnderToUpperSpace( attr ) + '</option>';
			$('.attribute-drop').append(option);
		})

	},

	cosponsored_legislation : function(){



	}

}

var eventToSelectorMapping = {
	"campaign_contribution" : ".recieved",
	"sponsored_legislation" : ".sponsored"
}

function lowerUnderToUpperSpace( string ){

	var pieces = string.split("_"),
		finStr = ""

	_.each(pieces, function(piece){
		finStr += capitaliseFirstLetter(piece) + " "
	})

	return $.trim(finStr)
}

Handlebars.registerHelper('formatDate', function(v){
    console.log("rounding this mother", v)
    var number = round(v)
    return number
})

var committeeAttributes = [
	
]

var sponsoredAttributes = [
		"bill_resolution_type",
		"bill_type", "bill_type_label",
		"congress", "contributor_type",
		"current_status", "current_status_date",
		"current_status_description", "current_status_label",
		"display_number", "docs_house_gov_postdate",
		"id", "introduced_date",
		"is_alive", "is_current", "noun",
		"number", "senate_floor_schedule_postdate",
		"sliplawnum", "sliplawpubpriv", "sponsor",
		"sponsor_role", "title",
		"title_without_number", "time"
	]

var contributionAttributes = [ 
		"amount", "candidacy_status", "committee_ext_id",
		"committee_name", "committee_party", "contributor_address",
		"contributor_category", "contributor_city",
		"contributor_employer", "contributor_ext_id",
		"contributor_gender", "contributor_name",
		"contributor_occupation", "contributor_state", 
		"contributor_type", "contributor_zipcode",
		"cycle", "date", "district", "district_held",
		"filing_id", "is_amendment", "organization_ext_id",
		"organization_name", "parent_organization_ext_id",
		"parent_organization_name", "recipient_category", 
		"recipient_ext_id", "recipient_name", 
		"recipient_party", "recipient_state",
		"recipient_state_held", "recipient_type",
		"seat", "seat_held", "seat_result", "seat_status", 
		"transaction_id", "transaction_namespace", 
		"transaction_type", "transaction_type_description"
	]

// to get:
// all the tracontributor categories

// DETAILED CODE DESCRIPTIONS FOR MEMBER DATA

var cStewartMemberData = {
	
	congressNumber : {
		"103" : "103rd (1993-1995)",
		"104" : "104th (1995-1997)",
		"105" : "105th (1997-1999)",
		"106" : "106th (1999-2001)",
		"107" : "107th (2001-2003)",
		"108" : "108th (2003-2005)",
		"109" : "109th (2005-2007)",
		"110" : "110th (2007-2009)",
		"111" : "11th  (2009-2011)"
	},

	office : {
		"3" : "Representative",
		"4" : "Senate, 1st Class",
		"5" : "Senate, 2nd Class",
		"6" : "Senate, 3rd Class",
		"7" : "Delegate",
		"8" : "Resident Commissioner"
	},
	identificationNumber : {

	}, 
	name : {

	},
	district : {
		// "0" : 
		// "1" :
		// "2" :
		// "3" :
		// "4" : 
		// "5" : 
		// "6" : 
		// "7" : 
		// "8" : 
		// "9" : 
		// "10":
		// "11":
		// "12":
		// "13":
		// "14":
		// "15":		
		// "16":
		// "17":
		// "18":
		// "19":
		// "20":
		// "21":
		// "22":
		// "23":
		// "24":
		// "25":
		// "26":
		// "27":
		// "28":
		// "29":
		// "30":
		// "31":
		// "32":
		// "33":
		"79": "Delegate",
		"80": "Resident Commissioner",
		"81": "Senate, 1st Class",
		"82": "Senate, 2nd Class",
		"83": "Senate, 3rd Class",
		"84": "House At-large District"
	},
	state : {

	},
	stateCode : {
		new_england : {
			full_name : "New England",
			states : {
				"01" : "Connecticut",
				"02" : "Maine",
				"03" :	"Massachusetts",
				"04" :	"New Hampshire",
				"05" :	"Rhode Island",
				"06" :	"Vermont"
			}
		},
		middle_atlantic : {
			full_name: "Middle Atlantic",
			states : {
				"11" : "Delaware",
				"12" : "New Jersey",
				"13" : "New York",
				"14" : "Pennsylvania",
			}
		},
		east_north_central : {
			full_name: "East North Central",
			states : {
				"21" : "Illinois",
				"22" : "Indiana",
				"23" : "Michigan",
				"24" : "Ohio",
				"25" : "Wisconsin",				
			}
		},
		west_north_central : {
			full_name: "West North Central",
			states : {
				"31" : "Iowa",
				"32" : "Kansas",
				"33" : "Minnesota",
				"34" : "Missouri",
				"35" : "Nebraska",
				"36" : "North Dakota",
				"37" : "South Dakota"			
			}
		},
		solid_south : {
			full_name : "Solid South",
			states : {
				"41" : "Alabama",
				"42" : "Arkansas",
				"43" : "Florida",
				"44" : "Georgia",
				"45" : "Louisiana",
				"46" : "Mississippi",
				"47" : "North Carolina",
				"48" : "South Carolina",
				"49" : "Texas",
				"40" : "Virginia"				
			}
		},
		border_states : {
			full_name : "Border States",
			states : {
				"51" : "Kentucky",
				"52" : "Maryland",
				"53" : "Oklahoma",
				"54" : "Tennessee",
				"56" : "West Virginia"
			}
		},
		mountain_states : {
			full_name : "Mountain States",
			states : {
				"61" : "Arizona",
				"62" : "Colorado",
				"63" : "Idaho",
				"64" : "Montana",
				"65" : "Nevada",
				"66" : "New Mexico",
				"67" : "Utah",
				"68" : "Wyoming"
			}
		},
		pacific_states : {
			full_name : "Pacific States",
			states : {
				"71" : "California",
				"72" : "Oregon",
				"73" : "Washington",
				"81" : "Alaska",
				"82" : "Hawaii"
			}
		},
		territories_districts : {
			full_name : "Territories/Districts",
			states : {
				"55" : "District of Columbia",
				"91" : "Guam",
				"92" : "Puerto Rico",
				"93" : "Virgin Islands",
				"94" : "American Samoa"
			}
		},
	},
	
	partyCode : {
		"100" : "Democrat",
		"200" :	"Republican",
		"328" :	"Independent",
		"999" : "Unknown or minor third party"
	},
	
	chamberSeniority : "The term served in this Congress for Representatives. The Year served for Senators. This variable represents total (not just continuous) service in the chamber and is calculated from the dates/terms of service given in the Congressional Directory.",
	
	periodOfServiceInChamber : {
		"1"	: "Only period of House service",
		"2"	: "1st Period of House service",
		"3"	: "2nd Period of House service",
		"4"	: "3rd Period of House service",
		"5"	: "4th Period of House service",
		"6"	: "Only period of Senate service",
		"7"	: "1st period of Senate service",
		"8"	: "2nd period of Senate Service"
	},

	statusOfMemberInNextCongress : {
		"1" : "Continued in next congress",
		"2" : "Defeated for election to next congress",
		"3" : "Defeated for nomination to next congress",
		"4" : "Elected to another federal post (Senate, President...)",
		"5" : "Elected to a state or local post (governor, mayor...)",
		"6" : "Appointed to another federal post (cabinet...)",
		"7" : "Appointed to a state or local post",
		"8" : "Retired from public life",
		"9" : "Unsuccessful contest for another office",
		"0" : "Inapplicable. Member died or left chamber before the end of this congress."
	},	

}



var cStewartAssignmentData = {

	congressNumber : {
		"103" : "103rd (1993-1995)",
		"104" : "104th (1995-1997)",
		"105" : "105th (1997-1999)",
		"106" : "106th (1999-2001)",
		"107" : "107th (2001-2003)",
		"108" : "108th (2003-2005)",
		"109" : "109th (2005-2007)",
		"110" : "110th (2007-2009)",
		"111" : "11th  (2009-2011)"
	},

	committeeCodes : {
		house_of_representatives : {
			"102" : "Agriculture",
			"104" : "Appropriations",
			"106" : [ "Armed Services (103rd, 109-111th)",
					  "National Security (104th - 108th)" ],
			"113" :	[ "Banking, Finance and Urban Affairs (103rd)",
					  "Banking and Financial Services (104th - 106th)",
					  "Financial Services (106th - 111th)" ],
			"115" : "Budget", 
			"120" : "District of Columbia (103rd)",
			"124" : [ "Education and Labor (103rd, 111th)",
				      "Economic and Educational Opportunities (104th)", 
				      "Education and the Workplace (105th - 109th)" ],
			"128" : [ "Energy and Commerce (103rd, 107th - 111th)",
					  "Commerce (104th - 106th)" ], 
			"134" :[ "Foreign Affairs (103rd, 110th-111th)",
					  "International Relations (104th - 109th)" ],
			"138" :[ "Government Operations (103rd)",
					 "Government Reform and Oversight (104th - 109th)",
					 "Oversight and Government Reform (110th-111th)" ],
			"142" : [ "House Administration (103rd, 109-111th)",
					  "House Oversight (104th - 108th)" ], 
			"156" : "Judiciary",
			"160" : "Merchant Marine and Fisheries (103rd)",
			"164" : [ "Natural Resources (103rd, 111th)",
					"Resources (104h - 109th)" ],
			"168" : "Post Office and Civil Service (103rd)",
			"173" : [ "Public Works and Transportation (103rd)",
					  "Transportation and Infrastructure (104th - 111th)"],
			"176" : "Rules",
			"182" : [ "Science, Space, and Technology (103rd)",
					  "Science (104th - 109th)",
					  "Science and Technology (110th-111th)" ], 
			"184" : "Small Business",
			"186" : "Standards of Official Conduct",
			"192" : "Veterans Affairs",
			"196" : "Ways and Means",
			"242" : "Intelligence (Select)",
			"251" : "Homeland Security (Select 107th and 108th; Standing, 109th-111th)",
			"252" : "Energy Independence and Global Warming (Select, 110th-111th)",
			"253" : "Investigate the Voting Irregularities of August 2, 2007 (Select, 110th)"
		},

		senate : {
			"305" : "Agriculture, Nutrition, and Forestry",              
			"306" : "Appropriations",                                    
			"308" : "Armed Services",                                    
			"314" : "Banking, Housing, and Urban Affairs",               
			"316" : "Budget",                                            
			"321" : "Commerce, Science, and Transportation",             
			"330" : "Energy and Natural Resources",                      
			"332" : "Environment and Public Works",                      
			"336" : "Finance",                                           
			"338" : "Foreign Relations",
			"344" : [ "Governmental Affairs (103rd to 108th)",
			        "Homeland Security and Governmental Affairs (109th)" ], 
			"358" : "Judiciary",                                         
			"362" : [ "Labor and Human Resources (103rd to 106th)",
					"Health, Education, Labor, and Pensions (107th to 109th)" ],
			"380" : "Rules and Administration",
			"381" : [ "Small Business (103rd to 107th)",
			          "Small Business and Entrepreneurship (108th and 109th)" ],
			"388" : "Veterans Affairs",                                  
			"419" : "Aging (Special)",                                   
			"432" : "Intelligence (Select)",                             
			"434" : "Ethics (Select)",
			"435" : "Indian Affairs (Select)"
		},

		joint_committees : {
			"500" : "Library",
			"501" : "Printing",
			"503" : "Taxation",
			"507" : "Economic"
		},

		leadership : {
			"661" : "House Party Leadership",              
			"662" : "Senate Party Leadership"
		},

		no_assignment : {
			"770" : "Elected, not sworn",
			"772" : "Resigned before assignment",                        
			"775" : "Appointed, not sworn",                              
			"780" : "Sworn, only select committee",                      
			"790" : "Elected and sworn, not assigned",                   
			"795" : "Appointed and sworn, not assigned"
		}
	},

	identificationNumber : {

	},

	name : {

	},

	partyStatusCode : {
		original_appointments : {
			"1" : "Majority",
			"2" : "Minority",
			"3" : "Other party"		
		},
		members_added_to_committees : {
			"4" : "Majority addition",
			"5" : "Minority addition"
		},
		members_replacing_departed_members : {
			"6" : "Majority replacement",
			"7" : "Minority replacement"
		}, 
		other : {
			"8" : "Other party additions or replacemnts",
			"0" : "Inapplicable; no committee assignment"
		}
	},

	rankWithinPartyStatus : {

	},

	dateOfAssignment : {

	},

	dateOfTermination : {

	},

	seniorPartyMember : {
		committee_chairman : {
			"11" : "Only Chairman",
			"12" : "1st Chairman",
			"13" : "2nd Chairman",
			"14" : "3rd Chairman",
			"16" : "Acting Chairman"
		},
		ranking_minority_members : {
			"21" : "Only ranking minority member",
			"22" : "1st ranking minority member",
			"23" : "2nd ranking minority member",
			"24" : "3rd ranking minority member"
		},

		speaker_of_the_house : {
			"31" : "Only Speaker",
			"32" : "1st Speaker",
			"33" : "2nd Speaker"
		},

		majority_leadership : {
			"41" : "Only Majority Leader",
			"42" : "1st Majority Leader",
			"43" : "2nd Majority Leader",
	        "44" : "3rd Majority Leader",
	        "51" : "Only Majority Whip",
			"52" : "1st Majority Whip",
			"53" : "2nd Majority Whip"
		},

		minority_leadership : {
			"61" : "Only Minority Leader",
			"62" : "1st Minority Leader",
			"63" : "2nd Minority Leader",
			"64" : "Only Minority Whip",
			"65" : "1st Minority Whip",
			"66" : "2nd Minority Whip"
		},

		non_standard_committee_senior_party_status : {
			"81" : "Only Vice Chairman",
			"82" : "1st Vice Chairman",
			"83" : "2nd Vice Chairman",
			"86" : "Co-chairman"
		}
	},

	committeeSeniority : "For the House, this is the number of the term presently served by the member on the committee. Each time a member leaves the committee and returns, the number of terms is reset to 1.For the Senate, the unit of measure is the year. It can best be described as the year on the committee as of the assignment date for that entry. For example, a freshman senator assigned at the beginning of a congress to committee would have this variable coded 1. Similarly, a senator have that initial entry coded 1. If he is reappointed to the same committee at the start of the next congress, he is still coded 1 since he is still serving his first year on the committee.",

	committeePeriodOfService : {
		"1" : "Temporary assignment",
		"2"	: "Only period of service",
		"3"	: "First period of service",
		"4"	: "Second period of service",
		"5"	: "Third period of service",
		"0"	: "Inapplicable; no committee assignments"
	},

	committeeStatusAtEndOfThisCongress : {
		"1"	: { 
				house : "Remained on committee until adjournment.",
				senate : "Remained on committee until next assignments announced."
			},	
		"2"	: "Transferred to another committee.",
		"3"	: "Left committee for no other.",
		"4"	: "Left committee before departing chamber.",
		"5"	: "Member died.",
		"6"	: "Resigned to hold another office.",
		"7"	: "Resigned to seek another office unsuccessfully.",
		"8"	: "Resigned, but neither held nor sought another office.",
		"9"	: "Member lost special election (Senate).",
		"0"	: "Inapplicable; no committee assignments",
	},

	committeeContinuityOfAssignmentInNextCongress : {
		"1" : "Continues on committee (or successor)",
		"2" : "Continues in congress, but not committee",
		"3" : "Continues in congress, presently unassigned",
		"4" : "Committee is eliminated",
		"0" : "Inapplicable; member died or does not serve in next congress."
	}


}

