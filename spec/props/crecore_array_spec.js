var vows = require('vows')
  , assert = require('assert')
  , CreioArray = require( __dirname + '/../../lib/props/creio_array' );

vows.describe('CreioArray').addBatch({

  "an array stays an array new([1,2])": function(){
    var value = CreioArray.new([1,2]);
    assert.typeOf( value.getValue(), 'array' );
    assert.deepEqual( value.getValue(), [1,2] );
  },

  "a string gets casted into an array new('1,2')": function(){
    var value = CreioArray.new('1,2');
    assert.typeOf( value.getValue(), 'array' );
    assert.deepEqual( value.getValue(), [1,2] );
  },

  "an object cannot be casted into an array new({})": function(){
    assert.throws( function(){ CreioArray.new({}) }, Error );
  }


}).export(module);