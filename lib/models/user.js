var sha1 = require('sha1');

var Model = require( __dirname + '/../model' )
  , Tas10Array = require( __dirname + '/../props/tas10_array')
  , Tas10String = require( __dirname + '/../props/tas10_string')
  , Tas10Object = require( __dirname + '/../props/tas10_object');

function User(){}
User.inherits( Model );
User.schema( 'email', 
	'hashedPassword', 
	'photoPath',
	'fullName',
	'email' );

User.schema({
	groups: {type: Tas10Array, default: function(){ return []; } },
	lastLogin: {type: Tas10Array, default: function(){ return []; } },
	friends: {type: Tas10Array, default: function(){ return []; } },
	defaults: {type: Tas10Object, default: function(){ return {}; } },
	confirmationKey: {type: Tas10String, default: function(){ return sha1(new Date().toString()) } } 
});

User.prototype.getChanges = function getChanges( callback ){
	var self = this;
	Model.query( self ).where('history').elemMatch({'by._id': this._id}).limit(50).find( function setupUserChanges( err, docs ){
		var arr = [];
		if( docs ){
			for( var i in docs ){
				arr.push({history: docs[i].history, name: docs[i].name, _id: docs[i]._id});
				for( var j in docs[i].history ){
					var mod = docs[i].history[j];
					if( mod.by._id.toString() === self._id.toString() ){
						arr[arr.length-1].myLastModification = mod;
					}
				}
			}
			arr = arr.sort(function(a,b){ return a.myLastModification.at.getTime()-b.myLastModification.at.getTime(); }).reverse();
		}
		self.changes = arr;
		callback( null, self );
	} );
}

User.prototype.getName = function getName(){
	return (this.fullName && this.fullName.length > 0 ? 
							this.fullName : 
							(this.name && this.name.length > 0 ? this.name : this.email ));
}

User.prototype.toJSON = function toJSON(){
    var props = {};
    for( var i in this._props )
        props[i] = this[i];
    props['_fullName'] = this.getName();
    return props;
}

User.hooks.before.save.push( function( next ){
	if( 'password' in this && this.password.length > 0 )
		this['hashedPassword'] = this.constructor.encryptPassword( this.password );
	next();
})

User.encryptPassword = function encryptPassword( password ){ return sha1(password); };

module.exports = User;
