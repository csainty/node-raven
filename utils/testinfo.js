var fs = require('fs')
  , credentials
  , database
  ;

if (process.env.RAVENDB_TEST_CONNSTRING) {
  // Testing a remote server based on a connection string
  module.exports = {
    connection_string: process.env.RAVENDB_TEST_CONNSTRING,
    isAdmin: process.env.RAVENDB_TEST_NOADMIN ? false : true
  };
} else {
  // Testing a local server
  credentials= '';
  database= '';
  if (fs.existsSync(process.env.RAVENDB_TEST_DIR + '/authentication.config')) {
    var auth = fs.readFileSync(process.env.RAVENDB_TEST_DIR + '/authentication.config', 'utf8');
    credentials= 'User=' + auth.match(/Username: (.*)/)[1] + ';Password=' + auth.match(/Password: (.*)/)[1] + ';';
  }
  if (process.env.RAVENDB_TEST_DB && process.env.RAVENDB_TEST_DB.length > 0) {
    database= 'Database=' + process.env.RAVENDB_TEST_DB + ';';
  }

  module.exports = {
    connection_string: 'Url=http://localhost:8080;' + credentials + database,
    isAdmin: process.env.RAVENDB_TEST_NOADMIN ? false : true
  };
}