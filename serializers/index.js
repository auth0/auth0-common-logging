var _ = require('lodash');

var forbidden_headers = [
  'authorization',
  'cookie',
  'set-cookie'
];

var common_serializers = {
  req: function (req) {
    return {
      id:       req._tracking_id,
      method:   req.method,
      host:     req.headers['host'],
      path:     req.path,
      headers:  _.omit(req.headers, forbidden_headers),
      ip:       req.ip,
      ua:       req.headers['user-agent'],
      referer:  req.headers['referer'],
      route:    req.route && req.route.path
    };
  },
  res: function (res) {
    var result = {
      statusCode: res.statusCode,
      headers:    _.omit(res._headers, forbidden_headers),
      time:       res._time
    };
    return result;
  },
  err: function (err) {
    if (!err) { return err; }

    if (typeof err === 'string') {
      return {
        message: err,
        is_string: true
      };
    }

    return {
      message:     err.message,
      name:        err.name,
      stack:       err.stack,
      code:        err.code,
      signal:      err.signal,
      statusCode:  err.statusCode,
      description: err.description,
      oauthError:  err.oauthError,
      constructor: err.constructor.name
    };
  }
};

module.exports = common_serializers;