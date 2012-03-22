var should = require('should')
  , utils = require('../lib/RavenUtils.js')
  ;

describe('RavenUtils', function() {
  describe('buildRavenQuery', function() {
    it('should correctly encode a raven query', function(){
      utils.buildRavenQuery({ 'Name' : 'Chris' }).should.equal('Name%3AChris');
    })
    it('should correctly encode a raven query with multiple values', function(){
      utils.buildRavenQuery({ 'Name' : 'Chris', 'Surname' : 'Sainty' }).should.equal('Name%3AChris%20Surname%3ASainty');
    })
  })
  describe('toBase64', function() {
    it('should correctly base64 encode a string', function() {
      utils.toBase64('test').should.equal('dGVzdA==');
    })
  })
  describe('prepareServerOptions', function() {
    it('should throw when no parameter is passed', function() {
      (function() { utils.prepareServerOptions(); }).should.throw();
    })
    it('should throw when no server_url or connection string is found', function() {
      (function() { utils.prepareServerOptions({ }); }).should.throw();
    })
    it('should throw when no server_url is found in a connection string', function() {
      (function() { utils.prepareServerOptions({ connection_string: 'ApiKey=123' }); }).should.throw();
    })
    it('should accept a string parameter', function() {
      var result = utils.prepareServerOptions('http://localhost');
      result.server_url.should.equal('http://localhost');
    })
    it('should parse url from a connection_string', function() {
      var result = utils.prepareServerOptions({ connection_string: 'Url=http://localhost' });
      result.server_url.should.equal('http://localhost');
      should.not.exist(result.connection_string);
    })
    it('should parse ApiKey from a connection_string', function() {
      var result = utils.prepareServerOptions({ connection_string: 'Url=http://localhost;ApiKey=12345' });
      result.server_url.should.equal('http://localhost');
      result.server_api_key.should.equal('12345');
      should.not.exist(result.connection_string);
    })
    it('should parse User and Password from a connection_string', function() {
      var result = utils.prepareServerOptions({ connection_string: 'Url=http://localhost;User=admin;Password=secret' });
      result.server_url.should.equal('http://localhost');
      result.auth_user.should.equal('admin');
      result.auth_password.should.equal('secret');
      should.not.exist(result.connection_string);
    })
    it('should parse Database from a connection_string', function() {
      var result = utils.prepareServerOptions({ connection_string: 'Url=http://localhost;Database=test' });
      result.server_url.should.equal('http://localhost/databases/test');
      result.server_db = 'test';
      should.not.exist(result.connection_string);
    })
    it('should parse DefaultDatabase from a connection_string', function() {
      var result = utils.prepareServerOptions({ connection_string: 'Url=http://localhost;DefaultDatabase=test' });
      result.server_url.should.equal('http://localhost/databases/test');
      result.server_db = 'test';
      should.not.exist(result.connection_string);
    })
    it('should accept a database in option form', function() {
      var result = utils.prepareServerOptions({ server_url : 'http://localhost', database_name : 'test' });
      result.server_url.should.equal('http://localhost/databases/test');
      result.server_db = 'test';
    })
    it('should combine a connection string and database_name', function() {
      var result = utils.prepareServerOptions({ connection_string : 'Url=http://localhost', database_name : 'test' });
      result.server_url.should.equal('http://localhost/databases/test');
      result.server_db = 'test';
      should.not.exist(result.connection_string);
    })
    it('should strip the trailing slash from a server_url', function() {
      var result = utils.prepareServerOptions('http://localhost/');
      result.server_url.should.equal('http://localhost');
    })
    it('should strip the trailing slash from a server_url without removing database path', function() {
      var result = utils.prepareServerOptions('http://localhost/database/test/');
      result.server_url.should.equal('http://localhost/database/test');
    })
  })
})  