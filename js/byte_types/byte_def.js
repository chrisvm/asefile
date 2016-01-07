/**
 * Created by chrisvm on 12/27/15.
 */
var path = require('path'),
    types = require('./byte_types'),
    _ = require('lodash'),
    fs = require('fs');


function ByteDef() {
    this.defs = {};
}
ByteDef.constructor = ByteDef;

/**
 * Create a definition from an object
 * @param {string} name - name of the definition to be created
 * @param {object} def - object with key-value pairs
 */
ByteDef.prototype.define = function (name, def) {
    // iterate throught the keys of the def
    this.defs[name] = _.mapValues(def, function (val) {
        // if string get type
        if (typeof(val) == 'string') {
            val = types.get(val);
        }
        return val;
    }, this);
};

/**
 * Definition parses a file, calling the callback with the parsed object
 * @param {string} def - the name of the definition
 * @param {string} filePath - the path to the file to be parsed
 * @param {function(err, parsed)} cb - the callback, recieves err and parsed
 **/
ByteDef.prototype.parse = function (def, filePath, cb) {
    // check for def
    var definition;
    if ((definition = this.get_def(def)) == null)
        return cb(null, null);
    else definition = this.test_wrapper(definition);

    // create read stream
    var ret = {};
    var stream = fs.createReadStream(filePath);
    stream.on('readable', function () {
        var chunk;
        while (null !== (chunk = stream.read())) {

        }
    });

    stream.on('end', function() {
        cb(null, ret);
    });

    stream.on('error', function (err) {
        throw err;
    });
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
        return _.clone(this.defs[def], true);
    }
};

/**
 * Wrap the definition with an object for parsing tracking
 * @param {object} def_obj - definition object to wrap
 * @return {object} - the definition wrapped
 */
ByteDef.def_wrapper = function (def_obj) {
    // create object with values of def_obj, with pointer to next value
    var keys = _.keys(def_obj), ret = { "def": def_obj}, key, next, pointer = null;
    for (var x = 0; x < keys.length; x += 1) {
        key = keys[x], next = keys[x + 1];
        ret[key] = { "val": def_obj[key], "next": next}
    }

    // bind has method
    var has_method = function (has_key) { return _.has(this.def, has_key); };
    ret.has = _.bind(has_method, ret);

    // bind get method
    var get_method = function (has_key) {
        if (!this.has(has_key)) return null;
        else {
            return this.def[has_key];
        }
    };
    ret.get = _.bind(get_method, ret);

    // bind next method
    var end = false;
    var next_method = function () {
        if (end) return null;
        if (pointer == null) {
            pointer = this[keys[0]];
            if (pointer == null) {
                end = true;
                return null;
            }
            pointer = pointer.next;
            return this[keys[0]].val;
        } else {
            var cache = this[pointer].val;
            pointer = this[pointer].next;
            if (pointer == null) end = true;
            return cache;
        }
    };
    ret.next = _.bind(next_method, ret);

    // bind end method
    var end_method = function () { return end; };
    ret.end = _.bind(end_method, ret);

    return ret;
};
module.exports = ByteDef;