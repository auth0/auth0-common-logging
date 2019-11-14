const traverse = require('traverse');

const MAX_WEIGHT = 250;

const obfuscate = function(obj) {
  let weight = 0;
  return traverse(obj).map(function(value) {
    weight += (this.isLeaf) ? 1 : 1.75;
    if (weight > MAX_WEIGHT) {
      throw new Error('object is too large to obfuscate');
    }

    if (this.isLeaf && value !== null) {
      if (value === undefined) {
        return '<undefined>';
      }
      const type = typeof value;
      return `<redacted_${type}>`;
    }
  });
};

const obfuscateSafe = function(obj) {
  try {
    return obfuscate(obj);
  } catch (e) {
    return e.message;
  }
};

module.exports = {
  obfuscate,
  obfuscateSafe
};

