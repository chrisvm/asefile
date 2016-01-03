/**
 * Created by chrisvm on 12/30/15.
 */
var ByteDef = require('./byte_def'),
    types = require('./byte_types');

// define ase file
var ase_def = new ByteDef();
ase_def.define('header', {
    "file_size": new types.DWord(),
    "magic_num": new types.Word(),
    "frames": new types.Word(),
    "width": new types.Word(),
    "height": new types.Word(),
    "color_depth": new types.Word(),
    "flags": new types.DWord(),
    "speed": new types.Word(),
    "blank1": new types.DWord(),
    "blank2": new types.DWord(),
    "pallete_alpha_index": new types.Byte(),
    "ignore": new types.Bytes(3),
    "num_colors": new types.Word(),
    "future": new types.Bytes(93)
});

(function test() {
    var path = require('path'),
        fPath = path.resolve(__filename, '../../../test/tank.ase');
    ase_def.parse('header', fPath, function (err, parsed) {
        if (err) throw err;
        console.log("Parsed:", parsed);
    });
})();

