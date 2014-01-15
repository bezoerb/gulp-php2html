/*global describe, it*/
"use strict";

var fs = require("fs"),
	es = require("event-stream"),
	should = require("should"),
	path = require("path"),
    gutil = require("gulp-util"),
    php2html = require("../");

require("mocha");


var getFile = function(filePath) {
    filePath = 'test/'+filePath;
    return new gutil.File({
        path: filePath,
        cwd: 'test/',
        base: path.dirname(filePath),
        contents: fs.readFileSync(filePath)
    });
};

describe("gulp-php2html", function () {



	it("should create html", function (done) {

		var srcFile = getFile('fixtures/index.php'),
            stream = php2html(),
            valid = 0;

		stream.on("data", function (newFile) {
            should.exist(newFile);
            should.exist(newFile.path);
            should.exist(newFile.relative);
            should.exist(newFile.contents);
            path.extname(newFile.path).should.equal('.html');
            /<\?php/.test(newFile.contents).should.equal(false);
            ++valid;
		});

        stream.once('end',function(){
            valid.should.equal(1);
            done();
        })

		stream.write(srcFile);
		stream.end();
	});

    it("should use correct PHP environment variables", function(){
        var stream = php2html(),
            docrootfix = process.platform === 'win32' ? '\\' : '',
            filenames = ['DOCUMENT_ROOT','PHP_SELF','REQUEST_URI','SCRIPT_NAME','SCRIPT_FILENAME'].map(function(name){
                return 'env/' + name + '.php';
            }),
            results = [path.resolve('test'),'/test/env/PHP_SELF.php','/test/env/REQUEST_URI.php','/test/env/SCRIPT_NAME.php',path.resolve('test/env/SCRIPT_FILENAME.php')],
            files = filenames.map(function(name){
                return getFile(name);
            }),
            valid = 0;

        stream.on("data", function (newFile) {
            gutil.log('received',newFile.path);
            should.exist(newFile);
            should.exist(newFile.path);
            should.exist(newFile.relative);
            should.exist(newFile.contents);
            path.extname(newFile.path).should.equal('.html');
            /<\?php/.test(newFile.contents).should.equal(false);
            ++valid;
        });

        stream.once('end',function(){
            valid.should.equal(filenames.length);
            done();
        });

        files.forEach(function(file){
            stream.write(file);
        });

        stream.end();

//        'environment': function (test) {
//            var docrootfix = process.platform === 'win32' ? '\\' : '';
//            test.expect(5);
//            test.equal(grunt.file.read('tmp/test/env/DOCUMENT_ROOT.html'), process.cwd()+docrootfix, 'DOCUMENT_ROOT should be cwd()');
//            test.equal(grunt.file.read('tmp/test/env/PHP_SELF.html'), '/test/env/PHP_SELF.php', 'PHP_SELF schould be relative script path');
//            test.equal(grunt.file.read('tmp/test/env/REQUEST_URI.html'), '/test/env/REQUEST_URI.php', 'REQUEST_URI schould be relative script path');
//            test.equal(grunt.file.read('tmp/test/env/SCRIPT_NAME.html'), '/test/env/SCRIPT_NAME.php', 'SCRIPT_NAME schould be relative script path');
//            test.equal(grunt.file.read('tmp/test/env/SCRIPT_FILENAME.html'), path.join(process.cwd(),'test/env/SCRIPT_FILENAME.php'), 'SCRIPT_FILENAME schould be absolute script path');
//            test.done();
//        }
    });

});
