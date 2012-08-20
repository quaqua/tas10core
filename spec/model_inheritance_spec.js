var vows = require('vows')
  , assert = require('assert')
  , Model = require( __dirname + '/../lib/model' )

var CreioString = require( __dirname + '/../lib/props/creio_string' )
  , CreioInt = require( __dirname + '/../lib/props/creio_int' )
  , CreioArray = require( __dirname + '/../lib/props/creio_array' )
  , CreioObject = require( __dirname + '/../lib/props/creio_object' )
  , CreioDateTime = require( __dirname + '/../lib/props/creio_datetime' )
  , CreioBoolean = require( __dirname + '/../lib/props/creio_boolean' );

vows.describe('Model inheritance').addBatch({

  "a model can be inherited": {

    topic: function(){ function Plain(){}; Plain.inherits( Model ); return Plain; },

    "Plain has a schema property": function( Plain ){
      assert.isFunction( Plain.schema );
    },

    "instance of Plain has a props property": function( Plain ){
      assert.isObject( Plain.new()._props );
    },

    "Plain with no args gets baseSchema set anyway": {

      "name": function( Plain ){
        assert.isObject( Plain.new()._props.name );
        assert.instanceOf( Plain.new()._props.name, CreioString );
      },

      "className": function( Plain ){
        assert.isObject( Plain.new()._props.className );
        assert.instanceOf( Plain.new()._props.className, CreioString );
      },

      "acl": function( Plain ){
        assert.isObject( Plain.new()._props.acl );
        assert.instanceOf( Plain.new()._props.acl, CreioObject );
      },

      "labels": function( Plain ){
        assert.isObject( Plain.new()._props.labels );
        assert.instanceOf( Plain.new()._props.labels, CreioArray );
      },

      "history": function( Plain ){
        assert.isObject( Plain.new()._props.history );
        assert.instanceOf( Plain.new()._props.history, CreioArray );
      }

    },

    "Plain can define custom properties": {

      "CreioString property": function( Plain ){
        Plain.schema('description');
        assert.isObject( Plain.schema().description );
        assert.isUndefined( Plain.new().description ); // due we did not set a default value
      },

      "CreioString property explicitely declaration": function( Plain ){
        Plain.schema({ desc2: CreioString });
        assert.isObject( Plain.schema().desc2 );
        assert.isUndefined( Plain.new().desc2 ); // due we did not set a default value
      },

      "CreioString property with options": function( Plain ){
        Plain.schema({ desc3: { type: CreioString, default: 'description' }});
        assert.isObject( Plain.schema().desc3 );
        assert.isString( Plain.new().desc3 );
      }

    },

    "baseSchema properties are 'protected'": function( Plain ){
      assert.throws( function(){ Plain.schema({ acl: {type: CreioString} }); }, Error );
    },

    "className of Plain is 'Plain'": function( Plain ){
      assert.equal( Plain.new().className, 'Plain' );
    }

  }
  
}).export(module);