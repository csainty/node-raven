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

Client.prototype.constructQuery = function(path) {
	var self = this;
	return self.server_url + path;
}

Client.prototype.getDatabaseNames = function(callback) {
	var self = this;
	request(self.constructQuery('/databases'), function(error, response, body){
		callback(JSON.parse(body));
	});
}

Client.prototype.getDocument = function(id, callback){
	callback(null);
}

Client.prototype.putDocument = function(id, doc, callback){
	var self = this;
	request.put({
		'uri': self.constructQuery('/docs/' + id),
		'json': doc
	}, function(error, response, bdoy) {
		callback(response.statusCode === 200);
	});
}

Client.prototype.ensureDatabaseExists = function(name, callback) {
	var docId = 'Raven/Databases/' + name;
	var doc = { 'Settings' : { "Raven/DataDir" : "~/Tenants/" + name } };
	callback(null);
}

Client.prototype.queryIndex = function(indexName, query, callback) {
	var self = this;
	callback(indexName);
}

function raven (options) {
	if (typeof options === 'string') options = { 'server_url' : options};
	var c = new Client(options);
	return c;
}

module.exports = raven;
