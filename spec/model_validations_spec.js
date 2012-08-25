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
Plain.schema( 'email', 'desc' );

vows.describe('Model Validations').addBatch({

	"define a new validation in Plain": {
	
		topic: function(){

			Plain.validates( 'presence', 'desc' );
			this.callback();

		},

		"Plain will now require for presence of desc": function(){
			Plain.new().runValidations( function( doc ){
				assert.deepEqual( doc.errors['desc'], ['required_field'] );
			})
		}

	}
}).addBatch({

	"define an email validation": {

		topic: function(){
			Plain.validates( 'presence', 'email' );
			Plain.validates( 'formatEmail', 'email' );
			this.callback();
		},

		"Plain will now require email to be a formatted email address": function(){
			Plain.new().runValidations( function( doc ){
				assert.deepEqual( doc.errors['email'], ['required_field', 'must_be_email'] );
			})
		}
	}

}).addBatch({

	"define a custom validation": {

		topic: function(){
			Plain.validates( function customValidation( next ){
				if( !( this.desc && this.desc.length < 3) )
					this.appendError( 'desc', 'must_be_less_than_3_characters');
				next()
			});
			this.callback();
		},

		"Plain will now require email to be a formatted email address": function(){
			Plain.new({desc: 'owietwet'}).runValidations( function( doc ){
				assert.deepEqual( doc.errors['desc'], ['must_be_less_than_3_characters'] );
			})
		}
	}

}).addBatch({

	"validations will pass if all criteria match": function(){
		Plain.new({name: 'p', email: 'email@localhost.loc', desc: 'ow'}).runValidations( function( doc ){
			assert.deepEqual( doc.errors, {} );
		})
	}
}).addBatch({

	"Soil does not have validations set as Plain has got set": function(){

		function Soil(){}
		Soil.inherits( Model );

		assert.equal( Plain.validations.length, 5 );
		assert.equal( Soil.validations.length, 1 );

	}

}).export(module);