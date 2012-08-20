var vows = require('vows')
  , assert = require('assert')
  , crecore = require('../../index')
  , Model = require('../../lib/model');

crecore.connect('mongodb://localhost:27017/testCrecore');

vows.describe('Mongo basics').addBatch({

	"setup the connection": function(){
    	crecore.connect('mongodb://localhost:27017/testCrecore')
  	}

}).export(module);