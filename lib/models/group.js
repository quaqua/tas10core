var Model = require( __dirname + '/../model' );

function Group(){}
Group.inherits( Model );

Group.prototype.getName = function getName(){
	return this.name;
}

module.exports = Group;
