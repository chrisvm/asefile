var ByteDef = require('./byte_def'),
    types = require('./byte_types'),
    colors = require('colors');

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

ase_def.define('frame_header', {
    "frame_bytes": new types.DWord(),
    "magic_num": new types.Word(),
    "num_chunks": new types.Word(),
    "frame_duration": new types.Word(),
    "future": new types.Bytes(6)
});

ase_def.define('frame_chunk', {
    "chunk_size": new types.DWord(),
    "chunk_type": new types.Word(),
    "chunk_data": null
});

ase_def.define('frame', {
    "header": "frame_header",
    "chunk": "frame_chunk"
});

ase_def.define('ase_file', {
    "header": "header",
    "frame": "frame"
});

// TODO: implement/test new after/repeat api
ase_def.after('frame_chunk.chunk_data', types.Bytes, ['frame_chunk.chunk_size']);
ase_def.repeat('ase_file.frame', 'ase_file.header.frames');
module.exports = ase_def;

