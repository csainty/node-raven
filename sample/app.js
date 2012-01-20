
/**
 * Module dependencies.
 */

var express = require('express'),
	routes = require('./routes'),
	raven = require('../lib/client.js'),
	server = raven({ server_url : 'http://localhost:8080/' }),
	app = module.exports = express.createServer();

server.ensureDatabaseExists('node-raven-sample', function (error, response, ok) {
	if (error || !ok) {
		throw new Error('Unable to create database in RavenDb. Check the server is running.');
	}

	server.useDatabase('node-raven-sample');

	// Configuration
	app.configure(function () {
		app.set('views', __dirname + '/views');
		app.set('view engine', 'jade');
		app.use(express.bodyParser());
		app.use(express.methodOverride());
		app.use(app.router);
		app.use(express.static(__dirname + '/public'));
	});

	app.configure('development', function () {
		app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
	});

	app.configure('production', function () {
		app.use(express.errorHandler());
	});

	// Routes

	app.get('/', routes.index);

	app.listen(3000);
	console.log("The node-raven sample application is listening on port %d in %s mode. Type 'exit' and hit <ENTER> to quit.", app.address().port, app.settings.env);


	// The below code is just to enable the exit by typeing quit functionality. It is not generally needed in production
	process.stdin.resume();
	process.stdin.setEncoding('utf8');
	process.stdin.on('data', function (chunk) {
		if (chunk.toLowerCase().substring(0, 4) === 'exit') {
			process.exit(0);
		}
	});
});