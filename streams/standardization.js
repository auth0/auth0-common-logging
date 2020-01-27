const Writable = require('stream').Writable;
const Validator = require('jsonschema').Validator;
const LOG_SCHEMAS = require('logs-schemas');


class SchemaDebugStream extends Writable {
    constructor(options) {
        options = options || {};
        super(options);
        this.out = options.out || process.stderr;
        delete options.out;

        this.delimiter = options.delimiter || null;
        delete options.delimiter;

        this.exitOnError = options.exitOnError || false;

        this.v = new Validator();
    }

    _write(chunk, encoding, callback) {
        const entry = chunk.toString();
        let json;
        try {
            json = JSON.parse(entry);
        } catch(error) {
            return callback();
        }

        const result = this.v.validate(json, LOG_SCHEMAS.webservice);
        if (!result.valid) {
            // console.log(JSON.stringify(result.errors[0]));
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
