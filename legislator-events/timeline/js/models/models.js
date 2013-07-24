var HeadingModel = Backbone.Model.extend({
	
	defaults : {
		"name" : undefined
	},

	initialize: function() {
		this.on('change', function(){
			
		})
	}

})

var FilterModel = Backbone.Model.extend({

	defaults : {
		"industries" : []
	},

	initialize : function() {
		this.on('change', function(){
			
		})
	}

})