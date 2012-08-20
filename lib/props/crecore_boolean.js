// #CrecoreBoolean
// a basic int class

var Property = require( __dirname + '/property' );

function CrecoreBoolean(){ };
CrecoreBoolean.inherits( Property );

CrecoreBoolean.prototype.setValue = function( value ){
	if( typeof(value) === 'string' )
		this.value = value.search(/t|true|T|TRUE|1/) >= 0;
	else if( typeof(value) === 'number' )
		this.value = (value > 0);
	else if( typeof( value ) === 'boolean' )
		this.value = value;
	else
		throw new Error(this.constructor.name + ".setValue("+value+"): unrecognized type ("+typeof(value)+")");
	return this;
}

module.exports = CrecoreBoolean;