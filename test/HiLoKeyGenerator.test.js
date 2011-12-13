var server_url = 'http://localhost:8080';
var util = require('util');
var should = require('should');
var request = require('request');
var server= require('../lib/client')(server_url);
var hilo = require('../lib/hilokeygenerator')({ server: server });

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
		function handle(error, key) {
			count += 1;
			if (error || count >= 200) { return done(error); }
			key.should.equal('Store/' + count);
			hilo.generateDocumentKey('Store', handle);	
		}
		hilo.generateDocumentKey('Store', handle);
	})
})
