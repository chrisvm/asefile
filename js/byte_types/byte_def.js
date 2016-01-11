/**
 * Created by chrisvm on 12/27/15.
 */
var path = require('path'),
    SequentialWrapper = require('./seq_wrapper'),
    types = require('./byte_types'),
    _ = require('lodash'),
    fs = require('fs');


function ByteDef() {
    this.defs = {};
    this.mods = { after: {}, repeat: {} };
}
ByteDef.constructor = ByteDef;

/**
 * Create a definition from an object, sanitizing the object
 * @param {string} name - name of the definition to be created
 * @param {object} def - object with key-value pairs
 */
ByteDef.prototype.define = function (name, def) {
    // iterate throught the keys of the def
    this.defs[name] = _.mapValues(def, function (val) {
        if (typeof(val) == 'string') {
            // if string, look for in types
            val = types.get(val);
        } else if (val == null) {
            // if null, set to null placeholder
            val = {"is": null};
        }
        return val;
    }, this);
};

// TODO: finish recursive implementation
/**
 * Definition parses a file, calling the callback with the parsed object
 * @param {string} def - the name of the definition
 * @param {string|ReadableStream} filePath - the path to the file to be parsed or the opened file
 * @param {function([err], parsed)} cb - the callback, recieves err and parsed
 **/
ByteDef.prototype.parse = function (def, filePath, cb) {
    // check for def
    var def_obj, definition;
    if ((def_obj = this.get_def(def)) == null)
        return cb(null, null);
    // wrap definition in sequential list
    else definition = ByteDef.seq_wrapper(def_obj, def);

    // create read stream if string given
    var temp = {}, stream;
    if (typeof(filePath) == 'string') {
        stream = fs.createReadStream(filePath);
    } else {
        // else start reading
        stream = filePath;
    }

    // attach on readable event
    stream.once('readable', _.bind(function () {
        var err = this._recv_parse(def, def_obj, definition, stream, temp), ret;
        if (err == null) {
            ret = {};
            ret[def] = temp;
        } else {
            ret = null;
        }
        cb(err, ret);
    }, this));

    stream.on('error', function (err) {
        throw err;
    });
};

// TODO: change parse_able use to definition.valid
ByteDef.prototype._recv_parse = function (def_name, orig, definition, stream, obj) {
    // start parsing loop
    var chunk, part, t = {};
    definition.valid = true;
    while (definition.valid) {
        // get next part to parse
        part = definition.next();

        // if null, finished parsing
        if (part == null) {
            // call callback with parsed results
            definition.valid = false;
            obj[def_name] = t;
            return null;
        }

        // TODO: unit test for just-in-time parsing
        // if null placeholder, look for after entry in the mods.after object
        if (part.is == 'null') {
            var part_name = [part.def_name, part.key].join('.');
            if (_.has(this.mods.after, part_name))  {
                // TODO: do initing, checking all data necessary is already parsed
                // get mod
                var after_mod = this.mods.after[part_name];

                // prepare arguments
                var args = _.map(after_mod.args, function (v) { return _.get(obj, v); });

                // if any argument is null, error
                if (_.some(args, function (a) { return a == null; })) {
                    // jit parsing failed, exit with error
                    definition.valid = false;
                    return 'MissingJITParsingModError';
                }

                // set part to correct type
                part = new (Function.prototype.bind.apply(after_mod.constructor, args));
            } else {
                // raise error
                definition.valid = false;
                return 'MissingJITParsingDataError';
            }
        }

        // TODO: implement recursive definition
        // if part is string, look in definitions
        if (typeof(part) == 'string') {

        }

        // get chunk for part
        chunk = stream.read(part.val.bsize);
        // if chunk size != part.bsize, data not enough for definition
        if (chunk.length < part.val.bsize) {
            definition.valid = false;
            return 'NotEnoughDataError';
        }

        // read part into ret object
        t[part.key] = orig[part.key].read(chunk);
    }
};

/**
 * Checks if the bytedef object has the definition
 * @param {string} def - the definition's name
 * @return {boolean} - if the bytedef has the definition
 */
ByteDef.prototype.has_def = function (def) {
    return _.has(this.defs, def);
};

/**
 * Get the definition with name 'def'
 * @param {string} def - name of the definition
 * @returns {object|null} - the definition if found, null if not
 */
ByteDef.prototype.get_def = function (def) {
    if (!this.has_def(def)) return null;
    else {
        return this.defs[def];
    }
};

// TODO: implement ByteDef.after method
/**
 * Set a def part to be init after starting parsing
 * @param {string} def_name - name of the part to set
 * @param {function} constructor - the constructor of the object to replace the part
 * @param {string[]|int[]} args - the list of arguments to give to constructor
 */
ByteDef.prototype.after = function (def_name, constructor, args) {
    this.mods.after[def_name] = {
        "def_name": def_name,
        "constructor": constructor,
        "args": args
    };
};


// TODO: implement ByteDef.repeat method
/**
 * Set a def part to repeat a set of times
 * @param {string} def_name - the definition (or sub definition) to repeat
 * @param {string|Number} repeat - times to repeat the definition
 */
ByteDef.prototype.repeat = function (def_name, repeat) {
    this.mods.repeat[def_name] = {
        "def_name": def_name,
        "repeat": repeat
    };
};

/**
 * Wrap the definition with an object with linked-list type functionality
 * @param {object} def_obj - definition object to wrap
 * @return {object} - the definition wrapped
 */
ByteDef.seq_wrapper = function (def_obj, def_name) {
    return new SequentialWrapper(def_obj, def_name);
};
module.exports = ByteDef;