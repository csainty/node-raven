var server_url = 'http://localhost:8080';
var server_url_mt = 'http://localhost:8080/databases/test/';
var util = require('util');
var should = require('should');
var request = require('request');
var ravenhttpclient = require('../lib/ravenhttpclient')(server_url);
var ravenhttpclient_mt = require('../lib/ravenhttpclient')(server_url_mt);

describe('RavenHttpClient', function(){
	describe('options', function() {
		it('should throw an error when no server is specified', function(){
			(function () { require('../lib/ravenhttpclient')(); }).should.throw();
		})
		it('should allow the server url to passed as a string', function(){
			(function () { require('../lib/ravenhttpclient')(server_url); }).should.not.throw();
		})
		it('should allow the server url to be passed on the options object', function(){
			(function () { require('../lib/ravenhttpclient')({ server_url: server_url }); }).should.not.throw();
		})
	})
	describe('.buildUrl', function(){
		it('should correctly handle path and query string', function(){
			ravenhttpclient.buildUrl('test', {'q':'search'}).should.equal(server_url + '/test?q=search');
		})
		it('should correctly handle no path', function(){
			ravenhttpclient.buildUrl('', {'q':'search'}).should.equal(server_url + '/?q=search');
		})		
		it('should correctly handle no query', function(){
			ravenhttpclient.buildUrl('test', null).should.equal(server_url + '/test');
		})		
		it('should correctly handle relative url', function(){
			ravenhttpclient_mt.buildUrl('/test', null).should.equal(server_url + '/test');
		})		
		it('should correctly handle absolute urls', function(){
			ravenhttpclient_mt.buildUrl('test', {'q':'search'}).should.equal(server_url_mt + 'test?q=search');
		})
	})
	describe('.get', function() {
		it('should be able to perform a GET request', function(done) {
			ravenhttpclient.get('/databases', null, function(error, result) {
				should.not.exist(error);
				result.statusCode.should.equal(200);
				result.asJson().should.be.an.instanceof(Array);
				done();
			});
		})
	})
	describe('.put', function(){
		it('should be able to perform a PUT request', function(done) {
			ravenhttpclient.put('/docs/testput/1', null, { 'name' : 'test' }, function(error, result) {
				should.not.exist(error);
				result.statusCode.should.equal(201);
				done();
			})
		})
	})
})
