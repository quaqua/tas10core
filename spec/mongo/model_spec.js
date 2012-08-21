var vows = require('vows')
  , assert = require('assert')
  , tas10io = require('../../index')
  , Model = require('../../lib/model');

tas10io.connect('mongodb://localhost:27017/testTas10io');

var Plain = function Plain(){}
Plain.inherits( Model );

vows.describe('Mongo basics').addBatch({

	"Drops the whole test collection in order to have a clean start": {
		topic: function(){ Plain.drop( this.callback ); },
		"done": function( err, success ){
			assert.isTrue( success );
		}
	}
}).addBatch({

	"Plain Document has a collectionName": function(){
		assert.equal( Plain.collectionName(), 'plains' );
	},

	"Plain Document has an open collection": function(){
		assert.equal( Plain.collection().collectionName, 'plains' );
	},

	"Plain Document can look up for any matches in the repository": {

		topic: function(){ Plain.query().find( this.callback ); },

		"and won't find any": function( err, callback ){
			assert.isNull( err );
			assert.isEmpty( callback );
		}

	},

	"Plain Document can look up and count the occurrences in the repository": {

		topic: function(){ Plain.query().count( this.callback ); },

		"and will find 0 occurrences": function( err, count ){
			assert.isNull( err );
			assert.equal( count, 0 );
		}
	},

	"Plain Document can add index": {

		"lists indexes": {
			topic: function(){ Plain.listIndexes( this.callback ); },
			"no index by default": function( err, indexes ){
				assert.deepEqual( indexes, {} );
			},
			"adds an index": {
				topic: function(){ Plain.ensureIndex( [ 'name' ], this.callback ) },
				"index has been added": function( err, index ){
					assert.isNull( err );
					assert.equal( index, 'name_1' );
				},

				"index is listed": {
					topic: function(){ Plain.listIndexes( this.callback ); },
					"name_1 as index": function( err, indexes ){
						assert.deepEqual( indexes, { _id_: [[ '_id', 1 ]], name_1: [ [ 'name', 1 ] ] } );
					}
				}
			}
		}
	}

}).export(module);