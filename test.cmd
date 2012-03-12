@echo off

FOR /D %%f IN (RavenDb*) DO CALL :test %%f

echo.---JShint results---
node .\utils\hint.js

GOTO :EOF

:test
@ECHO.Testing %1
del /q /s .\%1\data > NUL
del /q /s .\%1\logs > NUL
start "node-raven-test-server" /MIN .\%1\Raven.Server
node .\utils\waitforserver.js

echo.---Test results for %1---
set RAVENDB_TEST_DIR=%1
cmd /C .\node_modules\.bin\mocha
taskkill /F /FI "WINDOWTITLE eq node-raven-test-server" > NUL