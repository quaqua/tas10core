/**
 * the document model is the parent object
 * for any other content repository object like
 * users, audits, groups, sessions, ...
 */

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
  , Validations = require( __dirname + '/validations' )
  , AccessControl = require( __dirname + '/access_control' );

function Model(){};

/**
 *
 * create a new instance of this model
 *
 */
Model.new = function( holder, properties ){

  var o = new this();

  if( holder && holder.className === 'User' )
    o.holder = holder;
  else if( arguments.length === 1 ){
    properties = holder;
    holder = null;
  }

  if( properties && '_id' in properties )
    o._newRecord = false;
  else {
    o._initProps();
    o._newRecord = true;
  }

  
  if( properties )
    o._setupProps( properties );

  o._deleted = false;

  if( !o._newRecord )
    o._setupPersistedProps();

  if( ! this.name.match(/User|Group|Model/) )
    AccessControl.methods.call(this).forEach( function( m ){
      o[m.name] = m.fn;
    })

  return o;

}

Model.prototype._fields = [];

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
    name: { type: Tas10String, index: true, default: function(){ return null }, required: true },
    history: { type: Tas10Array, default: function(){ return []; } },
    acl: { type: Tas10Object, default: function(){ return {}; } },
    position: { type: Tas10Int, default: function(){ return 999; } },
    label_ids: { type: Tas10Array, default: function(){ return []; } },
    starred: {type: Tas10Boolean }
  }

};

Model._schema = Model._baseSchema();

/**
 *
 * setup property fields where you want to ensure a certain
 * type and value.
 *
 * @param {String,String,...} field to be added
 * @param {Object,Object,...} object of type: {fieldName: {type: <TYPE>, default: function(){} }}
 *
 * @example
 * Model.schema( 'description', 'firstname', {starts_at: 
 *                    {type: Tas10DateTime, default: new Date() }})
 *
 * also basic validations can be passed.
 *
 */
Model.schema = function(){
  for( var i in arguments ){
    var props = arguments[i];
    if( typeof(props) === 'object' )
      for( var j in props ){
        if( j in this._baseSchema() ) 
          throw new Error(this.constructor.name+" overriding baseSchema properties is not allowed (name: " +i+ ")");
        else{
          if( props[j]._super === Property )
              this._schema[j] = { type: props[j] }
          else
            this._schema[j] = props[j];
        }
      }
    else if( typeof(props) === 'string' )
      this._schema[ props ] = { type: Tas10String };
  }
  return this._schema;
}

/**
 *
 * @private
 *
 * set initial props, defined with 'default': true;
 *
 */
Model.prototype._initProps = function(){
  var props = this.constructor.schema();
  for( var i in props ){

    if( 'default' in props[i] && typeof(props[i].default) === 'function' )
      this[i] = props[i].default();

    if( this._fields.indexOf(i) < 0) this._fields.push(i);

  }
  if( this._fields.indexOf('className') < 0) this._fields.push('className');
  this.className = this.constructor.name;
}

/**
 *
 * @private
 *
 * set given properties according to Model.properties
 *
 */
Model.prototype._setupProps = function( properties ){
  for( var i in properties ){
    if( i in this.constructor.schema() ){
      if( this._fields.indexOf(i) < 0 ) this._fields.push(i);
      this[i] = this.constructor.schema()[i].type( properties[i] );
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
  var self = this;
  this._fields.forEach( function( field ){
      if( ! field.match (/_id|className|history/) )
          self._persistedProps[field] = self[field];
  })
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
      this[i] && (props[i] = this.constructor.schema()[i].type( this[i] ) );
  return props;
}

/**
 *
 * returns if this model has been deleted and is either
 * in the trash bin or has been deleted permanently
 *
 */
Model.prototype.isDeleted = function isDeleted(){
  return this._deleted;
}

/**
 *
 * returns if this model is a new record or has beens aved
 * to the repository already
 *
 */
Model.prototype.isNewRecord = function isNewRecord(){
  return this._newRecord;
}

/**
 *
 * returns if this model is persisted (saved) in the
 * database and no record is changed
 *
 */
Model.prototype.isPersisted = function isPersisted(){
  return (this.getChangedProps().length === 0);
}

/**
 *
 * set up a before hook for desired action with given function
 *
 * @param {String} action
 * @param {Function} fn
 *
 */
Model.before = function before( action, fn ){
  this.hooks.before[action].push( fn );
}

/**
 *
 * set up a after hook for desired action with given function
 *
 * @param {String} action
 * @param {Function} fn
 *
 */
Model.after = function after( action, fn ){
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

    var changed = []
      , self = this;

    if( this._newRecord )
      return this._fields;

    this._fields.forEach( function( field ){
      if(   this._persistedProps &&
            !field.match(/className|history|_id/) &&
            ( !(field in this._persistedProps) || 
            this[field] != this._persistedProps[field] ) )
              changed.push( field );
    });

    return changed;
}

/**
 * create a new instance of this model variant and
 * save it to the database
 *
 * @param {Object} holder - the user holding this object
 * @param {Object} props - properties to be set for this object
 * @param {Function} callback - the callback to be run after the database insertion
 *                callback will receive: ({String} err, {Object} doc)
 *
 * @example
 * create( user, {name: 't'}, function( err, doc ){} );
 *
 */
Model.create = function create( holder, props, callback ){

  if ( arguments.length === 2 ){
    callback = props; 
    props = holder; 
    holder = null; 
  }

  var doc = this.new( holder, props );
  doc.save( callback ); 

}

Model.before('save', function updateModifierHook( next ){

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

AccessControl.setupCreator.call( Model );

module.exports = require( __dirname + '/adapters/mongo/extend_model')( Model );
