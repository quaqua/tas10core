var vows = require('vows')
  , assert = require('assert')
  , creio = require('../../index')
  , Model = require('../../lib/model');

creio.connect('mongodb://localhost:27017/testCreio');

vows.describe('Mongo basics').addBatch({

	"setup the connection": function(){
    	creio.connect('mongodb://localhost:27017/testCreio')
  	}

}).export(module);