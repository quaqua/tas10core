// #Tas10Object
// a basic array class

function Tas10Object( value ){
	if( typeof( value ) === 'object' )
		val = value;
	else
		throw new Error(this.constructor.name + ".setValue("+value+"): unrecognized type ("+typeof(value)+")");
	return val;
}

module.exports = Tas10Object;