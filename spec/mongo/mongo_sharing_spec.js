var vows = require('vows')
  , assert = require('assert')

  , tas10io = require('../../index');

tas10io.connect('mongodb://localhost:27017/testTas10io');

var Model = require('../../lib/model')
  , User = require('../../lib/models/user')
  , Group = require('../../lib/models/group')

function Plain(){}
Plain.inherits( Model );

var docProps = { name: 'docA' }
  , uA, uB, uC
  , docA, docB, docC;


vows.describe('Deep Document sharing with user stored objects').addBatch({

	"reset the documents collection to get an empty starting point": function(){

		Plain.destroy( function(){} );
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

	"create uB": {

		topic: function(){ User.create({name: 'uB', email: 'uB@localhost.loc'}, this.callback ); },

		"uB exists": function( err, user ){
			uB = user;
			assert.isNull( err );
			assert.instanceOf( user, User );
		}

	},

	"create uAC": {

		topic: function(){ User.create({name: 'uAC', email: 'uAC@localhost.loc'}, this.callback ); },

		"uB exists": function( err, user ){
			uC = user;
			assert.isNull( err );
			assert.instanceOf( user, User );
		}

	}

}).addBatch({

	"Setup and label Plain A -> B -> C ": {

		"Setup A": {

			topic: function() { Plain.create(uA, {name: 'a', taggable: true}, this.callback ); },

			"Plain A has been created": function( err, doc ){
				docA = doc;
				assert.instanceOf( doc, Plain );
			},

			"Setup B": {

				topic: function() { Plain.create(uA, {name: 'b', label_ids: [ docA._id ], taggable: true }, this.callback ); },

				"Plain B has been created and is tagged with docA": function( err, doc ){
					assert.deepEqual( doc.label_ids, [ docA._id ] );
					docB = doc;
				},

				"Setup C": {

					topic: function(){ Plain.create(uA, {name: 'c', label_ids: [ docB._id ], taggable: true }, this.callback ); },

					"Plain C has been created and is tagged with docB": function( err, doc ){
						assert.deepEqual( doc.label_ids, [ docB._id ] );
						docC = doc;
					}
				}
			}
		}
	}

}).addBatch({

	"uB has no access on doc{A,B,C} (held by uAA)": function(){
		assert.isFalse( docA.canRead(uB) );
		assert.isFalse( docB.canRead(uB) );
		assert.isFalse( docC.canRead(uB) );
	},

	"uB cannot load docA": {
		topic: function(){ Plain.query(uB).where('name', 'A').first( this.callback ); },
		"null is returned for docA query": function( err, doc ){
			assert.isNull( doc );
		}
	}

}).addBatch({

	"userA shares docA with uB":{

		topic: function(){ docA.share( uB, 'rw' ); docA.save( this.callback ); },

		"uB can now read docA": function( err, doc ){
			assert.isTrue( doc.canRead( uB ) );
		},

		"uB can now load docA": {

			topic: function(){ Plain.query( uB ).where('name', 'a').first( this.callback ); },

			"uB gets docA loaded": function( err, doc ){
				assert.equal( doc._id.toString(), docA._id.toString() );
			}

		},

		"uB can also load docB": {

			topic: function(){ Plain.query( uB ).where('name', 'b' ).first( this.callback ); },

			"uB gets docB loaded": function( err, doc ){
				assert.equal( doc._id.toString(), docB._id.toString() );
			}

		},

		"uB can also load docC": {

			topic: function(){ Plain.query( uB ).where('name', 'c' ).first( this.callback ); },

			"uB gets docC loaded": function( err, doc ){
				assert.equal( doc._id.toString(), docC._id.toString() );
			}

		}
	}

}).addBatch({

	"new documents underneath acl will inherit acl from label_ids": {

		topic: function(){ Plain.create( uA, {name: 'd', label_ids: [ docA._id ] }, this.callback ); },

		"Plain d has been created and labeled with A": function(err, doc ){
			assert.instanceOf( doc, Plain );
			assert.equal( doc.label_ids[0].toString(), docA._id.toString() );
		},

		"ACLs for Plain D have been inherited": function( err, doc ){
			var keys = []; for( var i in doc.acl ){ keys.push(i); }
			assert.lengthOf( keys, 2 );
		}
	}
	
}).export(module);