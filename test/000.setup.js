var should = require('should')
  , raven = require('../lib/client')
  , info = require('../utils/testinfo.js')
  , server= require('../lib/client')({ connection_string: info.connection_string })
  ;

describe('Test Setup', function () {
  if (server.server_db) {
    // Testing in a database so ensure it exists
    it('should ensure database exists', function (done) {
      server.ensureDatabaseExists(server.server_db, function(error, result, ok) {
        should.not.exist(error);
        should.exist(result);
        should.exist(ok);
        ok.should.be.true;
        done();
      });
    })
  }  
})
