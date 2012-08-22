/**
 *
 * example demonstrating a basic use of a new document model
 * and CRUD (create/read/update/delete) actions for it
 *
 * a running mongo server is required
 *
 * this example does not use user authentication!
 *
 */

// outside the tas10core exmamples directory, you should require
//
// var tas10core = require('tas10core');
// var Model = require('tas10core/lib/model');
//
// here we do
var tas10core = require('../index');
var Model = require('../lib/model');

tas10core.connect('mongodb://localhost:27017/test_tas10core');


function MyDoc(){}
MyDoc.inherits( Model );
MyDoc.schema( 'description', 'statistics' );

// note the 'name'-field. It is predefined for every Model
// and a must criteria for saving to the database

var my = MyDoc.new({ name: 'mydoc', description: 'test', statistics: 'none' });

// until here pretty straight forward. Now the asynchronous part
// as this example is so simple, we will continue in nested
// spaghetti code:

my.save( function saveMyDoc( err, mydoc ){

	// err should be null. If you don't get the mydoc,
	// check it for messages
	if( err )
		console.log('error: ', err);
	else {
		console.log('successfully created mydoc');
		console.log( mydoc.toJSON() );
		process.exit(0);
	}

});
