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
 */

var request = require('request'),
	url = require('url');

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

/**
 * Perform a GET request against the server
 * @param  {string}   path  Path of the request. Paths are relative to the multi-tenant server url, use absolute paths for server level requests, and relative for database level
 * @param  {object}   query Hash of querystring parameters
 * @param  {Function(error, response, body)} callback Callback receives an error object, a wrapped httpResponse and the body of the response
 */
RavenHttpClient.prototype.get = function (path, query, callback) {
	var self = this;
	request({
			uri: self.buildUrl(path, query)
		}, function (error, response, body) {
			callback(error, {
				httpResponse: response,
				statusCode: response ? response.statusCode : -1,
				content: body,
				asJson: function () { return JSON.parse(body); }
			});
		});
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
	request({
			method: 'PUT',
			uri: self.buildUrl(path, query),
			json: content,
			headers: headers
		}, function (error, response, body) {
			callback(error, {
				httpResponse: response,
				statusCode: response ? response.statusCode : -1,
				content: body,
				asJson: function () { return JSON.parse(body); }
			});
		});
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
	request({
			method: 'POST',
			uri: self.buildUrl(path, query),
			json: content,
			headers: headers
		}, function (error, response, body) {
			callback(error, {
				httpResponse: response,
				statusCode: response ? response.statusCode : -1,
				content: body,
				asJson: function () { return JSON.parse(body); }
			});
		});
};

function ravenHttpClient(options) {
	return new RavenHttpClient(options);
}

module.exports = ravenHttpClient;