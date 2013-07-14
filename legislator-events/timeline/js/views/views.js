var FilterView = Backbone.View.extend({

	initialize : function() {
		this.render()
		$('#filter_container').hide()
		this.model.bind('change', this.render, this);
	},

	render : function() {
		var source = $('#filter').html()
			, template = Handlebars.compile( source )
			, model = this.model.toJSON();

		$('#filter_container').html( template(model) );
	},

	events : {
		'click #filter_img' : 'toggleFilter',
		'click #industry_filter_button' : 'filterIndustry'
		// 'click body' : 'removeFilter'
	},

	toggleFilter : function() {
		console.log("toggling")
		var filter = this.$el;

		if ( filter.hasClass('expanded-filter') ){
			filter.removeClass('expanded-filter');
			$('#options_content').hide();
		} else {
			filter.addClass('expanded-filter');
			// options.filter_li();
			$('#options_content').show();
		}
	},

	//REFACTORRRR!
	filterIndustry : function() {

		var attrVal = $('#industry_drop option:selected').val()
		hoverable = true
		
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

		filterActive = true

	},

	removeFilter : function() {
		console.log('trying to filter')
		if ( filterActive ){
			console.log('removing filter')
			d3.select('.selected')
				.classed('selected', false);

			d3.selectAll('.not-connected')
				.classed('not-connected', false);

			d3.selectAll('.connected')
				.classed('connected', false);

			filterActive = false;
		}
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
		{ label : "Chuck Grassley", value : "data/chuck_grassley.json" },
		{ label : "John Boehner", value : "data/john_a_boehner.json" },
		{ label : "David Vitter", value : "data/david_vitter.json" },
		{ label : "Jeff Sessions", value : "data/jeff_sessions.json" },
		{ label : "Jeff Flake", value : "data/jeff_flake.json" },
		{ label : "Nancy Pelosi", value : "data/nancy_pelosi.json" },
		{ label : "John McCain", value : "data/john_mccain.json" },
		{ label : "Barbara Boxer", value : "data/barbara_boxer.json" },
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
			$('#info, #filter_container, .event-labels').show()
			this.$el.find('#hgroup').hide()

		} else {
			$('#info, #filter_container, .event-labels').hide()
			this.$el.find('#hgroup').show()
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
		"click #whiteout" : "removePopup"
	},

	removePopup : function() {
		$('#whiteout, .event-popup').remove();
		removePopup = true;
	}

});

// REFACTOR: CHANGE TO ALLOW FOR ALL EVENT TYPES
var ExpandedView = Backbone.View.extend({
	
	templateIds : {
		'recieved_campaign_contribution' : '#campaign_contribution_details',
		'speech' : '#speech_details',
		'vote' : '#vote_details',
		'sponsored' : '#sponsored_details',
		'cosponsored' : '#cosponsored_details'
	},

	initialize : function(){		
		$('#popup_content_container').empty()
		this.render()
	},

	render : function(){
		var templateSelector = this.templateIds[this.model.event_type]
			, source = $(templateSelector).html()
			, template = Handlebars.compile( source );

		$('body').append('<div id="whiteout"</div>')
		this.$el.html( template( this.model.info ))
	},

	events : {}

})


		// if ( this.model.event_type === "received_campaign_contribution" ) {
		// 	var source = $('#campaign_contribution_details').html(),
		// 		template = Handlebars.compile( source )
			
			// if ( this.model.info.contributor_type === "C" ){
			// 	this.model.info.contribotor_type = "Corporate"
			// } else {
			// 	this.model.info.contributor_type = "Individual"
			// 	this.model.info.contributor_name = fixContributorName(this.model.info.contributor_name)
			// 	this.model.info.contributor_string = this.model.info.contributor_name.replace(/ /g, "")
			// }
		// } else {
		// 	var source = $('#speech_details').html(),
		// 		template = Handlebars.compile( source )
		// }
