var vows = require('vows')
  , assert = require('assert')

  , tas10core = require('../../index');

tas10core.connect('mongodb://localhost:27017/test_tas10core');

var Model = require('../../lib/model')
  , User = require('../../lib/models/user')
  , Group = require('../../lib/models/group')
  , Document = require('../../lib/models/document');

function Plain(){}
Plain.inherits( Model );
Plain.schema({a: {type: tas10core.propDefinitions.Tas10String, default: function(){ return 'a'} }} );

function Soil(){}
Soil.inherits( Model );

var docProps = { name: 'docA' }
  , uA, uB, uC
  , plainA, soilA;


vows.describe('Lookup with Document object').addBatch({

	"reset the documents collection to get an empty starting point": {

		topic: function(){ Document.drop( this.callback ); },

		"feedback processing": function( err, success ){
			assert.isTrue( success );
		},

		"documents collection is now empty": {

			topic: function(){ Document.query().count( this.callback ); },

			"is empty": function( err, docs ){
				assert.isEmpty( docs );
			}

		}

	}

}).addBatch({

	"create uAA": {

		topic: function(){ User.create({name: 'uAA', email: 'uAA@localhost.loc'}, this.callback ); },

		"uAA exists": function( err, user ){
			uA = user;
			assert.isNull( err );
			assert.instanceOf( user, User );
		}

	},

	"create plainA": {

		topic: function(){ Plain.create(uA, {name: 'plainA'}, this.callback ); },

		"plainA exists": function( err, doc ){
			plainA = doc;
			assert.isNull( err );
			assert.instanceOf( doc, Plain );
		}

	},

	"create soilA": {

		topic: function(){ Soil.create(uA, {name: 'soilA'}, this.callback ); },

		"soilA exists": function( err, doc ){
			soilA = doc;
			assert.isNull( err );
			assert.instanceOf( doc, Soil );
		}

	}
}).addBatch({

	"Soil has no schema value from Plain": function(){
		assert.equal( Plain.new().a, 'a' );
		assert.isUndefined( Soil.new().a )
	}

}).addBatch({

	"Finding all Soil documents": {

		topic: function(){ Soil.query().find( this.callback ); },

		"finds one document": function( err, docs ){
			assert.lengthOf( docs, 1 );
			assert.equal( docs[0].name, 'soilA' );
		}
	},

	"Finding all Plain documents": {

		topic: function(){ Plain.query().find( this.callback ); },

		"finds one document": function( err, docs ){
			assert.lengthOf( docs, 1 );
			assert.equal( docs[0].name, 'plainA' );
		}
	},

	"Finding all Documents": {

		topic: function(){ Document.query().find( this.callback ); },

		"finds two documents": function( err, docs ){
			assert.lengthOf( docs, 2 );
		}
	}

}).export(module);