const EventLogger = require('../').EventLogger;
const Hapi = require('hapi11');
const bunyan = require('bunyan');
const assert = require('chai').assert;
const request = require('request');
const eventLogger = new EventLogger(bunyan.createLogger({
  name: 'test'
}));

const startServer = (eventLoggerOptions, cb) => {
  var hapi_plugin = {
    register: function (server, options, next) {
      eventLogger.watch(server, eventLoggerOptions);
      next();
    }
  };

  hapi_plugin.register.attributes = {
    name: 'bunyan-logger',
    version: '1.0.0'
  };

  const server = new Hapi.Server();
  server.connection({ host: 'localhost', port: 9876 });
  server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
      return reply('Hello world!');
    }
  });
  server.route({
    method: 'GET',
    path: '/ignored',
    handler: function (request, reply) {
      return reply('ignored!');
    }
  });
  server.route({
    method: 'GET',
    path: '/slow',
    handler: function (request, reply) {
      setTimeout(function () {
        return reply('Hellooooooo sloooooow woooooorld!');
      }, 1500);
    }
  });
  server.route({
    method: 'POST',
    path: '/internal_error',
    handler: function (request, reply) {
      return reply(new Error('test error'));
    }
  });
  server.start(cb);
  server.register(hapi_plugin, function (err) {
    if (err) {
      console.log('Failed to load Hapi plugin');
    }
  });
  return server;
};

describe('watch Hapi server < v17', function () {
  var loggerSave = {};

  var server;

  before(function() {
    loggerSave.info = eventLogger.logger.info;
    loggerSave.error = eventLogger.logger.error;
  });
  afterEach(function() {
    eventLogger.logger.info = function() {};
    eventLogger.logger.error = function() {};
  });
  after(function() {
    // Restore saved logger functions to avoid test cross-contamination
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
    before(function (done) {
      const eventLoggerOptions = {};
      server = startServer(eventLoggerOptions, done);
    });

    after(function (done) {
      server.stop(done);
    });

    it('should log response time', function (done) {
      eventLogger.logger.info = function (log_event) {
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
      eventLogger.logger.info = function (log_event, msg) {
        if (log_event.log_type === 'request') {
          return;
        }
        assert.isNumber(log_event.took);
        assert.isAbove(log_event.took, 0);
        assert.equal(log_event.log_type, 'request_aborted');
        assert.isString(log_event.req.id);
        assert.equal(msg, 'request aborted');
        done();
      };

      const req = request.get(server.info.uri + '/slow', () => {});

      setTimeout(() => {
        req.abort();
      }, 50);
    });

    it('should log response time in a slow endpoint', function (done) {
      eventLogger.logger.info = function (log_event) {
        if (log_event.log_type === 'request') {
          return;
        }

        assert.isNumber(log_event.took);
        assert.isAbove(log_event.took, 1500);
      };
      request.get(server.info.uri + '/slow', function (error, response, body) {
        assert.equal(body, 'Hellooooooo sloooooow woooooorld!');
        done();
      });
    });

    it('should log server errors', function (done) {
      let event = null;
      let message = null;

      eventLogger.logger.error = function (log_event, msg) {
        event = log_event;
        message = msg;
      };

      whenARequestRaisesAnError(function () {
        assert.isNotNull(event);
        assert.equal(message, 'test error');
        assert.equal(event.log_type, 'request_error');
        assert.deepEqual(event.payload, { a: 't' });
        done();
      });
    });
  });

  describe('with ignorePaths set', function () {
    before(function (done) {
      const eventLoggerOptions = { ignorePaths: ['/ignored'] };
      server = startServer(eventLoggerOptions, done);
    });

    after(function (done) {
      server.stop(done);
    });

    it('should not log ignored endpoints', function (done) {
      eventLogger.logger.info = function () {
        throw done(new Error('info should not have been called'));
      };
      request.get(server.info.uri + '/ignored', function (error, response, body) {
        assert.equal(body, 'ignored!');
        done();
      });
    });
  });

  describe('with obfuscatePayload set', function () {
    before(function (done) {
      const eventLoggerOptions = { obfuscatePayload: true };
      server = startServer(eventLoggerOptions, done);
    });

    after(function (done) {
      server.stop(done);
    });

    it('should log obfuscated payload on error', function (done) {
      let event = null;
      let message = null;

      eventLogger.logger.error = function (log_event, msg) {
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
    before(function (done) {
      var eventLoggerOptions = { stringifyPayload: true };
      server = startServer(eventLoggerOptions, done);
    });

    after(function (done) {
      server.stop(done);
    });

    it('should log stringified payload on error', function (done) {
      let event = null;
      let message = null;

      eventLogger.logger.error = function (log_event, msg) {
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
    before(function (done) {
      var eventLoggerOptions = { stringifyPayload: true, obfuscatePayload: true };
      server = startServer(eventLoggerOptions, done);
    });

    after(function (done) {
      server.stop(done);
    });

    it('should log obfuscated+stringified payload on error', function (done) {
      let event = null;
      let message = null;

      eventLogger.logger.error = function (log_event, msg) {
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
