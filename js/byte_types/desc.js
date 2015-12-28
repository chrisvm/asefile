/**
 * Created by chrisvm on 12/27/15.
 */
var path = require('path'),
    types = require('./byte_types');

function TypeAddon() {
    this.types = [];
};
TypeAddon.constructor = TypeAddon;

TypeAddon.prototype.add = function (key, type) {
    if (typeof(type) == 'string') {
        if (types.keys().indexOf(type) != 0) {
            type = types[type];
        }
    }
    this.types.append(type);
    return this;
};

function Re
