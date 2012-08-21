module.exports = function AccessError(message){
	var e = new Error();
	e.name = "AccessError";
	e.message = "User " + this.holder.getName() + " has only access (" + this.privileges() + ") for document: " + this.name + (message ? " - " + message : '');
	return e;
};