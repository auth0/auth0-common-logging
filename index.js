var process_watcher = require('./watchers/process');

function BunyanWatcher (logger) {
  this.logger = logger;
}

BunyanWatcher.prototype.watch = function (obj) {
  if (obj.constructor.name === 'process') {
    return process_watcher.watch(this.logger, obj);
  }

  throw new Error('unknown object type');
};

module.exports = BunyanWatcher;