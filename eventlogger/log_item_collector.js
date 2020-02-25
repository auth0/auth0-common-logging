const _ = require('lodash');

const MAX_LOG_ITEMS = 20;

module.exports = (logger) => {
  let items = [];

  function addValue(key, value) {
    if (items.length > MAX_LOG_ITEMS) {
      // This prevents memory leaks by not allowing an infinite amount
      // of objects to be collected as part of log items
      logger.error({
        log_type: 'too_many_log_on_response',
        items
      },
      'The maximum amount of data to log has been exceed. We will ' +
      'log existing items as part of this error and cleanup items');

      items = [];
    }

    items.push({ key, value });
  }

  function injectOn(carrier) {
    if (typeof carrier !== 'object' || carrier === null) {
      return;
    }

    for (let item of items) {
      _.set(carrier, item.key, item.value);
    }
  }

  return {
    addValue,
    injectOn
  };
};