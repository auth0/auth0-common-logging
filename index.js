var EventLogger = require('./eventlogger');
var HttpWritableStream = require('./streams/HttpWritableStream');

module.exports = {
  EventLogger: EventLogger,
  Streams: {
    HttpWritableStream: HttpWritableStream
  }
};