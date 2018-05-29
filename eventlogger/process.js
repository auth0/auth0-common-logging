var _ = require('lodash');

module.exports.watch = function (logger, process) {
  if (!process.env.RELOAD_WORKER) {
    logger.info({
      log_type: 'starting',
      uptime: process.uptime()
    }, 'starting');
  } else {
    logger.info(_.extend({
      log_type: 'starting_worker',
      uptime: process.uptime()
    }, JSON.parse(process.env.RELOAD_WORKER)), 'starting as a new worker');
  }



  ['SIGTERM', 'SIGINT'].forEach(function (signal) {
    process.once(signal, function () {
      logger.info({
        log_type: 'stopping',
        signal: signal
      }, 'stopping');
    });
  });

  if (process.env.NODE_ENV !== 'test') {
    process.on('uncaughtException', function (err) {
      logger.error({
        log_type: 'uncaughtException',
        err:      err,
        uptime:   process.uptime(),
        memoryUsage: process.memoryUsage()
      }, 'Uncaught Exception');
    });
  }


  process.on('message', function (message) {
    var parsed;

    try{
      parsed = JSON.parse(message);
    } catch(err){
      parsed = {};
    }

    if (parsed.msg === 'replace_faulty_worker') {
      logger.error({
        reason:  parsed.reason,
        old_pid: parsed.old_pid,
        new_pid: parsed.new_pid
      }, 'A new worker was started and the previous one was killed. Reason: ' + parsed.reason);
    }
  });
};
