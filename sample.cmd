@echo off
start "node-raven-sample-server" /MIN .\RavenDb\Raven.Server

node .\utils\waitforserver.js
node .\sample\app.js	

taskkill /F /FI "WINDOWTITLE eq node-raven-sample-server" > NUL