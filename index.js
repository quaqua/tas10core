var RepositoryLogger = require( __dirname + '/lib/repository_logger' );

var _db
  , _logfile = './tas10io.log'
  , _Model = require( __dirname + '/lib/model' )
  , _Analytics = require( __dirname + '/lib/analytics' );

module.exports.connect = function( url ){

	if( url.indexOf('mongodb://') === 0 ){

		var mongoAdapter = require( __dirname + '/lib/adapters/mongo' );
		_db = mongoAdapter.connect( url.replace('mongodb://','')  );

		_Analytics = require( __dirname + '/lib/adapters/mongo/analytics' )( _Analytics,
			_db, new RepositoryLogger( _logfile ) );

		_Model = require( __dirname + '/lib/adapters/mongo/extend_model')( _Model, 
			_db, new RepositoryLogger( _logfile ) );
 
	
	} else if( url.indexOf('sqlite://') === 0 )
		console.log("sqlite is not implemented yet!");

}

module.exports.db = function db(){ return _db(); };

module.exports.setLogfile = function( logfile ){
	_logfile = logfile;
}

module.exports.logger = function logger(){
	var logger = new RepositoryLogger( _logfile );
	return logger; 
}