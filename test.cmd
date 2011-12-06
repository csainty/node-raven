@echo off
del /q /s .\Ravendb\data > NUL
start "node-raven-test-server" /MIN .\RavenDb\Raven.Server
timeout /T 3 /nobreak > NUL
cmd /C .\node_modules\.bin\mocha .\test\client.test.js
taskkill /F /FI "WINDOWTITLE eq node-raven-test-server" > NUL