const traverse = require('traverse');

const MAX_LEAF_COUNT = 250;

const obfuscate = function(obj) {
  let leafCount = 0;
  return traverse(obj).map(function(x) {
    if (this.isLeaf) {
      leafCount++;
      if (leafCount > MAX_LEAF_COUNT) {
        throw new Error('object is too large to obfuscate');
      }
    }
    if (this.isLeaf && x !== null) {
      return typeof x;
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

