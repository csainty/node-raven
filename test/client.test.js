var raven = require('../lib/client');
var server = raven('http://localhost:8080');

describe('Client', function() {
	describe('#queryIndex()', function(){
		it('should return results', function(done) {
			server.queryIndex('test', '', function(result) {
				result.should.equal('test');
				done();
			})
		})
	})
})
