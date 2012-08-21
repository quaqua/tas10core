// #Tas10String
// a basic string class

function Tas10String( value ){
	return (value ? value.toString() : null);
}

var Property = require( __dirname + '/property');
Tas10String.inherits( Property );

module.exports = Tas10String;