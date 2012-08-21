// # MongoConnectionHandler

var mongoskin = require('mongoskin');

var _db;

/**
 *
 * open connection to the mongodb
 *
 * @param {String} url
 *
 * @example
 * localhost:27017/testDB
 *
 */
module.exports.connect = function ( url ){

	var _db = mongoskin.db( url );
	return _db;

}

module.exports.db = function(){ return _db };