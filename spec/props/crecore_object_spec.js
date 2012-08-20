var vows = require('vows')
  , assert = require('assert')
  , CrecoreObject = require( __dirname + '/../../lib/props/crecore_object' );

vows.describe('CrecoreObject').addBatch({

  "an object stays an object new({name: 'a'})": function(){
    var value = CrecoreObject.new({name: 'a'});
    assert.typeOf( value.getValue(), 'object' );
    assert.deepEqual( value.getValue(), {name: 'a'} );
  },

  "nothing can be converted into an object new(2)": function(){
    assert.throws( function(){ CrecoreObject.new(2) }, Error );
  }


}).export(module);