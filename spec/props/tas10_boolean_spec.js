var vows = require('vows')
  , assert = require('assert')
  , Tas10Boolean = require( __dirname + '/../../lib/props/tas10_boolean' );

vows.describe('Tas10Boolean').addBatch({

  "a boolean stays a boolean new(true)": function(){
    var value = Tas10Boolean( true );
    assert.typeOf( value, 'boolean' );
    assert.equal( value, true );
  },

  "a string will be casted into a boolean if /true|t|TRUE|T/": function(){
    var value = Tas10Boolean( "true" );
    assert.typeOf( value, 'boolean' );
    assert.equal( value, true );
  }

}).export(module);