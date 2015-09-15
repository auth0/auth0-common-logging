var BunyanWatcher = require('./..');
var assert = require('chai').assert;
var _ = require('lodash');
var fake_process = require('./fixture/fake_process');

describe('watch process', function () {

  it('should log on start', function (done) {
    var logger = {
      info: function (meta, msg) {
        assert.include(msg, 'starting');
        assert.equal(meta.log_type, 'starting');
        done();
      }
    };

    var watcher = new BunyanWatcher(logger);
    watcher.watch(new fake_process());
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

      var watcher = new BunyanWatcher(logger);
      var proc = new fake_process();
      watcher.watch(proc);
      proc.emit(signal, {});
    });

  });


  it('should log on uncaughtException', function (done) {
    var logger = {
      info: _.noop,
      error: function (meta, msg) {
        assert.include(msg, 'Uncaught Exception');
        assert.equal(meta.log_type, 'uncaughtException');
        done();
      }
    };

    var watcher = new BunyanWatcher(logger);
    var proc = new fake_process();
    watcher.watch(proc);
    proc.emit('uncaughtException', {});
  });

});
