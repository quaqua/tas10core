var vows = require('vows')
  , assert = require('assert')
  , crecore = require('../../index');

vows.describe('Mongo connection').addBatch({

	"opens a connection to the mongo db": function(){
    crecore.connect('mongodb://localhost:27017/testCrecore')
  }
  
}).export(module);