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
  , Tas10Boolean = require( __dirname + '/props/tas10_boolean' )
  , Validations = require( __dirname + '/validations' );

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

  if( !o._newRecord )
    o._setupPersistedProps();

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

Model.validations = [];

Model._baseSchema = function(){

  return {
    className: { type: Tas10String },
    name: { type: Tas10String, index: true, default: null, required: true },
    history: { type: Tas10Array, default: [] },
    acl: { type: Tas10Object, default: {} },
    position: { type: Tas10Int, default: 999 },
    label_ids: { type: Tas10Array, default: [] },
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

/**
 * setup / reinitializes persisted properties
 *
 */
Model.prototype._setupPersistedProps = function _setupPersistedProps(){
  this._persistedProps = {};
  for( var i in this._props )
      if( ! i.match (/_id|className|history/) )
          this._persistedProps[i] = this[i];
}

 /**
 * returns a JSON with all properties set (no functions);
 *
 * @returns {Object} Json string containing prepared values
 *
 */
Model.prototype.toJSON = function(){
  var props = this.normalizeProps();
  //props['privileges'] = this.privileges();
  return props;
}

/**
 * normalizes props (set via = according to their defined type)
 *
 * @returns {Object} object with normalized properties (validated by Property instances)
 *
 */
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
  return (this.getChangedProps().length === 0);
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

/**
 * validates one of given types with either predefined validation
 * or custom validation
 *
 * @param {String|Function} type - 
 *                          (String) the type of the validation e.g.: `presence` or `formatEmail`,
 *                          (Function) a custom function to be run validating anything. See example below
 * @param {String} [prop] - only required if predefined validation is used
 *
 */
Model.validates = function validates( type, prop ){

  if( type && typeof(type) === 'string' ){
    switch( type ){
      case 'presence':
        this.validations.push( Validations.presence( prop ) );
        break;
      case 'formatEmail':
        this.validations.push( Validations.formatEmail( prop ) );
        break;
    }
  } else if( typeof( type ) === 'function' )
    this.validations.push( type );

}

/**
 * runs all defined validations. Fills in this.error object if any
 * errors occur. Validations are run through even on errors. Only
 * the error object witnesses about any unexptected occurrences.
 *
 * @param {Function} callback
 *
 * @example
 * runValidations();
 *
 */      
Model.prototype.runValidations = function runValidations( callback ){
    var self = this;
    this.errors = {};

    function nextValidation(){
      eventEmitter.emit('nextValidation');
    }

    var curValidation = 0
      , validations = this.constructor.validations;

    eventEmitter.removeAllListeners('nextValidation');
    eventEmitter.on('nextValidation', function(){
      curValidation < validations.length ? validations[curValidation++].call(self, nextValidation ) : callback( self );
    });

    nextValidation();

};

/**
 * append an error to the errors collector
 *
 * @param {String} property
 * @param {String} message - the Error message (preferably an i18n formattable string)
 *
 * @example
 * appendError( 'name', 'required_field' )
 *
 */
Model.prototype.appendError = function appendError( property, message ){
    property in this.errors || (this.errors[property] = [])
    this.errors[property].push( message );
}

/**
 * runs hooks within given action and type.
 *
 * @param {String} time - either 'before' or 'after'
 * @param {String} action - either /save|create|update|initialize|destroy/
 * @param {Function} callback
 *
 * @example
 * runHooks( 'before', 'save', function(){} );
 *
 */
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

/**
 * returns all props that have been changed since their last save
 *
 * @returns {Array} array of changed properties
 *
 */
Model.prototype.getChangedProps = function getChangedProps(){

    var changed = [];

    if( this._newRecord )
      return Object.keys( this._props );

    for( var i in this._props)
      if( ( !(i in this._persistedProps) || this[i] != this._persistedProps[i] ) &&
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
