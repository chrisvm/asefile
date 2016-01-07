var path = require('path'), jsDir = path.resolve(__dirname, '../js');
var should = require('should'), ByteDef = require(path.join(jsDir, 'byte_types/byte_def'));
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
            var test_def = new ByteDef(), def = {a:1, b: null, c: 2};
            test_def.define('test', def);
            test_def.get_def('test').should.deepEqual({a:1, b: {is: null}, c: 2});
        });
    });

    describe('#parsing mods', function () {
        it('should create after entry in the mods object', function () {
            var test_def = new ByteDef();
            test_def.after('test.b', Number, ['test.a']);
            test_def.mods.after['test.b'].should.deepEqual({
                "def_name": 'test.b',
                "constructor": Number,
                "args": ['test.a']
            });
        });

        it('should create repeat entry in the mods object', function () {
            var test_def = new ByteDef();
            test_def.repeat('test.b', 'test.a');
            test_def.mods.repeat['test.b'].should.deepEqual({
                "def_name": 'test.b',
                "repeat": 'test.a'
            });
        });
    });
});