// node-raven - A RavenDB client for node.js  
// Copyright (c) 2011-2012 Chris Sainty <csainty@hotmail.com>  
// MIT License  
// [GitHub](https://github.com/csainty/node-raven) [Twitter](http://twitter.com/csainty) [Blog](http://blog.csainty.com)


// `var raven = require('node-raven');`
var qs = require('querystring')
  , _ = require('underscore')
  , utils = require('./RavenUtils.js')
  ;

// Creating your connection
// ========================
// `var client = raven(options);`  
// ####Options:
//      {
//        useOptimisticConcurrency: (default false)
//        keyGenerator: Keygen instance (default HiLoKeyGenerator)
//      }
// Also see [Connection](RavenUtils.html#section-4) options for details on specifying your server details
function Client(options) {
  options = utils.prepareServerOptions(options);

  for (var i in options) {
    if (options.hasOwnProperty(i)) {
      this[i] = options[i];
    }
  }

  // When `useOptimisticConcurrency` is true, saving a document fails if it has been modified since we fetched it
  this.useOptimisticConcurrency = this.useOptimisticConcurrency || false;

  // Allow caller to override the `httpClient` or `keyGenerator` if they need to
  if (!this.httpClient) { this.httpClient = require('./ravenhttpclient')(options); }
  if (!this.keyGenerator) { this.keyGenerator = require('./hilokeygenerator')({ client: this }); }
}

// Fetch a document by id
// ======================
// `client.getDocument(key, [options], [callback]);`
// ####Parameters:
// `key` - Document key eg `users/1`
// ####Options:
//      {
//        isRoot: Fetch document from server root
//      }
// ####Callback:
//      function (error, result)
//
//      result:
//      {
//        document: The request document
//        response: The server response
//      }
Client.prototype.getDocument = function (key, options, callback) {
  var self = this
    , root = 'docs/'
    ;

  // `options` is optional
  if (typeof options === 'function') {
    callback = options;
    options = { isRoot: false };
  }

  // Are we fetching the document from the server root or the opened database
  if (options.isRoot) {
    root = '/' + root;
  }

  self.httpClient.get(root + key, null, function (error, result) {
    var doc;
    if (result.statusCode === 200) {
      doc = result.asJson();
      // Fill out the `metadata` property.
      doc['@metadata'] = {
        'etag': result.httpResponse.headers.etag,
        'raven-entity-name': result.httpResponse.headers['raven-entity-name']
      };
    }
    return callback && callback(error, { document: doc, response: result });
  });
};

// Update a document on the server
// ===============================
// `client.putDocument(key, document, [options], [callback]);`
// ####Parameters:
// `key` - Document key eg `users/1`  
// `document` - Document object to store
// ####Options:
//      {
//        isRoot: Save document to server root
//      }
// ####Callback:
//      function (error, result)
//
//      result:
//      {
//        ok: (bool) Success?
//        response: The server response
//      }
Client.prototype.putDocument = function (key, doc, options, callback) {
  var self = this
    , headers = {}
    , jsonDoc = doc
    , root = 'docs/'
    ;

  // `options` is optional
  if (typeof options === 'function') {
    callback = options;
    options = { isRoot: false };
  }

  // Are we saving the document to the server root or the opened database?
  if (options.isRoot) {
    root = '/' + root;
  }

  // If our document has metadata - extract it into the request headers and remove it from the document before serialization.
  if (doc['@metadata']) {
    jsonDoc = _.clone(doc);
    delete jsonDoc['@metadata'];

    // If `useOptimisticConcurrency` is enabled, add the required http headers
    if (self.useOptimisticConcurrency) {
      if (doc['@metadata'].etag) {
        headers['If-None-Match'] = doc['@metadata'].etag;
      }
    }
  }

  self.httpClient.put(root + key, null, jsonDoc, headers, function (error, result) {
    // HTTP response 201 is considered a success
    return callback && callback(error, { ok: result.statusCode === 201, response: result});
  });
};

// Store a new document on the server
// ==================================
// This function generates a new document id if required.
// `client.store(document, [callback]);`
// ####Parameters:
// `document` - Document object to store
// ####Callback:
//      function (error, result)
//
//      result:
//      {
//        ok: (bool) Success?
//        response: The server response
//      }
Client.prototype.store = function (doc, callback) {
  var self = this;

  // Validate the metadata
  if (!(doc['@metadata'] && doc['@metadata']['raven-entity-name'])) {
    throw new Error('The document you are trying to save has no @metadata.raven-entity-name property.');
  }

  // Does the doucment already have an id?
  if (doc.id) {
    // Yes. so just send the document to the server
    return self.putDocument(doc.id, doc, callback);
  } else {
    // No. Generate a new document id before saving the document
    self.generateDocumentKey(doc['@metadata']['raven-entity-name'], doc, function (error, result) {
      if (error) { return callback && callback(error, { ok: false }); }
      return self.putDocument(doc.id, doc, callback);
    });
  }
};

// Perform a query against an index
// ================================
// `client.queryIndex(indexName, options, [callback]);`
// ####Parameters:
// `indexName` - The index to query
// ####Options:
//      {
//        query: Hash of query variables
//               eg { Name : 'Node' }
//        waitForNonStaleResult: (bool) Requery for non-stale results
//               to be returned
//      }
// ####Callback:
//      function (error, result)
//
//      result:
//      {
//        result: Result object
//                eg { IndexName: 'MyIndex', IsStale: false, TotalResults: 10, Results: [ ... ] }
//        response: The server response
//      }
Client.prototype.queryIndex = function (indexName, options, callback) {
  var self = this
    , queryOptions = { 'query' : utils.buildRavenQuery(options.query) }
    ;

  self.httpClient.get('indexes/' + indexName, queryOptions, function (error, result) {
    // If nonstale results requested, then check to see if they are
    if (!error && result.statusCode === 200 && options.waitForNonStaleResults) {
      var data = result.asJson();
      if (data.IsStale) {
        // Simply wait some time and requery
        return setTimeout(function () {
          self.queryIndex(indexName, options, callback);
        }, 500);
      } else {
        return callback && callback(error, { result: data, response: result });
      }
    }

    // If we don't care about stale results, then just return
    return callback && callback(error, { result: result.statusCode === 200 ? result.asJson() : null, response: result });
  });
};

// Create or update the metadata on an entity
// ==========================================
// Each document stored in RavenDB uses an entity type to group similar documents together.
// This function helps you create documents that correctly contain this metadata ready to be stored.
// `var doc = client.createDocument('Users');`
// `client.createDocument('Users', docToUpdate);`
// ####Parameters:
// `entityType` - The type of docuemnt  
// `doc` - An existing document to update (optional)
Client.prototype.createDocument = function (entityType, doc) {
  if (!doc) {
    doc = {};
  }
  if (!doc['@metadata']) {
    doc['@metadata'] = {};
  }
  doc['@metadata']['raven-entity-name'] = entityType;
  return doc;
};

// Multi tenancy
// =============

// Fetch a list of database names from the server
// ==============================================
// `client.getDatabaseNames([callback]);`
// ####Callback:
//      function (error, result)
//
//      result:
//      {
//        databases: Array of database names
//        response: The server response
//      }
Client.prototype.getDatabaseNames = function (callback) {
  var self = this;

  self.httpClient.get('/databases', null, function (error, result) {
    return callback && callback(error, { databases: result.statusCode === 200 ? result.asJson() : null, response: result });
  });
};

// Select a database
// =================
// Note: It is preferable to use the constructor argument `server_db`
// `client.getDatabaseNames(name);`
// ####Parameters:
// `name` - The name of the database to use
Client.prototype.useDatabase = function (name) {
  this.httpClient.useDatabase(name);
  this.server_url = this.httpClient.server_url;
  this.server_db = name;
};

// Checks if a database esxists, create it if it does not
// ========================================================
// `client.ensureDatabaseExists(name, [callback]);`
// ####Parameters:
// `name` - The name of the database to check
// ####Callback:
//      function (error, result)
//
//      result:
//      {
//        ok: (bool) Success?
//        response: The server response
//      }
Client.prototype.ensureDatabaseExists = function (name, callback) {
  var self = this
   , docId
   , doc
   ;
  
  if (name.search(/[\/\\"'<>]/) !== -1) { return callback && callback(new Error('Database name is invalid'), { ok: false }); } // Invalid database name
  
  docId = 'Raven/Databases/' + name;
  self.getDocument(docId, { isRoot : true }, function (error, result) {
    if (error || !result) { return callback && callback(error, { ok: false, response: result.response }); } // Error connecting to server
    if (result.document) { return callback && callback(error, { ok: true, response: result.response }); } // Document and therefore database already exists

    doc = { 'Settings' : { "Raven/DataDir" : "~/Tenants/" + name } };
    return self.putDocument(docId, doc, { isRoot: true }, callback); // The database does not exist, save the document that describes it
  });
};

// Helpers
// =======

// Generate a new document key for the specified entity
// ====================================================
// `client.generateDocumentKey(entityType, entity, [callback]);`
// ####Parameters:
// `entityType` - The type of the document  
// `entity` - The document object
// ####Callback:
//      function (error, result)
//
//      result:
//      {
//        key; The generated key
//        document: The passed in document
//      }
Client.prototype.generateDocumentKey = function (entityType, entity, callback) {
  var self = this;
  
  self.keyGenerator.generateDocumentKey(entityType, function (error, result) {
    if (error) { return callback && callback(error, { document: entity }); }
    
    entity.id = result.key; // Assign the id to the entity so it is immediateley available
    return callback && callback(undefined, { document: entity, key: result.key });
  });
};


// Expose client via factory method.
function raven(options) {
  return new Client(options);
}

module.exports = raven;
