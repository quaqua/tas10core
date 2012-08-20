var Query = require( __dirname + '/query' );

module.exports = function( Model ){

	Model.query = function( holder ){ return new Query( holder ); }

	return Model;
}