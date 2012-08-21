/* 
 * tas10core by TASTENWERK
 * author: thorsten.zerha@tastenwerk.com
 * 
 * copyright (2012) by TASTENWERK e.U.
 *
 * http://www.tastenwerk.com/tas10core
 * 
 */

var AccessError = require( __dirname + '/errors/access_error' );

function _isUserAndCanRead( self, user ){
	return ( typeof(user) === 'object' && user._id && (user._id in self.acl) );
}

function _aclInclude( user, priv ){
	if( this.newRecord )
		return true;
	if( typeof(user) === 'undefined' )
		user = this.holder;
	if ( this.privileges(user).indexOf(priv) >= 0 )
		return true
	for( var i in user.groups )
		if( this.acl[user.groups[i]] && this.acl[user.groups[i]].privileges.indexOf(priv) > 0 )
			return true;
	return false;
}

function canRead( user ){
	if( typeof(user) === 'undefined' )
		user = this.holder;
	if( _isUserAndCanRead(this, user) )
		return true;
	for( var i in user.groups )
		if( user.groups[i] in this.acl )
			return true;
	return false;
};

function canWrite( user ){
	return ( _aclInclude.call(this, user, 'w') )
}

function canShare( user ){
	return ( _aclInclude.call(this, user, 's') )
}

function canDelete( user ){
	return ( _aclInclude.call(this, user, 'd') )
}

function privileges( user ){
	if( typeof(user) === 'undefined' )
		user = this.holder;
	if( typeof(user) !== 'undefined' && this.acl && this.acl[user._id] )
		return this.acl[user._id].privileges;
	return '';
}

function share( user, privileges ){
	if( !privileges )
		privileges = 'rw';
	if( !this.canShare() )
		throw AccessError.call(this, "will not share this document!");
	if( ! '_id' in user )
		throw "given user is not a user or is not persisted yet";
	if( !user._id )
		throw "not a valid user or user not persisted to database yet!";
	var newACL = {"privileges": privileges, "name": user.getName(), "photo_path": user.photo_path};
	this.acl[user._id] = newACL;
	this._aclChanged = {};
	this._aclChanged[user._id] = newACL;
}

function unshare( user ){
	if( !user._id )
		throw "not a valid user or user not persisted to database yet!";
	delete this.acl[user._id];
	this._aclChanged = {};
	this._aclChanged[user._id] = null;
}

module.exports.methods = function methods(){

    return [ { name: 'canRead', fn: canRead },
			{ name: 'canWrite', fn: canWrite },
			{ name: 'canShare', fn: canShare },
			{ name: 'canDelete', fn: canDelete },
			{ name: 'share', fn: share },
			{ name: 'unshare', fn: unshare },
			{ name: 'privileges', fn: privileges } ];

}
module.exports.canRead = canRead;
module.exports.canWrite = canWrite;
module.exports.canShare = canShare;
module.exports.canDelete = canDelete;
module.exports.privileges = privileges;
module.exports.share = share;
module.exports.unshare = unshare;

module.exports.setupCreator = function(){

	this.before('create', function setupCreatorHook( next ){

		if( !this._newRecord || !this.holder ){
		  next();
		  return;
		}

		this.acl[this.holder._id] = {"privileges": 'rwsd', "name": this.holder.getName(), "photoPath": this.holder.photoPath};

		next();

    });

}