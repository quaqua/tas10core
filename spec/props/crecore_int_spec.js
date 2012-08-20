var vows = require('vows')
  , assert = require('assert')
  , CreioInt = require( __dirname + '/../../lib/props/creio_int' );

vows.describe('CreioInt').addBatch({

  "a number stays a number new(2)": function(){
    var value = CreioInt.new(2);
    assert.typeOf( value.getValue(), 'number' );
  },

  "a string gets casted into a number new('2')": function(){
    var value = CreioInt.new('2');
    assert.typeOf( value.getValue(), 'number' );
  },

  "an object cannot be casted into a number new({})": function(){
    assert.throws( function(){ CreioInt.new({}) }, Error );
  }

}).export(module);