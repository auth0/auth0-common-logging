const EventLogger = require('../').EventLogger;
const Hapi = require('hapi17');
const bunyan = require('bunyan');
const assert = require('chai').assert;
const request = require('request');
const eventLogger = new EventLogger(bunyan.createLogger({
  name: 'test'
}));

var null_logger = function () { return; };

const startServer = async function(eventLoggerOptions) {
  var hapi_plugin = {
    register: function (server) {
      return eventLogger.watch(server, eventLoggerOptions);
    },
    name: 'bunyan-logger',
    version: '1.0.0',
  };

  const server = Hapi.server({ host: 'localhost', port: 9877 });
  server.route({
    method: 'GET',
    path: '/',
    handler: function() {
      return 'Hello world!';
    }
  });
  server.route({
    method: 'GET',
    path: '/ignored',
    handler: function() {
      return 'ignored!';
    }
  });
  server.route({
    method: 'GET',
    path: '/slow',
    handler: function() {
      return new Promise((resolve) => {
        setTimeout(resolve, 1500, 'Hellooooooo sloooooow woooooorld!');
      });
    }
  });
  server.route({
    method: 'GET',
    path: '/internal_error',
    handler: async function() {
      throw new Error('test error');
    }
  });
  server.route({
    method: 'POST',
    path: '/internal_error',
    handler: async function() {
      throw new Error('test error');
    }
  });
  await server.register(hapi_plugin);
  await server.start();
  return server;
};

describe('watch Hapi server v17', function () {
  var server;
  var loggerSave = {};

  before(function() {
    eventLogger.logger.info = null_logger;
    loggerSave.info = eventLogger.logger.info;
    loggerSave.error = eventLogger.logger.error;
  });

  afterEach(function() {
    // Restored saved logger functions to avoid test cross-contamination
    eventLogger.logger.info = loggerSave.info;
    eventLogger.logger.error = loggerSave.error;
  });

  const whenARequestRaisesAnError = function(cb) {
    const opts = {
      url: server.info.uri + '/internal_error',
      body: { a: 't' },
      json: true
    };
    request.post(opts, cb);
  };

  describe('with default options', function () {
    before(async function() {
      const eventLoggerOptions = {};
      server = await startServer(eventLoggerOptions);
    });

    after(function() {
      return server.stop();
    });

    it('should log response time', function (done) {
      eventLogger.logger.info = function(log_event) {
        if (log_event.log_type === 'request') {
          return;
        }

        assert.isNumber(log_event.took);
        assert.isAbove(log_event.took, 0);
      };
      request.get(server.info.uri + '/', function (error, response, body) {
        assert.equal(body, 'Hello world!');
        done();
      });
    });

    it('should log request on aborted request', function (done) {
      eventLogger.logger.info = function(log_event, msg) {
        if (log_event.log_type === 'request') {
          return;
        }

        assert.isNumber(log_event.took);
        assert.isAbove(log_event.took, 0);
        assert.equal(log_event.log_type, 'request_aborted');
        assert.isString(log_event.req.info.id);
        assert.equal(msg, 'request aborted');
        done();
      };

      const req = request.get(server.info.uri + '/slow', () => {});

      setTimeout(() => {
        req.abort();
      }, 50);
    });

    it('should log response time in a slow endpoint', function (done) {
      eventLogger.logger.info = function(log_event) {
        if (log_event.log_type === 'request') {
          return;
        }

        assert.isNumber(log_event.took);
        assert.isAbove(log_event.took, 1500);
      };
      request.get(server.info.uri + '/slow', function (error, response, body) {
        assert.equal(body, 'Hellooooooo sloooooow woooooorld!');
        done(error);
      });
    });

    it('should log error appropriately', function(done) {
      let event = null;
      let message = null;

      eventLogger.logger.error = function(log_event, msg) {
        event = log_event;
        message = msg;
      };

      request.get(server.info.uri + '/internal_error', function () {
        assert.isNotNull(event);
        assert.equal(event.log_type, 'request_error');
        assert.equal(event.payload, null);
        assert.typeOf(event.err, 'Error');
        assert.equal(message, 'test error');
        done();
      });
    });

    it('should log payload on error', function(done) {
      let event = null;
      let message = null;

      eventLogger.logger.error = function(log_event, msg) {
        event = log_event;
        message = msg;
      };

      whenARequestRaisesAnError(function () {
        assert.isNotNull(event);
        assert.equal(event.log_type, 'request_error');
        assert.deepEqual(event.payload, { a: 't' });
        done();
      });
    });
  });

  describe('with ignorePaths set', function () {
    before(async function() {
      const eventLoggerOptions = { ignorePaths: ['/ignored'] };
      server = await startServer(eventLoggerOptions);
    });

    after(function() {
      return server.stop();
    });

    it('should not log ignored endpoints', function (done) {
      eventLogger.logger.info = function() {
        done(new Error('info should not have been called'));
      };
      request.get(server.info.uri + '/ignored', function (error, response, body) {
        assert.equal(body, 'ignored!');
        done();
      });
    });
  });

  describe('with obfuscatePayload set', function () {
    before(async function() {
      const eventLoggerOptions = { obfuscatePayload: true };
      server = await startServer(eventLoggerOptions);
    });

    after(function() {
      return server.stop();
    });

    it('should log obfuscated payload on error', function(done) {
      let event = null;
      let message = null;

      eventLogger.logger.error = function(log_event, msg) {
        event = log_event;
        message = msg;
      };

      whenARequestRaisesAnError(function () {
        assert.isNotNull(event);
        assert.equal(event.log_type, 'request_error');
        assert.deepEqual(event.payload, { a: '<redacted_string>' });
        done();
      });
    });
  });

  describe('with stringifyPayload set', function () {
    before(async function() {
      const eventLoggerOptions = { stringifyPayload: true };
      server = await startServer(eventLoggerOptions);
    });

    after(function() {
      return server.stop();
    });

    it('should log stringified payload on error', function(done) {
      let event = null;
      let message = null;

      eventLogger.logger.error = function(log_event, msg) {
        event = log_event;
        message = msg;
      };

      whenARequestRaisesAnError(function () {
        assert.isNotNull(event);
        assert.equal(event.log_type, 'request_error');
        assert.equal(event.payload, '{"a":"t"}');
        done();
      });
    });
  });

  describe('with obfuscatePayload and stringifyPayload set', function () {
    before(async function() {
      const eventLoggerOptions = { obfuscatePayload: true, stringifyPayload: true };
      server = await startServer(eventLoggerOptions);
    });

    after(function() {
      return server.stop();
    });

    it('should log obfuscated+stringified payload on error', function(done) {
      let event = null;
      let message = null;

      eventLogger.logger.error = function(log_event, msg) {
        event = log_event;
        message = msg;
      };

      whenARequestRaisesAnError(function () {
        assert.isNotNull(event);
        assert.equal(event.log_type, 'request_error');
        assert.equal(event.payload, '{"a":"<redacted_string>"}');
        done();
      });
    });
  });

});
