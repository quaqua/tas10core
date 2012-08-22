var vows = require('vows')
  , assert = require('assert')
  , tas10core = require('../../index')
  , Model = require('../../lib/model');

tas10core.connect('mongodb://localhost:27017/test_tas10core');

vows.describe('Mongo basics').addBatch({

	"setup the connection": function(){
    	tas10core.connect('mongodb://localhost:27017/testTas10')
  	}

}).export(module);