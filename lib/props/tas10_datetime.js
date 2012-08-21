// #Tas10DateTime
// a basic datetime class

var moment = require('moment');

function Tas10DateTime( value ){
	if( typeof( value ) === 'string' )
		val = moment(value).toDate();
	else if( typeof( value ) === 'object' && value instanceof Date )
		val = value;
	else
		throw new Error(this.constructor.name + ".setValue("+value+"): unrecognized type ("+typeof(value)+")");
	return val;
}

module.exports = Tas10DateTime;