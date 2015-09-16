module.exports.watch = function (logger, server) {
  server.on('listening', function () {
    var address = this.address();
    var port = typeof address === 'string' ? address : address.port;

    logger.info({
      log_type: 'listening',
      port: port
    },'listening on ' + port);

  });


  // process.on('uncaughtException', function (err) {
  //   logger.error({
  //     process:  process_info,
  //     log_type: 'uncaughtException',
  //     err:      err
  //   }, 'Uncaught Exception');
  // });

};