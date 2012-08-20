// # Property INTERFACE

require( __dirname + '/../inherits' );

function Property(){
}

Property.prototype.getValue = function(){
	return this.value;
}

Property.new = function( value ){
	var o = new this();
	o.setValue( value );
	return o;
}

Property.prototype.setValue = function( value ){
	this.value = value;
}

module.exports = Property;