function Tas10Array( value ){
	if( typeof(value) === 'string' )
		val = value.split(',');
	else if( typeof( value ) === 'object' && value instanceof Array )
		val = value;
	else
		throw new Error(this.constructor.name + ".setValue("+value+"): unrecognized type ("+typeof(value)+")");
	return val;
}

var Property = require( __dirname + '/property');
Tas10Array.inherits( Property );

module.exports = Tas10Array;