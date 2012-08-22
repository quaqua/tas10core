# tas10core
a database mapper for SQL / MongoDB implementing a full
content repository (used with creSYS). The mapper modules
has been detached from the creSYS app-framework in order
to be used and developed independently.

## Installation

	npm install tas10core

## Quick Usage

Create a new connection

	var tas10core = require('tas10core');
	tas10core.connect( 'mongodb://localhost:27017/test_tas10core');

Get all documents in the repository regardeless of type:

	var Document = require('tas10core/document');
	Document.query().find( function( err, docs ){
		docs.forEach( function( doc ){
			console.log( doc.name );
		})
	}

Define a new Document

	var DocumentModel = require('tas10core/model');

	function MyDocument(){};
	MyDocument.inherits( DocumentModel );

	MyDocument.schema( 'starts_at', 'ends_at' )

or / and:

	MyDocument.schema( {'members': { value: [], type: 'array'}} );

Insert a Document

	m = new MyDocument({ name: 'test' });
	m.members.push('a');

Saving the document to the repository

	m.save( function( err, doc ){
		doc !== m
	});