// #CrecoreObject
// a basic array class

var Property = require( __dirname + '/property' );

function CrecoreObject(){ };
CrecoreObject.inherits( Property );

CrecoreObject.prototype.setValue = function( value ){
	if( typeof( value ) === 'object' )
		this.value = value;
	else
		throw new Error(this.constructor.name + ".setValue("+value+"): unrecognized type ("+typeof(value)+")");
}

module.exports = CrecoreObject;