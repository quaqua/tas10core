// # RepositoryLogger
//
// logs to repository log file.

var fs = require('fs')
  , moment = require('moment');

function RepositoryLogger( logfile ){

	logfile && (this.logfile = logfile);
	if( !this.logfile ) throw new Error(' no logfile' );

	if( ! fs.existsSync( logfile ) )
		this.info( 'successfully created tas10io logfile' );

}

RepositoryLogger.prototype.log = function( status, msg ){

	var d = moment().format("YYYY-MM-DD HH:mm:ss");
	fs.appendFileSync( this.logfile, d + " [" + status.toUpperCase() + "] " + msg + "\n" );

}

RepositoryLogger.prototype.info = function( msg ){
	this.log( 'info', msg );
}

RepositoryLogger.prototype.error = function( msg ){
	this.log( 'error', msg );
}

module.exports = RepositoryLogger;