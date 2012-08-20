// # MongoConnectionHandler

var MongoDb = require('mongodb').Db
  , Server = require('mongodb').Server
  , Connection = require('mongodb').Connection;

// # new MongoConnectionHandler( url )
//
// ### url
// a string, e.g.: localhost:27017/testDB
//
function MongoConnectionHandler( url ){

	var host = url.split(':')[0]
	  , port = parseInt(url.split(':')[1].split('/')[0])
	  , database = url.split(':')[1].split('/')[1]

	this._db = new MongoDb( database, new Server(host, port, {}), { native_parser: false } );
	this._db.open( function( err, db ) {
		if(err) throw err    

		// db.ensureIndex("locations", {loc:"2d"}, function(err, result) {
		//if(err) throw err    
		//
		//app.listen(8124);
		//})  
	});

}

module.exports.connect = function( url ){
	var connHandler = new MongoConnectionHandler( url );
	return connHandler;
}