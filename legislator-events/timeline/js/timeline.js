	var values

	// SETUP
	var margin = {top: 10, right: 10, bottom: 100, left: 40},
	    margin2 = {top: 610, right: 10, bottom: 20, left: 40},
	    width = 1400 - margin.left - margin.right,
	    height = 700 - margin.top - margin.bottom,
	    height2 = 700 - margin2.top - margin2.bottom;

	var format = d3.time.format('%B %d %Y')	
		, formatEventDate = d3.time.format("%b %d, %Y");

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

	var labels = svg.append('g').attr('class', 'event-labels')
		  .selectAll('.event-label')
		.data(labelData)
		  .enter().append('g')
		  .attr('transform', function(d){
			  return 'translate(-160,' + d.y + ')';
		  })

	labels.append('rect')
		.attr('class', 'event-label')
		.attr('height', 40)
		.attr('width', 180)
		.style("fill", function(d){ return d.fill })
		.style("fill-opacity", .6)
	  
	labels.append('text')
		.text(function(d){ return d.text })
	  	.attr('y', 25)
	  	.attr('x', 10)
	  	.style('fill', 'white')
	  	.style('font-family', 'helvetica')
	  	.style('font-size', '14px');

	labels.on('mouseover', function(d){
			d3.select(this).transition()
				.attr('transform', 'translate(0, ' + d.y + ')');
		})
		.on('mouseout', function(d){
			d3.select(this).transition()
				.attr('transform', 'translate(-160, ' + d.y + ')');
		})
		.on('click', function(d){
			var sponsored = d3.selectAll(d.targetClass)
			sponsored.classed('shown') ? sponsored.classed('shown', false).classed('hidden', true) : 
				 						 sponsored.classed('shown', true).classed('hidden', false)
		})


function update( legisJson, view, funcName, headingModel ){

	d3.json( legisJson, function(data){

		window.legislatorData = data
		window.contribs = _.filter(data.data, function(datum){ return datum.events[0].event_type === "recieved_campaign_contributions" })
			   contribs = _.map(contribs, function(ev){return ev.events[0]})
		window.committeeAssignments = _.filter(data.data, function(datum){ return datum.events[0].event_type === "joined_committee" })
			   committeeAssignments = _.map(committeeAssignments, function(ev){ return ev.events[0] })

		var crpCodes = legislatorData.crp_catcodes
			, catInfo = { "crpInfo" : [] }
			, sectors;
		
		for ( key in crpCodes ) {
			catInfo.crpInfo.push({
				"industryCode" : key,
				"industryName" : crpCodes[key][0],
				"sectorCode" : key.slice(0,2),
				"sectorCoding" : crpCodes[key][2],
				"sectorName" : crpCodes[key][1]
			})
		}

		sectors = _.uniq(_.pluck(catInfo.crpInfo, "sectorName"))
		sectors = _.map(sectors, function(sector){ 
			return _.findWhere(catInfo.crpInfo, {sectorName: sector});
		})
		catInfo.crpInfo = sectors.sort(compare)

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

		// set the data in the models
		headingModel.set(legis_data)
		filterModel.set(catInfo)
		view[funcName]()

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

		addContextContribution( values )
		addContextBills( values )
		addContextCosponsored( values )
		addContextSpeeches( values )
		addContextVotes( values )
		addContextCommittee()

	})

}


function toggleFilter(){

	$('#filter_options').hasClass('shown-filter') ? 
		$('#filter_options').slideUp().removeClass('shown-filter') :
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

function compare( a, b ) {

	if ( Number(a.time) < Number(b.time)) return -1;
	if (Number(a.time) > Number(b.time)) return 1;
	return 0;
}

function removeFilter() {

	d3.select('.selected')
		.classed('selected', false);

	d3.selectAll('.not-connected')
		.classed('not-connected', false);

	d3.selectAll('.connected')
		.classed('connected', false);

	filterActive = false;
	
}

function brushed() {

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
	addSpeeches( data )
	addVotes( data )
	addCommittees()
	focus.select(".x.axis").call(xAxis);

	if ( filterActive ){

		var attrVal = $('#industry_drop option:selected').val()
		
		d3.selectAll('.event, .context-event')[0].forEach(function(element, i){ 
			var el = d3.select(element)
				, data = el.data()[0];

			if (data.hasOwnProperty('info')){
				if ( data.info.hasOwnProperty('contributor_category') && 
					 data.info.contributor_category !== undefined ){
					if ( data.info["contributor_category"].slice(0,2) === attrVal ){
						console.log("got something connected", el)
						el.classed('connected', true)						
					} else {
						el.classed('not-connected', true)
					}
				}
				else if ( data.info.hasOwnProperty('crp_catcode') && 
					 data.info.crp_catcode !== undefined ){
					if ( data.info["crp_catcode"].slice(0,2) === attrVal ){
						console.log("got something connected", el)
						el.classed('connected', true)

					} else {
						el.classed('not-connected', true)
					}
				}
				else {
					el.classed('not-connected', true)
				} 
			}
			else {

				el.classed('not-connected', true)

			}
		})
		context.selectAll('.context-connected').select('circle').classed('not-connected', false)
	}


}

function addContributions( data ){

	data = _.filter(data, function(datum){ return datum.events[0].event_type === "recieved_campaign_contributions" })
	data = _.map(data, function(ev){return ev.events[0]})

	var diameter = 180,
    	format = d3.format(",d");

	var pack = d3.layout.pack()
	    .size([diameter - 4, diameter - 4])
	    .value(function(d) { return Number(d.amount); });

	var event_ = focus.selectAll(".contrib")
		.data(data)
	  .enter().append('svg:g')
	  	// .attr('class', 'event')
	  	.attr("transform", function(d) { return "translate(" + ( x(d.time * 1000) - 100 ) + ",350)"; })

	var node = event_.selectAll(".node")
		  .data(pack.nodes)
		.enter().append("g")		  
		  .attr("class", function(d) { return d.children ? "node" : "leaf node"; })
		  .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

	node.append("circle")
      .attr("r", function(d) { return d.r; })
      .attr("class", function(d){
      		var class_ = "event"
      		d.depth !== 0 ? class_ += " recieved" : null
      		return class_
      })
      .style("stroke", "green")
		.on('mouseover', function(d){
			console.log(d)
			var el = d3.select(this),
				templateData = templateId(d),
				eventId = '#' + d.event_id,
				templateSelector = '#' + templateData[0],
				top = $(this).position().top - 50,
				left = $(this).position().left >= 800 ? $(this).position().left - 400 - (d.r/2) : 
														$(this).position().left + 50 + (d.r/2)

			el.classed(d.event_id, true)
			  .classed('hovered', true)
			
			$('.event-popup').remove()

			var popup = new PopupView({
				el : $('body'),
				model : templateData[1],
				tmpl : $(templateSelector),
				top : top,
				left : left
			})
		})
		.on('mouseout', function(){
			removePopup ? $('.event-popup').remove() : null
			
			d3.select(this.parentNode.parentNode)
				.select('.event-date')
				.classed('shown', false)				

			d3.select(this).classed('hovered', false)				

			// if (!(d3.select(this).classed('selected'))){

			// 	d3.select(this).transition().attr('r', function(d){
			// 		var r = 600 * (1/data.length) 
			// 		return r
			// 	})
			// }

		})
		.on('click', function(d){			
			var contribInfo = contributionInfo( d )
			
			d3.select(this).classed('selected', true);
			removePopup = false;

			$('.event-popup').addClass('expanded');
			$('.hidden-content').removeClass('hidden-content');

			d.info.searchString = searchString( d )
			d.info.imageString = imageString( d )
			d.info.totalContributed = contribInfo['totalContributed']
			d.info.totalContributions = contribInfo['totalContributions']

			var expanded = new ExpandedView({
				el : '#popup_content_container',
				model : d
			});
		});
}

function addContextContribution( data ){

	data = _.filter(data, function(datum){ return datum.events[0].event_type === "recieved_campaign_contributions" })
	data = _.map(data, function(ev){return ev.events[0]})

	var diameter = 10,
    	format = d3.format(",d");

	var pack = d3.layout.pack()
	    .size([diameter - 4, diameter - 4])
	    .value(function(d) { return Number(d.amount); });

	var event_ = context.selectAll(".context-contrib")
		.data(data)
	  .enter().append('svg:g')
	  	.attr('class', 'context-contrib')	
	  	.attr("transform", function(d) { return "translate(" + ( x(d.time * 1000) - 5 ) + ",60)"; })

	var node = event_.selectAll(".node")
		  .data(pack.nodes)
		.enter().append("g")		  
		  .attr("class", function(d) { return d.children ? "node" : "leaf node"; })
		  .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

	node.append("circle")
      .attr("r", function(d) { return d.r; })
      .attr("class", function(d){
      		var class_ = "context-event"
      		d.depth !== 0 ? class_ += " recieved" : null
      		return class_
      })
      .style("stroke", "green")

      // hide everything but montsh
      context.selectAll('.recieved').style('display', 'none');
}

function addBills( data ){

	data = _.filter(data, function(datum){ 
		return datum.events[0].event_type === "sponsored_legislation" 
	})
	data = _.map(data, function(ev){return ev.events[0]})	

	var event_ = focus.selectAll(".sponsored")
		.data(data)
	  .enter().append('svg:g')
	  	.attr('class', 'event shown')
	  	.attr("transform", function(d) {
	  		return "translate(" + x(d.time * 1000) + ",90)"; 
	  	})

	event_.append('rect')
		.attr("width", 40)
		.attr("height", 15)
		.attr("class", "event sponsored")
		.attr("transform", function(d) {
	         return "rotate(-135)" 
	     })

	event_.on('mouseover', function(d){
		console.log(d)

		var el = d3.select(this),
			templateData = templateId(d),
			eventId = '#' + d.event_id,
			templateSelector = '#' + templateData[0],
			top = $(this).position().top - 50,
			left = $(this).position().left >= 800 ? $(this).position().left - 400 : 
													$(this).position().left + 50;

		el.append('svg:line')
			.attr('x1', 0)
			.attr('x2', 0)
			.attr('y1', 0)
			.attr('y2', height - 140 )
			.style("stroke-opacity", 0)
			.style("stroke", "steelblue")

		el.append('svg:text')
			.text(function(d){
				return formatEventDate(new Date(Number(d.time) * 1000))
			})
			.attr('x', function(d){
				return -this.getComputedTextLength()/2
			})
			.attr('y', height - 115)
			.attr('class', 'event-date')
			.style('font-family', 'helvetica')
			.style('font-size', '12px')
			.style('fill', 'steelblue')
			.style('fill-opacity', 1)

		el.select('line').transition().style("stroke-opacity", 1);
		el.select('rect').classed('hovering', true);

		el.classed(d.event_id, true)
		  .classed('hovered', true)
		
		$('.event-popup').remove()

		var popup = new PopupView({
			el : $('body'),
			model : templateData[1],
			tmpl : $(templateSelector),
			top : top,
			left : left
		})

	}).on('mouseout', function(d){
		
		var el = d3.select(this)

		el.selectAll('line').transition().style("stroke-opacity", 0).remove()
		el.selectAll('.event-date').transition().style("stroke-opacity", 0).remove()
		el.select('rect').classed('hovering', false)
		el.classed('hovered', false)
		removePopup ? $('.event-popup').remove() : null

	}).on('click', function(d){
	
		d3.select(this).classed('selected', true);
		removePopup = false;

		$('.event-popup').addClass('expanded');
		$('.hidden-content').removeClass('hidden-content');

		var expanded = new ExpandedView({
			el : '#popup_content_container',
			model : d
		});
	
	})
}


function addCosponsored( data ) {

	data = _.filter(data, function(datum){ return datum.events[0].event_type === "bill_cosponsorship" })
	data = _.map(data, function(ev){return ev.events[0]})

	var event_ = focus.selectAll(".cosponsored")
		.data(data)
	  .enter().append('svg:g')
	  	.attr('class', 'event cosponsored')
	  	.attr("transform", function(d) { 
	  		return "translate(" + x(d.time * 1000) + ",150)"; 
	  	})

	 event_.append('rect')
		.attr("width", 40)
		.attr("height", 15)
		.attr("class", "event cosponsored")
		.attr("transform", function(d) {
	         return "rotate(-135)" 
	     })

	event_.on('mouseover', function(d){
		console.log(d);
		var el = d3.select(this)
			, templateData = templateId(d)
			, eventId = '#' + d.event_id
			, templateSelector = '#' + templateData[0]
			, top = $(this).position().top - 50
			, left = $(this).position().left >= 800 ? $(this).position().left - 400 : 
													$(this).position().left + 50;

			el.append('svg:line')
				.attr('x1', 0)
				.attr('x2', 0)
				.attr('y1', 0)
				.attr('y2', height - 200)
				.style("stroke-opacity", 0)
				.style("stroke", "red")

			el.append('svg:text')
				.text(function(d){
					return formatEventDate(new Date(Number(d.time) * 1000))
				})
				.attr('x', function(d){
					return -this.getComputedTextLength()/2
				})
				.attr('y', height - 175)
				.attr('class', 'event-date')
				.style('font-family', 'helvetica')
				.style('font-size', '12px')
				.style('fill', 'red')
				.style('fill-opacity', 1)

			el.select('line').transition().style("stroke-opacity", 1)
			el.select('rect').classed('hovering', true);

			el.classed(d.event_id, true)
			  .classed('hovered', true)
			
			$('.event-popup').remove()

			var popup = new PopupView({
				el : $('body'),
				model : templateData[1],
				tmpl : $(templateSelector),
				top : top,
				left : left
			})

	}).on('mouseout', function(d){
		
		var el = d3.select(this)

		el.selectAll('line').transition().style("stroke-opacity", 0).remove()
		el.selectAll('.event-date').transition().style("stroke-opacity", 0).remove()
		el.select('rect').classed('hovering', false);
		el.classed('hovered', false)
		removePopup ? $('.event-popup').remove() : null

	}).on('click', function(d){
	
		d3.select(this).classed('selected', true)
		removePopup = false

		$('.event-popup').addClass('expanded')
		$('.hidden-content').removeClass('hidden-content')

		var expanded = new ExpandedView({
			el : '#popup_content_container',
			model : d
		})
	})

}

function addSpeeches( data ){

	data = _.filter(data, function(datum){ return datum.events[0].event_type === "speech" })
	data = _.map(data, function(ev){return ev.events[0]})

	var parse = d3.time.format("%Y-%m-%d").parse
		, format = d3.time.format("%b %d, %Y");
	
	var event_ = focus.selectAll(".speech")
		.data(data)
	  .enter().append('svg:g')
	  	.attr('class', 'event speech')	
	  	.attr("transform", function(d) { 
	  		return "translate(" + x(d.time * 1000) + ",210)"; 
	  	})	

	 event_.append('rect')
		.attr("width", 40)
		.attr("height", 15)
		.attr("class", "event speech")
		.attr("transform", function(d) {
	         return "rotate(-135)" 
	    })

	event_.on('mouseover', function(d){

		console.log(d);

		var el = d3.select(this),
			el_data = d3.select(this.parentNode).data()[0]
			el_data = $.extend( true, {}, el_data)
			el_data.info = d

		var	templateData = templateId(d)
			
		var eventId = '#' + d.event_id,
			templateSelector = '#' + templateData[0],
			top = $(this).position().top - 50,
			left = $(this).position().left >= 800 ? $(this).position().left - 400 : 
													$(this).position().left + 50


		el.append('svg:line')
			.attr('x1', 0)
			.attr('x2', 0)
			.attr('y1', 0)
			.attr('y2', height - 260)
			.style("stroke-opacity", 0)
			.style("stroke", "orange")

		el.append('svg:text')
			.text(function(d){
				return formatEventDate(new Date(Number(d.time) * 1000))
			})
			.attr('x', function(d){
				return -this.getComputedTextLength()/2
			})
			.attr('y', height - 235)
			.attr('class', 'event-date')
			.style('font-family', 'helvetica')
			.style('font-size', '12px')
			.style('fill', 'orange')
			.style('fill-opacity', 1)
	
		el.select('line').transition().style("stroke-opacity", 1)
		el.select('rect').classed('hovering', true);

		el.classed(d.event_id, true)
		  .classed('hovered', true)
		
		$('.event-popup').remove()

		var popup = new PopupView({
			el : $('body'),
			model : templateData[1],
			tmpl : $(templateSelector),
			top : top,
			left : left
		})

	})
	.on('mouseout', function(d){
	
		var el = d3.select(this)

		el.selectAll('line').transition().style("stroke-opacity", 0).remove()
		el.selectAll('.event-date').transition().style("stroke-opacity", 0).remove()
		el.select('rect').classed('hovering', false);
		el.classed('hovered', false)
		removePopup ? $('.event-popup').remove() : null

	})
	.on('click', function(d){
	
		d3.select(this).classed('selected', true)
		
		// hoverable = false
		removePopup = false

		$('.event-popup').addClass('expanded')
		$('.hidden-content').removeClass('hidden-content')

		var expanded = new ExpandedView({
			el : '#popup_content_container',
			model : d
		})
	})

}

function addVotes( data ){

	data = _.filter(data, function(datum){ 
			return datum.events[0].event_type === "vote" 
		})
	data = _.map(data, function(ev){ return ev.events[0]} )

	var event_ = focus.selectAll(".vote")
		.data(data)
	  .enter().append('svg:g')
	  	.attr('class', 'event vote')	
	  	.attr("transform", function(d) { 
	  		return "translate(" + x(d.time * 1000) + ",270)"; 
	  	})	

	event_.append('rect')
		.attr("width", 40)
		.attr("height", 15)
		.attr("class", "event speech")
		.style("fill", "indigo")
		.style("fill-opacity", .5)
		.style("stroke", "indigo")
		.attr("transform", function(d) {
	         return "rotate(-135)" 
	    })

	event_.on('mouseover', function(d){
		console.log(d)

		var el = d3.select(this)
			, templateData = templateId(d, legislatorData.bio.id.bioguide)
			, eventId = '#' + d.event_id
			, templateSelector = '#' + templateData[0]
			, top = $(this).position().top - 50
			, left = $(this).position().left >= 800 ? $(this).position().left - 400 : 
													$(this).position().left + 50;

		el.append('svg:line')
			.attr('x1', 0)
			.attr('x2', 0)
			.attr('y1', 0)
			.attr('y2', height - 320)
			.style("stroke-opacity", 0)
			.style("stroke", "indigo")

		el.append('svg:text')
			.text(function(d){
				return formatEventDate(new Date(Number(d.time) * 1000))
			})
			.attr('x', function(d){
				return -this.getComputedTextLength()/2
			})
			.attr('y', height - 295)
			.attr('class', 'event-date')
			.style('font-family', 'helvetica')
			.style('font-size', '12px')
			.style('fill', 'indigo')
			.style('fill-opacity', 1)				

		el.select('rect').classed('hovering', true);
		el.select('line').transition().style("stroke-opacity", 1)

		el.classed(d.event_id, true)
		  .classed('hovered', true)
		
		$('.event-popup').remove()

		var popup = new PopupView({
			el : $('body'),
			model : templateData[1],
			tmpl : $(templateSelector),
			top : top,
			left : left
		})

	})
	.on('mouseout', function(d){

		var el = d3.select(this)

		el.selectAll('line').transition().style("stroke-opacity", 0).remove()
		el.selectAll('.event-date').transition().style("stroke-opacity", 0).remove()
		el.select('rect').classed('hovering', false);
		el.classed('hovered', false)
		removePopup ? $('.event-popup').remove() : null

	})
	.on('click', function(d){

		d3.select(this).classed('selected', true);
		removePopup = false;

		$('.event-popup').addClass('expanded');
		$('.hidden-content').removeClass('hidden-content'); // ?

		var expanded = new ExpandedView({
			el : '#popup_content_container',
			model : d
		});
	});

}

function addCommittees(){

	var event_ = focus.selectAll(".committees")
		.data(committeeAssignments)
	  .enter().append('svg:g')
	  	.attr('class', 'event')	
	  	.attr("transform", function(d) { return "translate(" + x(d.time * 1000) + ",100)"; })

	event_.append('g').selectAll(".committee")
		  .data(function(d){ return d.info })
		.enter().append("svg:line")
		.attr('class', 'committee')
		.attr('x1', 0)
		.attr('x2', function(d){
			var x1, x2
			x1 = x(getTimestamp(d[7]))
			x2 = x(getTimestamp(d[8]))
			return x2 - x1
		})
		.attr('y1', function(d,i){ return 240 - ( i * 15 )})
		.attr('y2', function(d,i){ return 240 - ( i * 15 )})
		.style("stroke-opacity", .5)
		.style("stroke-width", 10)
		.style("stroke", "yellow")
		.on('mouseover', function(d){

			var el = d3.select(this),
				el_data = d3.select(this.parentNode).data()[0]
				el_data = $.extend( true, {}, el_data)
				el_data.info = d

			var	templateData = templateId(el_data)
				
			var eventId = '#' + d.event_id,
				templateSelector = '#' + templateData[0],
				left = mousePos[0] + 50,
				top = mousePos[1]

			el.classed(el_data.event_id, true)
			  .classed('hovered', true)
			
			$('.event-popup').remove()

			var popup = new PopupView({
				el : $('body'),
				model : templateData[1],
				tmpl : $(templateSelector),
				top : top,
				left : left
			})

		})
		.on('mouseout', function(d){
		
			var g = d3.select(this)
			g.classed('hovered', false)

			removePopup ? $('.event-popup').remove() : null
		})

}

function addContextBills( data ){

	data = _.filter(data, function(datum){ return datum.events[0].event_type === "sponsored_legislation" })
	data = _.map(data, function(ev){return ev.events[0]})	

	var event_ = context.selectAll(".context-sponsored")
		.data(data)
	  .enter().append('svg:g')
	  	.attr('class', 'context-event shown')
	  	.attr("transform", function(d) { return "translate(" + x(d.time * 1000) + ",15)"; })

	 event_.append('rect')
		.attr("width", 6)
		.attr("height", 2)
		.attr("class", "context-sponsored")
		.style("fill", "steelblue")
		.style("fill-opacity", .5)
		.style("stroke", "none")
		.attr("transform", function(d) {
	         return "rotate(-135)" 
	     })
		.on('mouseover', function(d){
			console.log("the d is d", d)
		})

} 

function addContextCosponsored ( data ){

	data = _.filter(data, function(datum){ return datum.events[0].event_type === "bill_cosponsorship" })
	data = _.map(data, function(ev){return ev.events[0]})

	var event_ = context.selectAll(".context-cosponsored")
		.data(data)
	  .enter().append('svg:g')
	  	.attr('class', 'context-event context-cosponsored')	
	  	.attr("transform", function(d) { return "translate(" + x(d.time * 1000) + ",25)"; })

	 event_.append('rect')
		.attr("width", 6)
		.attr("height", 2)
		.style("fill", "red")
		.style("fill-opacity", .5)
		.style("stroke", "none")
		.attr("transform", function(d) {
	         return "rotate(-135)" 
	     })
		.on('mouseover', function(d){
			console.log("the d is d", d)
		})
}

function addContextSpeeches( data ){

	data = _.filter(data, function(datum){ return datum.events[0].event_type === "speech" })
	data = _.map(data, function(ev){return ev.events[0]})

	var event_ = context.selectAll(".context-speech")
		.data(data)
	  .enter().append('svg:g')
	  	.attr('class', 'context-event context-speech')	
	  	.attr("transform", function(d) { return "translate(" + x(d.time * 1000) + ",35)"; })	

	 event_.append('rect')
		.attr("width", 6)
		.attr("height", 2)
		.attr("class", "context-speech")
		.style("fill", "orange")
		.style("fill-opacity", .5)
		.style("stroke", "none")
		.attr("transform", function(d) {
	         return "rotate(-135)" 
	     })

	event_.on('mouseover', function(d){
		console.log("the speech data is", d)
	})

}

function addContextVotes( data ){

	data = _.filter(data, function(datum){ return datum.events[0].event_type === "vote" })
	data = _.map(data, function(ev){return ev.events[0]})

	var event_ = context.selectAll(".context-vote")
		.data(data)
	  .enter().append('svg:g')
	  	.attr('class', 'context-event context-vote')	
	  	.attr("transform", function(d) { return "translate(" + x(d.time * 1000) + ",42)"; })	

	 event_.append('rect')
		.attr("width", 6)
		.attr("height", 2)
		.attr("class", "context-speech")
		.style("fill", "indigo")
		.style("fill-opacity", .5)
		.style("stroke", "none")
		.attr("transform", function(d) {
	         return "rotate(-135)" 
	     })

	event_.on('mouseover', function(d){
		console.log("the speech data is", d)
	})

}

function addContextCommittee(){

	var event_ = context.selectAll(".context-committees")
		.data(committeeAssignments)
	  .enter().append('svg:g')
	  	.attr('class', 'context-event')	
	  	.attr("transform", function(d) { return "translate(" + x(d.time * 1000) + ",40)"; })

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
		.attr('y1', function(d,i){ return 10 - ( i * 3 )})
		.attr('y2', function(d,i){ return 10 - ( i * 3 )})
		.style("stroke-opacity", .5)
		.style("stroke-width", 2)
		.style("stroke", "yellow")

}

function searchString( d ){
	var searchString = d.info.contributor_name
	searchString += ' ' + d.info.contributor_occupation
	searchString = $.trim(searchString.toLowerCase());
	searchString = searchString.split(' ').join('+');
	return 'https://www.google.com/search?q=' + searchString
}

function imageString ( d ) {
	return 'http://14ddv.com/wp-content/uploads/2012/05/person_placeholder-Copy.png'
}

function contributionInfo( d ) {
	var contributions = _.pluck(context.selectAll('.recieved').data(), 'info')
		, amounts
		, sum = 0
		, contribInfo = {};

	amounts = _.filter(contributions, function(contrib){
			if ( contrib.contributor_ext_id === d.info.contributor_ext_id ){
				return Number(contrib.amount)
			}
		})

	_.each(amounts, function(a){
		sum += Number(a.amount)
	})

	contribInfo['totalContributed'] = numberWithCommas( sum );
	contribInfo['totalContributions'] = amounts.length;

	return contribInfo
}

function numberWithCommas( x ) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function toTitleCase( str ) {
    return str.replace(/\w\S*/g, function(txt){
    	return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

// REFACTOR: this function shiouldn't be needed
// data from event dom element should be sufficient 
function templateId ( d, bioguide ){
	var data
	// console.log("incoming data is", d)
	switch(d.event) {
		case "sponsored legislation":
			data = {
				"date" : d.time,
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
				"date" : d.time,
				"title" : d.info.official_title,
				"thomas_link" : d.info.thomas_link,
				"govtrack_link" : d.info.link,
				"id" : d.event_id
			}

			return [ "cosponsored_legislation", data ]
			break;

		case "start congressional term":
			return "green"
			break;

		case "joined committee":
			data = {
				"date" : d.time,
				"committee" : d.info[14],
				"id" : d.event_id
			}
			return [ "joined_committee", data ]
			break;

		case "recieved campaign contribution":
			var contributor_name
			if ( d.info.contributor_type == "I" ) {
				var contributor_name = fixContributorName( d.info.contributor_name )
			} else {
				contributor_name = d.info.contributor_name
			}

			data = {
				"date" : d.time,
				"contributor_name" : contributor_name,
				"contributor_string" : d.info.contributor_name.replace(/ /g, ""),
				"contributor_occupation" : d.info.contributor_occupation,
				"contributor_city" : d.info.contributor_city,
				"contributor_state" : d.info.contributor_state,
				"conributor_zipcode" : d.info.contributor_zipcode,
				"industry" : d.info.contributor_category_industry,
				"cycle" : d.info.cycle,
				"amount" : d.info.amount,
				"id" : d.event_id
			}

			return [ "campaign_contribution", data ];
			break
		case "speech":
			data = {
				"date" : d.time,
				"title" : d.info.title,
				"date" : d.info.date,
				"bills" : d.info.bills || [],
				"id" : d.event_id
			}
			return ["speech", data]
			break
		case "vote":
			
			data = {
				"date" : d.time,
				"bill_title" : d.info.official_title,
				"vote" : d.info.vote,
				"id" : d.event_id
			}
			return["vote", data]
			break
	}
}

function fixContributorName( name ){

	var split = name.toLowerCase().split(" ")
		, first
		, last;

	first = split[1].charAt(0).toUpperCase() + split[1].slice(1);
	last = split[0].charAt(0).toUpperCase() + split[0].slice(1);
	console.log(last.search(/,/g, ""));
	last.replace(/,/g, "");

	return first + ' ' + last;
}

function capitaliseFirstLetter(string){
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function getTimestamp(str) {
	var d = str.match(/\d+/g); // extract date parts
	return +new Date(d[0], d[1] - 1, d[2], d[3], d[4], d[5]); // build Date object
}

var options = {
	filter_li : function(){
		var source = $('#filter_template').html()
			, template = Handlebars.compile( source )
		$('#options_content').html( template )
	},

	key_li : function(){
		var source = $('#key_template').html()
			, template = Handlebars.compile( source );

		$('#options_content').html( template )
	}
}

var addAttributeFilter = {
	elected : function(){

	},

	committee : function() {

	},

	campaign_contribution : function(){
		var select = '<select class="attribute-drop"' 
			select += ' id="contribution_attributes_drop"><option>'
			select += 'Select Attribute</option></select>'

		$(select).insertAfter('#event_type_filter_drop')

		_.each(contributionAttributes, function(attr){
			var option = '<option value="' + attr + '"">' + lowerUnderToUpperSpace( attr ) + '</option>';
			$('.attribute-drop').append(option);
		})
	}, 

	lobbying_contribution : function(){

	},

	sponsored_legislation : function(){
		var select = '<select class="attribute-drop"' 
			select += ' id="contribution_attributes_drop"><option>'
			select += 'Select Attribute</option></select>'

		$(select).insertAfter('#event_type_filter_drop')

		_.each(sponsoredAttributes, function(attr){
			var option = '<option value="' + attr + '"">' + lowerUnderToUpperSpace( attr ) + '</option>';
			$('.attribute-drop').append(option);
		})
	},

	cosponsored_legislation : function(){
		var select = '<select class="attribute-drop"' 
			select += ' id="contribution_attributes_drop"><option>'
			select += 'Select Attribute</option></select>'

		$(select).insertAfter('#event_type_filter_drop')

		_.each(sponsoredAttributes, function(attr){
			var option = '<option value="' + attr + '"">' + lowerUnderToUpperSpace( attr ) + '</option>';
			$('.attribute-drop').append(option);
		})
	}

}

function compare(a,b) {
  if (a.sectorName < b.sectorName){
  	 return -1;
  }
  else if (a.sectorName > b.sectorName){
  	return 1;
  }
  else{
  	return 0;	
  }
  
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

Handlebars.registerHelper('numberWithCommas', function(v){
	v = parseInt(v)
	return v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
})

Handlebars.registerHelper('stringToTitleCase', function(str){
	 return str.replace(/\w\S*/g, function(txt){
    	return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
})

Handlebars.registerHelper('timestampToDateString', function(ts){
	var formatEventDate = d3.time.format("%B %d, %Y");
	return formatEventDate(new Date(Number(ts) * 1000))
})
