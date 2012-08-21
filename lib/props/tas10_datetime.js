// #Tas10DateTime
// a basic datetime class

var moment = require('moment');

var Property = require( __dirname + '/property' );

function Tas10DateTime(){ };
Tas10DateTime.inherits( Property );

Tas10DateTime.prototype.setValue = function( value ){
	if( typeof( value ) === 'string' )
		this.value = moment(value).toDate();
	else if( typeof( value ) === 'object' && value instanceof Date )
		this.value = value;
	else
		throw new Error(this.constructor.name + ".setValue("+value+"): unrecognized type ("+typeof(value)+")");
	return this;
}

module.exports = Tas10DateTime;