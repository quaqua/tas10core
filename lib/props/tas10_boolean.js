// #Tas10Boolean
// a basic int class

function Tas10Boolean( value ){
	if( typeof(value) === 'string' )
		val = value.search(/t|true|T|TRUE|1/) >= 0;
	else if( typeof(value) === 'number' )
		val = (value > 0);
	else if( typeof( value ) === 'boolean' )
		val = value;
	else
		throw new Error(this.constructor.name + ".setValue("+value+"): unrecognized type ("+typeof(value)+")");
	return val;
}

module.exports = Tas10Boolean;