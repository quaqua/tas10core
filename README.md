# tas10io
a database mapper for SQL / MongoDB implementing a full
content repository (used with creSYS). The mapper modules
has been detached from the creSYS app-framework in order
to be used and developed independently.

## Installation

	npm install tas10io

## Quick Usage

Create a new connection

	var tas10io = require('tas10io');
	tas10io.connect( 'mongo://localhost:27017/testCresys');

Get all documents in the repository regardeless of type:

	var Document = require('tas10io/document');
	Document.query().find( function( err, docs ){
		docs.forEach( function( doc ){
			console.log( doc.name );
		})
	}

Define a new Document

	var DocumentModel = require('tas10io/model');

	function MyDocument(){};
	MyDocument.inherits( DocumentModel );

	MyDocument.schema( 'starts_at', 'ends_at', {'members': { value: [], type: 'array'}} );

Insert a Document

	m = new MyDocument({ name: 'test' });
	m.members.push('a');

Saving the document to the repository

	m.save( function( err, doc ){
		doc !== m
	});