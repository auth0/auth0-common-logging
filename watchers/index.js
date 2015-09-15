var process_watcher = require('./process');
var server_watcher = require('./server');

function BunyanWatcher (logger) {
  this.logger = logger;
}

BunyanWatcher.prototype.watch = function (obj) {
  if (obj.constructor.name === 'process') {
    return process_watcher.watch(this.logger, obj);
  }

  if (obj.constructor.name === 'Server') {
    return server_watcher.watch(this.logger, obj);
  }

  throw new Error('unknown object type');
};

module.exports = BunyanWatcher;