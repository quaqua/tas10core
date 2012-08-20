var vows = require('vows')
  , assert = require('assert')
  , CrecoreBoolean = require( __dirname + '/../../lib/props/crecore_boolean' );

vows.describe('CrecoreBoolean').addBatch({

  "a boolean stays a boolean new(true)": function(){
    var value = CrecoreBoolean.new( true );
    assert.typeOf( value.getValue(), 'boolean' );
    assert.equal( value.getValue(), true );
  },

  "a string will be casted into a boolean if /true|t|TRUE|T/": function(){
    var value = CrecoreBoolean.new( "true" );
    assert.typeOf( value.getValue(), 'boolean' );
    assert.equal( value.getValue(), true );
  }

}).export(module);