# CRECORE
a database mapper for SQL / MongoDB implementing a full
content repository (used with CRESYS). The mapper modules
has been detached from the CRESYS app-framework in order
to be used and developed independently.

## Installation

	npm install crecore

## Quick Usage

Create a new connection

	var crecore = require('crecore');
	crecore.open( 'mongo://localhost:27017/testCresys');

Get all documents in the repository regardeless of type:

	var Document = require('crecore/document');
	Document.query().find( function( err, docs ){
		docs.forEach( function( doc ){
			console.log( doc.name );
		})
	}

Define a new Document

	var DocumentModel = require('crecore/document_model');

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