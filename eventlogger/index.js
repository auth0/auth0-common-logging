var process_watcher = require('./process');
var server_watcher = require('./server');
var process_info = require('../lib/process_info');

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

  throw new Error('unknown object type');
};

module.exports = EventLogger;