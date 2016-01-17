var ase_def = require('../byte_types/ase_def'),
    colors = require('colors'),
    path = require('path'),
    fs = require('fs');

// get test file path
var filePath = path.resolve(path.join(__dirname, '../../test/tank.ase'));
console.log('Test file path:'.yellow, filePath);

// create readStream
var stream = fs.createReadStream(filePath);

// parse file header
var ase_file;
var print_file = function () { console.log(ase_file); };
ase_def.parse('ase_file', stream, function (err, parsed) {
    if (err) {
        console.log('Error:'.red);
        throw err;
    }
    ase_file = parsed;
    print_file();
});

