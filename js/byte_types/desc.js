/**
 * Created by chrisvm on 12/27/15.
 */
var path = require('path'),
    types = require('./byte_types'),
    _ = require('underscore');


function ByteDef() {
    this.defs = {};
}
ByteDef.constructor = ByteDef;

ByteDef.prototype.definition = function (name, def) {
    // iterate throught the keys of the def
    this.defs[name] = _.mapObject(def, function (val, key) {
        // get type
        if (_.has(types, ))
    });
};
