var RepositoryLogger = require( __dirname + '/lib/repository_logger' );

var _db
  , _logfile = './tas10core.log'
  , _Model = require( __dirname + '/lib/model' )
  , _Analytics = require( __dirname + '/lib/analytics' )
  , _User
  , _Group
  , _Document;

module.exports.connect = function( url ){

	if( url.indexOf('mongodb://') === 0 ){

		var mongoAdapter = require( __dirname + '/lib/adapters/mongo' );
		_db = mongoAdapter.connect( url.replace('mongodb://','')  );

		_Analytics = require( __dirname + '/lib/adapters/mongo/analytics' )( _Analytics,
			_db, new RepositoryLogger( _logfile ) );

		_Model = require( __dirname + '/lib/adapters/mongo/extend_model')( _Model, 
			_db, new RepositoryLogger( _logfile ) );

		_User = require( __dirname + '/lib/models/user' );
		_Group = require( __dirname + '/lib/models/group' );
		_Document = require( __dirname + '/lib/models/document' )
 
	
	} else if( url.indexOf('sqlite://') === 0 )
		console.log("sqlite is not implemented yet!");

	if( _db )
		console.log('[tas10core] connection to \'' + url + '\' established')

}

module.exports.db = function db(){ return _db(); };

module.exports.setLogfile = function( logfile ){
	_logfile = logfile;
}

module.exports.logger = function logger(){
	var logger = new RepositoryLogger( _logfile );
	return logger; 
}

module.exports.Model = _Model;
module.exports.getModel = function(){ return _Model; };
module.exports.getUser = function(){ return _User; };
module.exports.getGroup = function(){ return _Group; };
module.exports.getDocument = function(){ _Document; };
module.exports.getAnalytics = function(){ _Analytics; };
module.exports.getQuery = function(){ return require( __dirname + '/lib/adapters/mongo/query' ); }