var requests_start_time = {};
var assign = require('lodash').assign;

module.exports.watch = function  (logger, server, options) {
  options = assign({}, {
    ignorePaths: []
  }, options);

  var ignorePaths = options.ignorePaths;

  server
  .on('request-internal', function (request, data, tags) {
    if (tags.received && request.path !== '/api/v2/test' &&
      ignorePaths.indexOf(request.path) < 0) {
      requests_start_time[request.id] = new Date();
      return logger.debug({
        log_type: 'request',
        req: request
      });
    }
    if (tags.response && request.path !== '/api/v2/test' &&
      ignorePaths.indexOf(request.path) < 0) {
      const log_event = {
        log_type: 'response',
        req:  request,
        res:  request.response,
        took: new Date() - requests_start_time[request.id]
      };
      delete requests_start_time[request.id];
      if (tags.closed && tags.error) {
        log_event.err = new Error('connection closed');
      }
      if (tags.aborted && tags.error) {
        log_event.err = new Error('connection aborted');
      }
      return logger.info(log_event);
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
