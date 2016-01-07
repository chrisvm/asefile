var path = require('path'), jsDir = path.resolve(__dirname, '../js');
var should = require('should'), ase_def = require(path.join(jsDir, 'byte_types/ase_def'));

describe("ase_def.js", function () {
    describe("#parsing", function () {
        var testFile = path.resolve(__dirname, 'tank.ase');

        it('should parse correctly a header', function (done) {
            var testObj = {
                file_size: 1678,
                magic_num: 42464,
                frames: 1,
                width: 100,
                height: 100,
                color_depth: 8,
                flags: 0,
                speed: 100,
                blank1: 0,
                blank2: 0,
                pallete_alpha_index: 0,
                ignore: new Buffer(3),
                num_colors: 256,
                future: new Buffer(94)
            };
            ase_def.parse('header', testFile, function (err, parsed) {
                if (err) throw err;
                parsed.should.deepEqual(parsed, testObj);
                done();
            });
        });
    });
});