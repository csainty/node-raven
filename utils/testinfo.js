var fs = require('fs')
  , path = require('path')
  , credentials
  ;

if (process.env.RAVENDB_TEST_CONNSTRING) {
  // Testing a remote server based on a connection string
  module.exports = {
    connection_string: process.env.RAVENDB_TEST_CONNSTRING
  };
} else {
  // Testing a local server
  credentials= ''
  if (path.existsSync(process.env.RAVENDB_TEST_DIR + '/authentication.config')) {
    var auth = fs.readFileSync(process.env.RAVENDB_TEST_DIR + '/authentication.config', 'utf8');
    credentials= 'User=' + auth.match(/Username: (.*)/)[1] + ';Password=' + auth.match(/Password: (.*)/)[1];
  }

  module.exports = {
    connection_string: 'Url=http://localhost:8080;' + credentials
  };
}