var HeadingModel = Backbone.Model.extend({
	
	defaults : {
		"name" : undefined
	},

	initialize: function() {
		this.on('change', function(){
			console.log('SOME SHIT CHANGED', this.toJSON())
		})
	}

})

var FilterModel = Backbone.Model.extend({

	defaults : {
		"industries" : []
	},

	initialize : function() {
		this.on('change', function(){
			console.log('SOME SHIT DONE CHANGED', this.toJSON())
		})
	}

})