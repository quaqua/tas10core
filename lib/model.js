// # Model INTERFACE
// the document model is the parent object
// for any other content repository object like
// users, audits, groups, sessions, ...

var ObjectId = require('mongodb').BSONPure.ObjectID
  , events = require('events')
  , eventEmitter = new events.EventEmitter();

require( __dirname + '/inherits' );


var Property = require( __dirname + '/props/property' )
  , Tas10String = require( __dirname + '/props/tas10_string' )
  , Tas10Int = require( __dirname + '/props/tas10_int' )
  , Tas10Array = require( __dirname + '/props/tas10_array' )
  , Tas10Object = require( __dirname + '/props/tas10_object' )
  , Tas10DateTime = require( __dirname + '/props/tas10_datetime' )
  , Tas10Boolean = require( __dirname + '/props/tas10_boolean' );

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
    o._newRecord = false;
  else {
    o._initProps();
    o._newRecord = true;
  }
  
  o._setupProps( properties );
  o._deleted = false;

  if( !o._newRecord ){

    // persistedProps are for comparison against changed props
    // this will be used in history before.save action
    o._persistedProps = {};
    for( var i in o._props )
        if( ! i.match (/_id|className|history/) )
            o._persistedProps[i] = o[i];
  }

  return o;

}

Model.prototype._props = {};

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
    className: { type: Tas10String },
    name: { type: Tas10String, index: true, default: null, required: true },
    history: { type: Tas10Array, default: [] },
    acl: { type: Tas10Object, default: {} },
    position: { type: Tas10Int, default: 999 },
    labels: { type: Tas10Array, default: [] },
    starred: {type: Tas10Boolean }
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
//                    {type: Tas10DateTime, default: new Date() }})
//
// also basic validations can be passed.
// ## Options
// [type] - The type this value should always be set with.
// Available types are: Tas10String, Tas10Int, Tas10Array, 
// Tas10Object, Tas10DateTime, ...
// (see [props/property.html](props/property.html) for a full list)
//
Model.schema = function(){
  for( var i in arguments ){
    var props = arguments[i];
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
      this._schema[ props ] = { type: Tas10String };
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
      this._props[i] = props[i].type.new( props[i].default );
      this[i] = this._props[i].getValue();
    }
  this._props.className = Tas10String.new(this.constructor.name);
  this.className = this._props.className.getValue();
}

// # private: _setupProps( Object )
//
// set given properties according to Model.properties
//
Model.prototype._setupProps = function( properties ){
  for( var i in properties ){
    if( i in this.constructor.schema() ){
      this._props[i] = this.constructor.schema()[i].type.new( properties[i] );
    /* this would set up any value coming into the constructor:
    else
      this._props[i] = Tas10String.new( properties[i] );
    */
      this[i] = this._props[i].getValue();
    } else
      this[i] = properties[i];
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
  for( var i in this.constructor.schema() )
      this[i] && (props[i] = this.constructor.schema()[i].type.new( this[i] ).getValue());
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

// # isPersisted()
//
// returns if this model is persisted (saved) in the
// database and no record is changed
//
Model.prototype.isPersisted = function isPersisted(){
  this.getChangedProps().length === 0;
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

// # getChangedProps()
//
// returns all props that have been changed since their last save
//
Model.prototype.getChangedProps = function getChangedProps(){

    var changed = [];

    if( this._newRecord )
      return Object.keys( this._props );

    for( var i in this._props)
      if( ( !(this._props[i] in this._persistedProps) || this[i] != this._persistedProps[i] ) &&
        !i.match(/className|history|_id/) )
            changed.push( i );

    return changed;
}

Model.hooks.before.save.push( function updateModifier( next ){

  var self = this;
  var changed = this.getChangedProps();
  var perProps = {};

  if( !this._newRecord ){
    changed.forEach( function( prop ){
      perProps[prop] = self._persistedProps[prop];
    });
  }
  
  if( this.history.length > 30 )
        this.history.splice(1,1);

  this.history.push({
    at: new Date(),
    by: {
        _id: this.holder ? this.holder._id : null,
        photoPath: this.holder ? this.holder.photoPath : null,
        name: this.holder ? this.holder.getName() : null
    },
    undo: ( this._id ? perProps : null ),
    changed: changed
  });
    
  next();

});


module.exports = require( __dirname + '/adapters/mongo/extend_model')( Model );
