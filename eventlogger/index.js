var process_watcher = require('./process');
var server_watcher  = require('./server');
var hapi_server     = require('./hapi_server');
var hapi_server_v17 = require('./hapi_server_v17');

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
    const hapiVersion = obj.version || ""; // '17.0.0'
    const majorHapiVersion = parseInt(hapiVersion.split(".")[0]);

    // depending on the hapi version use a different watch version
    const watch = majorHapiVersion >= 17 ? hapi_server_v17.watch : hapi_server.watch;

    return watch(this.logger, obj, options);
  }

  throw new Error('unknown object type');
};

module.exports = EventLogger;
