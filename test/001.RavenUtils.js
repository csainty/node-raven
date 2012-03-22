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
})  