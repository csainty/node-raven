/*!
 * node-raven
 * Copyright (c) 2011 Chris Sainty <csainty@hotmail.com>
 * MIT License
 *
 * RavenDb client for node
 *
 * options:
 * server_url - The URL for the server, including multi-tenant path if applicable
 * useOptimisticConcurrency = Wehn set to true, the updating a document that has been updated elsewhere during your session will fail
 */

var ravenHttpClient = require('./ravenhttpclient'),
		qs = require('querystring'),
		_ = require('underscore');
	
function Client(options) {
	if (typeof options === 'string') { options = { 'server_url' : options }; }
	
	for (var i in options) {
		this[i] = options[i];
	}
	this.useOptimisticConcurrency = this.useOptimisticConcurrency ? this.useOptimisticConcurrency : false;
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
		var doc;
		if (result.statusCode === 200) {
			doc = result.asJson();
			doc['@metadata'] = {
				'etag': result.httpResponse.headers.etag,
				'raven-entity-name': result.httpResponse.headers['raven-entity-name']
			};
		}
		callback(error, result, doc);
	});
};

/**
 * Update a document on the server
 * @param  {string}   key      The key for the document to be updated
 * @param  {object}   doc      Hash representing the document
 * @param  {Function(error, response, success)} callback Callback function. Receives error, server response and boolean success
 */
Client.prototype.putDocument = function (key, doc, callback) {
	var self = this,
		headers = {},
		jsonDoc = doc;
	
	// If our document has metadata - extract it into the request headers and remove it from the serialized document
	if (doc['@metadata']) {
		jsonDoc = _.clone(doc);
		jsonDoc['@metadata'] = undefined;

		if (self.useOptimisticConcurrency) {
			if (doc['@metadata'].etag) {
				headers['If-None-Match'] = doc['@metadata'].etag;
			}
		}
	}

	self.httpClient.put('docs/' + key, null, jsonDoc, headers, function (error, result) {
		callback(error, result, result.statusCode === 201);
	});
};

/**
 * Store a document back to the server. Will generate a new id if needed
 * @param  {Object}   doc      Document to be saved
 * @param  {Function(error, response, success)} callback Callback recevies error, http response and boolean success
 */
Client.prototype.store = function (doc, callback) {
	var self = this;
	if (!(doc['@metadata'] && doc['@metadata']['raven-entity-name'])) {
		throw new Error('The document you are trying to save has no @metadata.raven-entity-name property.');
	}

	if (doc.id) {
		// We already have an id, so just send the document to the server
		self.putDocument(doc.id, doc, callback);
		return;
	} else {
		self.generateDocumentKey(doc['@metadata']['raven-entity-name'], doc, function (error, doc, key) {
			if (error) { callback(error, undefined, false); }
			self.putDocument(doc.id, doc, callback);
			return;
		});
	}
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

/**
 * Creates, or updates, a document with the correct metadata required to function correctly with RavenDb
 * @param  {string} entityType The entity type for the document
 * @param  {object} doc        Optionally provided an existing document to add the metadata to instead of creating a new document
 * @return {object}
 */
Client.prototype.createDocument = function (entityType, doc) {
	if (!doc) {
		doc = {};
	}
	doc['@metadata'] = {
		'raven-entity-name': entityType
	};
	return doc;
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
