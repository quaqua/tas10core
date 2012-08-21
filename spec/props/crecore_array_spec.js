var vows = require('vows')
  , assert = require('assert')
  , Tas10Array = require( __dirname + '/../../lib/props/tas10_array' );

vows.describe('Tas10Array').addBatch({

  "an array stays an array new([1,2])": function(){
    var value = Tas10Array.new([1,2]);
    assert.typeOf( value.getValue(), 'array' );
    assert.deepEqual( value.getValue(), [1,2] );
  },

  "a string gets casted into an array new('1,2')": function(){
    var value = Tas10Array.new('1,2');
    assert.typeOf( value.getValue(), 'array' );
    assert.deepEqual( value.getValue(), [1,2] );
  },

  "an object cannot be casted into an array new({})": function(){
    assert.throws( function(){ Tas10Array.new({}) }, Error );
  }


}).export(module);