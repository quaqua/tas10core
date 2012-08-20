var vows = require('vows')
  , assert = require('assert')
  , Property = require( __dirname + '/../../lib/props/property' )
  , CrecoreInt = require( __dirname + '/../../lib/props/crecore_int' );

vows.describe('Properties').addBatch({

	"a property can be initialized": {
    "without any argument": function(){
      var p = Property.new();
      assert.instanceOf( p, Property );
    },
    "with one argument (setting the value)": function(){
      var p = Property.new('test');
      assert.instanceOf( p, Property );
      assert.equal( p.getValue(), 'test' );
    }
  },

  "property interface has method": {

    topic: function(){ return Property.new('test'); },

    "getValue() - just returns the value or null without any type-cast": function( prop ){
      assert.isFunction( prop.getValue );
    },

    "setValue() - just sets the given datatype as the value of this instance": function( prop ){
      assert.isFunction( prop.setValue );
    }

  },

}).export(module);