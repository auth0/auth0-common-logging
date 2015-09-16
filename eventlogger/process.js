module.exports.watch = function (logger, process) {
  logger.info({
    log_type: 'starting'
  }, 'starting');


  ['SIGTERM', 'SIGINT'].forEach(function (signal) {
    process.on(signal, function () {
      logger.info({
        log_type: 'stopping',
        signal: signal
      }, 'stopping');
    });
  });


  process.on('uncaughtException', function (err) {
    logger.error({
      log_type: 'uncaughtException',
      err:      err,
      uptime:   process.uptime(),
      memoryUsage: process.memoryUsage()
    }, 'Uncaught Exception');
  });


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