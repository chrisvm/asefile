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

/**
 * Definition parses a file, calling the callback with the parsed object
 * @param {string} def - the name of the definition
 * @param {string} filePath - the path to the file to be parsed
 * @param {function([err], parsed)} cb - the callback, recieves err and parsed
 **/
ByteDef.prototype.parse = function (def, filePath, cb) {
    // check for def
    var def_obj, definition;
    if ((def_obj = this.get_def(def)) == null)
        return cb(null, null);
    // wrap definition in sequential list
    else definition = ByteDef.seq_wrapper(def_obj);

    // create read stream
    var ret = {}, stream = fs.createReadStream(filePath), parse_able = true;
    stream.on('readable', _.bind(function () {
        // start parsing loop
        var chunk, part;
        while (parse_able) {
            // get next part to parse
            part = definition.next();

            // if null, finished parsing
            if (part == null) {
                // call callback with parsed results
                parse_able = false;
                return cb(null, ret);
            }

            // TODO: unit test for just-in-time parsing
            // get chunk for part
            chunk = stream.read(part.val.bsize);
            // if chunk size != part.bsize, data not enough for definition
            if (chunk.length < part.val.bsize) {
                parse_able = false;
                return cb('NotEnoughDataError', null);
            }

            // read part into ret object
            ret[part.key] = def_obj[part.key].read(chunk);
        }
    }, this));

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

};


// TODO: implement ByteDef.repeat method
/**
 * Set a def part to repeat a set of times
 * @param {string} def_name - the definition (or sub definition) to repeat
 * @param {string|Number} part_name - times to repeat the definition
 */
ByteDef.prototype.repeat = function (def_name, part_name) {

};

/**
 * Wrap the definition with an object with linked-list type functionality
 * @param {object} def_obj - definition object to wrap
 * @return {object} - the definition wrapped
 */
ByteDef.seq_wrapper = function (def_obj) {
    // create object with values of def_obj, with pointer to next value
    var keys = _.keys(def_obj), ret = { "def": def_obj}, key, next, pointer = null;
    for (var x = 0; x < keys.length; x += 1) {
        key = keys[x], next = keys[x + 1];
        ret[key] = { "val": _.clone(def_obj[key]), "next": next}
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
            return { "key": keys[0], "val": this[keys[0]].val };
        } else {
            var cache = { "key": pointer, "val": this[pointer].val };
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