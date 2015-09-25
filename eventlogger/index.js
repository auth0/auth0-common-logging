var process_watcher = require('./process');
var server_watcher = require('./server');
var process_info = require('../lib/process_info');
var hapi_server = require('./hapi_server');

function EventLogger (logger) {
  this.logger =  process.env.NODE_ENV === 'production' ?
                  logger.child({ process: process_info }) :
                  logger;
}

EventLogger.prototype.watch = function (obj) {
  if (obj.constructor.name === 'process') {
    return process_watcher.watch(this.logger, obj);
  }

  if (obj.constructor.name === 'Server') {
    return server_watcher.watch(this.logger, obj);
  }

  //stupid way of identify a hapi server
  if (obj.app && obj.info && obj.info.id && obj.info.created) {
    return hapi_server.watch(this.logger, obj);
  }

  throw new Error('unknown object type');
};

module.exports = EventLogger;