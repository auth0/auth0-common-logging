const assign = require('lodash').assign;
const obfuscator = require('../lib/obfuscator');
const LOG_ON_RESPONSE_SYMBOL = Symbol();
const buildLogItemCollector = require('./log_item_collector');

module.exports.watch = function (logger, server, options) {
  options = assign({}, {
    ignorePaths: [],
    obfuscatePayload: false,
    stringifyPayload: false
  }, options);

  const ignorePaths = options.ignorePaths;
  const obfuscatePayload = options.obfuscatePayload;
  const stringifyPayload = options.stringifyPayload;

  function createLogEntry(request, log_type) {
    const took = Date.now() - request.info.received;
    const res = request.response;

    return {
      log_type,
      took,
      req: request,
      res: {
        status_code: res.statusCode,
        headers: res.headers,
      },
    };
  }

  function onRequest(request, h) {
    if (ignorePaths.indexOf(request.path) >= 0) {
      return h.continue;
    }
    logger.info({ log_type: 'request', req: request });
    return h.continue;
  }

  function onRequestError(request, event, tags) {
    let payload = request.pre && request.pre._originalPayload || request.payload;
    if (obfuscatePayload) {
      payload = obfuscator.obfuscateSafe(payload);
    }
    if (stringifyPayload) {
      payload = JSON.stringify(payload);
    }

    if (tags.error) {
      logger.error({
        log_type: 'request_error',
        req: request,
        res: request.response,
        err: event.error,
        payload,
      }, event.error.message);
    } else {
      logger.warning({
        log_type: 'request_error',
        event: event,
        req: request,
        tags: tags
      }, 'Unexpected event type in onRequestError handler');
    }
  }

  function onRequestClosedOrAborted(request, data, tags) {
    if (ignorePaths.indexOf(request.path) >= 0) {
      return;
    }
    if (tags.closed || tags.abort) {
      const abortLogEntry = createLogEntry(request, 'request_aborted');
      logger.info(abortLogEntry, 'request aborted');
    }
  }

  function onResponse(request) {
    if (ignorePaths.indexOf(request.path) >= 0) {
      return;
    }
    const responseLogEntry = createLogEntry(request, 'response');

    if (request[LOG_ON_RESPONSE_SYMBOL]) {
      request[LOG_ON_RESPONSE_SYMBOL].injectOn(responseLogEntry);
    }

    logger.info(responseLogEntry, 'response');
  }

  function onStartup() {
    logger.info({
      log_type: 'listening',
      port: server.info.port
    }, 'listening on ' + server.info.port);
  }

  function onLog(event, tags) {
    logger.info({ log_type: 'server_log', data: event, tags });
  }

  server.decorate('request', 'logOnResponse', (request) => {
    const responseItemCollector = buildLogItemCollector(logger);

    request[LOG_ON_RESPONSE_SYMBOL] = responseItemCollector;

    return function (key, value) {
      // Logs the value under the corresponding key on response log
      responseItemCollector.addValue(key, value);
    };
  }, { apply: true });

  server.ext({ type: 'onRequest', method: onRequest });
  server.events.on({ name: 'request', channels: 'internal' }, onRequestClosedOrAborted);
  server.events.on({ name: 'request', channels: 'error' }, onRequestError);
  server.events.on('log', onLog);
  server.events.on('response', onResponse);

  // Server Starting up event
  server.events.on('start', onStartup);
};
