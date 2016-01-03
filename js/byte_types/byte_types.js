/**
 * Created by chrisvm on 12/27/15.
 */
var _ = require('underscore');

function Byte () {
    this.signed = false
    this.read_method = 'readUInt8';
    this.bsize = 1;
};
Byte.prototype.read = function (buff) {
    return buff[this.read_method]();
};

function Word () {
    this.signed = false;
    this.read_method = 'readUInt16LE';
    this.bsize = 2;
};
Word.prototype.read = function (buff) {
    return buff[this.read_method]();
};

function DWord() {
    this.signed = false;
    this.read_method = 'readUInt32LE';
    this.bsize = 4;
};
DWord.prototype.read = function (buff) {
    return buff[this.read_method]();
};

function Long() {
    this.signed = true;
    this.read_method = 'readInt32LE';
    this.bsize = 4;
};
Long.prototype.read = function (buff) {
    return buff[this.read_method]();
};

function Bytes(n) {
    this.signed = false;
    this.read_method = 'readUInt8';
    this.bsize = n;
};
Bytes.prototype.read = function (buff) {
    if (this.bsize > buff.length) return null;
    return buff.slice(0, this.bsize);
};

function Rect(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
    this.bsize = 16;
};

function String(length, string) {
    this.length = length;
    this.chars = string;
    this.bsize = 2 + this.length;
};

function Pixel () {

};

var classes = [Byte, Word, DWord, Long, Bytes, Rect, String, Pixel], mod = {};

_.each(classes, function (c) {
    c.constructor = c;
    mod[c.constructor.name] = c;
});

mod.get = function (t) {
    if (_.has(mod, t)) {
        return mod[t];
    }
    return null;
};

module.exports = mod;