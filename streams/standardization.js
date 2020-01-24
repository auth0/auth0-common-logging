const Writable = require('stream').Writable;
const Validator = require('jsonschema').Validator;
const LOG_SCHEMAS = require('logs-schemas');

/*
function SchemaDebugStream() {
    stream.Writable.call(this);
}

util.inherits(SchemaDebugStream, stream.Writable);

SchemaDebugStream
*/


class SchemaDebugStream extends Writable {
    constructor(options) {
        super(options);
        this.out = process.stderrr;
        if (typeof options.out !== 'undefined') {
            this.out = options.out;
            delete options.out;
        }
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
            this.out.write(JSON.stringify(result.errors));
        }

        return callback();
    }
}

module.exports = {
    SchemaDebugStream
};
