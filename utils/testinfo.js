var fs = require('fs')
  , path = require('path')
  , user
  , pass
  ;

if (path.existsSync(process.env.RAVENDB_TEST_DIR + '/authentication.config')) {
  var auth = fs.readFileSync(process.env.RAVENDB_TEST_DIR + '/authentication.config', 'utf8');
  user= auth.match(/Username: (.*)/)[1];
  pass= auth.match(/Password: (.*)/)[1];
}

module.exports = {
  folder: process.env.RAVENDB_TEST_DIR,
  user: user,
  pass: pass,
  server_url: 'http://localhost:8080',
  server_url_tenant: 'http://localhost:8080/databases/test/'
};
