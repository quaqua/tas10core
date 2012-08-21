var vows = require('vows')
  , assert = require('assert')
  , Model = require( __dirname + '/../lib/model' );

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
  },

  "class properties": {

    "name": function(){
      assert.typeOf( Model.name, 'string' );
      assert.equal( Model.name, 'Model' );
    },

    "validations": function(){
      assert.typeOf( Model.validations, 'array' );
    },

    "hooks": function(){
      assert.typeOf( Model.hooks, 'object');
    }

  },

  "instance properties": {

    topic: function(){ return Model.new(); },

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

    topic: function(){ return Model.new({name: 'm'}); },

    "toJSON": function( model ){
      var json = model.toJSON();
      assert.equal( json.name, 'm' );
      assert.deepEqual( json.acl, {} );
      assert.deepEqual( json.label_ids, [] );
      assert.equal( json.position, 999 );
      assert.equal( json.className, 'Model' );
    }

  }
  
}).export(module);