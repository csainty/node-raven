var util = require('util');
var should = require('should');
var request = require('request');
var info = require('../utils/testinfo.js');
var ravenhttpclient = require('../lib/ravenhttpclient')({ connection_string : info.connection_string });

describe('RavenHttpClient', function(){
	describe('options', function() {
		it('should throw an error when no server is specified', function(){
			(function () { require('../lib/ravenhttpclient')(); }).should.throw();
		})
		it('should allow the server url to passed as a string', function(){
			(function () { require('../lib/ravenhttpclient')('http://localhost:8000'); }).should.not.throw();
		})
    it('should allow the server url to be passed on the options object', function(){
      (function () { require('../lib/ravenhttpclient')({ server_url: 'http://localhost:8000' }); }).should.not.throw();
    })
    it('should allow the server url to be set by connection string', function(){
      (function () { require('../lib/ravenhttpclient')({ connection_string: 'Url=http://localhost:8000' }); }).should.not.throw();
    })
    it('should set the server_url when using connection string', function(){
      var c = require('../lib/ravenhttpclient')({ connection_string: 'Url=http://localhost:8000' });
      c.server_url.should.equal('http://localhost:8000');
    })
    it('should strip trailing slashes from the server url', function(){
      var c = require('../lib/ravenhttpclient')({ server_url: 'http://localhost:8000/' });
      c.server_url.should.equal('http://localhost:8000');
    })
    it('should string trailing / in multi tenant situations', function(){
      var c = require('../lib/ravenhttpclient')({ server_url: 'http://localhost:8000/database/test/' });
      c.server_url.should.equal('http://localhost:8000/database/test');
    })
    it('should correctly set the server root when in a multi tenant situation', function(){
      var c = require('../lib/ravenhttpclient')({ server_url: 'http://localhost:8000' });
      c.server_url_root.should.equal('http://localhost:8000');
    })
    it('should correctly set the server root when in a multi tenant situation', function(){
      var c = require('../lib/ravenhttpclient')({ server_url: 'http://localhost:8000/database/test' });
      c.server_url_root.should.equal('http://localhost:8000');
    })
	})
	describe('.buildUrl', function(){
		it('should correctly handle path and query string', function(){
			ravenhttpclient.buildUrl('test', {'q':'search'}).should.equal(ravenhttpclient.server_url + '/test?q=search');
		})
		it('should correctly handle no path', function(){
			var u = ravenhttpclient.buildUrl('', {'q':'search'});
      (u === ravenhttpclient.server_url + '?q=search' || u === ravenhttpclient.server_url + '/?q=search').should.be.true;
		})		
		it('should correctly handle no query', function(){
			ravenhttpclient.buildUrl('test', null).should.equal(ravenhttpclient.server_url + '/test');
		})		
		it('should correctly handle absolute url', function(){
			ravenhttpclient.buildUrl('/test', null).should.equal(ravenhttpclient.server_url_root + '/test');
		})		
	})
	describe('.get', function() {
		it('should be able to perform a GET request', function(done) {
			ravenhttpclient.get('databases', null, function(error, result) {
				should.not.exist(error);
				result.statusCode.should.equal(200);
				result.asJson().should.be.an.instanceof(Array);
				done();
			});
		})
	})
	describe('.put', function(){
		it('should be able to perform a PUT request', function(done) {
			ravenhttpclient.put('docs/testput/1', null, { 'name' : 'test' }, { 'etag' : '00000000-0000-0000-000000000000', 'raven-entity-name': 'TestPut' }, function(error, result) {
				should.not.exist(error);
				result.statusCode.should.equal(201);
				done();
			})
		})
	})
})
