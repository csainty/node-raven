// node-raven - A RavenDB client for node.js  
// Copyright (c) 2011-2012 Chris Sainty <csainty@hotmail.com>  
// MIT License  
// [GitHub](https://github.com/csainty/node-raven) [Twitter](http://twitter.com/csainty) [Blog](http://blog.csainty.com)

 
// HTTP Client for communicating with a RavenDB server.  
// Deals with HTTP level concerns such as Authentication, Compression and Caching

// `var http = require('RavenHttpClient.js');`
var request = require('request')
  , url = require('url')
  , utils = require('../lib/RavenUtils.js')
  ;

// Internal functions
// ==================

// oAuthTokenRequest
// -----------------
// Requests oAuth token from the server
function oAuthTokenRequest(client, authSource, callback) {
  var headers = {
    'grant_type': 'client_credentials',
    'accept': 'application/json;charset=UTF-8'
  };
  if (client.auth_user && client.auth_password) {
    headers.authorization = 'Basic ' + utils.toBase64(client.auth_user + ':' + client.auth_password);
  }
  if (client.server_api_key) {
    headers['Api-Key'] = client.server_api_key;
  }
  request({
    uri: authSource,
    headers: headers
  }, callback);
}

// handleResponse
// -----------------
// Factory to create a function that handles the response from the server wrapping the passed callback
// to deal with authentication
function handleResponse(client, req, callback) {
  callback = callback || function () { };

  return function (error, response, body) {
      if (response && response.statusCode === 401) {
        var authType = response.headers['www-authenticate']
          , authSource = response.headers['oauth-source']
          ;

        if (authType && authSource) {
          return oAuthTokenRequest(client, authSource, function (error, response, body) {
            if (body) {
              client.Authorization = "Bearer " + body;
              client.wrapRequest(req, callback);
            } else {
              return callback(new Error('Unable to auth'), { });
            }
          });
        }
      }
      return callback(error, {
        httpResponse: response,
        statusCode: response ? response.statusCode : -1,
        content: body,
        asJson: function () { return JSON.parse(body); }
      });
    };
}

// Create your instance
// =====================
// `var client = http(options);`
// ####Options:
//     { }
// See [Connection](RavenUtils.html#section-4) options for details on specifying your server details
function RavenHttpClient(options) {
  options = utils.prepareServerOptions(options);

  for (var i in options) {
    if (options.hasOwnProperty(i)) {
      this[i] = options[i];
    }
  }
  
  this.server_url_parts = url.parse(this.server_url);
  this.server_url_root = this.server_url_parts.protocol + '//' + this.server_url_parts.host;
}

// Combines url of the server with path and query segments
// =======================================================
// `client.buildUrl(path, query);`
// ####Parameters:
// `path` - Path of the request. Paths are relative to the multi-tenant server url, use absolute paths for server level requests, and relative for database level  
// `query` - Hash of querystring parameters
// ####Returns:
// The combined URL
RavenHttpClient.prototype.buildUrl = function (path, query) {
  var parts = Object.create(this.server_url_parts);
  path = encodeURI(path);
  if (path) {
    if (path[0] === '/') {
      parts.pathname = path; // Go back to root
    } else {
      if (parts.pathname[parts.pathname.length - 1] !== '/') {
        parts.pathname += '/'; // Add a trailing slash if needed
      }
      parts.pathname += path;
    }
  }
  if (query) {
    parts.query = query;
  }
  return url.format(parts);
};

// Wrap server requests to handle auth, proxying etc
// =================================================
// `client.wrapRequest(req, [callback]);`
// ####Parameters:
// `req` - The request object that is being wrapped
// ####Callback:
// A standard callback for the `request` library
RavenHttpClient.prototype.wrapRequest = function (req, callback) {
  req.headers = req.headers || { };
  if (this.Authorization) {
    req.headers.Authorization = this.Authorization;
  }
  if (req.json) {
    req.body = JSON.stringify(req.json);
    delete req.json;
    req.headers['content-type'] = 'application/json; charset=utf-8';
    req.headers.accept = 'application/json';
  }
  // Uncomment to test with fiddler  
  //req.proxy = 'http://localhost:8888';
  request(req, handleResponse(this, req, callback));
};

// Perform a GET request against the server
// ========================================
// `client.get(path, query, [callback]);`
// ####Parameters:
// `path` - Path of the request. Paths are relative to the multi-tenant server url, use absolute paths for server level requests, and relative for database level  
// `query` - Path of the request. Hash of querystring parameters
// ####Callback:
//      function (error, result)
//
//      result:
//      {
//        httpResponse: The HTTP response
//        statusCode: The status code of the response
//        content: The body of the response
//        asJson(): A function to deserialize a json body
//      }
RavenHttpClient.prototype.get = function (path, query, callback) {
  var self = this;

  self.wrapRequest({
      uri: self.buildUrl(path, query)
    }, callback);
};


// Perform a PUT request against the server
// ========================================
// `client.put(path, query, content, headers [callback]);`
// ####Parameters:
// `path` - Path of the request. Paths are relative to the multi-tenant server url, use absolute paths for server level requests, and relative for database level  
// `query` - Path of the request. Hash of querystring parameters  
// `content` - Hash to be converted to JSON and sent to the server as the body of the request
// `headers` - Hash of http headers to send with request
// ####Callback:
//      function (error, result)
//
//      result:
//      {
//        httpResponse: The HTTP response
//        statusCode: The status code of the response
//        content: The body of the response
//        asJson(): A function to deserialize a json body
//      }
RavenHttpClient.prototype.put = function (path, query, content, headers, callback) {
  var self = this;

  self.wrapRequest({
      method: 'PUT',
      uri: self.buildUrl(path, query),
      json: content,
      headers: headers
    }, callback);
};

// Perform a POST request against the server
// ========================================
// `client.post(path, query, content, headers [callback]);`
// ####Parameters:
// `path` - Path of the request. Paths are relative to the multi-tenant server url, use absolute paths for server level requests, and relative for database level  
// `query` - Path of the request. Hash of querystring parameters  
// `content` - Hash to be converted to JSON and sent to the server as the body of the request
// `headers` - Hash of http headers to send with request
// ####Callback:
//      function (error, result)
//
//      result:
//      {
//        httpResponse: The HTTP response
//        statusCode: The status code of the response
//        content: The body of the response
//        asJson(): A function to deserialize a json body
//      }
RavenHttpClient.prototype.post = function (path, query, content, headers, callback) {
  var self = this;

  self.wrapRequest({
      method: 'POST',
      uri: self.buildUrl(path, query),
      json: content,
      headers: headers
    }, callback);
};

// Select a database
// =================
// Note: It is preferable to use the constructor argument `server_db`
// `client.getDatabaseNames(name);`
// ####Parameters:
// `name` - The name of the database to use
RavenHttpClient.prototype.useDatabase = function (name) {
  this.server_url = this.server_url_root + '/databases/' + name;
};


// Expose via factory method.
function ravenHttpClient(options) {
  return new RavenHttpClient(options);
}

module.exports = ravenHttpClient;