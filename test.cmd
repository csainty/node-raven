@echo off
del /q /s .\Ravendb\data > NUL
del /q /s .\Ravendb\logs > NUL
start "node-raven-test-server" /MIN .\RavenDb\Raven.Server
node .\test\waitforserver.js

echo ---
echo Test results
echo ---
cmd /C .\node_modules\.bin\mocha .\test\ravenhttpclient.test.js .\test\HiLoKeyGenerator.test.js .\test\client.test.js 
taskkill /F /FI "WINDOWTITLE eq node-raven-test-server" > NUL

echo ---
echo JShint results
echo ---
cmd /C .\node_modules\.bin\jshint .\lib\client.js .\lib\ravenhttpclient.js .\lib\HiLoKeyGenerator.js

