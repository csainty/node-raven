/*!
 * node-raven
 * Copyright (c) 2011 Chris Sainty <csainty@hotmail.com>
 * MIT License
 */

var ravenHttpClient = require('./ravenhttpclient');
	
function Client (options) {
	if (typeof options === 'string') options = { 'server_url' : options };
	
	for (var i in options) {
		this[i] = options[i];
	}	
	this.httpClient = ravenHttpClient(options);
}

Client.prototype.getDatabaseNames = function(callback) {
	var self = this;
	self.httpClient.get('/databases', null, function(result){
		callback(result, result.statusCode == 200 ? result.asJson() : null);
	});
}

Client.prototype.getDocument = function(id, callback){
	var self = this;
	self.httpClient.get('docs/' + id, null, function(result){
		callback(result, result.statusCode == 200 ? result.asJson() : null);
	});
}

Client.prototype.putDocument = function(id, doc, callback){
	var self = this;
	self.httpClient.put('docs/' + id, null, doc, function (result) {
		callback(result, result.statusCode == 201)	
	});
}

Client.prototype.ensureDatabaseExists = function(name, callback) {
	var self = this;
	
	if (name.search(/[\/\\\"'\<\>'"]/) !== -1) {
		callback({ error: true }, false);
		return;
	}
	
	var docId = 'Raven/Databases/' + name;
	var doc = { 'Settings' : { "Raven/DataDir" : "~/Tenants/" + name } };
	self.getDocument(docId, function (result, data) {
		if (result.error) { // There was an error contacing the server
			callback(result, false);
			return;
		}
		if (data) {	// Document and therefore database already exists
			callback(result, true);
			return;
		}
		// The database does not exist, save the document that describes it
		self.putDocument(docId, doc, function(result, ok) {
			callback(result, ok);
		});
	});
}
					

function raven (options) {
	if (typeof options === 'string') options = { 'server_url' : options};
	var c = new Client(options);
	return c;
}

module.exports = raven;
