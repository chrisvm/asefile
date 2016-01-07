var _ = require('lodash');

function SequentialWrapper(def_obj, def_name) {
    // create object with values of def_obj, with pointer to next value
    this.def =  def_obj;
    this.name = def_name;
    this._keys = _.keys(def_obj);
    this._pointer = null;
    this._end = false;

    // init the keys from def_obj
    var next, key;
    for (var x = 0; x < this._keys.length; x += 1) {
        key = this._keys[x], next = this._keys[x + 1];
        this[key] = {
            "val": _.clone(def_obj[key]),
            "next": next
        };
    }
}
SequentialWrapper.prototype.constructor = SequentialWrapper;


SequentialWrapper.prototype.has = function (has_key) {
    return _.has(this.def, has_key);
};


SequentialWrapper.prototype.get = function (has_key) {
    if (!this.has(has_key))
        return null;
    else
        return this.def[has_key];
};


SequentialWrapper.prototype.next = function () {
    if (this._end)
        return null;

    if (this._pointer == null) {
        this._pointer = this[this._keys[0]];
        if (this._pointer == null) {
            this._end = true;
            return null;
        }
        this._pointer = this._pointer.next;
        return { "key": this._keys[0], "val": this[this._keys[0]].val };
    } else {
        var cache = { "key": this._pointer, "val": this[this._pointer].val };
        this._pointer = this[this._pointer].next;
        if (this._pointer == null)
            this._end = true;
        return cache;
    }
};


SequentialWrapper.prototype.end = function () {
    return this._end;
};

module.exports = SequentialWrapper;
