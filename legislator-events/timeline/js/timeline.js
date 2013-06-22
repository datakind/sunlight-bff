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

	// refactor, make these elements data driven
	svg.append("rect")
		.attr("width", 80)
		.attr("height", 40)
		.attr("transform", "translate(-60, 100)")
		.style("fill", "steelblue")
		.style("fill-opacity", .6)
		.on('mouseover', function(d){
			d3.select(this).transition()
				.attr("transform", "translate(0, 100)")
		})
		.on('mouseout', function(d){
			d3.select(this).transition()
				.attr("transform", "translate(-60, 100)")
		})
		.on('click', function(d){
			var sponsored = d3.selectAll('.sponsored')
			sponsored.classed("shown") ? sponsored.classed("shown", false).classed("hidden", true) : 
				 						 sponsored.classed("shown", true).classed("hidden", false)
		})

	svg.append("rect")
		.attr("width", 80)
		.attr("height", 40)
		.attr("transform", "translate(-60, 200)")
		.style("fill", "red")
		.style("fill-opacity", .6)
		.on('mouseover', function(d){
			d3.select(this).transition()
				.attr("transform", "translate(0, 200)")
		})
		.on('mouseout', function(d){
			d3.select(this).transition()
				.attr("transform", "translate(-60, 200)")
		})
		.on('click', function(d){
			console.log( "testing", d3.selectAll('.sponsored').classed("shown") )
		})
		// .append("text").text("sponsored legislation")
		// .style("fill", "white")

	svg.append("rect")
		.attr("width", 80)
		.attr("height", 40)
		.attr("transform", "translate(-60, 270)")
		.style("fill", "yellow")
		.style("fill-opacity", .6)
		.on('mouseover', function(d){
			d3.select(this).transition()
				.attr("transform", "translate(0, 270)")
		})
		.on('mouseout', function(d){
			d3.select(this).transition()
				.attr("transform", "translate(-60, 270)")
		})

	svg.append("rect")
		.attr("width", 80)
		.attr("height", 40)
		.attr("transform", "translate(-60, 420)")
		.style("fill", "green")
		.style("fill-opacity", .6)
		.on('mouseover', function(d){
			d3.select(this).transition()
				.attr("transform", "translate(0, 420)")
		})
		.on('mouseout', function(d){
			d3.select(this).transition()
				.attr("transform", "translate(-60, 420)")
		})

	var values


var Heading = Backbone.Model.extend({
	
	defaults : {
		"name" : undefined
	},

	initialize: function(){

		this.on('change', function(){
			console.log('SOME SHIT CHANGED', this.toJSON())
		})
	}

})

var LegisInfoView = Backbone.View.extend({

	initialize : function(){

		this.render();
		this.model.bind('change', this.render, this);

	},

	render : function() {

		var source = $('#legis_info').html()
			, template = Handlebars.compile( source )
			, model = this.model.toJSON();

		this.$el.html( template(model) )

	}

})

var HeadingView = Backbone.View.extend({ 

	legislators : [
		{ label : "Chuck Grassley", value : "chuck_grassley.json" },
		{ label : "John Boehner", value : "john_a_boehner.json" }
	],

	initialize : function() {

		var self = this

		this.render()
		this.$el.find('input').autocomplete({
			source : this.legislators,
			select : function( ev, ui ) {
				ev.preventDefault()
				$('#legislator_input').val( ui.item.label )
				focus.selectAll('g').remove()
				context.selectAll('g').remove()
				update( ui.item.value, self, "toggleExpansion", self.model )
			},
		    focus: function( ev, ui) {
		        ev.preventDefault();
		        $("#legislator_input").val(ui.item.label);
		    }			
		})

	}, 

	render : function() {

		var source = $('#legislator').html()
	    	, template = Handlebars.compile( source )
	    	, model = this.model;

	    this.$el.html( template );

	    if ( model.get('name') === undefined ){	    	
	    	this.toggleExpansion();
	    }

	},

	events : {

		"click #change_legislator" : "changeLegislator"

	},

	toggleExpansion : function() {

		var expanded = this.$el.hasClass('expandido')
			, info
			, model = this.model;

		if ( expanded ) { 
			this.$el.removeClass('expandido')
			this.$el.find('input').css('display', 'none')		
			info = new LegisInfoView({
				el : '#info',
				model : model
			})
			this.$el.find('#info').show()
		} else {
			this.$el.find('#info').hide()
			this.$el.addClass('expandido')
			focus.selectAll('g').remove()
			context.selectAll('g').remove()
			this.$el.find('input')
				.val('').css('display', 'block')
		}

	},

	changeLegislator : function( ev ) {

		ev.preventDefault()
		this.toggleExpansion()

	}

})


function update( legisJson, view, funcName, headingModel ){

	d3.json( legisJson, function(data){

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

		headingModel.set(legis_data)
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

		// addContextContribution( values )
		addContextBills( values )
		addContextCosponsored( values )
		addContextCommittee()

	})

}

// events
$(document).ready(function(){

	var head = new Heading()
		, headingView = new HeadingView({
			el : '#top_bar',
			model : head
		});

	window.removePopup = true
	window.hoverable = true
	window.mousePos = undefined

	$('body').on('click', '#filter_img', function(){
		
		var filter = $(this).parent();

		if ( filter.hasClass('expanded-filter') ){
			filter.removeClass('expanded-filter');
			$('#options_content').empty();
		} else {
			filter.addClass('expanded-filter');
			options.filter_li();
		}
	
	})

	$('#filter').click(function(){
		
		toggleFilter();

	})

	$(document).mousemove(function(e){

      mousePos = [e.pageX, e.pageY]

   	});

	$('body').on('click', 'svg', function(ev){
		
		if ( !($(ev.target).is('circle')) ){
			
			hoverable = !hoverable;
			removePopup = !removePopup;

			$('.event-popup').remove();

			d3.select('.selected')
				.classed('selected', false);

			d3.selectAll('.not-connected')
				.classed('not-connected', false);

			d3.selectAll('.connected')
				.classed('connected', false);

			filterActive = false;

		}

	});

	$('body').on('click', '.contributor-name', function(ev){		
		
		ev.preventDefault();
		var targetName = $(ev.target).attr('class').split(" ")[1];

		// REFACTOR
		d3.selectAll('.context-container .recieved')[0].forEach(function(circle, i){		

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

	$('body').on('change', '#event_type_filter_drop', function(){

		var eventType = $('#event_type_filter_drop option:selected').val();
		console.log("eventtype is", eventType);
		addAttributeFilter[eventType]();

	})

	$('body').on('change', '.attribute-drop', function(){

		var eventType = $('#event_type_filter_drop option:selected').val()
			, eventAttribute = $('.attribute-drop option:selected').val()
			, attrVals = legislatorData["event_attributes"][eventType][eventAttribute]
			, valDrop = '<select class="attribute-value-drop">';
		valDrop += '<option>Select Value</option></select>';
		
		$('.attribute-value-drop').remove();
		$(valDrop).insertAfter('.attribute-drop');

		// attrVals = _.map(attrVals, function(n){ return Number(n) }).sort(function(a,b){return a-b})
		eventAttribute === "amount" ? attrVals = attrVals.sort(function(a,b){return a-b}) : attrVals = attrVals.sort();

		_.each( attrVals, function(val){
			$('.attribute-value-drop').append('<option value="' + val + '">' + val + '</option>');
		});

	});

	$('body').on('click', '#filter_button', function(){

		// REFACTOR: WILL NEED TO BE MODIFIED TO HANDLE MULTI QUERY
		// event types : array of event types
		// attributes : array of selected attributes
		// attribute values : array of attirubte values
		// operators : array of operators 
		// operands : array of operands
		
		//var toBeFiltered = data
		//each attribute, filter the resulting by the next filter
		// _.each(toBeFiltered, function(attr, i){
		// 		_.filter(toBeFiltered, function(data){
		// 			return data[attr] 
		// 		})
		// }) 

		window.attribute = $('#event_type_filter_drop').val(),
		window.attr = $('.attribute-drop option:selected').val(),
		window.attrVal = $('.attribute-value-drop option:selected').val()
		window.elements = $('.context-event')
		window.filterSelector = eventToSelectorMapping[attribute]

		d3.selectAll(filterSelector)[0].forEach(function(element, i){
		
			console.log("the element is", d3.select(element).data()[0] )

			var data = d3.select(element)[0][0].__data__,
				amount = Number(data.info.amount),
				el = d3.select(element)

			if ( data.info.hasOwnProperty(attr) ){
				if (data.info[attr] === attrVal ){
					console.log("got something connected")
					el.classed('connected', true)
				} else {
					el.classed('not-connected', true)
				}
			} else {
				el.classed('not-connected', true)
			}

		})

		filterActive = true
	})

	// $('body').on('click', '#change_legislator', function( ev ){

	// 	ev.preventDefault();

	// 	var test = [
	// 		{ label : "Chuck Grassley", value : "chuck_grassley.json" },
	// 		{ label : "John Boehner", value : "john_a_boehner.json" }
	// 	];

	// 	$('#top_bar').css({ height : '100%' });
	// 	$('#bio, #options_list').remove();

	// 	$('#legislator_input').css({ display : 'block'}).autocomplete({
	// 		source : test,
	// 		select : function( ev, ui ){
	// 			focus.selectAll('g').remove()
	// 			context.selectAll('g').remove()
	// 			update( ui.item.value, function(){ 		
	// 				$('#top_bar').css({ height : '40px' })
	// 				$('#legislator_input').hide()
	// 			});
	// 		}
	// 	});

	// });

});

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

	if ( filterActive ){

		d3.selectAll(filterSelector)[0].forEach(function(element, i){
		
			var data = d3.select(element)[0][0].__data__,
				amount = Number(data.info.amount),
				el = d3.select(element)

			if ( data.info.hasOwnProperty(attr) ){
				if (data.info[attr] === attrVal ){
					el.classed('connected', true)
				} else {
					el.classed('not-connected', true)	
				}
			} else {
				el.classed('not-connected', true)
			}

		})

	}


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
      .attr("class", function(d){
      		var class_ = "event"
      		d.depth !== 0 ? class_ += " recieved" : null
      		return class_
      })
      .style("stroke", "green")
		.on('mouseover', function(d){
			
			var el = d3.select(this),
				templateData = templateId(d),
				eventId = '#' + d.event_id,
				templateSelector = '#' + templateData[0],
				top = $(this).position().top - 50,
				left = $(this).position().left >= 800 ? $(this).position().left - 400 : 
														$(this).position().left + 50			

			if ( hoverable ){

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
				
			}

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
	  	.attr("transform", function(d) { return "translate(" + ( x(d.time * 1000) - 5 ) + ",35)"; })

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
}

function addBills( data ){

	data = _.filter(data, function(datum){ return datum.events[0].event_type === "sponsored_legislation" })
	data = _.map(data, function(ev){return ev.events[0]})	

	var event_ = focus.selectAll(".sponsored")
		.data(data)
	  .enter().append('svg:g')
	  	.attr('class', 'event shown')
	  	.attr("transform", function(d) { return "translate(" + x(d.time * 1000) + "," + 140 + ")"; })

	 event_.append('rect')
		.attr("width", 80)
		.attr("height", 20)
		.attr("class", "sponsored")
		.style("fill", "steelblue")
		.style("fill-opacity", .5)
		.style("stroke", "steelblue")
		.attr("transform", function(d) {
	         return "rotate(-135)" 
	     })

	event_.append('svg:line')
		.attr('x1', 0)
		.attr('x2', 0)
		.attr('y1', 0)
		.attr('y2', 400 )
		.style("stroke-opacity", 0)
		.style("stroke-width", 1)
		.style("stroke", "steelblue")

	event_.on('mouseover', function(d){

		var el = d3.select(this),
			templateData = templateId(d),
			eventId = '#' + d.event_id,
			templateSelector = '#' + templateData[0],
			top = $(this).position().top - 50,
			left = $(this).position().left >= 800 ? $(this).position().left - 400 : 
													$(this).position().left + 100			

		if ( hoverable && !(filterActive)){

			el.select('line').transition().style("stroke-opacity", 1)
			el.select('rect').transition().style("fill-opacity", 1)
			el.select('rect').transition().style("stroke-width", 3)

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
			
		}

	}).on('mouseout', function(d){
		
		var g = d3.select(this)

		g.select('line').transition().style("stroke-opacity", 0)
		g.select('rect').transition().style("stroke-width", 1)
		g.classed('hovered', false)
		removePopup ? $('.event-popup').remove() : null

	}).on('click', function(d){
	
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

function addContextBills( data ){

	data = _.filter(data, function(datum){ return datum.events[0].event_type === "sponsored_legislation" })
	data = _.map(data, function(ev){return ev.events[0]})	

	var event_ = context.selectAll(".context-sponsored")
		.data(data)
	  .enter().append('svg:g')
	  	.attr('class', 'context-event shown')
	  	.attr("transform", function(d) { return "translate(" + x(d.time * 1000) + ",-15)"; })

	 event_.append('rect')
		.attr("width", 8)
		.attr("height", 2)
		.attr("class", "context-sponsored")
		.style("fill", "steelblue")
		.style("fill-opacity", .5)
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
		.attr('y2', 40 )
		.style("stroke-opacity", 0)
		.style("stroke-width", 1)
		.style("stroke", "steelblue")
} 

function addCosponsored( data ) {

	data = _.filter(data, function(datum){ return datum.events[0].event_type === "bill_cosponsorship" })
	data = _.map(data, function(ev){return ev.events[0]})

	var event_ = focus.selectAll(".cosponsored")
		.data(data)
	  .enter().append('svg:g')
	  	.attr('class', 'event cosponsored')	
	  	.attr("transform", function(d) { return "translate(" + x(d.time * 1000) + "," + 240 + ")"; })

	 event_.append('rect')
		.attr("width", 80)
		.attr("height", 20)
		.attr("class", "cosponsored")
		.style("fill", "red")
		.style("fill-opacity", .5)
		.style("stroke", "red")
		.attr("transform", function(d) {
	         return "rotate(-135)" 
	     })

	event_.append('svg:line')
		.attr('x1', 0)
		.attr('x2', 0)
		.attr('y1', 0)
		.attr('y2', 300)
		.style("stroke-opacity", 0)
		.style("stroke-width", 1)
		.style("stroke", "red")

	event_.on('mouseover', function(d){

		var el = d3.select(this)
			, templateData = templateId(d)
			, eventId = '#' + d.event_id
			, templateSelector = '#' + templateData[0]
			, top = $(this).position().top - 50
			, left = $(this).position().left >= 800 ? $(this).position().left - 400 : 
													$(this).position().left + 100;	

		if ( hoverable && !(filterActive) ){

			console.log("filteractive is", filterActive)

			el.select('line').transition().style("stroke-opacity", 1)
			el.select('rect').transition().style("fill-opacity", 1)
			el.select('rect').transition().style("stroke-width", 3)

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
			
		} else {

			console.log("filteractive is", filterActive)

		}

	}).on('mouseout', function(d){
		
		var g = d3.select(this)

		g.select('line').transition().style("stroke-opacity", 0)
		g.select('rect').transition().style("stroke-width", 1)
		g.classed('hovered', false)
		removePopup ? $('.event-popup').remove() : null

	}).on('click', function(d){
	
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

	// event_.on('mouseover', function(d){

	// 	var el = d3.select(this)

	// 	el.select('line').transition().style("stroke-opacity", 1)
	// 	el.select('rect').transition().style("fill-opacity", 1)
	// 	el.select('rect').transition().style("stroke-width", 3)			

	// }).on('mouseout', function(d){
	// 	var g = d3.select(this)
	// 	g.select('line').transition().style("stroke-opacity", 0)
	// 	g.select('rect').transition().style("stroke-width", 1)

	// })

}

function addContextCosponsored ( data ){

	data = _.filter(data, function(datum){ return datum.events[0].event_type === "bill_cosponsorship" })
	data = _.map(data, function(ev){return ev.events[0]})

	var event_ = context.selectAll(".context-cosponsored")
		.data(data)
	  .enter().append('svg:g')
	  	.attr('class', 'context-event context-cosponsored')	
	  	.attr("transform", function(d) { return "translate(" + x(d.time * 1000) + ",0)"; })

	 event_.append('rect')
		.attr("width", 8)
		.attr("height", 2)
		.style("fill", "red")
		.style("fill-opacity", .5)
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
		.attr('y2', 300)
		.style("stroke-opacity", 0)
		.style("stroke-width", 1)
		.style("stroke", "red")
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


			if ( hoverable ){

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
				
			}

		})
		.on('mouseout', function(d){
		
			var g = d3.select(this)
			g.classed('hovered', false)

			removePopup ? $('.event-popup').remove() : null
		})

}

function addContextCommittee(){

	var event_ = context.selectAll(".context-committees")
		.data(committeeAssignments)
	  .enter().append('svg:g')
	  	.attr('class', 'context-event')	
	  	.attr("transform", function(d) { return "translate(" + x(d.time * 1000) + ",10)"; })

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

// REFACTOR: NOT NEEDED ANYMORE 
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

// REFACTOR: CHANGE SWITCH TO OBJECT 
function templateId (d){
	var data 
	// console.log("incoming data is", d)
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
				"committee" : d.info[14],
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




// REFACTOR: DEPRECATED
// function addContextCircles( data ) {

// 	console.log("the data is", data )

// 	var event_ = context.selectAll(".context-event")
// 		.data(data)
// 	  .enter().append('svg:g')
// 	  	.attr('class', 'context-event')
// 	  	.attr("transform", function(d) { return "translate(" + x(d.time * 1000) + ",75)"; })

// 	// append the shape 
// 	event_.append('g').selectAll("ev")
// 		.data(function(d){
// 			console.log("appending")
// 			return d.events
// 		})
// 		.enter().append('circle')
// 	  	.attr('cy', function(d, i){
// 	  		return -40 + (-2 * i)
// 	  	})
// 		.attr('class', function(d) { 
// 			return d.event.split(" ")[0] + ' ' + d.event_id + ' ' + 'context-circle'
// 		})
// 		.attr('r', 2 )
// 		.attr('cx', 0)
// 		.style('fill', function(d){
// 			switch(d.event) {
// 				case "sponsored legislation":
// 					return "steelblue"
// 					break;
// 				case "event/party":
// 					return "red"
// 					break;
// 				case "bill cosponsorship":
// 					return "blue"
// 					break
// 				case "start congressional term":
// 					return "green"
// 					break
// 				case "joined committee":
// 					return "purple"
// 					break
// 			}
// 		})

// }

function capitaliseFirstLetter(string){
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function getTimestamp(str) {
  var d = str.match(/\d+/g); // extract date parts
  return +new Date(d[0], d[1] - 1, d[2], d[3], d[4], d[5]); // build Date object
}


// REFACTOR: SHOULD BE OBJECT
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

});

// REFACTOR: CHANGE TO ALLOW FOR ALL EVENT TYPES
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

var eventToSelectorMapping = {
	"campaign_contribution" : ".recieved",
	"sponsored_legislation" : ".sponsored, .context-sponsored",
	"cosponsored_legislation" : ".cosponsored, .context-cosponsored",
	"committee" : ".committee"
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
		"title_without_number", "time",
		"crp_catname"
	]

var contributionAttributes = [ 
		"amount", "candidacy_status", "committee_ext_id",
		"committee_name", "committee_party", "contributor_address",
		"contributor_category", "contributor_category_name", "contributor_city",
		"contributor_category_industry", "contributor_category_order",
		"contributor_employer", "contributor_ext_id",
		"contributor_gender", "contributor_name",
		"contributor_occupation", "contributor_state", 
		"contributor_type", "contributor_zipcode",
		"cycle", "date", "district", "district_held",
		"filing_id", "is_amendment", "organization_ext_id",
		"organization_name", "parent_organization_ext_id",
		"parent_organization_name", "recipient_category", 
		"recipient_state_held", "recipient_type",
		"seat", "seat_held", "seat_result", "seat_status", 
		"transaction_id", "transaction_namespace", 
		"transaction_type", "transaction_type_description"
	]

// to get:
// all the tracontributor categories
