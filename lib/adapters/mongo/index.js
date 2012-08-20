// # MongoConnectionHandler

var mongoskin = require('mongoskin');

var _db;

// # connect( url )
//
// ### url {String}
// a string, e.g.: localhost:27017/testDB
//
module.exports.connect = function ( url ){

	var _db = mongoskin.db( url );
	return _db;

}

module.exports.db = function(){ return _db };