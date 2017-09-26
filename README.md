node-raven is a RavenDB client for node.js


If you are on Windows, make sure you use the MSI installer for Node which includes npm.

http://nodejs.org/#download


See http://csainty.github.com/node-raven for documentation or the tests for example usage.

To use this code you need to run the following command to install all dependencies.

```
npm install
```

To test this code you should use this command which installs the test libraries and runner.

```
npm install -d
```

The test.cmd script assumes a dedicated RavenDB instance is sitting in the .\RavenDB folder.  
It will delete the data folder, start and stop the server for each run of the tests.  
You can test against multiple RavenDB versions or configurations by creating additional folders in the format .\RavenDB_{Name}, the test script will run the tests against the RavenDB instance in each folder.

There is currently no windows authentication support. So please either turn off authentication with the following setting

```
<add key="Raven/AnonymousAccess" value="All" />  <!-- All|Get|None -->
```

Or use oAuth for authentication with these settings.

```
<add key="Raven/AnonymousAccess" value="Get" />  <!-- All|Get|None -->
<add key="Raven/AuthenticationMode" value="oauth" /> <!-- windows|oauth -->
```

See Also  
RavenDB - http://www.ravendb.net  
Node.js - http://nodejs.org  
Request - https://github.com/mikeal/request  
Underscore - http://documentcloud.github.com/underscore/  
Should - https://github.com/visionmedia/should.js  
Mocha - http://mochajs.org/  
Jshint - https://github.com/jshint/node-jshint  
Chris Sainty - http://blog.csainty.com  -  @csainty  
