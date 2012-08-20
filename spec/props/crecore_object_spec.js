var vows = require('vows')
  , assert = require('assert')
  , CreioObject = require( __dirname + '/../../lib/props/creio_object' );

vows.describe('CreioObject').addBatch({

  "an object stays an object new({name: 'a'})": function(){
    var value = CreioObject.new({name: 'a'});
    assert.typeOf( value.getValue(), 'object' );
    assert.deepEqual( value.getValue(), {name: 'a'} );
  },

  "nothing can be converted into an object new(2)": function(){
    assert.throws( function(){ CreioObject.new(2) }, Error );
  }


}).export(module);