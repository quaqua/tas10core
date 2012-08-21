var vows = require('vows')
  , assert = require('assert')
  , Model = require( __dirname + '/../lib/model' );

var Plain = function Plain(){}
Plain.inherits( Model );

vows.describe('Plain').addBatch({

  "has a constructor which can be called with": {
    "no arguments": function(){
      var m = Plain.new();
      assert.instanceOf( m, Plain );
    },
    "property object as one argument": function(){
      var m = Plain.new( {name: 'test'} );
      assert.instanceOf( m, Plain );
      assert.equal( m.name, 'test' );
    }
  },

  "class properties": {

    "name": function(){
      assert.typeOf( Plain.name, 'string' );
      assert.equal( Plain.name, 'Plain' );
    },

    "validations": function(){
      assert.typeOf( Plain.validations, 'array' );
    },

    "hooks": function(){
      assert.typeOf( Plain.hooks, 'object');
    }

  },

  "instance properties": {

    topic: function(){ return Plain.new(); },

    "name": function( model ){
      assert.isNull( model.name );
    },

    "history": function( model ){
      assert.typeOf( model.history, 'array' );
    },

    "label_ids": function( model ){
      assert.typeOf( model.label_ids, 'array' );
    },

    "acl": function( model ){
      assert.typeOf( model.acl, 'object' );
    }

  },

  "instance methods": {

    topic: function(){ return Plain.new({name: 'm'}); },

    "toJSON": function( model ){
      var json = model.toJSON();
      assert.equal( json.name, 'm' );
      assert.deepEqual( json.label_ids, [] );
      assert.equal( json.position, 999 );
      assert.equal( json.className, 'Plain' );
    }

  }
  
}).export(module);