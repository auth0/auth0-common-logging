const requests_start_time = {};
const assign = require('lodash').assign;
const obfuscator = require('../lib/obfuscator');
const buildLogItemCollector = require('./log_item_collector');
const LOG_ON_RESPONSE_SYMBOL = Symbol();

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

  server.decorate('request', 'logOnResponse', (request) => {
    const responseItemCollector = buildLogItemCollector(logger);

    request[LOG_ON_RESPONSE_SYMBOL] = responseItemCollector;

    return function logOnResponse(key, value) {
      // Logs the value under the corresponding key on response log
      responseItemCollector.addValue(key, value);
    };
  }, { apply: true });

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
      const responseLogEntry = createLogEntry(request, 'response');

      if (request[LOG_ON_RESPONSE_SYMBOL]) {
        request[LOG_ON_RESPONSE_SYMBOL].injectOn(responseLogEntry);
      }

      return logger.info(responseLogEntry, 'response');
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
      extras: {
        data: event,
        tags: tags
      }
    });
  }).on('start', function () {
    logger.info({
      log_type: 'listening',
      extras: {
        port: server.info.port
      }
    },'listening on ' + server.info.port);
  });
};
