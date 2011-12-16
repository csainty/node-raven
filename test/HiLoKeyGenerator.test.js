var server_url = 'http://localhost:8080';
var util = require('util');
var should = require('should');
var request = require('request');
var server= require('../lib/client')(server_url);
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
			if (error || count >= 50) { return done(error); }
			key.should.equal('Store/' + count);
			hilo.generateDocumentKey('Store', handle);	
		}
		hilo.generateDocumentKey('Store', handle);
	})
	it('should be able to generate keys with a different separator', function(done){
		var myHiLo= require('../lib/hilokeygenerator')({ client: server, keySeparator : '-' });
		myHiLo.generateDocumentKey('DashTest', function(error, key){
			should.not.exist(error);
			key.should.equal('DashTest-1');
			done();			
		})		
	})
})
