var vows = require('vows')
  , assert = require('assert')
  , Query = require('../../lib/adapters/mongo/query')
  , tas10io = require('../../index')
  , moment = require('moment')
  , conn = tas10io.connect( 'mongodb://localhost:27017/testTas10io' )
  , User = require('../../lib/models/user');

vows.describe('Query Object').addBatch({
  "returns a query object": function(){
    assert.instanceOf( User.query(), Query );
  },
  "returns itself (Query Object) on query method calls": function(){
    assert.instanceOf( User.query().where('name', 'test'), Query );
  },
  "builds a query of type {name: test}": function(){
    assert.deepEqual( User.query().where('name', 'test').build(), {name: 'test'} );
  },
  "builds a query of type {name: /test/} (SQL LIKE)": function(){
    assert.deepEqual( User.query().where('name', /test/).build(), {name: /test/} );
  },
  "builds a conditional AND query of type {name: /test/, pos: 1}": function(){
    assert.deepEqual( User.query().where('name', /test/).and('pos', 1).build(), {name: /test/, pos: 1} );
  },
  "builds a conditional OR query of type {$or: [{name: /test/, pos: 1}, {email: /test/}]}": function(){
    var userQuery = User.query().reset().or( new Query().where('name', /test/).and('pos', 1), new Query().where('email', /test/) );
    assert.deepEqual( userQuery.build(), {$or: [{name: /test/, pos: 1}, {email: /test/}]});
  },
  "builds a conditional NOT query of type {name: { $not: 'test'} }": function(){
    var userQuery = User.query().reset().not('name', 'test');
    assert.deepEqual( userQuery.build(), {name: { $not: 'test' }} );
  },
  "compares a date": {
    topic: new Date(),
    "less than given date": function( date ){
      var q = User.query().reset().where('created_at').lt(date);
      assert.deepEqual( q.build(), {'created_at': {$lt: date}});
    },
    "less equal given date": function( date ){
      var q = User.query().reset().where('created_at').lte(date);
      assert.deepEqual( q.build(), {'created_at': {$lte: date}});
    },
    "greater than given date": function( date ){
      var q = User.query().reset().where('created_at').gt(date);
      assert.deepEqual( q.build(), {'created_at': {$gt: date}});
    },
    "greater equal given date": function( date ){
      var q = User.query().reset().where('created_at').gte(date);
      assert.deepEqual( q.build(), {'created_at': {$gte: date}});
    },
    "in range of d1 and d2": function( d1 ){
      var d2 = moment(d1).add('d',1).toDate();
      var q = User.query().reset().where('created_at').gt(d1).lt(d2);
      assert.deepEqual( q.build(), {'created_at': {$gt: d1, $lt: d2}});
    },
    "complex combination of date ranges": {
      "compares 2 date ranges with or condition": function(d1){
        var d2 = moment(d1).add('d',1).toDate();
        var q1 = new Query().where('created_at').lt(d2).gt(d1);
        var q2 = new Query().where('created_at').lt(d1).gt(d2);
        var exp1 = {'created_at': {$lt: d2, $gt: d1}};
        var exp2 = {'created_at': {$lt: d1, $gt: d2}};
        var q = User.query().or(q1, q2);
        assert.deepEqual( q.build(), {$or: [exp1, exp2]});
      }
    }
  }
}).export(module);
