/*!
 * node-raven
 * Copyright (c) 2011 Chris Sainty <csainty@hotmail.com>
 * MIT License
 */

var request = require('request'),
		url = require('url');

function RavenHttpClient(options) {
	if (typeof options === 'string') options = { 'server_url' : options };
	
	for (var i in options) {
		this[i] = options[i];
	}
	
	this.server_url_parts = url.parse(this.server_url);	
}

RavenHttpClient.prototype.buildUrl = function(path, query) {
	var parts = Object.create(this.server_url_parts);
	if (path)
		parts.pathname = (path[0] === '/' ? path : (parts.pathname + path));
	if (query)
		parts.query = query;
	return url.format(parts);	
};

RavenHttpClient.prototype.get = function(path, query, callback) {
	var self = this;
	request.get(self.buildUrl(path, query), function (error, response, body) {
		callback(error, {
			httpResponse: response,
			statusCode: response ? response.statusCode : -1,
			content: body,
			asJson: function() { return JSON.parse(body); }
		});
	}); 
};

RavenHttpClient.prototype.put = function(path, query, content, callback) {
	var self = this;
	request.put({
			uri: self.buildUrl(path, query),
			json: content
		}, function (error, response, body) {
			callback(error, {
				httpResponse: response,
				statusCode: response ? response.statusCode : -1,
				content: body,
				asJson: function() { return JSON.parse(body); }
			});
	}); 
};

function ravenHttpClient(options) {
	return new RavenHttpClient(options);
}

module.exports = ravenHttpClient;