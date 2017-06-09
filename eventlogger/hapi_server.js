var requests_start_time = {};
var assign = require('lodash').assign;

module.exports.watch = function  (logger, server, options) {
  options = assign({}, {
    ignorePaths: []
  }, options);

  var ignorePaths = options.ignorePaths;

  function createLogEntry(request, log_type) {
    const took = Date.now() - requests_start_time[request.id];
    delete requests_start_time[request.id];

    return {
      log_type,
      took,
      req: request,
      res: request.response
    };
  }

  server
  .on('request-internal', function (request, data, tags) {
    if (tags.received && request.path !== '/api/v2/test' &&
      ignorePaths.indexOf(request.path) < 0) {
      requests_start_time[request.id] = Date.now();
      return logger.debug({
        log_type: 'request',
        req: request
      });
    }

    if (tags.request && tags.closed) {
      const abortLogEntry = createLogEntry(request, 'request_aborted');
      return logger.info(abortLogEntry, 'request aborted');
    }

    if (tags.response &&
        request.path !== '/api/v2/test' &&
        ignorePaths.indexOf(request.path) < 0) {
      const rsponseLogEntry = createLogEntry(request, 'response');
      return logger.info(rsponseLogEntry, 'response');
    }
  }).on('request', function (request, data, tags) {
    const level = tags.debug ? 'debug': 'info';
    logger[level]({ req: request, data: data.data });
  }).on('request-error', function (request, error) {
    logger.error({
      log_type: 'request_error',
      req: request,
      res: request.response,
      err: error,
      payload: request.pre &&
               request.pre._originalPayload ||
               request.payload
    }, error.message);
  }).on('log', function (event, tags) {
    logger.info({
      log_type: 'server_log',
      data: event,
      tags: tags
    });
  }).on('start', function () {
    logger.info({
      log_type: 'listening',
      port: server.info.port
    },'listening on ' + server.info.port);
  });
};
