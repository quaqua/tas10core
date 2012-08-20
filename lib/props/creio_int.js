// #CreioInt
// a basic int class

var Property = require( __dirname + '/property' );

function CreioInt(){ };
CreioInt.inherits( Property );

CreioInt.prototype.setValue = function( value ){
	if( typeof(value) === 'string' )
		this.value = parseInt( value );
	else if( typeof( value ) === 'number' )
		this.value = value;
	else
		throw new Error(this.constructor.name + ".setValue("+value+"): unrecognized type (cannot be casted into number)");
	return this;
}

module.exports = CreioInt;