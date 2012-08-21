module.exports.presence = function presence( propName ){
	return (function validatePresence( next ){
		if( !( this[propName] && typeof(this[propName]) === 'string' && this[propName].length > 0 ) )
			this.appendError( propName, 'required_field' );
		next();
	})
}

module.exports.formatEmail = function formatEmail( propName ){
	return (function validateFormatEmail( next ){
    var validEmail = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		if( !( this[propName] && validEmail.test(this[propName]) ) )
			this.appendError( propName, 'must_be_email' );
		next();
	})	
}