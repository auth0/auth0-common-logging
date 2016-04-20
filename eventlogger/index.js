var process_watcher = require('./process');
var server_watcher  = require('./server');
var hapi_server     = require('./hapi_server');

function EventLogger (logger) {
  this.logger =  logger;
}

EventLogger.prototype.watch = function (obj, options) {
  if (obj.constructor.name === 'process') {
    return process_watcher.watch(this.logger, obj);
  }

  if (obj.constructor.name === 'Server') {
    return server_watcher.watch(this.logger, obj);
  }

  //stupid way of identify a hapi server
  if (obj.app && obj.info && obj.info.id && obj.info.created) {
    return hapi_server.watch(this.logger, obj, options);
  }

  throw new Error('unknown object type');
};

module.exports = EventLogger;
