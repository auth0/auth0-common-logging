var process_info = require('../lib/application');

module.exports.watch = function (logger, process) {


  logger.info({
    process: process_info,
    log_type: 'starting'
  }, 'starting');


  ['SIGTERM', 'SIGINT'].forEach(function (signal) {
    process.on(signal, function () {
      logger.info({
        process: process_info,
        log_type: 'stopping',
        signal: signal
      }, 'stopping');
    });
  });


  process.on('uncaughtException', function (err) {
    logger.error({
      process:  process_info,
      log_type: 'uncaughtException',
      err:      err
    }, 'Uncaught Exception');
  });

};