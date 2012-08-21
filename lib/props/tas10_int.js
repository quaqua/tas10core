// #Tas10Int
// a basic int class

function Tas10Int( value ){
	if( typeof(value) === 'string' )
		val = parseInt( value );
	else if( typeof( value ) === 'number' )
		val = value;
	else
		throw new Error(this.constructor.name + ".setValue("+value+"): unrecognized type (cannot be casted into number)");
	return val;
}

module.exports = Tas10Int;