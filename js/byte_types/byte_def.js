/**
 * Created by chrisvm on 12/27/15.
 */
var path = require('path'),
    types = require('./byte_types'),
    _ = require('underscore'),
    fs = require('fs');


function ByteDef() {
    this.defs = {};
}
ByteDef.constructor = ByteDef;

ByteDef.prototype.define = function (name, def) {
    // iterate throught the keys of the def
    this.defs[name] = _.mapObject(def, function (val, key) {
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
    var CHUNK_SIZE = 256,
        buffer = new Buffer(CHUNK_SIZE);

    var pairs = _.pairs(this.defs[def]), pIndex = 0, ret = {};
    fs.open(filePath, 'r', function (err, fd) {
        if (err) return cb(err, null);

        function close() {
            fs.close(fd, function (err) {
                return cb(err, ret);
            }); 
        }

        (function readChunk(last) {
            fs.read(fd, buffer, 0, CHUNK_SIZE , null, function (err, nread) {
                if (err) return cb(err, null);

                if (nread == 0 || pIndex >= pairs.length) {
                    return close();
                }

                // add last buffer
                if (last != null)
                    buffer = Buffer.concat([last, buffer]);

                var rval, offset = 0, key = pairs[pIndex][0], type = pairs[pIndex][1];
                rval = type.read(buffer);
                if (rval == null) {
                    readChunk(buffer.slice(offset));
                }

                ret[key] = rval;
                pIndex += 1;
                readChunk();
            });
        })();
    });
};

module.exports = ByteDef;