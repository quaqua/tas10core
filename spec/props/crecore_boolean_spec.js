var vows = require('vows')
  , assert = require('assert')
  , CreioBoolean = require( __dirname + '/../../lib/props/creio_boolean' );

vows.describe('CreioBoolean').addBatch({

  "a boolean stays a boolean new(true)": function(){
    var value = CreioBoolean.new( true );
    assert.typeOf( value.getValue(), 'boolean' );
    assert.equal( value.getValue(), true );
  },

  "a string will be casted into a boolean if /true|t|TRUE|T/": function(){
    var value = CreioBoolean.new( "true" );
    assert.typeOf( value.getValue(), 'boolean' );
    assert.equal( value.getValue(), true );
  }

}).export(module);