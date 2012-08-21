var Query = require( __dirname + '/query' )
  , AccessError = require( __dirname + '/../../errors/access_error' );

module.exports = function( Model, db, logger ){

	// # Model.collectionName()
	//
	// returns this model's collection name (mostly, this will be 'documents')
	//
	Model.collectionName = function(){ 
		var cN = this.name.toLowerCase(); 
		return ( cN+'s' ) //cN.match(/user|group/) ? cN+'s' : 'documents' ) 
	}

	// # Model.collection()
	//
	// type: sync
	//
	// returns the collection object for this model. This can be used to
	// perform custom queryies and interoperate with the mongodb driver
	// directly
	//
	Model.collection = function(){

		return db.collection( this.collectionName() );

	}

	// # Model.trashCollection()
	//
	// the collection name of the trash. Here go documents which get deleted
	// (not explicitely with permanent switch)
	//
	Model.trashCollection = function(){ return db.collection( (this.collectionName()+'_trash' ) ); }

	// # Model.query( holder )
	//
	// returns a query object which can be used to stack up a query
	// and run the query with find (see [query.html](query.html) )
	//
	Model.query = function( holder ){ 
		return new Query( this.collection(), this, holder ); 
	}

	// # Model.destroy()
	//
	// type: async
	//
	// destroys ALL documents of this type
	//
	// ### callback {Function}
	//
	Model.destroy = function( callback ){
		logger.info( 'request to delete all contents of collection \'' + this.collectionName() + '\'');
	    this.collection().remove( callback );
	}

	// # Model.drop()
	//
	// type: async
	//
	// drops the whole collection (leaves no traces)
	//
	Model.drop = function( callback ){

		var self = this;

		logger.info( 'request to drop collection \'' + this.collectionName() + '\'');

		db.collections( function( err, collections ){
			var found = false;
			collections.forEach( function( coll ){
				if( coll.collectionName === self.collectionName() )
					found = true;
			});

			if( found )
				self.collection().drop( callback );
			else
				callback( null, false );

		});
	}

	// # ensureIndex
	//
	// type: async
	//
	// ensures the given index is present in the repository
	//
	// ### callback {Function}
	//
	Model.ensureIndex = function( index, options, callback ){

		var opts = { unique: true, background: true, dropDups: true, safe: true };

		if( typeof( options ) === 'function' ){
			callback = options;
		} else
			for( var i in options )
				opts[i] = options[i];

		this.collection().ensureIndex( index, opts, callback );

	}

	// # listIndexes
	//
	// type: async
	//
	// lists all indexes for this collection
	//
	// ### callback {Function}
	//
	Model.listIndexes = function( callback ){
		this.collection().indexInformation( callback );
	}

	// # save
	//
	// type: async
	//
	// saves the model to the repository after all hooks have
	// successfully passed an validations matched
	//
	Model.prototype.save = function save( callback ){		

		this.runHooks( 'before', 'save', function continueAfterRunHooksBeforeSave( self ){

			if( self._newRecord )
				self._insert( callback );
			else
				self._update( callback );

		});
	}

	// # private: _insert
	//
	// inserts the model into the repository (new record);
	Model.prototype._insert = function _insert( callback ){

		var self = this;

		self.runHooks( 'before', 'create', function continueAfterRunHooksBeforeCreate(){

			function finishInsert(){
				self.constructor.collection().insert( self.normalizeProps(), {safe: true}, function(err, newDocumentProps){

					if( err )
						callback(err);

					else if( newDocumentProps.length === 1){

						logger.info( 'INSERTED name: ' + self.name + ' id: '+newDocumentProps[0]._id+' user: ' + self.holder );

						self._setupProps( newDocumentProps[0] );
						self._setupPersistedProps();
						self._newRecord = false;

						self.runHooks( 'after', 'create', function continueAfterRunHooksAfterCreate(){

							self.runHooks( 'after', 'save', function continueAfterRunHooksAfterSave(){

								callback( null, self );

							});

						});
					} else
						throw new Error("tas10io specification transgression. Please only insert one document object at time!");
				});
			};

			if( self.label_ids.length > 0 )
				self.loadLabels( function( err, label_ids ){
					for( label in label_ids ){
						for( acl in label_ids[label].acl )
							self.acl[ acl ] = label_ids[label].acl[acl];
					}
					finishInsert();
				})
			else
				finishInsert();
		});

	}

	/**
	 * load labels of this model
	 *
	 * @param {Function} callback
	 *
	 */
	Model.prototype.loadLabels = function loadLabels( callback ){
		var self = this;
		this.constructor.collection().find( {_id: { $in: self.label_ids } } ).toArray( function( err, results ){
		    if( err )
				callback(err);
		    else{
				docs = [];
				results.forEach( function( res ) {
					docs.push( self.constructor.new(self.holder, res) );
				});
	      		callback(null, docs);
			}
		});
	},

	/**
	 * load documets, that label this document
	 *
	 * @param {Function} callback
	 *
	 */
	Model.prototype.loadLabelers = function loadLabelers( callback ){
		var self = this;
		this.constructor.collection().find( {"label_ids": self._id } ).toArray( function( err, results ){
		    if( err )
				callback(err);
		    else{
				docs = [];
				results.forEach( function( res ) {
					docs.push( self.constructor.new(self.holder, res) );
				});
	      		callback(null, docs);
			}
		});
	}


	/**
	 * updates relating labelers and triggers callback
	 *
	 * @param {Function} callback
	 *
	 */
	Model.prototype._updateLabelersAndTrigger = function( callback ){
		var self = this
		  , pushVal
		  , updateObj;
		for( var i in self._aclChanged ){
			if( self._aclChanged[i] ){
				pushVal = {}
				pushVal["acl."+i] = self._aclChanged[i];
				updateObj = {$push: pushVal};
			} else
				updateObj = {$pull: {"acl": i}};
		}
		this.constructor.collection().update( {"label_ids": self._id }, updateObj, {safe: true},
			function( err, numChangedRecords ){
				if( err )
					callback( err );
				else{
					self.loadLabelers( function( err, labelers ){
						var count = labelers.length;
						function _checkAllAndTriggerCallback(){
							if( count === 0 ){
								self._aclChanged = null;
								callback( null, self );
							}
						}
						if( count ){
							labelers.forEach( function(labeler){
								labeler._aclChanged = {};
								for( i in self._aclChanged )
										labeler._aclChanged[i] = self._aclChanged[i];
								labeler._updateLabelersAndTrigger( function(){
									count--;
									_checkAllAndTriggerCallback(); 
								});
							});
						} else
							_checkAllAndTriggerCallback();
					})
				}
			}
		);
	},

	Model.prototype._update = function _update( callback ){
		
		var self = this;

		if( !self.constructor.name.match(/User|Group/) && !self.canWrite() )
			throw AccessError.call( this );

		self.runHooks( 'before', 'update', function continueAfterRunHooksBeforeUpdate(){

			self.constructor.collection().update( {_id: self._id}, self.normalizeProps(), {safe: true}, 
				function( err, numChangedRecords ){

					if( err === null && numChangedRecords === 1 ){

						logger.info( 'UPDATED name: ' + self.name + ' id: '+self._id+' user: ' + self.holder );

						self.runHooks( 'after', 'update', function continueAfterRunHooksAfterUpdate(){
							self.runHooks( 'after', 'save', function continueAfterRunHooksAfterSave(){
								if( self._aclChanged )
									self._updateLabelersAndTrigger( callback );
								else
							  		callback( null, self );
							});
						} );
					} else
					  callback( err );
				}
			);

		} );
	}

	// # destroy( permanetly|callback, callback )
	//
	// type: async
	//
	// destroys this model instance.
	//
	// ### permanently {Boolean}
	// if present, this model instance will not be moved to the
	// trash bin, but entirely deleted from the repository
	//
	// ### callback {Function}
	//
	Model.prototype.destroy = function destroy( permanently, callback ){

		var self = this;

		if( typeof(permanently) === 'function' )
			callback = permanently;

		if( !self.constructor.name.match(/User|Group/) && !self.canDelete() )	
			throw AccessError(this);
		
		this.runHooks( 'before', 'destroy', function continueAfterRunHooksBeforeDestroy(){

			self.constructor.collection().remove( {_id: self._id}, {safe: true}, function( err, numDestroyed ){

				if( err )
					callback(err);
				else if( numDestroyed != 1 )
					callback( numDestroyed + " objects have been destroyed (not good)!" );
				else{
					self._deleted = true;
					self.runHooks( 'after', 'destroy', function continueAfterRunHooksAfterDestroy(){
						if( typeof(permanently) === 'function' ){
							self.constructor.trashCollection().insert(self.normalizeProps(), 
									{ safe: true }, 
									function(err, newDocumentProps){
										if( err )
											callback( err );
										else
											callback(null, self);
									}
								);
						} else
							callback( null, self );
					});
				}
			} );

		});
	}

	return Model;
}