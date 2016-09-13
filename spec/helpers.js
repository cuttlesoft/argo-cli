var path = require('path'),
    fs = require('fs'),
    shell = require('shelljs'),
    os = require('os');

module.exports.tmpDir = function(subdir) {
    var dir = path.join(os.tmpdir(), 'e2e-test');
    if (subdir) {
        dir = path.join(dir, subdir);
    }
    shell.mkdir('-p', dir);
    return dir;
};
