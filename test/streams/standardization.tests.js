const expect = require('chai').expect;
const standardized = require('../../streams/standardization');


describe('schemas', () => {
    describe('schemas:write()', () => {
        it('schemas: should do nothing with valid schema', () => {
            expect(1).to.eql(2);
        });

        it('schemas: should log out result to stderr on invalid', () => {
            let buffer = Buffer.alloc(1000000000);
            const stream = new standardized.SchemaDebugStream({
                out: buffer
            });
            stream.write(JSON.stringify({'error!': 'error'}));
            const errors = JSON.parse(buffer.toString());
            expect(errors.length).to.be.greaterThan(0);
        });

        it('schemas: should ignore invalid JSON logs', () => {
            const stream = new standardized.SchemaDebugStream();
            expect(() => {stream.write('asdf!}|;j')}).to.not.throw();
        });
    });
});
