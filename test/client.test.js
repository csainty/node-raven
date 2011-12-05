var util = require('util');
var should = require('should');
var raven = require('../lib/client');
var server = raven('http://localhost:8080');
var databaseNames;

describe('Client', function() {
	describe('constructQuery()', function() {
		it('should prepend server name to queries', function(){
			server.constructQuery('/databases').should.equal('http://localhost:8080/databases');
		})
	})

	describe('getDatabaseNames()', function() {
		it('should return an array of database names', function(done){
			server.getDatabaseNames(function (result){
				should.exist(result);
				result.should.be.an.instanceof(Array);
				databaseNames = result;
				done();
			})
		})
	})
	
	describe('putdocument()', function() {
		it('should return true when saving a document', function (done) {
			server.putDocument('docs-1', { 'message': 'Testing.1.2.3' }, function(result){
				should.exist(result);
				result.should.be.true;
				done();
			})
		})
	})
	
	describe('getDocument()', function(){
		it('should return null if document is not found', function (done) {
			server.getDocument('invalidKey', function(result) {
				should.not.exist(result);
				done();
			});
		})
		it('should return the correct document')
	})
	
	describe('ensureDatabaseExists()', function() {
		it('should create a database that does not exist', function(done){
			server.ensureDatabaseExists('node-raven', done);
		})
		it('should not error when a database already exists', function(done){
			server.ensureDatabaseExists('node-raven', done);
		})
	})

	describe('queryIndex()', function(){
		it('should return results', function(done) {
			server.queryIndex('test', '', function(result) {
				result.should.equal('test');
				done();
			})
		})
	})
})
