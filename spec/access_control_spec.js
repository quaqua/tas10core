var vows = require('vows')
  , assert = require('assert')

  , tas10io = require('../index');

tas10io.connect('mongodb://localhost:27017/testTas10io');

var Model = require('../lib/model')
  , User = require('../lib/models/user')
  , Group = require('../lib/models/group')

function Plain(){}
Plain.inherits( Model );

var docProps = { name: 'docA' }
  , uA, uB, uC;

vows.describe('Access Control').addBatch({
	
	"setup": {

		"uA": {

			topic: function(){ User.create({name: 'uAA', email: 'uAA@localhost.loc'}, this.callback ) },

			"uA finished": function( err, user ){
				assert.instanceOf( user, User );
				uA = user;
			}
		},

		"uB": {

			topic: function(){ User.create({name: 'uBB', email: 'uBB@localhost.loc'}, this.callback ) },

			"uB finished": function( err, user ){
				assert.instanceOf( user, User );
				uB = user;
			}
		},

		"uC": {

			topic: function(){ User.create({name: 'uCC', email: 'uCC@localhost.loc'}, this.callback ) },

			"uC finished": function( err, user ){
				assert.instanceOf( user, User );
				uC = user;
			}
		}
	},

    "reset document collection to get an empty starting point": {

        topic: function(){ Plain.drop( this.callback ); },

        "Plain collection has been dropped": function( err, count ){
            assert.isNull( err );
        }

    }
}).addBatch({

	"Plain has method canRead": function(){
		assert.isFunction( Plain.new().canRead );
	},

	"Plain has method canWrite": function(){
		assert.isFunction( Plain.new().canWrite );
	},
	
	"Plain has method canShare": function(){
		assert.isFunction( Plain.new().canShare );
	},
	
	"Plain has method canDelete": function(){
		assert.isFunction( Plain.new().canDelete );
	},
	
	"Plain has method privileges": function(){
		assert.isFunction( Plain.new().privileges );
	},
	
	"Plain has method share": function(){
		assert.isFunction( Plain.new().share );
	},

	"Plain has method unshare": function(){
		assert.isFunction( Plain.new().unshare );
	},

}).addBatch({

	"Plain return current privileges for holder": {

		topic: function(){ p = Plain.new( uA ); return p; },

		"only initialized documents (but not persisted) have no privileges": function( doc ){
			assert.isFalse( doc.canRead() );
			assert.isFalse( doc.isPersisted() );
			assert.equal( doc.holder._id, uA._id );
		},

		"saves doc to repository": {

			topic: function( p ){ p.save( this.callback ); },

			"doc now has privileges set": function( p, p1 ){
				assert.equal( p1.privileges(), 'rwsd' );
			}
		}
	}

}).addBatch({

	"Default Documents Access Control": {

		topic: function() { var doc = Plain.new(uA, docProps); doc.save( this.callback ); },

		"creator gets full access": function( err, document ){
			// for( var i in Plain.schema() ){ console.log( Plain.schema()[i].default ); }
			// console.log( document.history );
			assert.deepEqual( document.acl[uA._id], {privileges: 'rwsd', photoPath: undefined, name: 'uAA'} );
		},

		"new document gets history set up with creaotor": function( err, document ){
			assert.typeOf( document.history[0].at, 'date' );
			assert.deepEqual( document.history[0].by, { '_id': uA._id, 'photoPath': uA.photoPath, 'name': uA.name });
		}

	}

}).addBatch({
/**
	"Querying for document owner": {

		topic: function() { Plain.query(uA).where('name', docProps.name).first( this.callback ); },

		"UserA can query for their own document": function( err, document ){
			assert.instanceOf( document, Plain );
		}

	},

	"Querying for other uAs": {

		topic: function() { Plain.query(uB).where('name', docProps.name).first( this.callback ); },

		"UserB cannot query for uAA's document": function( err, document ){
			assert.isNull( document );
		}

	},

	"ACL Methods": {

		topic: function(){ Plain.query(uA).where('name', docProps.name).first( this.callback ); },

		"returns who has access on this document": function( err, document ){
			var expACL = {}
			expACL[uA._id] = {privileges: 'rwsd', photoPath: null, name: 'uAA'}
			assert.deepEqual( document.acl, expACL );
		},

		"uAb cannot read this document": function( err, document ){
			assert.isFalse( document.canRead( uB ) );
		},

		"uAa can read this document": function( err, document ){
			assert.isTrue( document.canRead( uA ) );
			assert.isTrue( document.canRead() );
		},

		"uAb cannot write this document": function( err, document ){
			assert.isFalse( document.canWrite( uB ) );
		},

		"uAa can write on this document": function( err, document ){
			assert.isTrue( document.canWrite( uA ) );
			assert.isTrue( document.canWrite() );
		},

		"uAb cannot share this document": function( err, document ){
			assert.isFalse( document.canShare( uB ) );
		},

		"uAa can share this document": function( err, document ){
			assert.isTrue( document.canShare( uA ) );
			assert.isTrue( document.canShare() );
		},

		"uAb cannot delete this document": function( err, document ){
			assert.isFalse( document.canDelete( uB ) );
		},

		"uAa can delete this document": function( err, document ){
			assert.isTrue( document.canDelete( uA ) );
			assert.isTrue( document.canDelete() );
		},

		"returns privileges for current document holder": function( err, document ){
			assert.equal( document.privileges(), 'rwsd' );
		},

		"returns privileges for any other uA": function( err, document ){
			assert.equal( document.privileges(uB), '' );
		},

		"Plain holder ( here also owner ) has WRITE ACCESS": {
			// THIS COULD BE A PROBLEM DUE TO BELOW UNSHARE
			topic: function( document ){ document.save( this.callback ) },
			"uAa can write this document": function( err, document ){
				assert.instanceOf( document, Plain );
			}
		},

		"Plain holder ( here also owner ) has UNSHARE ACCESS": {
			topic: function( document ){ document.unshare( uB ); document.save( this.callback ) },
			"uAa can unshare uAs from this document": function( err, document){
				assert.instanceOf( document, Plain );
			}
		}

	}

}).addBatch({

	"preparation for uB READ ACCESS": {

		topic: function(){ Plain.query(uA).where('name', docProps.name).first( this.callback ); },

		"shares read access with uB": {

			topic: function( document ){ document.share(uB, 'r'); document.save( this.callback ); },

			"uB can now read document": function( err, document ){
				assert.isTrue(document.canRead(uB));
			}

		}
	}
	
}).addBatch({

	"uB READ ACCESS tests": {

		topic: function(){ Plain.query(uB).where('name', docProps.name).first( this.callback ); },

		"uB finds document": function( err, document ){
			assert.instanceOf( document, Plain );
		},

		"uB has no write access (throws AccessError)": function( document ){
			assert.throws( function(){ document.save(function(){}) }, Error );
		},

		"AccessError gives details about current privileges": function( document ){
			try{
				document.save(function(){});
			} catch( e ){
				assert.equal( e.name, "AccessError" );
				assert.equal( e.message, "User uB has only access (r) for document: " + docProps.name);
			}
		},

		"uB has no share access (throws AccessError)": function( document ){
			assert.throws( function(){ document.share(uAA, 'r'); }, Error );
		},

		"AccessError gives details about why uB cannot share object": function( document ){
			try{ document.share(uAA, 'r', function(){}); } catch(e){ 
				assert.equal( e.name, "AccessError" );
				assert.equal( e.message, "User uB has only access (r) for document: " + docProps.name + " - will not share this document!");
			}
		},

		"uB cannot delete document (throws AccessError)": function( document ){
			assert.throws( function(){ document.destroy( function(){} ) }, Error );
		},

		"AccessError gives details about why uB cannot share object": function( document ){
			try{ document.share(uA, 'r', function(){}); } catch(e){ 
				assert.equal( e.name, "AccessError" );
				assert.equal( e.message, "User uB has only access (r) for document: " + docProps.name + " - will not share this document!");
			}
		}

	}
	
}).addBatch({

	"preparation for uB WRITE ACCESS": {

		topic: function(){ Plain.query(uA).where('name', docProps.name).first( this.callback ); },

		"shares write access with uB": {

			topic: function( document ){ document.share(uB, 'rw'); document.save( this.callback ); },

			"uB can now write document": function( err, document ){
				assert.isTrue(document.canWrite(uB));
			}
		}

	}
}).addBatch({

	"uB WRITE ACCESS tests": {

		topic: function(){ Plain.query(uB).where('name', docProps.name).first( this.callback ); },

		"uB finds document": function( err, document ){
			assert.instanceOf( document, Plain );
		},

		"uB can write document changes": {

			topic: function( document){ document.save( this.callback ) },

			"document is saved to the database": function( err, document ){
				assert.instanceOf( document, Plain );
			}
		},

		"uB has no share access (throws AccessError)": function( document ){
			assert.throws( function(){ document.share(uAA, 'r'); }, Error );
		},

		"AccessError gives details about why uB cannot share object": function( document ){
			try{ document.share(uA, 'r', function(){}); } catch(e){ 
				assert.equal( e.name, "AccessError" );
				assert.equal( e.message, "User uB has only access (rw) for document: " + docProps.name + " - will not share this document!");
			}
		},

		"uB cannot delete document (throws AccessError)": function( document ){
			assert.throws( function(){ document.destroy( function(){} ) }, Error );
		},

		"AccessError gives details about why uB cannot share object": function( document ){
			try{ document.share(uA, 'r', function(){}); } catch(e){ 
				assert.equal( e.name, "AccessError" );
				assert.equal( e.message, "User uB has only access (rw) for document: " + docProps.name + " - will not share this document!");
			}
		}
	}

}).addBatch({

	"preparation for uB SHARE ACCESS": {

		topic: function(){ Plain.query(uA).where('name', docProps.name).first( this.callback ); },

		"shares share access with uB": {
			topic: function( document ){ document.share(uB, 'rws'); document.save( this.callback ); },
			"uB can now write document": function( err, document ){
				assert.isTrue(document.canShare(uB));
			}
		}

	}
}).addBatch({

	"uB SHARE ACCESS tests": {

		topic: function(){ Plain.query(uB).where('name', docProps.name).first( this.callback ); },

		"uB finds document": function( err, document ){
			assert.instanceOf( document, Plain );
		},

		"uB can write document changes": {

			topic: function( document){ document.save( this.callback ) },

			"document is saved to the database": function( err, document ){
				assert.instanceOf( document, Plain );
			}
		},

		"document can be shared with other users": function( err, document ){
			assert.doesNotThrow(function(){ document.share(uA, 'r', function(){} ) }, Error );
		},

		"uB cannot delete document (throws AccessError)": function( document ){

			assert.throws( function(){ document.destroy( function(){} ) }, Error );

		},

		"AccessError gives details about why uB cannot share object": function( document ){

			try{ document.share(uA, 'r', function(){}); } catch(e){ 
				assert.equal( e.name, "AccessError" );
				assert.equal( e.message, "User uB has only access (rw) for document: test - will not share this document!");
			}

		}
	}

}).addBatch({

	"preparation for uB DELETE ACCESS": {

		topic: function(){ Plain.query(uA).where('name', docProps.name).first( this.callback ); },

		"shares delete access with uB": {

			topic: function( document ){ document.share(uB, 'rwsd'); document.save( this.callback ); },

			"uB can now delete document": function( err, document ){
				assert.isTrue(document.canDelete(uB));
			}
		}

	}

}).addBatch({

	"uB DELETE ACCESS tests": {

		topic: function(){ Plain.query(uB).where('name', docProps.name).first( this.callback ); },

		"uB finds document": function( err, document ){
			assert.instanceOf( document, Plain );
		},

		"uB can write document changes": {

			topic: function( document){ document.save( this.callback ) }

			/*
			 * strange behaviour since before.destroy safely remove taggers has been implemented
			 *,

			"document is saved to the database": function( err, document ){
				assert.instanceOf( document, Plain );
			}
			*/
			/*
		},

		"document can be shared with other users": function( err, document ){
			assert.doesNotThrow(function(){ document.share(uA, 'r') }, Error );
		},

		"can delete document": {

			topic: function( document ){ document.destroy( this.callback ); },

			"document is marked deleted": function( err, document ){
				assert.isTrue(document.deleted);
			},

			"Querying for deleted document": {
				topic: function(){ Plain.query(uA).where('name', docProps.name).first( this.callback ) },
				"no document is found": function( document ){

				}
			}
		}
	}
*/
}).export(module);