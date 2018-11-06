var EventLogger = require('../').EventLogger;
var assert = require('chai').assert;
var noop = require('lodash.noop');
var fake_process = require('./fixture/fake_process');

describe('watch process', function () {

  it('should log on start', function (done) {
    var logger = {
      info: function (meta, msg) {
        assert.include(msg, 'starting');
        assert.equal(meta.log_type, 'starting');
        assert.isNumber(meta.uptime, 'uptime');
        done();
      }
    };

    var eventLogger = new EventLogger(logger);
    eventLogger.watch(new fake_process());
  });

  it('should log on starting worker', function (done) {
    var logger = {
      info: function (meta, msg) {
        assert.include(msg, 'starting as a new worker');
        assert.equal(meta.log_type, 'starting_worker');
        assert.isNumber(meta.uptime, 'uptime');
        done();
      }
    };

    var eventLogger = new EventLogger(logger);
    var fakeProcess = new fake_process();
    fakeProcess.env.RELOAD_WORKER = true;
    eventLogger.watch(fakeProcess);
  });

  ['SIGTERM', 'SIGINT'].forEach(function (signal) {

    it('should log on ' + signal, function (done) {
      var logger = {
        calls: 0,
        info: function (meta, msg) {
          this.calls++;

          if (this.calls !== 2) {
            return;
          }

          assert.include(msg, 'stopping');
          assert.equal(meta.log_type, 'stopping');
          assert.equal(meta.signal, signal);

          done();
        }
      };

      var eventLogger = new EventLogger(logger);
      var proc = new fake_process();
      eventLogger.watch(proc);
      proc.emit(signal, {});
    });

  });


  it('should log on uncaughtException', function (done) {
    var logger = {
      info: noop,
      error: function (meta, msg) {
        assert.include(msg, 'Uncaught Exception');
        assert.equal(meta.log_type, 'uncaughtException');
        done();
      }
    };

    var eventLogger = new EventLogger(logger);
    var proc = new fake_process();
    eventLogger.watch(proc);
    proc.emit('uncaughtException', {});
  });

});
