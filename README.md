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

To make this work you need the `php-cgi` binaray in your PATH.

### Installing php-cgi

##### OSX

The `php-cgi` binary can be installed via Homebrew by tapping the
[homebrew-php](https://github.com/josegonzalez/homebrew-php) repository:

```shell
brew tap homebrew/dupes
brew tap josegonzalez/homebrew-php
brew install php54
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

#### options.docroot
Type: `String`
Default: process.cwd()

Customize docroot for php files

#### options.port
Type: `Int`
Default value: `8888`

Specify a port for the php Server.

#### options.processLinks
Type: `Boolean`
Default value: `true`

Convert links pointing to `.php` pages to the `.html` equivalent.

#### options.getData
Type: `Object`
Default value: `{}`

Pass data to php file using $_GET.

#### options.verbose
Type: `Boolean`
Default value: `false`

Print debug output to the console


## License

[MIT License](http://bezoerb.mit-license.org)

[npm-url]: https://npmjs.org/package/gulp-php2html
[npm-image]: https://badge.fury.io/js/gulp-php2html.png

[travis-url]: http://travis-ci.org/bezoerb/gulp-php2html
[travis-image]: https://secure.travis-ci.org/bezoerb/gulp-php2html.png?branch=master

[depstat-url]: https://david-dm.org/bezoerb/gulp-php2html
[depstat-image]: https://david-dm.org/bezoerb/gulp-php2html.png
