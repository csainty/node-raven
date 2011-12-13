/*!
 * node-raven
 * Copyright (c) 2011 Chris Sainty <csainty@hotmail.com>
 * MIT License
 */

var qs = require('querystring');

function HiLoKeyGenerator(options) {
	if (!options || !options.server) { throw new Error('You must specify the server when creating HiLoKeyGenerator') }
	
	this.server= options.server;
	this.documentPrefix = 'Raven/Hilo/';
	this.keySeparator = '/';
	this.entityGenerators = {};
	this.capacity = 32;
}

HiLoKeyGenerator.prototype.generateDocumentKey = function(entityName, callback) {
	var self = this;
	self.nextId(entityName, function(error, id) {
		if (error) { return callback(error, null); }
		
		callback(null, entityName + self.keySeparator + id);
	});
}

HiLoKeyGenerator.prototype.nextId = function(entityName, callback) {
	var self = this;
	if (!self.entityGenerators[entityName]) {
		// init a document that needs refreshing, it makes some of the later code simpler as we do not need to check it exists
		self.entityGenerators[entityName]= { lastId: 0, currentMax: 0 };
	}

	// Increment our current then validate against the max
	var generator =self.entityGenerators[entityName]; 
	generator.lastId += 1;
	if (generator.lastId > generator.currentMax) {
		// We have exceeded the currently assigned limit, get a new limi
		self.getNextMax(entityName, function(error) {
			if (error) { return callback(error); }
			
			generator.lastId += 1;
			callback(null, generator.lastId);
		});
	} else {
		// We are still in range, so just send it back
		callback(null, generator.lastId);	
	}
}

HiLoKeyGenerator.prototype.getNextMax = function(entityName, callback) {
	var self = this;

	self.server.getDocument(self.documentPrefix + entityName, function(error, result, doc){
		if (error) { return callback(error); }
		
		if (doc) {
			var lastMax = doc.max;
			doc.max += self.capacity;
			self.server.putDocument(self.documentPrefix + entityName, doc, function(error, result, ok) {
				if (error) { return callback(error); }
				if (!ok) { return callback(new Error('Unable to update HiLO metadata')); }

				self.entityGenerators[entityName].currentMax = doc.max;
				self.entityGenerators[entityName].lastId = lastMax;
				callback(null);
			});	
		} else {
			doc = { max: self.capacity };
			self.server.putDocument(self.documentPrefix + entityName, doc, function(error, result, ok) {
				if (error) return callback(error);
				if (!ok) { return callback(new Error('Unable to update HiLO metadata')); }
		
				self.entityGenerators[entityName].currentMax = doc.max;
				self.entityGenerators[entityName].lastId = 0;

				callback(null);
			});
		}
	});
}

function generator(options){ 
	return new HiLoKeyGenerator(options);
}

module.exports = generator; 