/*!
 * node-raven
 * Copyright (c) 2011 Chris Sainty <csainty@hotmail.com>
 * MIT License
 */

var request = require('request')
	, querystring = require('querystring');
	
function Client (options) {
	if (typeof options === 'string') options = { 'server_url' : options };
	
	for (var i in options) {
		this[i] = options[i];
	}	
}

Client.prototype.queryIndex = function(indexName, query, callback){
	var self = this;
	callback(indexName);
}

function raven (options) {
	if (typeof options === 'string') options = { 'server_url' : options};
	var c = new Client(options);
	return c;
}

module.exports = raven;
