var qs = require('querystring')
  ;

function RavenUtils() { }

/**
 * Parse server options and perform any validation, transformation or cleanup required
 * @param [object] Hash of server options
 * {
 *   connection_string: "Url=<server url>;ApiKey=<server api key>;User=<oAuth user>;Password=<oAuth password>;Database=<Database name>",
 *   server_url: <server url if not using connection_string>,
 *   auth_user: <oAuth user if not using connection string>,
 *   auth_password: <oAuth password if not using connection string>,
 *   server_api_key: <Server API key if not using connection string>,
 *   database_name= <Database name if not using connection string>
 * }
 */
RavenUtils.prototype.prepareServerOptions = function (options) {
  var o, parts;
  if (typeof options === 'string') { options = { server_url : options }; }

  // Parse connection string if present
  if (options.hasOwnProperty('connection_string')) {
    o = qs.parse(options.connection_string, ';', '=');
    if (o.Url) { options.server_url = o.Url; }
    if (o.ApiKey) { options.server_api_key = o.ApiKey; }
    if (o.User) { options.auth_user = o.User; }
    if (o.Password) { options.auth_password = o.Password; }
    if (o.Database || o.DefaultDatabase) { options.database_name = o.Database || o.DefaultDatabase; }
    delete options.connection_string;
  }

  // We should have our sever url by now
  if (!options.hasOwnProperty('server_url') || typeof options.server_url !== 'string') { throw new Error('You must specify a server_url'); }

  // Strip trailing / if present
  if (options.server_url[options.server_url.length - 1] === '/') { options.server_url = options.server_url.substr(0, options.server_url.length - 1); }

  // If a database name was passed in the options, use it to build a tenant url
  if (options.hasOwnProperty('database_name')) {
    options.server_url += '/databases/' + options.database_name;
    options.server_db = options.database_name;
    delete options.database_name;
  }
  return options;
};

/**
 * Base64 encode a string
 * @param [string] The string to encode
 * @return {string}
 */
RavenUtils.prototype.toBase64 = function (str) {
  return (new Buffer(str || "", "ascii")).toString("base64");
};

/**
 * Combine the elements of an object hash into a querystring suitable for passing to RavenDb
 * @param [object] Hash of values to build string out of
 * @return {string}
 */
RavenUtils.prototype.buildRavenQuery = function (query) {
  var s = '',
    i;
  for (i in query) {
    if (query.hasOwnProperty(i)) {
      s += (s.length === 0 ? '' : ' ') + i + ':' + query[i];
    }
  }
  return qs.escape(s);
};

module.exports = new RavenUtils();