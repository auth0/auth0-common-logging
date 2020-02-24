const Writable = require('stream').Writable;
const Validator = require('jsonschema').Validator;
const _ = require('lodash');
const LOG_SCHEMAS = require('@a0/logs-schemas');
const stream = require('stream');


class SchemaDebugStream extends Writable {
    constructor(options) {
        options = options || {};
        super(options);

        this.out = options.out || process.stderr;
        this.delimiter = options.delimiter || null;
        this.exitOnError = options.exitOnError || false;
        this.v = new Validator();
        this.schema = options.schema || LOG_SCHEMAS.webservice;
    }

    _write(chunk, encoding, callback) {
        const entry = chunk.toString();
        let json;
        try {
            json = JSON.parse(entry);
        } catch(error) {
            return callback();
        }

        const result = this.v.validate(json, this.schema);
        if (!result.valid) {
            const errors = JSON.stringify(result.errors);
            if (this.delimiter !== null) {
                this.out.write(errors + this.delimiter);
            }
            this.out.write(errors);

            if (this.exitOnError) {
                process.exit(1);
            }
        }

        return callback();
    }
}

/**
 * LogShaperStream will only pull valid fields from the log message.
 */
class LogShaperStream extends stream.Transform {
    constructor(options) {
        options = options || {};
        super(options);

        this.schema = options.schema || LOG_SCHEMAS.webservice;
        this.schemaKeys = _.keys(this.schema.properties);
    }

    _transform(chunk, encoding, cb) {
        const entry = chunk.toString();
        let log;
        try {
            log = JSON.parse(entry);
        } catch(error) {
            return cb(new Error('unable to parse log to json'));
        }

        const shaped = _.pick(log, this.schemaKeys);
        this.push(JSON.stringify(shaped));
        cb();
    }
}

module.exports = {
    SchemaDebugStream,
    LogShaperStream
};
