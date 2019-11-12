var requests_start_time = {};
var assign = require('lodash').assign;
var obfuscator = require('../lib/obfuscator');

module.exports.watch = function  (logger, server, options) {
  options = assign({}, {
    ignorePaths: [],
    obfuscatePayload: false,
    stringifyPayload: false
  }, options);

  var ignorePaths = options.ignorePaths;
  var obfuscatePayload = options.obfuscatePayload;
  var stringifyPayload = options.stringifyPayload;

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
      return logger.info({
        log_type: 'request',
        req: request
      });
    }

    if (tags.request && tags.closed ||
        tags.response && tags.aborted) {
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
    let payload = request.pre && request.pre._originalPayload || request.payload;
    if (obfuscatePayload) {
      payload = obfuscator.obfuscateSafe(payload);
    }
    if (stringifyPayload) {
      payload = JSON.stringify(payload);
    }
    logger.error({
      log_type: 'request_error',
      req: request,
      res: request.response,
      err: error,
      payload
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
