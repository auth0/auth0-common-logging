var util = require('util');
var EventEmitter = require('events').EventEmitter;

//fake process constructor
function process() {
  EventEmitter.call(this);
  this.uptime = function () {
    return 10;
  };
  this.memoryUsage = function () {
    return {};
  };
  this.env = {
	'RELOAD_WORKER': false
  };
}

util.inherits(process, EventEmitter);

module.exports = process;