var path = require('path'), jsDir = path.resolve(__dirname, '../js');
var should = require('should'), ByteDef = require(path.join(jsDir, 'byte_types/byte_def'));

describe("ByteDef", function () {
    describe("#def_wrapper", function () {

        it('should work propertly for empty objects', function () {
            var testObj = {}, wrapped = ByteDef.def_wrapper(testObj);
            var prop, times = 0;
            while ((prop = wrapped.next()) != null) {
                // do something
                times += 1;
            }
            times.should.equal(0);
        });

        it('should work with non-empty objects', function () {
            var testObj = { "a": 1, "b": 2, "c": 3 },
                wrapped = ByteDef.def_wrapper(testObj),
                prop, times = 0, vals = [];
            while ((prop = wrapped.next()) != null) {
                // do something
                vals.push(prop);
            }
            vals.length.should.equal(3);
            should.deepEqual([1, 2, 3], vals);
        });
    });
});