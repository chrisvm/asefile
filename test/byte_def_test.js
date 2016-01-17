var path = require('path'), jsDir = path.resolve(__dirname, '../js');
var should = require('should');
var ByteDef = require(path.join(jsDir, 'byte_types/byte_def')),
    types = require(path.join(jsDir, 'byte_types/byte_types'));
var ase_def = require(path.join(jsDir, 'byte_types/ase_def'));

describe("ByteDef", function () {
    describe("#seq_wrapper", function () {

        it('should work propertly for empty objects', function () {
            var testObj = {}, wrapped = ByteDef.seq_wrapper(testObj);
            var prop, times = 0;
            while ((prop = wrapped.next()) != null) {
                // do something
                times += 1;
            }
            times.should.equal(0);
        });

        it('should work with non-empty objects', function () {
            var testObj = { "a": 1, "b": 2, "c": 3 },
                wrapped = ByteDef.seq_wrapper(testObj),
                prop, times = 0, vals = [];
            while ((prop = wrapped.next()) != null) {
                // do something
                vals.push(prop.val);
            }
            vals.length.should.equal(3);
            should.deepEqual([1, 2, 3], vals);
        });

         it('should work correctly for string in values', function () {
             var testObj = { "a": 'a', "b": 'b' },
                 wrapped = ByteDef.seq_wrapper(testObj),
                 prop, vals = [];
             while ((prop = wrapped.next()) != null) {
                 // do something
                 vals.push(prop.val);
             }
             vals.length.should.equal(2);
             should.deepEqual(['a', 'b'], vals);
         });
    });

    describe('#has_def/get_def methods', function () {
        var test_def = new ByteDef(), def = {a:1, b: 2};
        test_def.define('test', def);

        it('should check correctly for containement', function () {
            test_def.has_def('test').should.equal(true);
        });

        it('should get properly the definition', function () {
            test_def.get_def('test').should.deepEqual(def);
        });
    });

    describe('#define method', function () {

        it('should swap null values with placeholder', function () {
            var test_def = new ByteDef();
            test_def.define('test', {
                "a": 1,
                "b": null,
                "c": 2
            });
            test_def.get_def('test').should.deepEqual({a:1, b: {is: 'null'}, c: 2});
        });
    });

    describe("#parsing", function () {
        describe('#parsing mods', function () {
            describe('#repeat', function () {
                it('should create repeat entry in the mods object', function () {
                    var test_def = new ByteDef();
                    test_def.define('test', {
                        'a': new types.Byte(),
                        'b': new types.Byte()
                    });
                    test_def.repeat('test.b', 'test.a');
                    test_def.mods.repeat['test'].should.deepEqual({
                        "b": "a"
                    });
                });

                it('should create various repeat entry in the mods object', function () {
                    var test_def = new ByteDef();
                    test_def.define('test', {
                        'a': new types.Byte(),
                        'b': new types.Byte()
                    });
                    test_def.repeat('test.b', 'test.a');
                    test_def.mods.repeat['test'].should.deepEqual({
                        "b": "a"
                    });

                    test_def.repeat('test.d', 'test.c');
                    test_def.mods.repeat['test'].should.deepEqual({
                        "b": "a",
                        "d": "c"
                    });
                });

                it('should create repeat entry in the mods object given a integer', function () {
                    var test_def = new ByteDef();
                    test_def.define('test', {
                        'a': new types.Byte(),
                        'b': new types.Byte()
                    });
                    test_def.repeat('test.b', 5);
                    test_def.mods.repeat['test'].should.deepEqual({
                        "b": 5
                    });
                });

                it('should parse repeat mods', function (done) {
                    var test_def = new ByteDef();
                    test_def.define('test', {
                        "size": new types.Byte(),
                        "data": new types.Byte()
                    });
                    test_def.repeat('test.data', 'test.size');
                    var test_obj = {
                        "size": 3,
                        "data": [1, 2, 3]
                    }, test_file = path.resolve(__dirname, 'testing2.dat');
                    test_def.parse('test', test_file, function (err, parsed) {
                        if (err) throw err;
                        parsed.should.deepEqual(test_obj);
                        done();
                    });
                });

                it('should parse repeat mods with self referencing', function (done) {
                    var test_def = new ByteDef();
                    test_def.define('test', {
                        "size": new types.Byte(),
                        "data": 'data'
                    });

                    test_def.define('data', {
                        "a": new types.Byte(),
                        "b": new types.Byte()
                    });

                    test_def.repeat('test.data', 'test.size');
                    var test_obj = {
                        "size": 3,
                        "data": [
                            { "a": 0, "b": 1 },
                            { "a": 2, "b": 3 },
                            { "a": 4, "b": 5 }
                        ]
                    }, test_file = path.resolve(__dirname, 'testing3.dat');
                    test_def.parse('test', test_file, function (err, parsed) {
                        if (err) throw err;
                        parsed.should.deepEqual(test_obj);
                        done();
                    });
                });
            });

            describe('#after', function () {
                it('should create after entry in the mods object', function () {
                    var test_def = new ByteDef();
                    test_def.after('test.b', Number, ['test.a']);
                    test_def.mods.after['test'].should.deepEqual({
                        'b': {
                            "type": Number,
                            "args": ['a']
                        }
                    });
                });

                it('should parse correctly a jit definition', function (done) {
                    var test_def = new ByteDef();
                    test_def.define('test', {
                        "size": new types.Byte(),
                        "data": null
                    });
                    test_def.after('test.data', types.Bytes, ['test.size']);

                    var test_file = path.resolve(__dirname, 'testing4.dat');

                    test_def.parse('test', test_file, function (err, parsed) {
                        if (err) throw err;
                        parsed.data.length.should.equal(parsed.size);
                        done();
                    });
                });
            });
        });

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