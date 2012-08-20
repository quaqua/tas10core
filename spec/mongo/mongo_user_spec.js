/* 
 * tas10core by TASTENWERK
 * author: thorsten.zerha@tastenwerk.com
 * 
 * copyright (2012) by TASTENWERK e.U.
 *
 * http://www.tastenwerk.com/tas10core
 * 
 */

var vows = require('vows')
  , assert = require('assert')
  , creio = require('../../index');

creio.connect('mongodb://localhost:27017/testCreio');

var User = require('../../lib/models/user');

var userProps = { name: 'user1', password: 'test123', email: 'eamil@localhost.loc' };

vows.describe('mongo tas10core User').addBatch({

    "reset the users collection to get an empty starting point": {

        topic: function(){ User.destroy( this.callback ); },

        "All user objects are destroyed": function( err, count ){
            assert.isNull( err );
        }
  }

}).addBatch({

  "counting users": {

        topic: function(){ User.query().count( this.callback ); },

        "0 users are in the database (due to previous reset": function( err, count ){
            assert.equal( count, 0 );
        }
  
  }

}).addBatch({

    "CREATING a User": {

        topic: User.new( userProps ),

        "after initialization a user is a newRecord": function( user ){
            assert.isTrue( user.isNewRecord() );
        },

        "saving": {

            topic: function( user ){ user.save( this.callback ); },

            "new user is now persisted to the database": function( err, user ){
                assert.isFalse( user.isNewRecord() );
                assert.isFalse( user.isDeleted() );
            },

            "new user still has name set as before": function( err, user ){
                assert.equal( user.name, userProps.name );
            },

            "new user still has email set as before": function( err, user ){
                assert.equal( user.email, userProps.email );
            },

            "new user got a modification timestamp attribute set": function( err, user ){
                assert.typeOf( user.history[0].at, 'date' );
            },

        }

    }

}).addBatch({

    "FINDING a User": {

        topic: function(){ User.query().where('name',userProps.name).first( this.callback ) },

        "result is instance of User": function( err, user ){
            assert.instanceOf( user, User );
        },

        "result still returns className == 'User'": function( err, user ){
            assert.equal( user.constructor.name, 'User' );
        },

        "result has all attributes (name, email, ...) set as before": function( err, user ){
            assert.equal( user.name, userProps.name );
            assert.equal( user.email, userProps.email );
        },

        "result is not a new record": function( err, user ){
            assert.isFalse( user.isNewRecord() );
        },

        "result is not marked deleted": function( err, user ){
            assert.isFalse( user.isDeleted() );
        },

        "result does not have password stored": function( err, user ){
            assert.isFalse( 'password' in user );
        },

        "result has hashedPassword property instead of password": function( err, user ){
            assert.lengthOf( user.hashedPassword, 40 );
        }

    }

}).addBatch({

    "UPDATING a User": {

        topic: function(){ User.query().count( this.callback ); },

        "initial count === 1": function( err, count ){
            assert.equal( count, 1 );
        },

        "getting the user": {

            topic: function(){ User.query().where('name', userProps.name).first( this.callback ) },

            "changes the name of the user": {

                topic: function( user ){ user.name = 'other' ; return user; },

                "saves the changed user ob": {

                    topic: function( user ){ user.save( this.callback ); },

                    "if save is successful, new user object is returned": function( err, user ){
                        assert.equal( user.name, 'other' );
                    }
                }

            }

        }

    }

}).addBatch({

    "counting users after update": {

        topic: function(){ User.query().count( this.callback ); },

        "count === 1": function( err, count ){
            assert.equal( count, 1 );
        }

    },

    "finding user with old name does not return results any more": {

        topic: function(){ User.query().where('name', userProps.name).first( this.callback ) },

        "result === 0 ": function( err, user ){
            assert.isNull( user );
        }

    }
/*
}).addBatch({

    "DESTROYING a User": {

        topic: function(){ User.query().where('name', 'other').first( this.callback )},

        "destroys the previously found user": {

            topic: function( user ){ user.destroy( this.callback ); },

            "user is now marked deleted": function( err, user ){
                assert.isTrue( user.deleted );
            }

        }

    }

}).addBatch({

    "counting users after destroy": {

        topic: function(){ User.count( this.callback ); },

        "no more users in database": function( err, count ){
            assert.equal( count, 0 );
        }
    }
*/
}).export(module);
