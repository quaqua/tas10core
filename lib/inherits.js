// # inherits
// extends Function with 'inherits' method for better
// OO programming
Function.prototype.inherits = function (parent) {

  for( var i in parent.prototype )
    this.prototype[i] = parent.prototype[i];
  for( var i in parent)
    i !== 'prototype' && (this[i] = parent[i]);
  this._super = parent;

  parent._inherits || (parent._inherits = []);
  parent._inherits.indexOf(this) < 0 && (parent._inherits.push(this));

}
