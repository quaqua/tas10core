var vows = require('vows')
  , assert = require('assert')
  , CrecoreInt = require( __dirname + '/../../lib/props/crecore_int' );

vows.describe('CrecoreInt').addBatch({

  "a number stays a number new(2)": function(){
    var value = CrecoreInt.new(2);
    assert.typeOf( value.getValue(), 'number' );
  },

  "a string gets casted into a number new('2')": function(){
    var value = CrecoreInt.new('2');
    assert.typeOf( value.getValue(), 'number' );
  },

  "an object cannot be casted into a number new({})": function(){
    assert.throws( function(){ CrecoreInt.new({}) }, Error );
  }

}).export(module);