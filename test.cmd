@echo off
start "node-raven-test-server" /MIN .\RavenDb\Raven.Server
timeout /T 5 /nobreak > NUL
cmd /C .\node_modules\.bin\mocha .\test\client.test.js
taskkill /F /FI "WINDOWTITLE eq node-raven-test-server" > NUL