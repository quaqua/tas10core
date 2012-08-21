// #Tas10Boolean
// a basic int class

var Property = require( __dirname + '/property' );

function Tas10Boolean(){ };
Tas10Boolean.inherits( Property );

Tas10Boolean.prototype.setValue = function( value ){
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

module.exports = Tas10Boolean;