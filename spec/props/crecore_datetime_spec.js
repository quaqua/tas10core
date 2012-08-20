var vows = require('vows')
  , assert = require('assert')
  , moment = require('moment')
  , CrecoreDateTime = require( __dirname + '/../../lib/props/crecore_datetime' );

vows.describe('CrecoreDateTime').addBatch({

  "a date object stays a date object new(new Date())": function(){
    var d = new Date();
    var value = CrecoreDateTime.new( d );
    assert.instanceOf( value.getValue(), Date );
    assert.equal( value.getValue(), d );
  },

  "a string gets converted (with momentjs) into a date object new('2011-02-03')": function(){
    var value = CrecoreDateTime.new('2011-02-03');
    assert.instanceOf( value.getValue(), Date );
    assert.equal( value.getValue().toString(), moment('2011-02-03').toDate().toString() );
  },

  "anything else can't be casted new(2)": function(){
    assert.throws( function(){ CrecoreDateTime.new(2) }, Error );
  }


}).export(module);