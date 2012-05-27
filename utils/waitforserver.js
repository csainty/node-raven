var server_url = 'http://localhost:8080';
var request = require('request');

console.log('Waiting for RavenDb server @ ' + server_url + ' to start responding');
checkServerIsUp();

function checkServerIsUp() {
  request(server_url + '/build/version', function (error, response) {
    if (!error && response.statusCode == 200) {
      return;
    } 
    checkServerIsUp();
  });
}