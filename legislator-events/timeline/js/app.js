$(document).ready(function(){
	
	window.removePopup = true;
	window.hoverable = true;
	window.mousePos = undefined;
	window.filterActive = false;
	window.filterModel = new FilterModel();
	
	var headingModel = new HeadingModel()
		, headingView = new HeadingView({
			el : '#top_bar',
			model : headingModel
		})
		, filterView = new FilterView({
			el : '#filter_container',
			model : filterModel
		});

	$(document).mousemove(function(e){
      mousePos = [e.pageX, e.pageY]
   	});

	// remove filter on body click
	$('body').on('click', 'svg', function(ev){
		var isEvent = d3.select(ev.target).classed('event')
		if ( filterActive && !(isEvent) ) removeFilter()
	});

	// $('body').on('click', '.contributor-name', function(ev){		
	// 	ev.preventDefault();
	// 	var targetName = $(ev.target).attr('class').split(" ")[1];

	// 	// REFACTOR
	// 	d3.selectAll('.context-container .recieved')[0].forEach(function(circle, i){		

	// 		var data = d3.select(circle)[0][0].__data__,
	// 			stripped = data.info.contributor_name.replace(/ /g, ""),
	// 			el = d3.select(circle)

	// 		if ( stripped !== targetName ){
	// 			el.classed('not-connected', true)
	// 		} else {
	// 			console.log("the stripped name is", stripped)
	// 			console.log("the target name is", targetName)
	// 			el.classed('connected', true)
	// 			el.attr('r', function(){
	// 				return d3.select(this).attr('r') * 5
	// 			})
	// 			console.log(data)
	// 		}

	// 	})
	// })

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

});