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