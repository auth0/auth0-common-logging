var util = require('util');
var EventEmitter = require('events').EventEmitter;

//fake process constructor
function process() {
  EventEmitter.call(this);
}

util.inherits(process, EventEmitter);

module.exports = process;