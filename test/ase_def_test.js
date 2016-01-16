var path = require('path'), jsDir = path.resolve(__dirname, '../js');
var should = require('should'), ase_def = require(path.join(jsDir, 'byte_types/ase_def'));
var ByteDef = require(path.join(jsDir, 'byte_types/byte_def')),
    types = require(path.join(jsDir, 'byte_types/byte_types'));

describe("ase_def.js", function () {
    describe("#parsing", function () {

        it('should parse correctly a header', function (done) {
            var testFile = path.resolve(__dirname, 'tank.ase');
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
                num_colors: 256
            };
            ase_def.parse('header', testFile, function (err, parsed) {
                if (err) throw err;
                parsed.should.have.properties(testObj);
                done();
            });
        });

        it('should correctly parse a self referencing structure', function (done) {
            var test_def = new ByteDef(), test_file = path.resolve(__dirname, 'testing.dat');
            test_def.define('a', {
                '1': new types.Byte(),
                '2': new types.Byte()
            });

            test_def.define('b', {
                '3': new types.Byte(),
                '4': new types.Byte()
            });

            test_def.define('test', {
                'a': 'a',
                'b': 'b'
            });

            var testObj = {
                'a': { '1': 0, '2': 1 },
                'b': { '3': 2, '4': 3 }
            };
            test_def.parse('test', test_file, function (err, parsed) {
                if (err) throw err;
                parsed.should.deepEqual(testObj);
                done();
            });
        });
    });
});