@echo off
del /q /s .\Ravendb\data > NUL
start "node-raven-test-server" /MIN .\RavenDb\Raven.Server
node .\test\waitforserver.js
cmd /C .\node_modules\.bin\mocha .\test\ravenhttpclient.test.js .\test\HiLoKeyGenerator.test.js .\test\client.test.js 
taskkill /F /FI "WINDOWTITLE eq node-raven-test-server" > NUL

