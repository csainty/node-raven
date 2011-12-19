/*!
 * node-raven
 * Copyright (c) 2011 Chris Sainty <csainty@hotmail.com>
 * MIT License
 *
 * RavenDb client for node
 *
 * options:
 * server_url - The URL for the server, including multi-tenant path if applicable
 */

var ravenHttpClient = require('./ravenhttpclient'),
		qs = require('querystring');
	
function Client(options) {
	if (typeof options === 'string') { options = { 'server_url' : options }; }
	
	for (var i in options) {
		this[i] = options[i];
	}
	this.httpClient = ravenHttpClient({ server_url: this.server_url });
	
	if (!this.keyGenerator) { this.keyGenerator = require('./hilokeygenerator')({ client: this }); }
}

/**
 * Fetch a document, by key, from the server
 * @param  {string}   key      Document key to fetch
 * @param  {Function(error, response, document)} callback Callback function, received error, server response and the document
 */
Client.prototype.getDocument = function (key, callback) {
	var self = this;
	self.httpClient.get('docs/' + key, null, function (error, result) {
		callback(error, result, result.statusCode === 200 ? result.asJson() : null);
	});
};

/**
 * Update a document on the server
 * @param  {string}   key      The key for the document to be updated
 * @param  {object}   doc      Hash representing the document
 * @param  {Function(error, response, success)} callback Callback function. Receives error, server response and boolean success
 */
Client.prototype.putDocument = function (key, doc, callback) {
	var self = this;
	self.httpClient.put('docs/' + key, null, doc, function (error, result) {
		callback(error, result, result.statusCode === 201);
	});
};

/**
 * Perform a query against a specific index
 * @param  {string}   indexName Name of the index to query
 * @param  {object}   options   Hash of query options. { query: <Hash of fields to query>, waitForNonStaleResults : boolean, }
 * @param  {Function(error, response, results)} callback  Callback function. Receives error, server response, query results.
 */
Client.prototype.queryIndex = function (indexName, options, callback) {
	var self = this,
		queryOptions = {
			'query' : self.buildRavenQuery(options.query)
		};
	self.httpClient.get('indexes/' + indexName, queryOptions, function (error, result) {
		// Optionally request a non-stale index
		if (!error && result.statusCode === 200 && options.waitForNonStaleResults) {
			var data = result.asJson();
			if (data.IsStale) {
				return setTimeout(function () {
					self.queryIndex(indexName, options, callback);
				}, 500);
			} else {
				return callback(error, result, data);
			}
		}
		callback(error, result, result.statusCode === 200 ? result.asJson() : null);
	});
};

// Multi tenancy stuff

/**
 * Fetch a list of database names from the server
 * @param  {Function(error, response, results)} callback  Callback function. Receives error, server response, array of databases.
 */
Client.prototype.getDatabaseNames = function (callback) {
	var self = this;
	self.httpClient.get('/databases', null, function (error, result) {
		callback(error, result, result.statusCode === 200 ? result.asJson() : null);
	});
};

/**
 * Checks if a database esxists, creating it if it does not
 * @param  {string}   name     Name of the database to check/create
 * @param  {Function(error, response, success)} callback Callback function. Receives error, server response, boolean success
 */
Client.prototype.ensureDatabaseExists = function (name, callback) {
	var self = this,
		docId,
		doc;
	
	if (name.search(/[\/\\"'<>]/) !== -1) { return callback(new Error('Database name is invalid'), null, false); } // Invalid database name
	
	docId = 'Raven/Databases/' + name;
	doc = { 'Settings' : { "Raven/DataDir" : "~/Tenants/" + name } };
	self.getDocument(docId, function (error, result, data) {
		if (error) { return callback(error, result, false); } // Error connecting to server
		if (data) { return callback(error, result, true); } // Document and therefore database already exists
		
		// The database does not exist, save the document that describes it
		self.putDocument(docId, doc, callback);
	});
};

// Extensions points and conventions

/**
 * Generate a new document key for the specified entity and assigns it to the document
 * @param  {string}   entityName The type of document to generate a key for
 * @param  {object}   entity     The document whose key is being generated
 * @param  {Function(error, entity, key)} callback   Callback function. Receives error, the document, the new key
 */
Client.prototype.generateDocumentKey = function (entityName, entity, callback) {
	var self = this;
	self.keyGenerator.generateDocumentKey(entityName, function (error, key) {
		if (error) { return callback(error, entity); }
		
		// Assign the id to the entity so it is immediateley available
		entity.id = key;
		callback(null, entity, key);
	});
};

// Utilities, generally for internal use

/**
 * Parses a hash of query fields and generates the query string to send to the server
 * @param  {object} query Hash of fields and their query values
 * @return {string}
 */
Client.prototype.buildRavenQuery = function (query) {
	var s = '',
		i;
	for (i in query) {
		s = s + (s.length === 0 ? '' : ' ') + i + ':' + query[i];
	}
	return qs.escape(s);
};

function raven(options) {
	if (typeof options === 'string') { options = { 'server_url' : options}; }
	return new Client(options);
}

module.exports = raven;
