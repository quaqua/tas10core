function Analytics( holder, props ){
	if( !props )
		props = holder;
	for( var i in props )
		this[i] = props[i];
}

Analytics.new = function( holder, props ){
	return new this( holder, props );
}

module.exports = Analytics;