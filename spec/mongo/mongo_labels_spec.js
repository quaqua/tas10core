var vows = require('vows')
  , assert = require('assert')

  , tas10core = require('../../index');

tas10core.connect('mongodb://localhost:27017/test_tas10core');

var Model = require('../../lib/model')
  , User = require('../../lib/models/user')
  , Group = require('../../lib/models/group')

function Plain(){}
Plain.inherits( Model );

var docProps = { name: 'docA' }
  , uA, uB, uC
  , docA, docB, docC;


function init2Docs(callback){
  var res = [];
  function checkConditionAndFireCB(){ if( res.length === 2 ) callback(null, res) };

  Plain.create(user, {name: 'test1'}, function( err, doc ){
    res.push(doc);
    checkConditionAndFireCB();
  });
  Plain.create(user, {name: 'test2'}, function( err, doc ){
    res.push(doc);
    checkConditionAndFireCB();
  });
}

vows.describe('Labeling Documents').addBatch({

	"reset the documents collection to get an empty starting point": function(){

		Plain.destroy( function(){} );
    User.destroy( function(){} );
    Group.destroy( function(){} );

	}

}).addBatch({

  "create groupA": {

    topic: function(){ Group.create({name: 'groupA'}, this.callback ); },

    "groupA exists": function( err, groupA ){

      gA = groupA;
      assert.isNull( err );
      assert.instanceOf( groupA, Group );

    }
  }

}).addBatch({

  "create userA": {

    topic: function(){ User.create({name: 'userA', groups: [ gA._id ] }, this.callback ); },

    "userA exists": function( err, userA ){
      uA = user = userA;
      assert.isNull( err );
      assert.instanceOf( userA, User );
    }

  },

  "create userB": {

    topic: function(){ User.create({name: 'userB', groups: [ gA._id ] }, this.callback ); },

    "userB exists": function( err, userB ){
      uB = userB;
      assert.isNull( err );
      assert.instanceOf( userB, User );
    }

  }

}).addBatch({

  "Tagging documents": {

    topic: function(){ init2Docs( this.callback ); },

    "having 2 documents": function( docs ){
      assert.equal(docs.length, 2 );
    }
  }

}).addBatch({

  "Creating docA": {

    topic: function(){  Plain.create(user, {name: 'doca'}, this.callback ); },

    "returns doca": function( err, doc ){
      docA = doc;
      assert.instanceOf( doc, Plain );
    }

  }

}).addBatch({

  "Creating docB": {

    topic: function(){  Plain.create(user, {name: 'docb'}, this.callback ); },

    "returns doca": function( err, doc ){
      docB = doc;
      assert.instanceOf( doc, Plain );
    }
  }

}).addBatch({

  "DocA can be labeled with DocB": {

    topic: function(){ docA.addLabel(docB); docA.save( this.callback ); },

    "DocA is now labeled with DocB": function( err, doc ){
      assert.equal( doc.label_ids[0], docB._id );
    }

  },

  "cannot be labeled with itself": function(){
    assert.throws( function(){ docA.addTag( docA ) }, Error );
  }

}).addBatch({

  "lists all documents, labeled with docB": {

    topic: function(){ docA.loadLabels( this.callback ); },

    "returns a list containing one document DocB": function( err, labellist ){
      assert.lengthOf( labellist, 1 );
      assert.equal( labellist[0]._id.toString(), docB._id.toString() );
    }

  }

}).addBatch({

  "lists all documents which are labeled by docB": {

    topic: function(){ docB.loadLabelers( this.callback ); },

    "returns a list of documents labeled with DocB": function( err, labellist ){
      assert.lengthOf( labellist, 1 );
      assert.equal( labellist[0]._id.toString(), docA._id.toString() );
    }

  }

}).addBatch({

  "if DocB is shared with groupA": {

    topic: function(){ docB.share( gA ); docB.save( this.callback ); },

    "docB is now readable to groupA": function( err, doc ){
      assert.isTrue( doc.canRead( gA ) );
    },

    "userB (as member of groupA)": {

      topic: function(){ Plain.query(uB).where('name', docA.name).first( this.callback ); },

      "can also access DocA because it is labeled with DocB": function( err, doc ){
          assert.instanceOf( doc, Plain );
      }
    }
  }
  
}).addBatch({

  "safely removes labelers from labeled documents": {

    "docA is labeled with docB": function(){
      assert.equal( docA.label_ids[0], docB._id );
    },

    "remove docB": {

      topic: function(){ docB.destroy( this.callback ); },

      "checks docA": {

        topic: function(){ Plain.query(uA).where('name', docA.name).first( this.callback ) },

        "docA is no longer labeled with docB": function(err, doc){
          assert.isEmpty(doc.label_ids);
        }

      }
    }


  }

}).export(module);