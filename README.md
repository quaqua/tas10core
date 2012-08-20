# creIO
a database mapper for SQL / MongoDB implementing a full
content repository (used with CRESYS). The mapper modules
has been detached from the CRESYS app-framework in order
to be used and developed independently.

## Installation

	npm install creio

## Quick Usage

Create a new connection

	var creio = require('creio');
	creio.open( 'mongo://localhost:27017/testCresys');

Get all documents in the repository regardeless of type:

	var Document = require('creio/document');
	Document.query().find( function( err, docs ){
		docs.forEach( function( doc ){
			console.log( doc.name );
		})
	}

Define a new Document

	var DocumentModel = require('creio/document_model');

	var MyDocument = function(){};
	MyModel.inherits( DocumentModel );

	MyModel.attributes( 'starts_at', 'ends_at', {'members': { value: [], type: 'array'}} );

Insert a Document

	m = new MyModel({ name: 'test' });
	m.members.push('a');

Saving the document to the repository

	m.save( function( err, doc ){
		doc !== m
	});