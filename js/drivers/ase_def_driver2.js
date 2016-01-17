var ByteDef = require('../byte_types/byte_def'),
    colors = require('colors'),
    types = require('../byte_types/byte_types'),
    path = require('path'),
    fs = require('fs');

// get test file path
var filePath = path.resolve(path.join(__dirname, '../../test/tank.ase'));
console.log('Test file path:'.yellow, filePath);

// create readStream
var stream = fs.createReadStream(filePath);

// parse file header
var ase_file, ase_def = new ByteDef();
var print_file = function () { console.log(ase_file); };

ase_def.define('ase_file', {
    "header": "header"
});

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

ase_def.parse('ase_file', stream, function (err, parsed) {
    if (err) {
        console.log('Error:'.red);
        throw err;
    }
    ase_file = parsed;
    print_file();
});

