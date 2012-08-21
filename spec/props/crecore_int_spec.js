var vows = require('vows')
  , assert = require('assert')
  , Tas10Int = require( __dirname + '/../../lib/props/tas10_int' );

vows.describe('Tas10Int').addBatch({

  "a number stays a number new(2)": function(){
    var value = Tas10Int.new(2);
    assert.typeOf( value.getValue(), 'number' );
  },

  "a string gets casted into a number new('2')": function(){
    var value = Tas10Int.new('2');
    assert.typeOf( value.getValue(), 'number' );
  },

  "an object cannot be casted into a number new({})": function(){
    assert.throws( function(){ Tas10Int.new({}) }, Error );
  }

}).export(module);