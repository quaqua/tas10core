var vows = require('vows')
  , assert = require('assert')
  , Model = require( __dirname + '/../lib/model' )

var Tas10String = require( __dirname + '/../lib/props/tas10_string' )
  , Tas10Int = require( __dirname + '/../lib/props/tas10_int' )
  , Tas10Array = require( __dirname + '/../lib/props/tas10_array' )
  , Tas10Object = require( __dirname + '/../lib/props/tas10_object' )
  , Tas10DateTime = require( __dirname + '/../lib/props/tas10_datetime' )
  , Tas10Boolean = require( __dirname + '/../lib/props/tas10_boolean' );

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
        assert.instanceOf( Plain.new()._props.name, Tas10String );
      },

      "className": function( Plain ){
        assert.isObject( Plain.new()._props.className );
        assert.instanceOf( Plain.new()._props.className, Tas10String );
      },

      "acl": function( Plain ){
        assert.isObject( Plain.new()._props.acl );
        assert.instanceOf( Plain.new()._props.acl, Tas10Object );
      },

      "labels": function( Plain ){
        assert.isObject( Plain.new()._props.labels );
        assert.instanceOf( Plain.new()._props.labels, Tas10Array );
      },

      "history": function( Plain ){
        assert.isObject( Plain.new()._props.history );
        assert.instanceOf( Plain.new()._props.history, Tas10Array );
      }

    },

    "Plain can define custom properties": {

      "Tas10String property": function( Plain ){
        Plain.schema('description');
        assert.isObject( Plain.schema().description );
        assert.isUndefined( Plain.new().description ); // due we did not set a default value
      },

      "Tas10String property explicitely declaration": function( Plain ){
        Plain.schema({ desc2: Tas10String });
        assert.isObject( Plain.schema().desc2 );
        assert.isUndefined( Plain.new().desc2 ); // due we did not set a default value
      },

      "Tas10String property with options": function( Plain ){
        Plain.schema({ desc3: { type: Tas10String, default: 'description' }});
        assert.isObject( Plain.schema().desc3 );
        assert.isString( Plain.new().desc3 );
      }

    },

    "baseSchema properties are 'protected'": function( Plain ){
      assert.throws( function(){ Plain.schema({ acl: {type: Tas10String} }); }, Error );
    },

    "className of Plain is 'Plain'": function( Plain ){
      assert.equal( Plain.new().className, 'Plain' );
    }

  }
  
}).export(module);