var vows = require('vows')
  , assert = require('assert')
  , Tas10Object = require( __dirname + '/../../lib/props/tas10_object' );

vows.describe('Tas10Object').addBatch({

  "an object stays an object new({name: 'a'})": function(){
    var value = Tas10Object({name: 'a'});
    assert.typeOf( value, 'object' );
    assert.deepEqual( value, {name: 'a'} );
  },

  "nothing can be converted into an object new(2)": function(){
    assert.throws( function(){ Tas10Object(2) }, Error );
  }


}).export(module);