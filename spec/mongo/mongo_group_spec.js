var vows = require('vows')
  , assert = require('assert')
  , tas10core = require('../../index');

tas10core.connect('mongodb://localhost:27017/test_tas10core');

var Model = require('../../lib/model')
  , User = require('../../lib/models/user')
  , Group = require('../../lib/models/group')

function PlainDocument(){}
PlainDocument.inherits( Model )

var groupProps = { name: 'g1' }


vows.describe('Group').addBatch({

    "reset the groups collection to get an empty starting point": {

        topic: function(){ Group.destroy( this.callback ); },

        "All group objects are destroyed": function( err, count ){
            assert.isNull( err );
        }
  }

}).addBatch({

  "counting groups": {

        topic: function(){ Group.query().count( this.callback ); },

        "0 groups are in the database (due to previous reset": function( err, count ){
            assert.equal( count, 0 );
        }
  
  }

}).addBatch({

    "CREATING a Group": {

        topic: Group.new(groupProps),

        "after initialization a group is a newRecord": function( group ){
            assert.isTrue( group.isNewRecord() );
        },

        "after initialization a group object is not persisted": function( group ){
            assert.isFalse( group.isPersisted() );
        },

        "saving": {

            topic: function( group ){ group.save( this.callback ); },

            "new group is now persisted to the database": function( err, group ){
                assert.isTrue( group.isPersisted() );
                assert.isFalse( group.isNewRecord() );
                assert.isFalse( group.isDeleted() );
            },

            "new group still has name set as before": function( err, group ){
                assert.equal( group.name, groupProps.name );
            },

            "new group got a modification timestamp attribute set": function( err, group ){
                assert.typeOf( group.history[0].at, 'date' );
            },

        }

    }

}).addBatch({

    "FINDING a Group": {

        topic: function(){ Group.query().where('name',groupProps.name).first( this.callback ) },

        "result is instance of Group": function( err, group ){
            assert.instanceOf( group, Group );
        },

        "result still returns className == 'Group'": function( err, group ){
            assert.equal( group.constructor.name, 'Group' );
        },

        "result has all attributes (name, ...) set as before": function( err, group ){
            assert.equal( group.name, groupProps.name );
        },

        "result is not a new record": function( err, group ){
            assert.isFalse( group.isNewRecord() );
        },

        "result is persisted": function( err, group ){
            assert.isTrue( group.isPersisted() );
        },

        "result is not marked deleted": function( err, group ){
            assert.isFalse( group.isDeleted() );
        }

    }

}).addBatch({

    "UPDATING a Group": {

        topic: function(){ Group.query().count( this.callback ); },

        "initial count === 1": function( err, count ){
            assert.equal( count, 1 );
        },

        "getting the group": {

            topic: function(){ Group.query().where('name', groupProps.name).first( this.callback ) },

            "changes the name of the group": {

                topic: function( group ){ group.name = 'other' ; return group; },

                "saves the changed group ob": {

                    topic: function( group ){ group.save( this.callback ); },

                    "if save is successful, new group object is returned": function( err, group ){
                        assert.equal( group.name, 'other' );
                    }
                }

            }

        }

    }

}).addBatch({

    "counting groups after update": {

        topic: function(){ Group.query().count( this.callback ); },

        "count === 1": function( err, count ){
            assert.equal( count, 1 );
        }

    },

    "finding group with old name does not return results any more": {

        topic: function(){ Group.query().where('name', groupProps.name).first( this.callback ) },

        "result === 0 ": function( err, group ){
            assert.isNull( group );
        }

    }

}).addBatch({

    "DESTROYING a Group": {

        topic: function(){ Group.query().where('name', 'other').first( this.callback )},

        "destroys the previously found group": {

            topic: function( group ){ group.destroy( this.callback ); },

            "group is now marked deleted": function( err, group ){
                assert.isTrue( group.isDeleted() );
            }

        }

    }

}).addBatch({

    "counting groups after destroy": {

        topic: function(){ Group.query().count( this.callback ); },

        "no more groups in database": function( err, count ){
            assert.equal( count, 0 );
        }
    }

}).export(module);
