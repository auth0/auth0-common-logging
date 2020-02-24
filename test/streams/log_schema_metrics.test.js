const expect = require('chai').expect;
const standardized = require('../../streams/standardization');

class StubMetrics {
    constructor() {
        this.increments = [];
    }
    increment(name, tags) {
        this.increments.push({
            name,
            tags
        });
    }
}

describe('LogSchemaMetricsStream', () => {
    it('#_transform: should not call increment on non-sampled logs', (done) => {
        const metrics = new StubMetrics();

        const s = new standardized.LogSchemaMetricsStream({
            sampling_rate_percentage: 0,
            metrics,
        });

        s.on('data', (msg) => {
            const log = JSON.parse(msg);
            expect(log).to.eql({
                'log_type': 'request'
            });
            expect(metrics.increments.length).to.eql(0);
            done();
        });

        s.write(JSON.stringify({
            'log_type': 'request',
        }));
    });

    it('#_transform: return error for invalid json', (done) => {
        const s = new standardized.LogSchemaMetricsStream({
            sampling_rate_percentage: 1,
        });
        s.on('error', (err) => {
            expect(err.message).to.equal('unable to parse log to json');
            done();
        });
        s.write('asdf!}|;j');
    });

    it('#_transform: emit metric with validation status', (done) => {
        const metrics = new StubMetrics();

        const s = new standardized.LogSchemaMetricsStream({
            sampling_rate_percentage: 1,
            metrics,
        });

        s.on('data', (msg) => {
            const log = JSON.parse(msg);
            expect(log).to.eql({
                'log_type': 'request'
            });
            expect(metrics.increments).to.eql([
                {
                    name: 'logs.validation.count',
                    tags: {
                        is_valid: true
                    }
                }
            ]);
            done();
        });

        s.write(JSON.stringify({
            'log_type': 'request',
        }));

    });
});
