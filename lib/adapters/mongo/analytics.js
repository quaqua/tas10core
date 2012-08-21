/* 
 * tas10core by TASTENWERK
 * author: thorsten.zerha@tastenwerk.com
 * 
 * copyright (2012) by TASTENWERK e.U.
 *
 * http://www.tastenwerk.com/tas10core
 * 
 */

var _collectionName = 'analytics'
  , moment = require( 'moment' )
  , Query = require( __dirname + '/query' );

module.exports = function( Analytics, db, logger ){

	function updateOrInsertAnalytic( doc, callback ){

	}

	function createAnalytic( props, callback ){
		Analytics.collection().insert( props, {safe: true}, function(err, doc){
			if( doc )
				updateOrInsertAnalytic( doc, callback );
			else
				callback( err );
		});
	}

	Analytics.collection = function(){ return db.collection( _collectionName ); }

	Analytics._update = function( doc, props, callback ){

		var newClients = {};
		newClients[props['ip']] = {count: 1, browser: props['browser'], geo: props['geo']};
		if( doc.pages && (props['page_id'] in doc.pages) )
			if( props['ip'] in doc.pages[props['page_id']].clients){
				doc.pages[props['page_id']].clients[props['ip']].count++;
				doc.pages[props['page_id']].clients[props['ip']].geo = props['geo']
			} else
				doc.pages[props['page_id']].clients[props['ip']] = { count: 1, browser: props['browser'], geo: props['geo']};
		else
			doc.pages[props['page_id']] = {clients: newClients};

		this.collection().update( {_id: doc._id}, doc, function(err, num){
			if( err )
				callback( err );
			else
				callback( null, doc);
		});

	}

	Analytics._create = function( date, props, callback ){

		this.collection().insert( {at: date, pages: {}}, {safe: true}, function(err, doc ){
			if( err === null && doc )
				Analytics._update( doc[0], props, callback )
			else
				callback( err );
		})
	};

	Analytics._findDateAndInsert = function( date, props, callback ){

		this.collection().findOne( {at: date}, function( err, doc ){
			if( doc )
				Analytics._update( doc, props, callback );
			else
				Analytics._create( date, props, callback );
		});

	};

	Analytics.insert = function( props, callback ){
		if( !('at' in props) )
			props['at'] = moment.utc().sod().toDate();
		logger.info(props);
		Analytics._findDateAndInsert( props['at'], props, callback );
	}
	Analytics.query = function(){ return new Query( this.collection(), Analytics, null ); }
	Analytics.destroy = function( callback ){ this.collection().remove( callback );}

	return Analytics;

}