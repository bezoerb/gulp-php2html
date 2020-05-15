/* global describe, it */
'use strict';

const fs = require('fs');
const path = require('path');
const {Stream} = require('stream');
const vinylStream = require('vinyl-source-stream');
const {assert} = require('chai');
const streamAssert = require('stream-assert');
const should = require('should');
const File = require('vinyl');
const array = require('stream-array');
const php2html = require('..');

/**
 * Get vinyl file object
 *
 * @returns {*|StreamArray|exports}
 */
function getVinyl(...args) {
  function create(filepath) {
    const file = path.join(__dirname, 'fixtures', filepath);
    return new File({
      cwd: __dirname,
      base: path.dirname(file),
      path: file,
      contents: Buffer.from(fs.readFileSync(file))
    });
  }

  return array(args.map(filepath => create(filepath)));
}

function read(file) {
  return fs.readFileSync(path.join(__dirname, file), 'utf8');
}

describe('gulp-php2html', () => {
  describe('plugin', () => {
    // This.timeout(20000);

    it('should emit error on streamed file', done => {
      const fakeFilePath = path.join(__dirname, 'fixtures', 'index.php');

      fs.createReadStream(fakeFilePath)
        .pipe(vinylStream())
        .pipe(php2html())
        .on('data', data => {
          assert.fail(null, data, 'Should not emit data');
        })
        .on('error', err => {
          assert.strictEqual(err.message, 'Streaming not supported');
          done();
        });
    });

    it('should create html', done => {
      getVinyl('index.php')
        .pipe(php2html())
        .pipe(streamAssert.length(1))
        .on('data', newFile => {
          should.exist(newFile);
          should.exist(newFile.path);
          should.exist(newFile.relative);
          should.exist(newFile.contents);
          path.extname(newFile.path).should.equal('.html');
          /<\?php/.test(newFile.contents).should.equal(false);
        })
        .on('error', err => {
          assert.fail(null, err, 'Should not emit an error');
          done();
        })
        .on('end', done);
    });

    it('should use correct PHP environment variables', done => {
      const results = {
        DOCUMENT_ROOT: path.resolve('test'),
        PHP_SELF: '/fixtures/env/PHP_SELF.php',
        REQUEST_URI: '/fixtures/env/REQUEST_URI.php',
        SCRIPT_NAME: '/fixtures/env/SCRIPT_NAME.php',
        SCRIPT_FILENAME: path.resolve('test/fixtures/env/SCRIPT_FILENAME.php'),
        SERVER_NAME: 'mydomain.com'
      };

      function assertResult(file) {
        const index = path.basename(file.path, '.html');
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
        .on('error', err => {
          assert.fail(null, err, 'Should not emit an error');
          done();
        })
        .on('data', file => {
          path.extname(file.path).should.equal('.html');
        })
        .on('end', done);
    });

    it('should throw an error', done => {
      getVinyl('test.txt')
        .pipe(php2html())
        .on('data', newFile => {
          should.not.exist(newFile);
          done();
        })
        .on('error', err => {
          should.exist(err);
          done();
        });
    });

    it('should respect haltOnError option', done => {
      getVinyl('test.txt', 'index.php')
        .pipe(php2html({haltOnError: false}))
        .on('data', newFile => {
          should.exist(newFile);
        })
        .on('error', err => {
          should.not.exist(err);
        })
        .on('end', done);
    });

    it('should process relative links to php files and change them to html', done => {
      /* eslint-disable max-nested-callbacks */
      getVinyl('index.php')
        .pipe(php2html())
        .on('data', newFile => {
          should.exist(newFile);
          should.exist(newFile.path);
          should.exist(newFile.relative);
          should.exist(newFile.contents);
          path.extname(newFile.path).should.equal('.html');
          const content = newFile.contents.toString();
          [
            '<a href="info.html">info.php</a>',
            '<a href="http://info.php">http://info.php</a>',
            '<a href="info.html?test=1">info.php</a>',
            '<img src="getmyimg.php?test=2"/>',
            'info.html',
            'http://info.php',
            'info.html?test=1',
            'getmyimg.php?test=2'
          ].forEach(link => {
            content.indexOf(link).should.not.equal(-1);
          });
        })
        .on('error', err => {
          assert.fail(null, err, 'Should not emit an error');
          done();
        })
        .on('end', done);
      /* eslint-enable max-nested-callbacks */
    });

    it('should not process relative links to php files and change them to html', done => {
      /* eslint-disable max-nested-callbacks */
      getVinyl('index.php')
        .pipe(php2html({processLinks: false}))
        .on('data', newFile => {
          should.exist(newFile);
          should.exist(newFile.path);
          should.exist(newFile.relative);
          should.exist(newFile.contents);
          path.extname(newFile.path).should.equal('.html');
          const content = newFile.contents.toString();
          [
            '<a href="info.php">info.php</a>',
            '<a href="http://info.php">http://info.php</a>',
            '<a href="info.php?test=1">info.php</a>',
            '<img src="getmyimg.php?test=2"/>',
            'info.php',
            'http://info.php',
            'info.php?test=1',
            'getmyimg.php?test=2'
          ].forEach(link => {
            content.indexOf(link).should.not.equal(-1);
          });
        })
        .on('error', err => {
          assert.fail(null, err, 'Should not emit an error');
          done();
        })
        .on('end', done);
      /* eslint-enable max-nested-callbacks */
    });

    it('should output $_GET data passed to php2html', done => {
      const expected = read('expected/get.html').replace(/[\s\t\r\n]+/gm, '');
      getVinyl('get.php')
        .pipe(php2html({getData: {test: 42, arr: [1, 2, 3, 4], obj: {a: 1, b: 2, c: 3}}}))
        .on('data', newFile => {
          should.exist(newFile);
          should.exist(newFile.path);
          should.exist(newFile.relative);
          should.exist(newFile.contents);
          path.extname(newFile.path).should.equal('.html');
          /<\?php/.test(newFile.contents.toString('utf8')).should.equal(false);

          newFile.contents.toString('utf8').replace(/[\s\t\r\n]+/gm, '').should.equal(expected);
        })
        .on('error', err => {
          assert.fail(null, err, 'Should not emit an error');
          done();
        })
        .on('end', done);
    });

    it('should not throw an error', done => {
      php2html()
        .on('error', () => {
          should.fail('Should not throw an error');
        })
        .on('data', () => {
        })
        .on('end', done)
        .end();
    });
  });

  describe('router', () => {
    it('should be available', () => {
      const type = typeof php2html.routes;
      type.should.equal('function');
    });

    it('should return readable stream', () => {
      const routes = php2html.routes(['test']);
      const isStream = routes instanceof Stream;
      const isReadable = typeof routes._read === 'function' && typeof routes._readableState === 'object';

      isStream.should.equal(true);
      isReadable.should.equal(true);
      routes.readable.should.equal(true);
    });

    it('should create html from routes', done => {
      const routes = php2html.routes(['/myroute', '/another/route', '/route/with/extension.php']);
      const stream = php2html({
        router: 'test/fixtures/router.php',
        processLinks: false
      });
      let valid = 0;

      stream.on('error', err => {
        should.not.exist(err);
      });

      stream.on('data', newFile => {
        should.exist(newFile);
        should.exist(newFile.route);
        should.exist(newFile.path);
        should.exist(newFile.contents);
        path.extname(newFile.path).should.equal('.html');
        /<\?php/.test(newFile.contents).should.equal(false);
        newFile.contents.toString('utf-8').should.equal(newFile.route);
        ++valid;
      });

      stream.once('end', () => {
        valid.should.equal(3);
        done();
      });

      routes.pipe(stream);
    });

    it('should skip empty routes routes', done => {
      const routes = php2html.routes(['', '', '/valid']);
      const stream = php2html({
        router: 'test/fixtures/router.php',
        processLinks: false
      });
      let valid = 0;

      stream.on('error', err => {
        should.not.exist(err);
      });

      stream.on('data', newFile => {
        should.exist(newFile);
        should.exist(newFile.route);
        should.exist(newFile.path);
        should.exist(newFile.contents);
        path.extname(newFile.path).should.equal('.html');
        /<\?php/.test(newFile.contents).should.equal(false);
        newFile.contents.toString('utf-8').should.equal(newFile.route);
        ++valid;
      });

      stream.once('end', () => {
        valid.should.equal(1);
        done();
      });

      routes.pipe(stream);
    });

    it('should set filenames to index for routes ending with /', done => {
      const routes = php2html.routes(['/']);
      const stream = php2html({
        router: 'test/fixtures/router.php',
        processLinks: false
      });
      let valid = 0;

      stream.on('error', err => {
        should.not.exist(err);
      });

      stream.on('data', newFile => {
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

      stream.once('end', () => {
        valid.should.equal(1);
        done();
      });

      routes.pipe(stream);
    });
  });
});
