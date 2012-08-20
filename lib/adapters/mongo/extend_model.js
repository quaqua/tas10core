var Query = require( __dirname + '/query' );

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
		logger.info( 'request to drop collection \'' + this.collectionName() + '\'');
		this.collection().drop( callback );
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

						doc = self.constructor.new(self.holder, newDocumentProps[0]);

						self.runHooks( 'after', 'create', function continueAfterRunHooksAfterCreate(){

							self.runHooks( 'after', 'save', function continueAfterRunHooksAfterSave(){

								callback( null, doc );

							});

						});
					} else
						throw new Error("creIO specification transgression. Please only insert one document object at time!");
				});
			};

			if( self.labels.length > 0 )
				self.getLabels( function( err, labels ){
					for( label in labels ){
						for( acl in labels[label].acl )
							self.acl[ acl ] = labels[label].acl[acl];
					}
					finishInsert();
				})
			else
				finishInsert();
		});

	}

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
									self._updateTaggersAndTrigger( callback );
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