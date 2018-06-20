var serializers = require('../serializers');
var assert = require('chai').assert;
var _ = require('lodash');

describe('serializers', function () {
  it('should work', function () {
    var serialized = serializers.req({
      headers: {
        host: 'host.host.com',
        'x-forwarded-host': 'my.forwarded.host.com'
      },
      method: 'post',
      path: '/foo/bar'
    });

    assert.equal(serialized.method, 'post');
    assert.equal(serialized.host, 'host.host.com');
    assert.equal(serialized.headers['x-forwarded-host'], 'my.forwarded.host.com');
    assert.equal(serialized.path, '/foo/bar');

  });

  it('should serialize auth0-client header', function () {
    var serialized = serializers.req({
      headers: {
        host: 'host.host.com',
        'auth0-client': 'eyJuYW1lIjoiQXV0aDAuc3dpZnQiLCJ2ZXJzaW9uIjoiMS4xMC4xIiwic3dpZnQtdmVyc2lvbiI6IjMuMCJ9'
      },
      method: 'post',
      path: '/foo/bar'
    });

    assert.equal(serialized.method, 'post');
    assert.equal(serialized.host, 'host.host.com');
    assert.equal(serialized.path, '/foo/bar');
    assert.equal(serialized.headers['auth0-client'], 'eyJuYW1lIjoiQXV0aDAuc3dpZnQiLCJ2ZXJzaW9uIjoiMS4xMC4xIiwic3dpZnQtdmVyc2lvbiI6IjMuMCJ9');

  });

  it('can be extended', function () {
    var my_serializers = _.extend({}, serializers, {
      req: function (req) {
        var result = serializers.req(req);
        result.extended = true;
        return result;
      }
    });

    var serialized = my_serializers.req({ headers: {} });

    assert.ok(serialized.extended);

  });
});