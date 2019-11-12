const expect = require('chai').expect;
const _ = require('lodash');
const obfuscator = require('../lib/obfuscator');

describe('obfuscator', () => {
  describe('obfuscate()', () => {
    it('should obfuscate strings with "string"', () => {
      const actual = obfuscator.obfuscate({ a: 'some_string' });
      expect(actual).to.eql({ a: 'string' });
    });

    it('should obfuscate numbers with "number"', () => {
      const actual = obfuscator.obfuscate({ a: 10 });
      expect(actual).to.eql({ a: 'number' });
    });

    it('should obfuscate booleans with "boolean"', () => {
      const actual = obfuscator.obfuscate({ a: false });
      expect(actual).to.eql({ a: 'boolean' });
    });

    it('should keep null untouched', () => {
      const actual = obfuscator.obfuscate({ a: null });
      expect(actual).to.eql({ a: null });
    });

    it('should report undefined as a string', () => {
      const actual = obfuscator.obfuscate({ a: undefined });
      expect(actual).to.eql({ a: 'undefined' });
    });

    it('should walk down child object', () => {
      const actual = obfuscator.obfuscate({ a: { b: 'some_string' } });
      expect(actual).to.eql({ a: { b: 'string' } });
    });

    it('should walk down child array', () => {
      const actual = obfuscator.obfuscate({ a: ['some_string'] });
      expect(actual).to.eql({ a: ['string'] });
    });

    it('should not mutate input object', () => {
      const input = { a: 'some_string' };
      obfuscator.obfuscate(input);
      expect(input).to.eql({ a: 'some_string' });
    });

    it('should support `null` payload', () => {
      const actual = obfuscator.obfuscate(null);
      expect(actual).to.eql(null);
    });

    it('should support string payload', () => {
      const actual = obfuscator.obfuscate('some_string');
      expect(actual).to.eql('string');
    });

    it('should throw on big objects', () => {
      const input = { a: _.times(1000, () => 'some_string') };
      expect(() => obfuscator.obfuscate(input)).to.throw('object is too large to obfuscate');
    });
  });

  describe('obfuscateSafe()', () => {
    it('should return a string when processing big objects', () => {
      const input = { a: _.times(1000, () => 'some_string') };
      const actual = obfuscator.obfuscateSafe(input);
      expect(actual).to.eql('object is too large to obfuscate');
    });

    it('should return the error message when an unexpected error occurs', () => {
      const input = {
        get a() {
          throw new Error('expected error');
        }
      };
      const actual = obfuscator.obfuscateSafe(input);
      expect(actual).to.eql('expected error');
    });
  });
});
