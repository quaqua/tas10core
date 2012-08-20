var _db
  , _Model = require( __dirname + '/lib/model' );

module.exports.connect = function( url ){

	if( _db )
		return _db;

	if( url.indexOf('mongodb://') === 0 ){
	    
		var mongo = require( __dirname + '/lib/adapters/mongo' );
		_db = mongo.connect(url.replace('mongodb://',''));

		_Model = require( __dirname + '/lib/adapters/mongo/extend_model')( _Model );

		console.log('model query', _Model.query);

	
	} else if( url.indexOf('sqlite://') === 0 )
		console.log("sqlite is not implemented yet!");

	return _db;
	
}

module.exports.db = function(){ return _db };
module.exports.Model = _Model;