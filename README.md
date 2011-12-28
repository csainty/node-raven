node-raven is a RavenDB client for Node.


If you are on Windows, make sure you use the MSI installer for Node which includes npm.

http://nodejs.org/#download


See test/client.test.json for exmaples of usage.

To use this code you need to

```
npm install request
npm install underscore
```

To test this code you also need to

```
npm install mocha
npm install should
npm install jshint
```

These dependencies are in the package.json, so you can just _npm install_ to get them all.

The test.cmd script assumes a dedicated RavenDb instance is sitting in the .\RavenDb folder.  
It will delete the data folder, start and stop the server for each run of the tests.  
You can test against multiple RavenDb versions or configurations by createing additional folders in the format .\RavenDb_{Name}, the test script will run the tests against the RavenDb instance in each folder.

Since there is no auth support yet, please change the following setting (from it's default Get) in Raven.Server.config

```
<add key="Raven/AnonymousAccess" value="All"/>
```

See Also  
RavenDb - http://www.ravendb.net  
NodeJs - http://nodejs.org  
Request - https://github.com/mikeal/request  
Underscore - http://documentcloud.github.com/underscore/  
Should - https://github.com/visionmedia/should.js  
Mocha - http://visionmedia.github.com/mocha/  
Jshint - https://github.com/jshint/node-jshint  
Chris Sainty - http://csainty.blogspot.com  -  @csainty  