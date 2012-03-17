var qs = require('querystring')
  ;

module.exports = {
  prepareServerOptions: function (options) {
    var o, parts;
    if (typeof options === 'string') { options = { server_url : options }; }

    // Parse connection string if present
    if (options.hasOwnProperty('connection_string')) {
      o = qs.parse(options.connection_string, ';', '=');
      if (o.Url) { options.server_url = o.Url; }
      if (o.ApiKey) { options.server_api_key = o.ApiKey; }
      if (o.User) { options.auth_user = o.User; }
      if (o.Password) { options.auth_password = o.Password; }
      if (o.Database || o.DefaultDatabase) { options.databaseName = o.Database || o.DefaultDatabase; }
      delete options.connection_string;
    }

    // We should have our sever url by now
    if (!options.hasOwnProperty('server_url') || typeof options.server_url !== 'string') { throw new Error('You must specify a server_url'); }

    // Strip trailing / if present
    if (options.server_url[options.server_url.length - 1] === '/') { options.server_url = options.server_url.substr(0, options.server_url.length - 1); }

    // If a database name was passed in the options, use it to build a tenant url
    if (options.hasOwnProperty('databaseName')) {
      options.server_url += '/databases/' + options.databaseName;
      delete options.databaseName;
    }
    return options;
  }
};