var Query = require( __dirname + '/query' )
  , AccessError = require( __dirname + '/../../errors/access_error' );

module.exports = function( Model, db, logger ){

	/**
	 * returns this model's collection name (mostly, this will be 'documents')
	 *
	 */
	Model.collectionName = function(){ 
		var cN = this.name.toLowerCase(); 
		return ( cN.match(/user|group/) ? cN+'s' : 'documents' ) 
	}

	/**
	 * returns the collection object for this model. This can be used to
	 * perform custom queryies and interoperate with the mongodb driver
	 * directly
	 *
	 */
	Model.collection = function(){

		return db.collection( this.collectionName() );

	}

	/**
	 *
	 * the collection name of the trash. Here go documents which get deleted
	 * (not explicitely with permanent switch)
	 *
	 */
	Model.trashCollection = function(){ return db.collection( (this.collectionName()+'_trash' ) ); }

	/**
	 *
	 * returns a query object which can be used to stack up a query
	 * and run the query with find (see [query.html](query.html) )
	 *
	 * @param {User} holder
	 *
	 * @returns {Query} a query instance
	 *
	 */
	Model.query = function( holder ){ 
		return new Query( this.collection(), this, holder ); 
	}

	/**
	 *
	 * destroys ALL documents of this type
	 *
	 * @param {Function} callback
	 *
	 */
	Model.destroy = function( callback ){
		logger.info( 'request to delete all contents of collection \'' + this.collectionName() + '\'');
	    this.collection().remove( callback );
	}

	/**
	 *
	 * drops the whole collection (leaves no traces)
	 *
	 * @param {Function} callback
	 *
	 */
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

	/**
	 *
	 * ensures the given index is present in the repository
	 *
	 * @param {String} index - the field name to be indexed
	 * @param {Object} options - options (see mongo documetation for details http://www.mongodb.org/display/DOCS/Indexes)
	 *
	 * @param {Function} callback
	 *
	 */
	Model.ensureIndex = function( index, options, callback ){

		var opts = { unique: false, background: true, dropDups: true, safe: true };

		if( typeof( options ) === 'function' ){
			callback = options;
		} else
			for( var i in options )
				opts[i] = options[i];

		this.collection().ensureIndex( index, opts, callback );

	}

	/**
	 *
	 * lists all indexes for this collection
	 *
	 * @param {Function} callback
	 *
	 */
	Model.listIndexes = function( callback ){
		this.collection().indexInformation( callback );
	}

	/**
	 * saves the model to the repository after all hooks have
	 * successfully passed an validations matched
	 *
	 * @param {Function} callback
	 *
	 */
	Model.prototype.save = function save( callback ){		

		this.runHooks( 'before', 'save', function continueAfterRunHooksBeforeSave( self ){

			if( self._newRecord )
				self._insert( callback );
			else
				self._update( callback );

		});
	}

	/**
	 *
	 * @private
	 *
	 * inserts the model into the repository (new record);
	 *
	 * @param {Function} callback
	 *
	 */
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
	 *
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
	 *
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
	 *
	 * add a label to this model
	 *
	 * @param {Model} doc - a model derived document
	 *
	 */
	Model.prototype.addLabel = function( doc ){
		if( doc._id.toString() === this._id.toString() )
			throw new Error("cannot label document with itself");
		this.label_ids.indexOf( doc._id ) < 0 && this.label_ids.push( doc._id );
	  	for( var i in doc.acl )
	    	if( ! this.acl[i] )
	      		this.acl[i] = doc.acl[i];
	}

	/**
	 *
	 * remove a label from this model
	 *
	 * @param {Model} doc - a model derived document
	 *
	 */
	Model.prototype.removeLabel = function( doc ){
		if( doc._id && this.label_ids.indexOf( doc._id ) < 0 )
			this.label_ids.splice( this.label_ids.indexOf( doc._id ), 1 );
	}

	/**
	 *
	 * @private
	 *
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

	/**
	 *
	 * @private
	 *
	 * updates the model with set properties
	 *
	 * @param {Function} callback
	 *
	 */
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

	/**
	 *
	 * destroys this model instance.
	 *
	 * @param {Boolean} permanently - 
	 * if present, this model instance will not be moved to the
	 * trash bin, but entirely deleted from the repository
	 *
	 * @param {Function} callback
	 *
	 */
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

					self.constructor.collection().update({'label_ids': self._id}, {$pull: {'label_ids': self._id}}, {safe: true},
						function( err, numAffected){

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

					}); // collection().update({'label_ids'})
				}

			}); // collection().remove({ _id: self._id})

		});
	}

	return Model;
}