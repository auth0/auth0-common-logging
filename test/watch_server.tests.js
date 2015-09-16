var EventLogger = require('../eventlogger');
var assert = require('chai').assert;
// var _ = require('lodash');
var fake_server = require('./fixture/fake_server');

describe('watch process', function () {

  it('should log on listening', function (done) {
    var logger = {
      info: function (meta, msg) {
        assert.include(msg, 'listening on 9283');
        assert.equal(meta.log_type, 'listening');
        done();
      }
    };

    var eventLogger = new EventLogger(logger);
    var server = new fake_server();
    eventLogger.watch(server);
    server.emit('listening');
  });


});
