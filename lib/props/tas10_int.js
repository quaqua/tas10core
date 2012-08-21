// #Tas10Int
// a basic int class

var Property = require( __dirname + '/property' );

function Tas10Int(){ };
Tas10Int.inherits( Property );

Tas10Int.prototype.setValue = function( value ){
	if( typeof(value) === 'string' )
		this.value = parseInt( value );
	else if( typeof( value ) === 'number' )
		this.value = value;
	else
		throw new Error(this.constructor.name + ".setValue("+value+"): unrecognized type (cannot be casted into number)");
	return this;
}

module.exports = Tas10Int;