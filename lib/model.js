// # Model INTERFACE
// the document model is the parent object
// for any other content repository object like
// users, audits, groups, sessions, ...

var ObjectId = require('mongodb').BSONPure.ObjectID;

require( __dirname + '/inherits' );

var CrecoreString = require( __dirname + '/props/crecore_string' )
  , CrecoreInt = require( __dirname + '/props/crecore_int' )
  , CrecoreArray = require( __dirname + '/props/crecore_array' )
  , CrecoreObject = require( __dirname + '/props/crecore_object' )
  , CrecoreDateTime = require( __dirname + '/props/crecore_datetime' )
  , CrecoreBoolean = require( __dirname + '/props/crecore_boolean' );

// # var n = new Model( properties );
//
var Model = function(){};

// # new( user | object, object )
// create a new instance of this
// model
Model.new = function( holder, properties ){

  var o = new this();

  arguments.length === 1 && (properties = holder);
  o.holder = holder;
  o._initProps();
  o._setupProps( properties );

  return o;

}

Model.prototype.props = {};

Model._baseSchema = {

  className: { type: CrecoreString },
  name: { type: CrecoreString, index: true, default: null, required: true },
  history: { type: CrecoreArray, default: [] },
  acl: { type: CrecoreObject, default: {} },
  position: { type: CrecoreInt, default: 999 },
  labels: { type: CrecoreArray, default: [] },
  starred: {type: CrecoreBoolean }

};

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
  if( props && typeof(props) === 'object' )
    for( var i in props )
      if(i in this._baseSchema) 
        throw new Error(this.constructor.name+" overriding baseSchema properties is not allowed (name: " +i+ ")");
      else
        this._baseSchema[i] = props[i];
  return this._baseSchema;
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

module.exports = Model;
