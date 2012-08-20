var vows = require('vows')
  , assert = require('assert')
  , Model = require( __dirname + '/../lib/model' )

var CrecoreString = require( __dirname + '/../lib/props/crecore_string' )
  , CrecoreInt = require( __dirname + '/../lib/props/crecore_int' )
  , CrecoreArray = require( __dirname + '/../lib/props/crecore_array' )
  , CrecoreObject = require( __dirname + '/../lib/props/crecore_object' )
  , CrecoreDateTime = require( __dirname + '/../lib/props/crecore_datetime' )
  , CrecoreBoolean = require( __dirname + '/../lib/props/crecore_boolean' );

vows.describe('Model inheritance').addBatch({

  "a model can be inherited": {

    topic: function(){ function Plain(){}; Plain.inherits( Model ); return Plain; },

    "Plain has a schema property": function( Plain ){
      assert.isFunction( Plain.schema );
    },

    "instance of Plain has a props property": function( Plain ){
      assert.isObject( Plain.new().props );
    },

    "Plain with no args gets baseSchema set anyway": {

      "name": function( Plain ){
        assert.isObject( Plain.new().props.name );
        assert.instanceOf( Plain.new().props.name, CrecoreString );
      },

      "className": function( Plain ){
        assert.isObject( Plain.new().props.className );
        assert.instanceOf( Plain.new().props.className, CrecoreString );
      },

      "acl": function( Plain ){
        assert.isObject( Plain.new().props.acl );
        assert.instanceOf( Plain.new().props.acl, CrecoreObject );
      },

      "labels": function( Plain ){
        assert.isObject( Plain.new().props.labels );
        assert.instanceOf( Plain.new().props.labels, CrecoreArray );
      },

      "history": function( Plain ){
        assert.isObject( Plain.new().props.history );
        assert.instanceOf( Plain.new().props.history, CrecoreArray );
      }

    },

    "baseSchema properties are 'protected'": function( Plain ){
      assert.throws( function(){ Plain.schema({ acl: {type: CrecoreString} }); }, Error );
    },

    "className of Plain is 'Plain'": function( Plain ){
      assert.equal( Plain.new().className, 'Plain' );
    }

  }
  
}).export(module);