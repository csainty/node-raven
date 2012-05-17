/*!
 * node-raven
 * Copyright (c) 2011 Chris Sainty <csainty@hotmail.com>
 * MIT License
 *
 * RavenDb client for node
 *
 * Properties - set via the options parameter, see RavenUtils.prepareServerOptions:
 * server_url - The URL for the server, including multi-tenant path if applicable
 * server_db - The database currently in use
 *
 * Properties - passed via options, but specifically handled here
 * useOptimisticConcurrency = When set to true, the updating a document that has been updated elsewhere during your session will fail
 *
 * Properties - Set internally, but can be passed in to override behaviour
 * httpClient - Instance of RavenHttpClient to handle server communication
 * keyGenerator - Instance of a key generator, defaults to HiLoKeyGenerator
 */

var qs = require('querystring')
  , _ = require('underscore')
  , utils = require('./RavenUtils.js')
  ;

function Client(options) {
  options = utils.prepareServerOptions(options);

  for (var i in options) {
    if (options.hasOwnProperty(i)) {
      this[i] = options[i];
    }
  }

  this.useOptimisticConcurrency = this.useOptimisticConcurrency || false;

  if (!this.httpClient) { this.httpClient = require('./ravenhttpclient')(options); }
  if (!this.keyGenerator) { this.keyGenerator = require('./hilokeygenerator')({ client: this }); }
}

/**
 * Fetch a document, by key, from the server
 * @param  {string}   key      Document key to fetch
 * @param  [object]   options  Hash of options. { isRoot : [Get document from server root] }
 * @param  {Function(error, { document: { }, response: { }})} callback Callback function, received error, server response and the document
 */
Client.prototype.getDocument = function (key, options, callback) {
  var self = this
    , root = 'docs/'
    ;

  if (typeof options === 'function') {
    callback = options;
    options = { isRoot: false };
  }

  if (options.isRoot) {
    root = '/' + root;
  }

  self.httpClient.get(root + key, null, function (error, result) {
    var doc;
    if (result.statusCode === 200) {
      doc = result.asJson();
      doc['@metadata'] = {
        'etag': result.httpResponse.headers.etag,
        'raven-entity-name': result.httpResponse.headers['raven-entity-name']
      };
    }
    return callback && callback(error, { document: doc, response: result });
  });
};

/**
 * Update a document on the server
 * @param  {string}   key      The key for the document to be updated
 * @param  {object}   doc      Hash representing the document
 * @param  [object]   options  Hash of options. { isRoot : [Put document to server root] }
 * @param  {Function(error, { ok: bool, response: {} })} callback Callback function. Receives error, server response and boolean success
 */
Client.prototype.putDocument = function (key, doc, options, callback) {
  var self = this
    , headers = {}
    , jsonDoc = doc
    , root = 'docs/'
    ;

  if (typeof options === 'function') {
    callback = options;
    options = { isRoot: false };
  }

  if (options.isRoot) {
    root = '/' + root;
  }

  // If our document has metadata - extract it into the request headers and remove it from the serialized document
  if (doc['@metadata']) {
    jsonDoc = _.clone(doc);
    delete jsonDoc['@metadata'];

    if (self.useOptimisticConcurrency) {
      if (doc['@metadata'].etag) {
        headers['If-None-Match'] = doc['@metadata'].etag;
      }
    }
  }

  self.httpClient.put(root + key, null, jsonDoc, headers, function (error, result) {
    return callback && callback(error, { ok: result.statusCode === 201, response: result});
  });
};

/**
 * Store a document back to the server. Will generate a new id if needed
 * @param  {Object}   doc      Document to be saved
 * @param  {Function(error, { ok: bool, response: { }})} callback Callback recevies error, http response and boolean success
 */
Client.prototype.store = function (doc, callback) {
  var self = this;

  if (!(doc['@metadata'] && doc['@metadata']['raven-entity-name'])) {
    throw new Error('The document you are trying to save has no @metadata.raven-entity-name property.');
  }

  if (doc.id) {
    // We already have an id, so just send the document to the server
    return self.putDocument(doc.id, doc, callback);
  } else {
    self.generateDocumentKey(doc['@metadata']['raven-entity-name'], doc, function (error, result) {
      if (error) { return callback && callback(error, { ok: false }); }
      return self.putDocument(doc.id, doc, callback);
    });
  }
};

/**
 * Perform a query against a specific index
 * @param  {string}   indexName Name of the index to query
 * @param  {object}   options   Hash of query options. { query: <Hash of fields to query>, waitForNonStaleResults : boolean, }
 * @param  {Function(error, { result: { }, response: { }})} callback  Callback function. Receives error, server response, query results.
 */
Client.prototype.queryIndex = function (indexName, options, callback) {
  var self = this
    , queryOptions = { 'query' : utils.buildRavenQuery(options.query) }
    ;

  self.httpClient.get('indexes/' + indexName, queryOptions, function (error, result) {
    // Optionally request a non-stale index
    if (!error && result.statusCode === 200 && options.waitForNonStaleResults) {
      var data = result.asJson();
      if (data.IsStale) {
        return setTimeout(function () {
          self.queryIndex(indexName, options, callback);
        }, 500);
      } else {
        return callback && callback(error, { result: data, response: result });
      }
    }
    return callback && callback(error, { result: result.statusCode === 200 ? result.asJson() : null, response: result });
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
 * @param  {Function(error, { databases: [ ], response: { } })} callback  Callback function. Receives error, server response, array of databases.
 */
Client.prototype.getDatabaseNames = function (callback) {
  var self = this;

  self.httpClient.get('/databases', null, function (error, result) {
    return callback && callback(error, { databases: result.statusCode === 200 ? result.asJson() : null, response: result });
  });
};

/**
 * Appends a tenant url to the server url. Only call this function once.
 * @param {string} name The name of the database to use
 */
Client.prototype.useDatabase = function (name) {
  this.httpClient.useDatabase(name);
  this.server_url = this.httpClient.server_url;
  this.server_db = name;
};

/**
 * Checks if a database esxists, creating it if it does not
 * @param  {string}   name     Name of the database to check/create
 * @param  {Function(error, { ok: bool, response: { }})} callback Callback function. Receives error, server response, boolean success
 */
Client.prototype.ensureDatabaseExists = function (name, callback) {
  var self = this
   , docId
   , doc
   ;
  
  if (name.search(/[\/\\"'<>]/) !== -1) { return callback && callback(new Error('Database name is invalid'), { ok: false }); } // Invalid database name
  
  docId = 'Raven/Databases/' + name;
  doc = { 'Settings' : { "Raven/DataDir" : "~/Tenants/" + name } };
  self.getDocument(docId, { isRoot : true }, function (error, result) {
    if (error || !result) { return callback && callback(error, { ok: false, response: result.response }); } // Error connecting to server
    if (result.document) { return callback && callback(error, { ok: true, response: result.response }); } // Document and therefore database already exists
    
    // The database does not exist, save the document that describes it
    return self.putDocument(docId, doc, { isRoot: true }, callback);
  });
};

// Extensions points and conventions

/**
 * Generate a new document key for the specified entity and assigns it to the document
 * @param  {string}   entityName The type of document to generate a key for
 * @param  {object}   entity     The document whose key is being generated
 * @param  {Function(error, { key: '', document: { } })} callback   Callback function. Receives error, the document, the new key
 */
Client.prototype.generateDocumentKey = function (entityName, entity, callback) {
  var self = this;
  
  self.keyGenerator.generateDocumentKey(entityName, function (error, result) {
    if (error) { return callback && callback(error, { document: entity }); }
    
    // Assign the id to the entity so it is immediateley available
    entity.id = result.key;
    return callback && callback(undefined, { document: entity, key: result.key });
  });
};

function raven(options) {
  return new Client(options);
}

module.exports = raven;
