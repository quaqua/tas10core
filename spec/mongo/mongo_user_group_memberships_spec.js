var vows = require('vows')
  , assert = require('assert')
  , tas10io = require('../../index');

tas10io.connect('mongodb://localhost:27017/testTas10io');

var Model = require('../../lib/model')
  , User = require('../../lib/models/user')
  , Group = require('../../lib/models/group')

function Plain(){}
Plain.inherits( Model )

var groupProps = { name: 'g1' }
  , uA, uB, ga

vows.describe('User Group Membership').addBatch({

	"tidy up user and group collections": function(){
		User.destroy();
		Group.destroy();
	},

}).addBatch({

	"create groupA": {

		topic: function(){ Group.create({name: 'groupA'}, this.callback ); },

		"groupA exists": function( err, groupA ){

			gA = groupA;
			assert.isNull( err );
			assert.instanceOf( groupA, Group );

		}
	},

	"create userA": {

		topic: function(){ User.create({name: 'userA'}, this.callback ); },

		"userA exists": function( err, userA ){
			uA = userA;
			assert.isNull( err );
			assert.instanceOf( userA, User );
		}

	},

	"create userB": {

		topic: function(){ User.create({name: 'userB'}, this.callback ); },

		"userB exists": function( err, userB ){
			uB = userB;
			assert.isNull( err );
			assert.instanceOf( userB, User );
		}

	}

}).addBatch({

	"userB differs from userA": function(){
		assert.notEqual( uB._id.toString(), uA._id.toString() );
	},

	"userA is in no groups yet": function(){
		assert.lengthOf( uA.groups, 0 );
	},

	"userB is in no groups yet": function(){
		assert.lengthOf( uB.groups, 0 );
	}

}).addBatch({
	"add userA to groupA": {

		topic: function(){ uA.groups.push(gA._id); uA.save( this.callback ); },

		"userA is now member of groupA": function( err, userA ){
			assert.lengthOf( uA.groups, 1 );
			assert.equal( uA.groups[0], gA._id );
		}

	},

	"userB still is in no groups yet": function(){
		assert.equal( uB.name, 'userB' );
		assert.lengthOf( uB.groups, 0 );
	}

}).addBatch({

	"add userB to groupA": {

		topic: function(){ uB.groups.push(gA._id); uB.save( this.callback ); },

		"userB is now member of groupA": function( err, userB ){
			assert.lengthOf( userB.groups, 1 );
			assert.equal( uB.groups[0], gA._id );
		}

	}
	
}).addBatch({

	"a document created by userA": {

		topic: function(){ var doc = Plain.new(uA, {name: 'doc'}); doc.share(gA); doc.save( this.callback ); },

		"is shared with groupA": function( err, doc ){
			assert.isTrue( doc.canRead(gA) );
			assert.isTrue( doc.canWrite(gA) );
			assert.isFalse( doc.canShare(gA) );
			assert.isFalse( doc.canDelete(gA) );
		},

		"can be read by members of groupA": function( err, doc ){

			assert.isTrue( doc.canRead(uB) );

		},

		"can be written by members of groupA": function( err, doc ){

			assert.isTrue( doc.canWrite(uB) );

		},

		"cannot be shared by members of groupA": function( err, doc ){
			assert.isFalse( doc.canShare(uB) );
		},

		"cannot be deleted by members of groupA": function( err, doc ){
			assert.isFalse( doc.canDelete(uB) );
		}

	}

}).addBatch({

	"a document shared via a group userB is member": {

		topic: function(){ Plain.query(uB).where('name', 'doc').first( this.callback ); },

		"can be queried by userB": function( err, doc ){
			assert.instanceOf( doc, Plain );
		}

	}

}).export(module);