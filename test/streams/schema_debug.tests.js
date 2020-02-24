const expect = require('chai').expect;
const standardized = require('../../streams/standardization');


describe('schemas', () => {
    describe('schemas:write()', () => {
        it('schemas: should do nothing with valid schema', () => {
            let buffer = Buffer.alloc(100000); // 100KB
            const emptyBuffer = Buffer.alloc(100000);
            const stream = new standardized.SchemaDebugStream({
                out: buffer,
                delimiter: '|'
            });
            stream.write(JSON.stringify({
                log_type: '',
                version: '',
                level: 0,
                name: '',
                time: '',
                region: '',
                environment: '',
                purpose: '',
                channel: '',
                hostname: '',
                msg: '',
                service_name: '',
                req_id: '',
                trace_id: '',
                tenant: '',
                auth_strategy: '',
                took: 0,
                operation: '',
                retry_count: 0,
                process: {},
                err: {},
                req: {},
                session: {},
                res: {},
                auth_req: {},
                feature_id: '',
                client: {},
                group: {},
                role: {},
                authenticator: {},
                connection: {},
                grant_id: '',
                user: {},
                flags: {},
                circuit_breaker: {},
                credentials: {},
                geoip: {},
                extras: {}
            }));

            expect(buffer.equals(emptyBuffer)).to.eql(true);
        });

        it('schemas: should log out result to stderr on invalid', () => {
            let buffer = Buffer.alloc(100000); // 100KB
            const stream = new standardized.SchemaDebugStream({
                out: buffer,
                delimiter: '|'
            });
            stream.write(JSON.stringify({'error!': 'error'}));
            // console.log(JSON.parse(buffer.toString()));
            const s = buffer.toString();
            // TODO we over allocate the buffer because
            // we don't know the length of the errors
            // we need to return unallocated bytes so that we can parse
            // the JSON.  this is a delimiter hack to indicate
            // end of JSON... :(
            const i = s.indexOf('|');
            const errors = JSON.parse(s.slice(0, i));
            expect(errors.length).to.be.greaterThan(0);
        });

        it('schemas: should ignore invalid JSON logs', () => {
            const stream = new standardized.SchemaDebugStream();
            expect(() => {stream.write('asdf!}|;j')}).to.not.throw();
        });

        it('schemas: should write invalid without error', () => {
            const stream = new standardized.SchemaDebugStream();
            expect(() => {
                stream.write(JSON.stringify({}));
            }).to.not.throw();
        });
    });
});
