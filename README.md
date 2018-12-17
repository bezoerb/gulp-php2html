# gulp-php2html [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][depstat-image]][depstat-url]

> php2html plugin for [gulp](https://github.com/wearefractal/gulp)

## Usage

First, install `gulp-php2html` as a development dependency:

```shell
npm install --save-dev gulp-php2html
```

Then, add it to your `gulpfile.js`:

```javascript
var php2html = require("gulp-php2html");

gulp.src("./src/*.php")
	.pipe(php2html())
	.pipe(gulp.dest("./dist"));
```

### With router

```javascript
var php2html = require("gulp-php2html");

php2html.routes(['/my/route','/will/be/processed','/by/router.php'])
	.pipe(php2html({router: 'router.php'}))
	.pipe(gulp.dest("./dist"));
```

To make this work you need the `php-cgi` binaray in your PATH.

### Installing php-cgi

##### OSX

The `php-cgi` binary can be installed via Homebrew by tapping the
[homebrew-php](https://github.com/Homebrew/homebrew-php) repository:

```shell
brew tap homebrew/dupes
brew tap homebrew/versions
brew tap homebrew/homebrew-php
brew install php56
```

##### Windows

The `php-cgi` binary can be installed via [XAMPP](http://www.apachefriends.org/de/xampp-windows.html).
Here is how you can add the binary to your PATH: [Link](https://www.monosnap.com/image/psLZ5fpwuSsvJJeZPdklEjxMr)

##### Ubuntu

```shell
sudo apt-get install php5-cgi
```


## API

### php2html(options)

#### options.verbose
Type: `Boolean`
Default value: `false`

Print debug output to the console

#### options.haltOnError
Type: `Boolean`
Default value: `true`

Set to `false` to write dest html files on error. Usefull for debugging.

See [php2html](https://github.com/bezoerb/php2html#options) for a full list of options.

## License

[MIT License](http://bezoerb.mit-license.org)

[npm-url]: https://npmjs.org/package/gulp-php2html
[npm-image]: https://badge.fury.io/js/gulp-php2html.svg

[travis-url]: http://travis-ci.org/bezoerb/gulp-php2html
[travis-image]: https://secure.travis-ci.org/bezoerb/gulp-php2html.svg?branch=master

[depstat-url]: https://david-dm.org/bezoerb/gulp-php2html
[depstat-image]: https://david-dm.org/bezoerb/gulp-php2html.svg
