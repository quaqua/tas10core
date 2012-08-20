var vows = require('vows')
  , assert = require('assert')
  , Model = require( __dirname + '/../lib/model' )
  , ObjectId = require('mongodb').BSONPure.ObjectID;

vows.describe('Model').addBatch({

	"has a constructor which can be called with": {
    "no arguments": function(){
      var m = Model.new();
      assert.instanceOf( m, Model );
    },
    "property object as one argument": function(){
      var m = Model.new( {name: 'test'} );
      assert.instanceOf( m, Model );
      assert.equal( m.name, 'test' );
    }
  }
  
}).export(module);