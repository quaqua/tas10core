// #Tas10Object
// a basic array class

var Property = require( __dirname + '/property' );

function Tas10Object(){ };
Tas10Object.inherits( Property );

Tas10Object.prototype.setValue = function( value ){
	if( typeof( value ) === 'object' )
		this.value = value;
	else
		throw new Error(this.constructor.name + ".setValue("+value+"): unrecognized type ("+typeof(value)+")");
	return this;
}

module.exports = Tas10Object;