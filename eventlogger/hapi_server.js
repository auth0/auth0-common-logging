module.exports.watch = function  (logger, server) {
  server
  .on('request-internal', function (request, data, tags) {
    if (tags.received && request.path !== '/api/v2/test') {
      return logger.debug({
        log_type: 'request',
        req: request
      });
    }
    if (tags.response && request.path !== '/api/v2/test') {
      const log_event = {
        log_type: 'response',
        req:  request,
        res:  request.response
      };
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