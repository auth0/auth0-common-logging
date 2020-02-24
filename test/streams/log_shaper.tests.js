const expect = require('chai').expect;
const standardized = require('../../streams/standardization');


describe('LogShaperStream', () => {
    it('#_transform: should return error on invalid json', (done) => {
        const s = new standardized.LogShaperStream();
        s.on('error', (err) => {
            expect(err.message).to.equal('unable to parse log to json');
            done();
        });
        s.write('asdf!}|;j');
    });

    it('#_transform: should pick valid fields', (done) => {
        const s = new standardized.LogShaperStream();
        s.on('data', (msg) => {
            const log = JSON.parse(msg);
            expect(log).to.eql({
                'log_type': 'request'
            });
            done();
        });
        s.write(JSON.stringify({
            'log_type': 'request',
            'unknown_field': 'field',
        }));

    });
});
