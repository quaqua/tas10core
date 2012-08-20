var vows = require('vows')
  , assert = require('assert')
  , RepositoryLogger = require('../lib/repository_logger')
  , fs = require('fs');

var logfile = './test.log';

vows.describe('Mongo basics').addBatch({

	"Logfile is started if RepositoryLogger is initialized": {

		topic: function(){ new RepositoryLogger( logfile ); fs.readFile( logfile, 'utf8', this.callback ); },

		"Logfile exists and has one line": function( err, data ){
			assert.lengthOf( data.split('\n'), 2);
		}
	}

}).addBatch({

	"Logs a string to the logfile": {

		topic: function(){
			var logger = new RepositoryLogger( logfile );
			logger.error('test');
			return true;
		},

		"Logfile now contains one additional log entry": function( b ){
			var data = fs.readFileSync( logfile, 'utf8' );
			assert.lengthOf( data.split('\n'), 3 );
		}



	}

}).addBatch({

	"Removes file at end of spec": function(){
		assert.isTrue( fs.existsSync( logfile ) );
		fs.unlinkSync( logfile );
		assert.isFalse( fs.existsSync( logfile ) );
	}

}).export(module);