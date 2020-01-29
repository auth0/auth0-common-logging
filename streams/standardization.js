const Writable = require('stream').Writable;
const Validator = require('jsonschema').Validator;
const LOG_SCHEMAS = require('@a0/logs-schemas');


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

module.exports = {
    SchemaDebugStream
};
