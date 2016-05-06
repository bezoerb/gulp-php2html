/* global describe, it*/
'use strict';

var fs = require('fs');
var path = require('path');
var Stream = require('stream').Stream;
var vinylStream = require('vinyl-source-stream');
var assert = require('chai').assert;
var streamAssert = require('stream-assert');
var should = require('should');
var gutil = require('gulp-util');
var array = require('stream-array');
var php2html = require('../');

/**
 * Get vinyl file object
 *
 * @returns {*|StreamArray|exports}
 */
function getVinyl() {
    var args = Array.prototype.slice.call(arguments);

    function create(filepath) {
        var file = path.join(__dirname, 'fixtures', filepath);
        return new gutil.File({
            cwd: __dirname,
            base: path.dirname(file),
            path: file,
            contents: new Buffer(fs.readFileSync(file))
        });
    }

    return array(args.map(create));
}

function read(file) {
    return fs.readFileSync(path.join(__dirname, file), 'utf8');
}

describe('gulp-php2html', function () {
    describe('plugin', function () {
        // this.timeout(20000);

        it('should emit error on streamed file', function (done) {
            var fakeFilePath = path.join(__dirname, 'fixtures', 'index.php');

            fs.createReadStream(fakeFilePath)
                .pipe(vinylStream())
                .pipe(php2html())
                .on('data', function (data) {
                    assert.fail(null, data, 'Should not emit data');
                })
                .on('error', function (err) {
                    assert.strictEqual(err.message, 'Streaming not supported');
                    done();
                });
        });

        it('should create html', function (done) {
            getVinyl('index.php')
                .pipe(php2html())
                .pipe(streamAssert.length(1))
                .on('data', function (newFile) {
                    should.exist(newFile);
                    should.exist(newFile.path);
                    should.exist(newFile.relative);
                    should.exist(newFile.contents);
                    path.extname(newFile.path).should.equal('.html');
                    /<\?php/.test(newFile.contents).should.equal(false);
                })
                .on('error', function (err) {
                    assert.fail(null, err, 'Should not emit an error');
                    done();
                })
                .on('end', done);
        });

        it('should use correct PHP environment variables', function (done) {
            var results = {
                DOCUMENT_ROOT: path.resolve('test'),
                PHP_SELF: '/fixtures/env/PHP_SELF.php',
                REQUEST_URI: '/fixtures/env/REQUEST_URI.php',
                SCRIPT_NAME: '/fixtures/env/SCRIPT_NAME.php',
                SCRIPT_FILENAME: path.resolve('test/fixtures/env/SCRIPT_FILENAME.php'),
                SERVER_NAME: 'mydomain.com'
            };

            function assertResult(file) {
                var index = path.basename(file.path, '.html');
                should.exist(file);
                should.exist(file.path);
                should.exist(file.relative);
                should.exist(file.contents);
                /<\?php/.test(file.contents.toString('utf8')).should.equal(false);
                file.contents.toString('utf8').should.equal(results[index]);
            }

            getVinyl('env/DOCUMENT_ROOT.php', 'env/PHP_SELF.php', 'env/REQUEST_URI.php', 'env/SCRIPT_NAME.php', 'env/SCRIPT_FILENAME.php', 'env/SERVER_NAME.php')
                .pipe(php2html({requestHost: 'mydomain.com'}))
                .pipe(streamAssert.length(6))
                .pipe(streamAssert.nth(0, assertResult))
                .pipe(streamAssert.nth(1, assertResult))
                .pipe(streamAssert.nth(2, assertResult))
                .pipe(streamAssert.nth(3, assertResult))
                .pipe(streamAssert.nth(4, assertResult))
                .pipe(streamAssert.nth(6, assertResult))
                .on('error', function (err) {
                    assert.fail(null, err, 'Should not emit an error');
                    done();
                })
                .on('data', function (file) {
                    path.extname(file.path).should.equal('.html');
                })
                .on('end', done);
        });

        it('should throw an error', function (done) {
            getVinyl('test.txt')
                .pipe(php2html())
                .on('data', function (newFile) {
                    should.not.exist(newFile);
                    done();
                })
                .on('error', function (err) {
                    should.exist(err);
                    done();
                });
        });

        it('should respect haltOnError option', function (done) {
            getVinyl('test.txt', 'index.php')
                .pipe(php2html({haltOnError: false}))
                .on('data', function (newFile) {
                    should.exist(newFile);
                })
                .on('error', function (err) {
                    should.not.exist(err);
                })
                .on('end', done);
        });

        it('should process relative links to php files and change them to html', function (done) {
            /* eslint-disable max-nested-callbacks */
            getVinyl('index.php')
                .pipe(php2html())
                .on('data', function (newFile) {
                    should.exist(newFile);
                    should.exist(newFile.path);
                    should.exist(newFile.relative);
                    should.exist(newFile.contents);
                    path.extname(newFile.path).should.equal('.html');
                    var content = newFile.contents.toString();
                    [
                        '<a href="info.html">info.php</a>',
                        '<a href="http://info.php">http://info.php</a>',
                        '<a href="info.html?test=1">info.php</a>',
                        '<img src="getmyimg.php?test=2"/>',
                        'info.html',
                        'http://info.php',
                        'info.html?test=1',
                        'getmyimg.php?test=2'
                    ].forEach(function (link) {
                        content.indexOf(link).should.not.equal(-1);
                    });
                })
                .on('error', function (err) {
                    assert.fail(null, err, 'Should not emit an error');
                    done();
                })
                .on('end', done);
            /* eslint-enable max-nested-callbacks */
        });

        it('should not process relative links to php files and change them to html', function (done) {
            /* eslint-disable max-nested-callbacks */
            getVinyl('index.php')
                .pipe(php2html({processLinks: false}))
                .on('data', function (newFile) {
                    should.exist(newFile);
                    should.exist(newFile.path);
                    should.exist(newFile.relative);
                    should.exist(newFile.contents);
                    path.extname(newFile.path).should.equal('.html');
                    var content = newFile.contents.toString();
                    [
                        '<a href="info.php">info.php</a>',
                        '<a href="http://info.php">http://info.php</a>',
                        '<a href="info.php?test=1">info.php</a>',
                        '<img src="getmyimg.php?test=2"/>',
                        'info.php',
                        'http://info.php',
                        'info.php?test=1',
                        'getmyimg.php?test=2'
                    ].forEach(function (link) {
                        content.indexOf(link).should.not.equal(-1);
                    });
                })
                .on('error', function (err) {
                    assert.fail(null, err, 'Should not emit an error');
                    done();
                })
                .on('end', done);
            /* eslint-enable max-nested-callbacks */
        });

        it('should output $_GET data passed to php2html', function (done) {
            var expected = read('expected/get.html').replace(/[\s\t\r\n]+/gm, '');
            getVinyl('get.php')
                .pipe(php2html({getData: {test: 42, arr: [1, 2, 3, 4], obj: {a: 1, b: 2, c: 3}}}))
                .on('data', function (newFile) {
                    should.exist(newFile);
                    should.exist(newFile.path);
                    should.exist(newFile.relative);
                    should.exist(newFile.contents);
                    path.extname(newFile.path).should.equal('.html');
                    /<\?php/.test(newFile.contents.toString('utf8')).should.equal(false);

                    newFile.contents.toString('utf8').replace(/[\s\t\r\n]+/gm, '').should.equal(expected);
                })
                .on('error', function (err) {
                    assert.fail(null, err, 'Should not emit an error');
                    done();
                })
                .on('end', done);
        });

        it('should not throw an error', function (done) {
            php2html()
                .on('error', function () {
                    should.fail('Should not throw an error');
                })
                .on('data', function () {
                })
                .on('end', done)
                .end();
        });
    });

    describe('router', function () {
        it('should be available', function () {
            var type = typeof php2html.routes;
            type.should.equal('function');
        });

        it('should return readable stream', function () {
            var routes = php2html.routes(['test']);
            var isStream = routes instanceof Stream;
            var isReadable = typeof routes._read === 'function' && typeof routes._readableState === 'object';

            isStream.should.equal(true);
            isReadable.should.equal(true);
            routes.readable.should.equal(true);
        });

        it('should create html from routes', function (done) {
            var routes = php2html.routes(['/myroute', '/another/route', '/route/with/extension.php']);
            var stream = php2html({
                router: 'test/fixtures/router.php',
                processLinks: false
            });
            var valid = 0;

            stream.on('error', function (err) {
                should.not.exist(err);
            });

            stream.on('data', function (newFile) {
                should.exist(newFile);
                should.exist(newFile.route);
                should.exist(newFile.path);
                should.exist(newFile.contents);
                path.extname(newFile.path).should.equal('.html');
                /<\?php/.test(newFile.contents).should.equal(false);
                newFile.contents.toString('utf-8').should.equal(newFile.route);
                ++valid;
            });

            stream.once('end', function () {
                valid.should.equal(3);
                done();
            });

            routes.pipe(stream);
        });

        it('should skip empty routes routes', function (done) {
            var routes = php2html.routes(['', '', '/valid']);
            var stream = php2html({
                router: 'test/fixtures/router.php',
                processLinks: false
            });
            var valid = 0;

            stream.on('error', function (err) {
                should.not.exist(err);
            });

            stream.on('data', function (newFile) {
                should.exist(newFile);
                should.exist(newFile.route);
                should.exist(newFile.path);
                should.exist(newFile.contents);
                path.extname(newFile.path).should.equal('.html');
                /<\?php/.test(newFile.contents).should.equal(false);
                newFile.contents.toString('utf-8').should.equal(newFile.route);
                ++valid;
            });

            stream.once('end', function () {
                valid.should.equal(1);
                done();
            });

            routes.pipe(stream);
        });

        it('should set filenames to index for routes ending with /', function (done) {
            var routes = php2html.routes(['/']);
            var stream = php2html({
                router: 'test/fixtures/router.php',
                processLinks: false
            });
            var valid = 0;

            stream.on('error', function (err) {
                should.not.exist(err);
            });

            stream.on('data', function (newFile) {
                should.exist(newFile);
                should.exist(newFile.route);
                should.exist(newFile.path);
                should.exist(newFile.contents);
                path.extname(newFile.path).should.equal('.html');

                /<\?php/.test(newFile.contents).should.equal(false);
                newFile.contents.toString('utf-8').should.equal(newFile.route);

                /index\.html$/.test(newFile.path).should.equal(true);
                ++valid;
            });

            stream.once('end', function () {
                valid.should.equal(1);
                done();
            });

            routes.pipe(stream);
        });
    });
});
