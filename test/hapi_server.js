const EventLogger = require('../').EventLogger;
const Hapi = require('hapi');
const bunyan = require('bunyan');
const assert = require('chai').assert;
const request = require('request');
const eventLogger = new EventLogger(bunyan.createLogger({
  name: 'test'
}));

var hapi_plugin = {
  register: function(server, options, next) {
    eventLogger.watch(server);
    next();
  }
}
hapi_plugin.register.attributes = {
  name: 'bunyan-logger',
  version: '1.0.0'
};

describe('watch Hapi server', function () {
  var server;

  before(function() {
    server = new Hapi.Server();
    server.connection({ port: 9876 });
    server.route({
      method: 'GET',
      path: '/',
      handler: function(request, reply) {
        return reply('Hello world!');
      }
    });
    server.route({
      method: 'GET',
      path: '/slow',
      handler: function(request, reply) {
        setTimeout(function() {
          return reply('Hellooooooo sloooooow woooooorld!');
        }, 1500);
      }
    });
    server.start(function() {});
    server.register(hapi_plugin, function(err) {
      if (err) {
        console.log('Failed to load Hapi plugin');
      }
    });
  });

  it('should log response time', function (done) {
    eventLogger.logger.info = function(log_event) {
      assert.isNumber(log_event.took);
      assert.isAbove(log_event.took, 0);
    };
    request.get(server.info.uri + '/', function (error, response, body) {
      assert.equal(body, 'Hello world!');
      done();
    })
  });

  it('should log response time in a slow endpoint', function (done) {
    eventLogger.logger.info = function(log_event) {
      assert.isNumber(log_event.took);
      assert.isAbove(log_event.took, 1500);
    };
    request.get(server.info.uri + '/slow', function (error, response, body) {
      assert.equal(body, 'Hellooooooo sloooooow woooooorld!');
      done();
    })
  });

});
