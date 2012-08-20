// #CreioDateTime
// a basic datetime class

var moment = require('moment');

var Property = require( __dirname + '/property' );

function CreioDateTime(){ };
CreioDateTime.inherits( Property );

CreioDateTime.prototype.setValue = function( value ){
	if( typeof( value ) === 'string' )
		this.value = moment(value).toDate();
	else if( typeof( value ) === 'object' && value instanceof Date )
		this.value = value;
	else
		throw new Error(this.constructor.name + ".setValue("+value+"): unrecognized type ("+typeof(value)+")");
	return this;
}

module.exports = CreioDateTime;