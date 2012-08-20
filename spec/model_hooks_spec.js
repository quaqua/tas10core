/* 
 * tas10core by TASTENWERK
 * author: thorsten.zerha@tastenwerk.com
 *
 * copyright (2012) by TASTENWERK e.U.
 * 
 * http://www.tastenwerk.com/tas10core
 * 
 */

var vows = require('vows')
  , assert = require('assert')
  , Model = require( __dirname + '/../lib/model' );

function Plain(){}
Plain.inherits( Model );

vows.describe('Model Hooks').addBatch({

	"define a new hook in Plain": {
	
		topic: function(){

			Plain.before( 'destroy', function( next ){
				this.name = 'destroyed';
				next();
			});

			this.callback();

		},

		"Plain now has a before destroy hook defined": function(){
			assert.lengthOf( Plain.hooks.before.destroy, 1 );
		},

		"Plain gets a new name when runHooks is invoked": function(){
			Plain.new().runHooks( 'before', 'destroy', function( doc ){
				assert.equal(doc.name, 'destroyed');
			})
		}

	}
}).addBatch({

	"append another destroy hook that changes the name again": {

		topic: function(){
			Plain.before( 'destroy', function( next ){
				this.name = this.name + '2';
				next();
			});
			this.callback();
		},

		"Plain now has two before hooks defined": function(){
			assert.lengthOf( Plain.hooks.before.destroy, 2 );
		},

		"Plain gets name modified 2 times": function(){
			Plain.new().runHooks( 'before', 'destroy', function( doc ){
				assert.equal(doc.name, 'destroyed2');
			})
		}
	}

}).export(module);