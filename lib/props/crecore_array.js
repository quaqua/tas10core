// #CrecoreArray
// a basic array class

var Property = require( __dirname + '/property' );

function CrecoreArray(){ };
CrecoreArray.inherits( Property );

CrecoreArray.prototype.setValue = function( value ){
	if( typeof(value) === 'string' )
		this.value = value.split(',');
	else if( typeof( value ) === 'object' && value instanceof Array )
		this.value = value;
	else
		throw new Error(this.constructor.name + ".setValue("+value+"): unrecognized type ("+typeof(value)+")");
	return this;
}

module.exports = CrecoreArray;