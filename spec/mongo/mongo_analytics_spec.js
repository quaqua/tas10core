var vows = require('vows')
  , assert = require('assert')
  , tas10core = require('../../index');

tas10core.connect('mongodb://localhost:27017/test_tas10core');

var Analytics = require( '../../lib/analytics' );

vows.describe('Analytics - logging webpage or similar traffic').addBatch({

  "reset analytics for test": function(){

    Analytics.destroy( function(){} );

  }

}).addBatch({

  "get logs for this year (returns 0)": {

    topic: function(){ Analytics.query().where('at')
    							.gt(new Date('2012-01-01'))
    							.lt(new Date()).find( this.callback ); },

    "0 documents are in the database (due to previous reset": function( err, res ){
      assert.lengthOf( res, 0 );
    }

  }
}).addBatch({

	"inserting log entries": {
		topic: function(){ Analytics.insert({ page_id: '123', ip: '0.0.0.0' }, this.callback ) },

		"new record has been inserted": function( err, doc ){
			assert.typeOf( doc._id, 'object' );
		}
	}
}).addBatch({

  "retreiving analytics": {
    topic: function(){ Analytics.query().first( this.callback )},

    "one analytics entry is found": function( err, doc ){
      console.log(doc);
      assert.typeOf( doc.pages['123'], 'object' );
    }
  }

}).export(module);