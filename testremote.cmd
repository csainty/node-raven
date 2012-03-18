@ECHO OFF
set RAVENDB_TEST_CONNSTRING=Url=<enter remote url here>
set RAVENDB_TEST_NOADMIN=true
cmd /C .\node_modules\.bin\mocha --timeout 10000
set RAVENDB_TEST_CONNSTRING=
set RAVENDB_TEST_NOADMIN=