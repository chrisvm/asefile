/**
 * Created by chrisvm on 12/27/15.
 */
var _ = require('underscore');

function Byte () {
    this.signed = false;
    this.bsize = 1;
};

function Word () {
    this.signed = false;
    this.bsize = 2;
};

function DWord() {
    this.signed = false;
    this.bsize = 4;
};

function Long() {
    this.signed = true;
    this.bsize = 4;
};

function Bytes(n) {
    this.signed = false;
    this.bsize = n;
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

var classes = [Byte, Word, DWord, Long, Bytes, Rect, String], mod = {};

_.each(classes, function (c) {
    c.constructor = c;
    mod[c.constructor.name] = c;
});
module.exports = mod;