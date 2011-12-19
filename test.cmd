@echo off

FOR /D %%f IN (RavenDb*) DO CALL :test %%f

echo.---JShint results---
cmd /C .\node_modules\.bin\jshint .\lib\client.js .\lib\ravenhttpclient.js .\lib\HiLoKeyGenerator.js --config test\jshint-config.json

GOTO :EOF

:test
@ECHO.Testing %1
del /q /s .\%1\data > NUL
del /q /s .\%1\logs > NUL
start "node-raven-test-server" /MIN .\%1\Raven.Server
node .\test\waitforserver.js

echo.---Test results for %1---
cmd /C .\node_modules\.bin\mocha .\test\ravenhttpclient.test.js .\test\HiLoKeyGenerator.test.js .\test\client.test.js 
taskkill /F /FI "WINDOWTITLE eq node-raven-test-server" > NUL