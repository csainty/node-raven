/*!
 * node-raven
 * Copyright (c) 2011 Chris Sainty <csainty@hotmail.com>
 * MIT License
 */

var ravenHttpClient = require('./ravenhttpclient'),
		qs = require('querystring');
	
function Client (options) {
	if (typeof options === 'string') options = { 'server_url' : options };
	
	for (var i in options) {
		this[i] = options[i];
	}	
	this.httpClient = ravenHttpClient(options);
	
	if (!this.keyGenerator) this.keyGenerator= require('./hilokeygenerator')({ client: this });
}

Client.prototype.getDocument = function(id, callback){
	var self = this;
	self.httpClient.get('docs/' + id, null, function(error, result){
		callback(error, result, result.statusCode == 200 ? result.asJson() : null);
	});
};

Client.prototype.putDocument = function(id, doc, callback){
	var self = this;
	self.httpClient.put('docs/' + id, null, doc, function (error, result) {
		callback(error, result, result.statusCode == 201);
	});
};

Client.prototype.queryIndex = function(indexName, options, callback) {
	var self = this;
	var queryOptions = {
		'query' : self.buildRavenQuery(options.query)
	};
	self.httpClient.get('indexes/' + indexName, queryOptions, function(error, result) {
		// Optionally request a non-stale index
		if (!error && result.statusCode === 200 && options.WaitForNonStaleResults) {
			var data = result.asJson();
			if (data.IsStale) {
				return setTimeout(function() {
					self.queryIndex(indexName, options, callback);
				}, 500);
			} else {
				return callback(error, result, data);	
			}
		}
		callback(error, result, result.statusCode == 200 ? result.asJson() : null);
	});
};

// Multi tenancy stuff
Client.prototype.getDatabaseNames = function(callback) {
	var self = this;
	self.httpClient.get('/databases', null, function(error, result){
		callback(error, result, result.statusCode == 200 ? result.asJson() : null);
	});
};

Client.prototype.ensureDatabaseExists = function(name, callback) {
	var self = this;
	
	if (name.search(/[\/\\"'<>]/) !== -1) { return callback(new Error('Database name is invalid'), null, false); } // Invalid database name 
	
	var docId = 'Raven/Databases/' + name;
	var doc = { 'Settings' : { "Raven/DataDir" : "~/Tenants/" + name } };
	self.getDocument(docId, function (error, result, data) {
		if (error) { return callback(error, result, false); } // Error connecting to server
		if (data) { return callback(error, result, true); } // Document and therefore database already exists
		
		// The database does not exist, save the document that describes it
		self.putDocument(docId, doc, callback);
	});
};

// Conventions
Client.prototype.generateDocumentKey = function(entityName, entity, callback) {
	var self = this;
	self.keyGenerator.generateDocumentKey(entityName, function(error, key) {
		if (error) { return callback(error, entity); }
		
		// Assign the id to the entity so it is immediateley available
		entity.id = key;
		callback(null, entity, key);
	});
};

// Utilities, generally for internal use
Client.prototype.buildRavenQuery = function (query) {
	var s = '';
	for(var i in query){
		s = s + (s.length === 0 ? '' : ' ') + i + ':' + query[i]; 
	}
	return qs.escape(s);
};

function raven (options) {
	if (typeof options === 'string') options = { 'server_url' : options};
	return new Client(options);
}

module.exports = raven;
