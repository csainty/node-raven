/*!
 * node-raven
 * Copyright (c) 2011 Chris Sainty <csainty@hotmail.com>
 * MIT License
 *
 * A key generator that reserves ranges of keys from the server allowing it to creating new entities with
 * fewer round trips to the server.
 *
 * options:
 * client - node-raven client
 * keySeparator - Separator character used in keys (default: /)
 * capacity - The number of keys to reserve in each bacth (default: 32)
 */

var qs = require('querystring');

function HiLoKeyGenerator(options) {
	if (!options || !options.client) { throw new Error('You must specify the client when creating HiLoKeyGenerator'); }

	for (var i in options) {
		this[i] = options[i];
	}
	
	if (!this.keySeparator) { this.keySeparator = '/'; }
	if (!this.capacity) { this.capacity = 32; }

	this.documentPrefix = 'Raven/Hilo/';
	this.entityGenerators = {}; // Hold each entity type's generator
}

 /**
  * Generate a new document key for the provided entity type
  * @param  {string}   entityName The name of the entities we are generating keys for
  * @param  {Function(error, key)} callback   Callback which provides the generated key
  */
HiLoKeyGenerator.prototype.generateDocumentKey = function (entityName, callback) {
	var self = this;
	self.nextId(entityName, function (error, id) {
		if (error) { return callback(error, null); }
		
		callback(undefined, entityName + self.keySeparator + id);
	});
};

/**
 * Find the next available id, if we have used our range up, then fetch a new range from the server
 * @param  {string}   entityName The name of the entities we are generating keys for
 * @param  {Function(error, id)} callback   Callback which provides the generated id
 */
HiLoKeyGenerator.prototype.nextId = function (entityName, callback) {
	var self = this,
		generator;
	if (!self.entityGenerators[entityName]) {
		// First time generating this entity, create a placeholder document before fetching it from the server.
		self.entityGenerators[entityName] = { lastId: 0, currentMax: 0 };
	}

	// Increment our current then validate against the max
	generator = self.entityGenerators[entityName];
	generator.lastId += 1;
	if (generator.lastId > generator.currentMax) {
		// We have exceeded the currently assigned limit, get a new limit
		self.getNextMax(entityName, function (error) {
			if (error) { return callback(error); }
			
			generator.lastId += 1;
			callback(undefined, generator.lastId);
		});
	} else {
		// We are still in range, so just send it back
		callback(undefined, generator.lastId);
	}
};

 /**
  * Query the server for the next reserved id range for these entities
  * @param  {string}   entityName The name of the entities we are generating keys for
  * @param  {Function(error)} callback   Callback to indicate we have queried the server and are ready to generate more keys
  */
HiLoKeyGenerator.prototype.getNextMax = function (entityName, callback) {
	var self = this;

	self.client.getDocument(self.documentPrefix + entityName, function (error, result, doc) {
		if (error) { return callback(error); }
		
		if (doc) {
			if (doc.ServerHi) {
				// We have the older format ServerHi document, convert to the new Max which supports changing capacity
				doc.max = (doc.ServerHi - 1) * self.capacity;
				doc.ServerHi = undefined;
			}

			var lastMax = doc.max;
			doc.max += self.capacity;
			self.client.putDocument(self.documentPrefix + entityName, doc, function (error, result, ok) {
				if (error) { return callback(error); }
				if (!ok) { return callback(new Error('Unable to update HiLO metadata')); }

				self.entityGenerators[entityName].currentMax = doc.max;
				self.entityGenerators[entityName].lastId = lastMax;
				callback(undefined);
			});
		} else {
			doc = { max: self.capacity };
			self.client.putDocument(self.documentPrefix + entityName, doc, function (error, result, ok) {
				if (error) { return callback(error); }
				if (!ok) { return callback(new Error('Unable to update HiLoKeyGenerator metadata')); }
		
				self.entityGenerators[entityName].currentMax = doc.max;
				self.entityGenerators[entityName].lastId = 0;

				callback(undefined);
			});
		}
	});
};

function generator(options) {
	return new HiLoKeyGenerator(options);
}

module.exports = generator;