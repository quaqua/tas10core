var ObjectId = require('mongodb').BSONPure.ObjectID;

var Query = function(collection, obj, holder){
  this._collection = collection;
  this._Obj = obj;
  if( collection && collection.collectionName === 'documents' )
    this.className = (new obj).className;
  this.query = {};
  this._sort = [];
  this._limit = 0;
  this._select = null;
  this.keys = {};
  this._holder = holder;
  if( holder && holder.constructor.className === 'User' )
    this._setupDefaultQuery();
  this._curKey = null;
};

var _buildACL = function _buildACL( id ){
  var acl = {};
  acl["acl."+id+".privileges"] = /r\w*/;
  return acl;
}
Query.prototype._setupDefaultQuery = function(){
  var preparedQ = [];
  preparedQ.push(_buildACL(this._holder._id));
  for( var i in this._holder.groups )
    preparedQ.push(_buildACL(this._holder.groups[i]));

  if( this._collection.collectionName === 'documents' ){
    this.query = {$or: preparedQ};
    if( this._Obj.className && this._Obj.className !== 'AnyDocument' )
      this.query.className = this._Obj.className;
  }
};

// # and, where
//
// type: sync
//
// combines the query with an and statement. The following
// statement will be and-linked
//
// ### key {String}
// the key to be looked up
//
// ### val {Any}
// the value to be associated with the key
//
Query.prototype.and =
Query.prototype.where = function(key, val){
  this._checkCurKey();
  if( arguments.length === 2 )
    this.query[key] = val;
  else{
    this._curKey = key;
    this.keys[key] = {};
  }
  return this;
};

// # byId
//
// type: sync
//
// transforms the entered id into a BSON ObjectId
//
// ### id {String}
//
Query.prototype.byId = function( id ){
  this.query['_id'] = new ObjectId(id);
  return this;
};

// # reset
//
// type: sync
//
// resets the query
//
Query.prototype.reset = function(){
  this.query = {};
  this._sort = [];
  this._limit = 0;
  this.keys = {};
  this._select = null;
  this._curKey = null;
  return this;
};

// # not
//
// type: sync
//
// following statement must not match the query
//
// ### key {String}
// the key to be looked up
//
// ### val {Any}
// the value to be associated with the key
//
Query.prototype.not = function(key, val){
  this._checkCurKey();
  this.query[key] = {$not: val};
  return this;
};

// # exists
//
// type: sync
//
// sets the 'exists' switch.
//
// ### key {String}
// the key to be looked up
//
// ### val {Any}
// the value to be associated with the key
//
Query.prototype.exists = function(key, val){
  this._checkCurKey();
  this.query[key] = {$exists: val};
  return this;
};

// # or
//
// type: sync
//
// combines other queries with an or statement.
//
// e.g.:
//      (new Query()).or( new Query().where('a',2), new Query().where('a',5) )
//
Query.prototype.or = function(){
  this._checkCurKey();
  orQuery = [];
  for( i in arguments ){
    if( ! arguments[i] instanceof Query )
      throw "the OR operator only takes arguments of instance Query! (got: " + arguments[i] + ")";
    orQuery.push(arguments[i].build());
  }
  this.query.$or = orQuery;
  return this;
};

// # gt gte lt lte ne in nin all regex size maxDistance
//
// type: sync
//
// all these types have the same syntax:
//
// ### path {String}
// the key to be looked up
//
// ### val {String|Number|Date|Any} (optional)
// the value to be looked for
//
'gt gte lt lte ne in nin all regex size maxDistance'.split(' ').forEach( function ($conditional) {
  Query.prototype[$conditional] = function (path, val) {
    if ( arguments.length === 1 )
      val = path;
    else
      this._checkCurKey();
    if( typeof(this.keys[this._curKey]) === 'undefined' )
      this.keys[this._curKey] = {};
    this.keys[this._curKey]['$'+$conditional] = val;
    return this;
  };
});

Query.prototype.elemMatch = function(matcher){
  if( typeof(this.keys[this._curKey]) === 'undefined' )
    this.keys[this._curKey] = {};
  this.keys[this._curKey]['$elemMatch'] = matcher;
  return this;
}

// # select( selector )
//
// type: sync
//
// ### selector {Array}
// the fields to select. Avoids returning the
// document as a whole.
//
Query.prototype.select = function(selector){
  this._select = selector;
  return this;
}

// # sort( key, desc )
//
// type: sync
//
// ### key {String}
// the key in the database which should be used for sorting
//
// ### desc {String}
// 'desc' | 'asc'
//
Query.prototype.sort = function(key, desc){
  if( typeof(desc) === 'undefined' || ( typeof(desc) === 'string' && desc == 'desc') )
    desc = 1;
  else
    desc = -1;
  this._sort.push([key, desc]);
  return this;
}

// # limit( val )
//
// type: sync
//
// ### val {Number}
// the value 0-n
//
// specify a maximum limit to the query.
//
Query.prototype.limit = function(val){
  if( typeof(val) === 'number' )
    this._limit = val;
  return this;
}

// # build( reset )
//
// type: sync
//
// builds this instance's query.
//
// ### reset {Boolean}
// wether the query should be reset after returned
// or not
//
// returns {Object}
//
Query.prototype.build = function(reset){
  this._checkCurKey();
  var q = this.query;
  if( typeof(reset) === 'undefined' || (typeof(reset) === 'object' && reset.reset === true ) )
    this.reset();
  if( this._collection ) // for testing
    console.log("QUERY [" + this._collection.collectionName + "]: " + require('util').inspect(q, false, null));
  return q;
};

Query.prototype.buildSortLimit = function buildSortLimit(reset){
  res = {};
  if( this._limit > 0 )
    res['limit'] = this._limit;
  if( this._sort.length > 0 )
    res['sort'] = this._sort;
  if( this._select )
    res['fields'] = this._select;
  if( res.limit || res.sort || res.fields )
    console.log(res);
  if( typeof(reset) === 'undefined' || (typeof(reset) === 'object' && reset.reset === true ) )
    this.reset();
  return res;
}

// # first
//
// type: async
//
// run the query and return only the first matching result
// to the callback
//
Query.prototype.first = function( callback ){
  var Obj = this._Obj
    , self= this;
  
  this._collection.findOne( self.build(), function(err, res){
    if ( res ){
      doc = Obj.new(self._holder, res);
      callback(null, doc);
    } else
      callback(err, null);
  });
};

// # find
//
// type: async
// 
// run the query and find all occurrences that match
// the defined query. If query is empty, all documents
// will be returned to the callback function
//
Query.prototype.find = function( callback ){
  var Obj = this._Obj
    , self = this;
  this._collection.find( self.build(false), self.buildSortLimit() ).toArray( function( err, results ){
    if( err )
      callback(err);
    else{
      docs = [];
      results.forEach( function( res ){
        docs.push( Obj.new(self._holder, res) );
      });
      callback(null, docs);
    }
  })
}

// # count
//
// type: async
//
// count all occurrences that match this query.
// if query is empty, all occurrences will be
// taken into account.
//
Query.prototype.count = function( callback ){

  this._collection.count( this.build(false), callback );

}

Query.prototype._checkCurKey = function(){
  if( this._curKey )
    this.query[this._curKey] = this.keys[this._curKey];
  this._curKey = null;
};

module.exports = Query;