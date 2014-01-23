/*global describe, it*/
'use strict';

var fs = require('fs'),
	should = require('should'),
	path = require('path'),
    gutil = require('gulp-util'),
    php2html = require('../');

require('mocha');


var getFile = function(filePath) {
    filePath = 'test/'+filePath;
    return new gutil.File({
        path: filePath,
        cwd: 'test/',
        base: path.dirname(filePath),
        contents: fs.readFileSync(filePath)
    });
};

describe('gulp-php2html', function () {



	it('should create html', function (done) {

		var srcFile = getFile('fixtures/index.php'),
            stream = php2html({
                processLinks: false
            }),
            valid = 0;

        stream.on('error', function(err) {
            should.not.exist(err);
        });

		stream.on('data', function (newFile) {
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
        });

		stream.write(srcFile);
		stream.end();
	});

//

    it('should use correct PHP environment variables', function(done){
        var stream = php2html(),
            file1 = getFile('env/DOCUMENT_ROOT.php'),
            file2 = getFile('env/PHP_SELF.php'),
            file3 = getFile('env/REQUEST_URI.php'),
            file4 = getFile('env/SCRIPT_NAME.php'),
            file5 = getFile('env/SCRIPT_FILENAME.php'),

            results = {
                'DOCUMENT_ROOT': path.resolve('test'),
                'PHP_SELF': '/env/PHP_SELF.php',
                'REQUEST_URI': '/env/REQUEST_URI.php',
                'SCRIPT_NAME': '/env/SCRIPT_NAME.php',
                'SCRIPT_FILENAME': path.resolve('test/env/SCRIPT_FILENAME.php')
            },

            valid = 0;

        stream.on('data', function (newFile) {
            var ext = path.extname(newFile.path),
                key = path.basename(newFile.path, ext);

            should.exist(newFile);
            should.exist(newFile.path);
            should.exist(newFile.relative);
            should.exist(newFile.contents);
            path.extname(newFile.path).should.equal('.html');
            /<\?php/.test(newFile.contents.toString('utf8')).should.equal(false);
            newFile.contents.toString('utf8').should.equal(results[key]);
            ++valid;
        });

        stream.once('end',function(){
            valid.should.equal(5);
            done();
        });


        stream.write(file1);
        stream.write(file2);
        stream.write(file3);
        stream.write(file4);
        stream.write(file5);


        stream.end();
    });

    it('should throw an error', function(done){
        var srcFile = getFile('fixtures/test.txt'),
            stream = php2html();

        stream.on('error', function(err) {
            should.exist(err);
            done();
        });

        stream.on('data', function (newFile) {
            should.not.exist(newFile);
            done();
        });


        stream.write(srcFile);
        stream.end();
    });

    it('should process relative links to php files and change them to html', function (done) {

        var srcFile = getFile('fixtures/index.php'),
            stream = php2html(),
            valid = 0,
            expectedLinks = [
                '<a href="info.html">info.php</a>',
                '<a href="http://info.php">http://info.php</a>',
                '<a href="info.html?test=1">info.php</a>',
                '<img src="getmyimg.php?test=2"/>',
                'info.html',
                'http://info.php',
                'info.html?test=1',
                'getmyimg.php?test=2'
            ];



        stream.on('error', function(err) {
            should.not.exist(err);
        });


        stream.on('data', function (newFile) {
            should.exist(newFile);
            should.exist(newFile.path);
            should.exist(newFile.relative);
            should.exist(newFile.contents);
            path.extname(newFile.path).should.equal('.html');
            var content  = newFile.contents.toString();
            expectedLinks.forEach(function(link){
                content.indexOf(link).should.not.equal(-1);
            });
            ++valid;
        });

        stream.once('end',function(){
            valid.should.equal(1);
            done();
        });

        stream.write(srcFile);
        stream.end();
    });

    it('should not process relative links to php files and change them to html', function (done) {

        var srcFile = getFile('fixtures/index.php'),
            stream = php2html({
                processLinks: false
            }),
            valid = 0,
            expectedLinks = [
                '<a href="info.php">info.php</a>',
                '<a href="http://info.php">http://info.php</a>',
                '<a href="info.php?test=1">info.php</a>',
                '<img src="getmyimg.php?test=2"/>',
                'info.php',
                'http://info.php',
                'info.php?test=1',
                'getmyimg.php?test=2'
            ];



        stream.on('error', function(err) {
            should.not.exist(err);
        });


        stream.on('data', function (newFile) {
            should.exist(newFile);
            should.exist(newFile.path);
            should.exist(newFile.relative);
            should.exist(newFile.contents);
            path.extname(newFile.path).should.equal('.html');
            var content  = newFile.contents.toString();
            expectedLinks.forEach(function(link){
                content.indexOf(link).should.not.equal(-1);
            });
            ++valid;
        });

        stream.once('end',function(){
            valid.should.equal(1);
            done();
        });

        stream.write(srcFile);
        stream.end();
    });

});
