var _ = require('lodash');
//_.omit(req.headers, forbidden_headers),

var forbidden_headers = [
  'authorization',
  'cookie',
  'set-cookie'
];

var common_serializers = {
  req: function (req) {
    var headers = req.headers || {};
    return {
      id:       req._tracking_id,
      method:   req.method,
      host:     req.headers['host'],
      path:     req.path,
      headers:   {
        'content-type':      headers['content-type'],
        'content-length':    headers['content-length'],
        'accept':            headers['accept'],
        'host':              headers['host'],
        'origin':            headers['origin'],
        'x-forwarded-for':   headers['x-forwarded-for'],
        'x-forwarded-proto': headers['x-forwarded-proto'],
        'x-forwarded-req-id': headers['x-forwarded-req-id'],
        'x-from-loc':        headers['x-from-loc'],
        'user-agent':        headers['user-agent'],
        'referer':           headers['referer'],
      },
      ip:       req.ip,
      route:    req.route && req.route.path
    };
  },
  res: function (res) {
    var headers = res.headers || {};
    var result = {
      statusCode: res.statusCode,
      headers:    {
        'access-control-allow-origin': headers['access-control-allow-origin'],
        'content-type':          headers['content-type'],
        'content-length':        headers['content-length'],
        'x-ratelimit-limit':     headers['x-ratelimit-limit'],
        'x-ratelimit-remaining': headers['x-ratelimit-remaining'],
        'x-ratelimit-reset':     headers['x-ratelimit-reset'],
      },
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
      constructor: err.constructor.name,
      port:        err.port,
      host:        err.host || _.get(err, 'domainEmitter.socket._host'),
      path:        err.path,
    };
  }
};

module.exports = common_serializers;
