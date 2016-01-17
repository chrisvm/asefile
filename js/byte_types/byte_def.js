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
        if (val == null) {
            // if null, set to null placeholder
            val = {"is": null};
        }
        return val;
    }, this);
};

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
        var err = this._recv_parse(def, def_obj, stream, temp), ret;
        if (err == null) {
            ret = temp[def];
        } else {
            ret = null;
        }
        cb(err, ret);
    }, this));

    stream.on('error', function (err) {
        throw err;
    });
};

ByteDef.prototype._recv_parse = function (def_name, orig, stream, obj) {
    // start parsing loop
    var chunk, currentPart, t = {}, definition;

    // wrap definition in sequential list
    definition = ByteDef.seq_wrapper(orig, def_name);
    definition.valid = true;

    // start parsing loop
    while (definition.valid) {
        // get next currentPart to parse
        currentPart = definition.next();

        // if null, finished parsing
        if (currentPart == null) {
            // call callback with parsed results
            definition.valid = false;
            obj[def_name] = t;
            return null;
        }

        // TODO: unit test for just-in-time parsing
        // if null placeholder, look for after entry in the mods.after object
        if (currentPart.is == 'null') {
            var part_name = [currentPart.def_name, currentPart.key].join('.');
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

                // set currentPart to correct type
                currentPart = new (Function.prototype.bind.apply(after_mod.constructor, args));
            } else {
                // raise error
                definition.valid = false;
                return 'MissingJITParsingDataError';
            }
        }

        // if currentPart is string, look in definitions
        var rmod = this.mods.repeat[def_name];
        if (typeof(currentPart.val) == 'string') {
            // if not found, give error
            if (!this.has_def(currentPart.val)) {
                definition.valid = false;
                return 'DefinitionNotFoundError';
            }

            // get referenced definition
            var t_orig = this.get_def(currentPart.val), t_obj = {}, t_err;

            // check if repeat mod present for current self-referenced property
            if (rmod && rmod[currentPart.key]) {
                // TODO: insert repeat code for a self reference in here

            } else {
                // parse normally (without repeat)
                t_err = this._recv_parse(currentPart.val, t_orig, stream, t_obj);
                // error was found
                if (t_err != null) {
                    definition.valid = false;
                    return t_err;
                } else {
                    t[currentPart.key] = t_obj[currentPart.key];
                }
            }
        } else {
            // TODO: check if a repeat mod
            if (rmod && rmod[currentPart.key]) {
                // set array
                var arr = t[currentPart.key] = [];

                // get repeat number
                var repTimes = rmod[currentPart.key];
                if (typeof(repTimes) == 'string') {
                    // repTimes is name of prop, get it
                    repTimes = t[repTimes];
                    if (repTimes == null) throw 'RepeatPropNotFoundError';
                }

                // repeat the parsing
                for (var index = 0; index < repTimes; index += 1) {
                    // get chunk for currentPart
                    chunk = stream.read(currentPart.val.bsize);
                    // if chunk size != currentPart.bsize, data not enough for definition
                    if (chunk.length < currentPart.val.bsize) {
                        definition.valid = false;
                        return 'NotEnoughDataError';
                    }
                    arr.push(orig[currentPart.key].read(chunk));
                }

            } else {
                // get chunk for currentPart
                chunk = stream.read(currentPart.val.bsize);
                // if chunk size != currentPart.bsize, data not enough for definition
                if (chunk.length < currentPart.val.bsize) {
                    definition.valid = false;
                    return 'NotEnoughDataError';
                }

                // read currentPart into ret object
                t[currentPart.key] = orig[currentPart.key].read(chunk);
            }
        }
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


/**
 * Set a def part to repeat a set of times
 * @param {string} def_name - the definition (or sub definition) to repeat
 * @param {string|Number} repeat - times to repeat the definition
 */
ByteDef.prototype.repeat = function (def_name, repeat) {
    // get name of definition
    var def = def_name.split('.')[0];
    // throw error if defitnition not found
    if (!this.has_def(def)) throw 'DefinitionNotFoundError';

    // get properties names
    var prop_name = def_name.split('.').slice(1).join('.');

    // if name of repeat field, extract propname
    if (typeof(repeat) == 'string') {
        if (repeat.split('.')[0] != def) throw 'WrongRepeatPropertyError';
        repeat = repeat.split('.').slice(1).join('.');
    }
    // create entry in repeat mods
    if (this.mods.repeat[def] == null)
        this.mods.repeat[def] = {};
    this.mods.repeat[def][prop_name] = repeat;
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