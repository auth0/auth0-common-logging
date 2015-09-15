var util = require('util');
var EventEmitter = require('events').EventEmitter;

//fake server constructor
function Server() {
  EventEmitter.call(this);
  this.address = function () {
    return { address: '::', family: 'IPv6', port: 9283 };
  };
}

util.inherits(Server, EventEmitter);

module.exports = Server;