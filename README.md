Common utilities to write formatted logs in auth0 components.

## Installation

```
npm i git+ssh://git@github.com:auth0/auth0-common-logging.git
```

## EventLogger

The watcher is a common abstraction that can subscribe to events of different node.js instances and write logs in a predefined logger.

```js

var EventLogger = require('auth0-common-logging').EventLogger
var eventLogger = new EventLogger(bunyanLogger);

eventLogger.watch(process);
eventLogger.watch(httpServer);
```


### process event logger

The process event logger emits a log entry for the following events of a node.js process instance:

-  exit signals events: `SIGTERM`, `SIGINT`
-  `uncaughtException`

In addition to these 3 events it emits and "starting" log entry inmediatelly when is called.

Please note, that subscribing to the afore mentioned events normally changes the behavior of node.js, this means that the process will not longer exit by itself, you need to subscribe and exit. Example:

```javascript
eventLogger.watch(process);

var exit = function (exitCode) {
  return function () { process.exit(exitCode); };
}

process.on('SIGTERM', exit(0))
       .on('SIGINT', exit(0))
       .on('uncaughtException', function () {
          //give some time to write the log.
          setTimeout(function () {
            exit(1);
          }, 200);
       });
```

### http event logger

The http event logger log entries for the following events of a node.js process instance:

-  `listening`

## Serializers

auth0-common-logging export a `Serializers` object for bunyan. The serializer includes: `req`, `res` and `err` with our defaults.

Serializers can be extended as follows:

```js
var _ = require('lodash);
var serializers = require('auth0-common-logging').Serializers;

var my_serializers = _.extend({}, serializers, {
  err: function (err) {
    //run the common-loggin serializer:
    var result = serializers.err(err);
    //append some data
    if (err.inner) {
      result.inner = this.err(err.inner);
    }
    //return
    return result;
  }
});

bunyan.createLogger({ ..., serializers: my_serializers });
```

## Common Streams used for logs

```javascript
var HttpWritableStream = require('auth0-common-logging').Streams.HttpWritableStream;
var httpWritableStream = new HttpWritableStream('http://url');
```
