/*!
 * node-raven
 * Copyright (c) 2011 Chris Sainty <csainty@hotmail.com>
 * MIT License
 *
 * HTTP Client for communicating with a RavenDb server.
 * Deals with HTTP level concerns suchs as Authentication, Compression and Caching
 *
 * options:
 * server_url - URL for the RavenDb server (required)
 * server_api_key - API Key to use when accessing the server with oAuth
 * auth_user - Username to connect to server with
 * auth_password - Password to connect to server with
 */

var request = require('request')
  , url = require('url')
  ;


/**
 * Base64 encode a string
 */
function toBase64(str) {
  return (new Buffer(str || "", "ascii")).toString("base64");
}

/**
 * Requests oAuth token from the server
 * @param [string] oAuth source returned from the server
 */
function oAuthTokenRequest(client, authSource, callback) {
  // TODO: Fetch these from the auth document? A pain.
  var headers = {
    'grant_type': 'client_credentials',
    'accept': 'application/json;charset=UTF-8'
  };
  if (client.auth_user && client.auth_password) {
    headers.authorization = 'Basic ' + toBase64(client.auth_user + ':' + client.auth_password);
  }
  if (client.server_api_key) {
    headers['Api-Key'] = client.server_api_key;
  }

  request({
    uri: authSource,
    headers: headers
  }, callback);
}

/**
 * Creates a function to handle the response from the server wrapping the passed callback
 * @param  [function]  The real callback to fired when the response is received
 */
function handleResponse(client, req, callback) {
  callback = callback || function () { };

  return function (error, response, body) {
      if (response && response.statusCode === 401) {
        var authType = response.headers['www-authenticate']
          , authSource = response.headers['oauth-source']
          ;

        if (authType && authSource) {
          return oAuthTokenRequest(client, authSource, function (error, response, body) {
            client.Authorization = "Bearer " + body;
            client.wrapRequest(req, callback);
          });
        }
      }
      callback(error, {
        httpResponse: response,
        statusCode: response ? response.statusCode : -1,
        content: body,
        asJson: function () { return JSON.parse(body); }
      });
    };
}

function RavenHttpClient(options) {
  if (typeof options === 'string') { options = { 'server_url' : options }; }
  
  for (var i in options) {
    this[i] = options[i];
  }

  if (!this.server_url || typeof(this.server_url) !== 'string') { throw new Error('You must specify a serevr_url'); }
  
  this.server_url_parts = url.parse(this.server_url);
}

/**
 * Combines url of the server with path and query segments
 * @param  {string} path  Path of the request. Paths are relative to the multi-tenant server url, use absolute paths for server level requests, and relative for database level
 * @param  {object} query Hash of querystring parameters
 * @return {string}
 */
RavenHttpClient.prototype.buildUrl = function (path, query) {
  var parts = Object.create(this.server_url_parts);

  if (path) {
    parts.pathname = (path[0] === '/' ? path : (parts.pathname + path));
  }
  if (query) {
    parts.query = query;
  }
  return url.format(parts);
};

RavenHttpClient.prototype.wrapRequest = function (req, callback) {
  if (this.Authorization) {
    req.headers = req.headers || { };
    req.headers.Authorization = this.Authorization;
  }
  request(req, handleResponse(this, req, callback));
};

/**
 * Perform a GET request against the server
 * @param  {string}   path  Path of the request. Paths are relative to the multi-tenant server url, use absolute paths for server level requests, and relative for database level
 * @param  {object}   query Hash of querystring parameters
 * @param  {Function(error, response, body)} callback Callback receives an error object, a wrapped httpResponse and the body of the response
 */
RavenHttpClient.prototype.get = function (path, query, callback) {
  var self = this;

  self.wrapRequest({
      uri: self.buildUrl(path, query)
    }, callback);
};

/**
 * Perform a PUT request against the server
 * @param  {string}   path     Path of the request. Paths are relative to the multi-tenant server url, use absolute paths for server level requests, and relative for database level
 * @param  {object}   query    Hash of querystring parameters
 * @param  {object}   content  Hash to be converted to JSON and sent to the server as the body of the request
 * @param  {object}   headers  Hash of http headers to send with request
 * @param  {Function(error, response, body)} callback Callback receives an error object, a wrapped httpResponse and the body of the response
 */
RavenHttpClient.prototype.put = function (path, query, content, headers, callback) {
  var self = this;

  self.wrapRequest({
      method: 'PUT',
      uri: self.buildUrl(path, query),
      json: content,
      headers: headers
    }, callback);
};

/**
 * Perform a POST request against the server
 * @param  {string}   path     Path of the request. Paths are relative to the multi-tenant server url, use absolute paths for server level requests, and relative for database level
 * @param  {object}   query    Hash of querystring parameters
 * @param  {object}   content  Hash to be converted to JSON and sent to the server as the body of the request
 * @param  {object}   headers  Hash of http headers to send with request
 * @param  {Function(error, response, body)} callback Callback receives an error object, a wrapped httpResponse and the body of the response
 */
RavenHttpClient.prototype.post = function (path, query, content, headers, callback) {
  var self = this;

  self.wrapRequest({
      method: 'POST',
      uri: self.buildUrl(path, query),
      json: content,
      headers: headers
    }, callback);
};

function ravenHttpClient(options) {
  return new RavenHttpClient(options);
}

module.exports = ravenHttpClient;