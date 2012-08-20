// #CreioObject
// a basic array class

var Property = require( __dirname + '/property' );

function CreioObject(){ };
CreioObject.inherits( Property );

CreioObject.prototype.setValue = function( value ){
	if( typeof( value ) === 'object' )
		this.value = value;
	else
		throw new Error(this.constructor.name + ".setValue("+value+"): unrecognized type ("+typeof(value)+")");
	return this;
}

module.exports = CreioObject;