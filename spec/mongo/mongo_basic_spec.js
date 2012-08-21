var vows = require('vows')
  , assert = require('assert')
  , tas10io = require('../../index')
  , Model = require('../../lib/model');

tas10io.connect('mongodb://localhost:27017/testTas10io');

vows.describe('Mongo basics').addBatch({

	"setup the connection": function(){
    	tas10io.connect('mongodb://localhost:27017/testTas10')
  	}

}).export(module);