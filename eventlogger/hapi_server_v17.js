var assign = require('lodash').assign;

module.exports.watch = function (logger, server, options) {
  options = assign({}, {
    ignorePaths: []
  }, options);

  const ignorePaths = options.ignorePaths;

  function createLogEntry(request, log_type) {
    const took = Date.now() - request.info.received;

    return {
      log_type,
      took,
      req: request,
      res: request.response
    };
  }

  function onRequest(request, h) {
    if (ignorePaths.indexOf(request.path) >= 0) {
      return h.continue;
    }
    logger.info({ log_type: 'request', req: request });
    return h.continue;
  }

  function onRequestError(request, error) {
    const payload = request.pre && request.pre._originalPayload || request.payload;

    logger.error({
      log_type: 'request_error',
      req: request,
      res: request.response,
      err: error,
      payload,
    }, error.message);
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
    const reponseLogEntry = createLogEntry(request, 'response');
    logger.info(reponseLogEntry, 'response');
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

  server.ext({ type: 'onRequest', method: onRequest });
  server.events.on({ name: 'request', channels: 'internal' }, onRequestClosedOrAborted);
  server.events.on({ name: 'request', channels: 'error' }, onRequestError);
  server.events.on('log', onLog);
  server.events.on('response', onResponse);

  // Server Starting up event
  server.events.on('start', onStartup);
};
