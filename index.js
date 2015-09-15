var process_watcher = require('./watchers/process');

function BunyanWatcher (logger) {
  this.logger = logger;
}

BunyanWatcher.prototype.watch = function (obj) {
  process_watcher.watch(this.logger, obj);
};

module.exports = BunyanWatcher;