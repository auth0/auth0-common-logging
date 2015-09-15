var process_info = require('../lib/application');

module.exports.watch = function (logger, server) {
  server.on('listening', function () {
    var address = this.address();

    logger.info({
      process: process_info,
      log_type: 'listening',
      address: address
    },'listening on ' + address.port);

  });


  // process.on('uncaughtException', function (err) {
  //   logger.error({
  //     process:  process_info,
  //     log_type: 'uncaughtException',
  //     err:      err
  //   }, 'Uncaught Exception');
  // });

};