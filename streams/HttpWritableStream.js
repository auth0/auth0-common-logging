var stream  = require('stream');
var util    = require('util');
var request = require('request');
var _       = require('lodash');

function HttpWritableStream (url) {
  if (!url) {
    throw new Error('Must provide a url');
  }
  stream.Writable.call(this);
  this._url = url;
}

util.inherits(HttpWritableStream, stream.Writable);

HttpWritableStream.prototype._write = function (chunk, encoding, done) {
  var entry = chunk.toString();
  var json = JSON.parse(entry);
  var self = this;

  request.post({
    url:  this._url,
    json: json
  }, _.noop).on('error', function (err) {
    self.emit('error', err);
  });

  return done();
};

module.exports = HttpWritableStream;