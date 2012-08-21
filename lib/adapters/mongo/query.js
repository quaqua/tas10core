var ObjectId = require('mongodb').BSONPure.ObjectID;

/**
 *
 * @class implements stacked database queries
 *
 */
function Query(collection, obj, holder){
  this._collection = collection;
  this._Obj = obj;
  this.query = {};
  if( collection && collection.collectionName === 'documents' && obj.name !== 'Document' )
    this.query['className'] = obj.name;
  this._sort = [];
  this._limit = 0;
  this._select = null;
  this.keys = {};
  this._holder = holder;
  if( holder && holder.constructor.name === 'User' )
    this._setupDefaultQuery();
  this._curKey = null;
};

/**
 *
 * @private
 *
 * build the access control specific part of the query.
 * This mainly means, that acl["acl.<user_id>.privileges"] are
 * queried for existence. If they exist, the object matches
 *
 * @returns {Object} acl
 *
 */
var _buildACL = function _buildACL( id ){
  var acl = {};
  acl["acl."+id+".privileges"] = /r\w*/;
  return acl;
}

/**
 * 
 * @private
 *
 * sets up the default Query (if nothing else is passed)
 *
 */
Query.prototype._setupDefaultQuery = function(){
  var preparedQ = [];
  preparedQ.push(_buildACL(this._holder._id));
  for( var i in this._holder.groups )
    preparedQ.push(_buildACL(this._holder.groups[i]));

  if( !this._collection.collectionName.match(/users|groups/) ){
    this.query['$or'] = preparedQ;

    //if( this._Obj.name !== 'Document' )
    //  this.query.className = this._Obj.name;
    
    //if( this._Obj.name && this._Obj.name !== 'Document' )
    //  this.query.className = this._Obj.name;
  }
};

/**
 * combines the query with an and statement. The following
 * statement will be and-linked
 *
 * @param {String} key
 * @param {String} val - the value to be looked up
 *
 * @returns {Query}
 *
 */
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

/**
 * transforms the entered id into a BSON ObjectId
 *
 * @param {String} id
 *
 */
Query.prototype.byId = function( id ){
  this.query['_id'] = new ObjectId(id);
  return this;
};

/**
 *
 * reset the query (same if just reinitializing the whole Query object)
 *
 */
Query.prototype.reset = function(){
  this.query = {};
  this._sort = [];
  this._limit = 0;
  this.keys = {};
  this._select = null;
  this._curKey = null;
  return this;
};


/**
 *
 * following statement must not match the query
 *
 * @param {String} key
 * @param {String} val - the value to be looked up
 *
 * @returns {Query}
 *
 */
Query.prototype.not = function(key, val){
  this._checkCurKey();
  this.query[key] = {$not: val};
  return this;
};

/**
 *
 * wether the given value exists or not
 *
 * @param {String} key
 * @param {Boolean} val - the value to be looked up
 *
 * @returns {Query}
 *
 */
Query.prototype.exists = function(key, val){
  this._checkCurKey();
  this.query[key] = {$exists: val};
  return this;
};

/**
 *
 * combines other queries with an or statement.
 *
 * @param {Query} a query instance
 *
 * @returns {Query}
 *
 * @example
 * (new Query()).or( new Query().where('a',2), new Query().where('a',5) )
 *
 */
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

/**
 *
 * gt gte lt lte ne in nin all regex size maxDistance
 *
 * all these types have the same syntax:
 *
 * @param {String} key
 * @param {Boolean} val - the value to be looked up
 *
 * @returns {Query}
 *
 */
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

/**
 *
 * select only a subset of values
 * NOT SUPPORTED YET (will be ignored)
 *
 * @param {Object} selector
 *
 * @return {Query}
 *
 */
Query.prototype.select = function(selector){
  this._select = selector;
  return this;
}

/**
 *
 * sort the current query by given key (stackable)
 *
 *
 * @param {String} key
 * @param {String} asc/desc
 *
 */
Query.prototype.sort = function(key, desc){
  if( typeof(desc) === 'undefined' || ( typeof(desc) === 'string' && desc == 'desc') )
    desc = 1;
  else
    desc = -1;
  this._sort.push([key, desc]);
  return this;
}

/**
 *
 * limit the query to a maximum of record
 *
 * @param {Number} limit
 *
 * @returns {Query}
 *
 */
Query.prototype.limit = function(val){
  if( typeof(val) === 'number' )
    this._limit = val;
  return this;
}

/**
 * 
 * build the query (but don't run it)
 *
 * @param {Boolean} reset - wether the query should be resetted after return
 * or not.
 *
 * @returns {Object} the query fitting to the mongo driver
 *
 */
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

/**
 * run the query and return only the first matching result to the callback
 *
 * @param {Function} callback
 *
 */
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


/**
 *
 * run the query and find all occurrences that match
 * the defined query. If query is empty, all documents
 * will be returned to the callback function
 *
 * @param {Function} callback
 *
 */
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

/**
 *
 * count all occurrences that match this query.
 * if query is empty, all occurrences will be
 * taken into account.
 *
 * @param {Function} callback
 *
 */
Query.prototype.count = function( callback ){

  this._collection.count( this.build(false), callback );

}

Query.prototype._checkCurKey = function(){
  if( this._curKey )
    this.query[this._curKey] = this.keys[this._curKey];
  this._curKey = null;
};

module.exports = Query;