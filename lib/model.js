// # Model INTERFACE
// the document model is the parent object
// for any other content repository object like
// users, audits, groups, sessions, ...

var ObjectId = require('mongodb').BSONPure.ObjectID
  , events = require('events')
  , eventEmitter = new events.EventEmitter();

require( __dirname + '/inherits' );


var Property = require( __dirname + '/props/property' )
  , CrecoreString = require( __dirname + '/props/crecore_string' )
  , CrecoreInt = require( __dirname + '/props/crecore_int' )
  , CrecoreArray = require( __dirname + '/props/crecore_array' )
  , CrecoreObject = require( __dirname + '/props/crecore_object' )
  , CrecoreDateTime = require( __dirname + '/props/crecore_datetime' )
  , CrecoreBoolean = require( __dirname + '/props/crecore_boolean' );

// # var n = new Model( properties );
//
function Model(){};

// # new( user | object, object )
// create a new instance of this
// model
Model.new = function( holder, properties ){

  var o = new this();

  arguments.length === 1 && (properties = holder);

  if( typeof(holder) === 'object' )
    properties = holder;
  else
    o.holder = holder;

  if( properties && '_id' in properties )
    o._newRecord = false
  else {
    o._initProps();
    o._newRecord = true;
  }
  
  o._setupProps( properties );
  o._deleted = false;

  return o;

}

Model.prototype.props = {};

Model.hooks = { 
          before: {
              create: [], update: [], save: [], destroy: [] 
          },
          after: {
              initialize: [], create: [], update: [], save: [], destroy: []
          }
};

Model._baseSchema = function(){

  return {
    className: { type: CrecoreString },
    name: { type: CrecoreString, index: true, default: null, required: true },
    history: { type: CrecoreArray, default: [] },
    acl: { type: CrecoreObject, default: {} },
    position: { type: CrecoreInt, default: 999 },
    labels: { type: CrecoreArray, default: [] },
    starred: {type: CrecoreBoolean }
  }

};

Model._schema = Model._baseSchema();

// # Model.schema( object, object, ... )
// setup property fields where you want to ensure a certain
// type and value.
//
// e.g.:
//
//      Model.schema( 'description', 'firstname', {starts_at: 
//                    {type: CrecoreDateTime, default: new Date() }})
//
// also basic validations can be passed.
// ## Options
// [type] - The type this value should always be set with.
// Available types are: CrecoreString, CrecoreInt, CrecoreArray, 
// CrecoreObject, CrecoreDateTime, ...
// (see [props/property.html](props/property.html) for a full list)
//
Model.schema = function( props ){
  if( props ){
    if( typeof(props) === 'object' )
      for( var i in props ){
        if( i in this._baseSchema() ) 
          throw new Error(this.constructor.name+" overriding baseSchema properties is not allowed (name: " +i+ ")");
        else{
          if( props[i]._super === Property )
              this._schema[i] = { type: props[i] }
          else
            this._schema[i] = props[i];
        }
      }
    else if( typeof(props) === 'string' )
      this._schema[ props ] = { type: CrecoreString };
  }
  return this._schema;
}

// # private: _initProps()
//
// set initial props, defined with 'default': true;
//
Model.prototype._initProps = function(){
  var props = this.constructor.schema();
  for( var i in props )
    if( 'default' in props[i] ){
      this.props[i] = props[i].type.new( props[i].default );
      this[i] = this.props[i].getValue();
    }
  this.props.className = CrecoreString.new(this.constructor.name);
  this.className = this.props.className.getValue();
}

// # private: _setupProps( Object )
//
// set given properties according to Model.properties
//
Model.prototype._setupProps = function( properties ){
  for( var i in properties ){
    if( i in this.constructor.schema() )
      this.props[i] = this.constructor.schema()[i].type.new( properties[i] );
    else
      this.props[i] = CrecoreString.new( properties[i] );
    this[i] = this.props[i].getValue();
  }
}

// # toJSON()
//
// returns a JSON with all properties set (no functions);
//
Model.prototype.toJSON = function(){
  var props = this.normalizeProps();
  //props['privileges'] = this.privileges();
  return props;
}

// # normalizeProps()
//
// normalizes props (set via = according to their defined type)
//
Model.prototype.normalizeProps = function(){
  var props = {};
  for( var i in this.props )
      props[i] = this.props[i].setValue( this[i] ).getValue();
  return props;
}

// # isDeleted()
//
// returns if this model has been deleted and is either
// in the trash bin or has been deleted permanently
//
Model.prototype.isDeleted = function isDeleted(){
  return this._deleted;
}

// # isNewRecord()
//
// returns if this model is a new record or has beens aved
// to the repository already
//
Model.prototype.isNewRecord = function isNewRecord(){
  return this._newRecord;
}

// # before( action, fn )
//
// set up a before hook for desired action with given function
//
// ### action {String}
// either 'create', 'save', 'update', 'destroy'
//
// ### fn {Function}
// the function to be called when action is invoked
//
Model.before = function before( action, fn ){
  this.hooks.before[action].push( fn );
}

// # after( action, fn )
//
// set up a after hook for desired action with given function
//
// ### action {String}
// either 'initialize', 'create', 'save', 'update', 'destroy'
//
// ### fn {Function}
// the function to be called when action is invoked
//
Model.after = function before( action, fn ){
  this.hooks.after[action].push( fn );
}

Model.prototype.runValidations = function runValidations( callback ){
    this.errors = {};
    this.numValidations = 0;
    if( callback )
        this.afterValidationsCallback = callback;
    else
        this.afterValidationsCallback = this.nextHook;
    this.nextValidation();
};

// # runHooks( time, action, callback )
//
// type: async
//
// runs hooks within given action and type.
// 
// e.g.:
//
//      runHooks( 'before', 'save', function(){} );
//
// ### time {String}
// either 'before', or 'after'
//
// ### action {String}
// either /save|create|update|initialize|destroy/
//
// ### callback {Function}
//
Model.prototype.runHooks = function runHooks( time, action, callback ){

    var self = this;

    function nextHook(){
      eventEmitter.emit('nextHook');
    }

    var curHook = 0
      , hooks = this.constructor.hooks[time][action];

    eventEmitter.removeAllListeners('nextHook');
    eventEmitter.on('nextHook', function(){
      curHook < hooks.length ? hooks[curHook++].call(self, nextHook ) : callback( self );
    });

    nextHook();

}


module.exports = require( __dirname + '/adapters/mongo/extend_model')( Model );
