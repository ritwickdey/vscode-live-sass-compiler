/*! sass.js - v0.10.5 (2cd3782) - built 2017-06-25
  providing libsass 3.4.5 (31573210)
  via emscripten 1.37.0 ()
 */
var fs = require('fs');
var Sass = require('./sass.sync.js');
var pathModule = require('path');
function fileExists(path) {
    var stat = fs.statSync(path);
    return stat && stat.isFile();
}
function importFileToSass(originalPath, path, done) {
    var requestedPath = pathModule.resolve(originalPath, path);
    // figure out the *actual* path of the file
    var filesystemPath = Sass.findPathVariation(fileExists, requestedPath);
    if (!filesystemPath) {
        done({
            error: 'File "' + requestedPath + '" not found',
        });
        return;
    }
    // write the file to emscripten FS so libsass internal FS handling
    // can engage the scss/sass switch, which apparently does not happen
    // for content provided through the importer callback directly
    var content = fs.readFileSync(filesystemPath, {
        encoding: 'utf8'
    });
    Sass.writeFile(filesystemPath, content, function () {
        done({
            path: filesystemPath,
        });
    });
}
function importerCallback(originalPath, request, done) {
    //EDITED
    // sass.js works in the "/sass/" directory, make that relative to CWD
    // var requestedPath = request.resolved.replace(/^\/sass\//, '' );
    // importFileToSass(requestedPath, done);
    //var requestedPath = request.current.replace(/^\/sass/, '');
    var requestedPath;
    var indexOfSlash;
    if (process.platform === "win32") {
        requestedPath = pathModule.resolve(pathModule.dirname(request.previous.replace(/^\/sass\//, '')), request.current);
        indexOfSlash = requestedPath.lastIndexOf("\\");
    }
    else {
        requestedPath = request.resolved.replace(/^\/sass/, '');
        indexOfSlash = requestedPath.lastIndexOf("/");
    }
    var fullTempRequestedPath = requestedPath.substring(0, indexOfSlash + 1) + '_' + requestedPath.substring(indexOfSlash + 1);

    if (fs.existsSync(fullTempRequestedPath + '.scss')
        || fs.existsSync(fullTempRequestedPath + '.sass')) {
        requestedPath = fullTempRequestedPath;
    }
    else {
        console.error("not found", fullTempRequestedPath);
    }
    importFileToSass(originalPath, requestedPath, done);
}
function compileFile(path, options, callback) {
    if (!callback) {
        callback = options;
        options = {};
    }
    var originalFilePath = pathModule.dirname(path);
    var originalFileName = pathModule.basename(path);
    Sass.importer((requestPath, done) => {
        importerCallback(originalFilePath, requestPath, done);
    });
    importFileToSass(originalFilePath, originalFileName, function () {
        Sass.compileFile(path, options, callback);
    });
}
compileFile.importFileToSass = importFileToSass;
compileFile.Sass = Sass;
module.exports = compileFile;
