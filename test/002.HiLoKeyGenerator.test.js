var util = require('util');
var should = require('should');
var request = require('request');
var info = require('../utils/testinfo.js');
var server= require('../lib/client')({ connection_string: info.connection_string });
var hilo = require('../lib/hilokeygenerator')({ client: server });

describe('HiLoKeyGenerator', function(){
	it('should be able to generate a valid key', function(done){
		hilo.generateDocumentKey('Album', function(error, key){
			should.not.exist(error);
			key.should.equal('Album/1');
			done();			
		})
	})
	it('should be able to generate keys for multiple entity types', function(done) {
		hilo.generateDocumentKey('Artist', function(error, key){
			should.not.exist(error);
			key.should.equal('Artist/1');
			done();			
		})
	})
	it('should be able to generate enough keys to require a second set from the server', function(done) {
		var count = 0;
		var myHiLo= require('../lib/hilokeygenerator')({ client: server, capacity : 10 });
		function handle(error, key) {
			count += 1;
			if (error || count >= 20) { return done(error); }
			key.should.equal('Store/' + count);
			myHiLo.generateDocumentKey('Store', handle);	
		}
		myHiLo.generateDocumentKey('Store', handle);
	})
	it('should be able to generate keys with a different separator', function(done) {
		var myHiLo= require('../lib/hilokeygenerator')({ client: server, keySeparator : '-' });
		myHiLo.generateDocumentKey('DashTest', function(error, key){
			should.not.exist(error);
			key.should.equal('DashTest-1');
			done();			
		})		
	})
	it('should fetch the max from the server before generating any keys', function(done) {
		server.putDocument('Raven/HiLo/MaxTest', { max: 1000 }, function(error, response, ok) {
			should.not.exist(error);
			ok.should.be.true;

			hilo.generateDocumentKey('MaxTest', function (error, key) {
				should.not.exist(error);
				key.should.equal('MaxTest/1001');
				done();
			})
		})
	})
	it('should convert from ServerHi to Max formatted keys', function(done) {
		server.putDocument('Raven/HiLo/ServerHiTest', { ServerHi: 10 }, function(error, response, ok) {
			should.not.exist(error);
			ok.should.be.true;

			hilo.generateDocumentKey('ServerHiTest', function (error, key) {
				should.not.exist(error);
				key.should.equal('ServerHiTest/289');
				
				server.getDocument('Raven/HiLo/ServerHiTest', function(error, response, doc) {
					should.not.exist(error);
					response.statusCode.should.equal(200);
					should.exist(doc);
					should.not.exist(doc.ServerHi); // Make sure we removed the old property
					done();
				})
			})
		})
	})	
})
