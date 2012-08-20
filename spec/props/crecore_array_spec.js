var vows = require('vows')
  , assert = require('assert')
  , CrecoreArray = require( __dirname + '/../../lib/props/crecore_array' );

vows.describe('CrecoreArray').addBatch({

  "an array stays an array new([1,2])": function(){
    var value = CrecoreArray.new([1,2]);
    assert.typeOf( value.getValue(), 'array' );
    assert.deepEqual( value.getValue(), [1,2] );
  },

  "a string gets casted into an array new('1,2')": function(){
    var value = CrecoreArray.new('1,2');
    assert.typeOf( value.getValue(), 'array' );
    assert.deepEqual( value.getValue(), [1,2] );
  },

  "an object cannot be casted into an array new({})": function(){
    assert.throws( function(){ CrecoreArray.new({}) }, Error );
  }


}).export(module);