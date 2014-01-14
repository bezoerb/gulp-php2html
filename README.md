(PLUGIN AUTHOR: Please read [Plugin README conventions](https://github.com/wearefractal/gulp/wiki/Plugin-README-Conventions), then delete this line)

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

gulp.src("./src/*.ext")
	.pipe(php2html({
		msg: "Hello Gulp!"
	}))
	.pipe(gulp.dest("./dist"));
```

## API

### php2html(options)

#### options.msg
Type: `String`  
Default: `Hello World`

The message you wish to attach to file.


## License

[MIT License](http://en.wikipedia.org/wiki/MIT_License)

[npm-url]: https://npmjs.org/package/gulp-php2html
[npm-image]: https://badge.fury.io/js/gulp-php2html.png

[travis-url]: http://travis-ci.org/bezoerb/gulp-php2html
[travis-image]: https://secure.travis-ci.org/bezoerb/gulp-php2html.png?branch=master

[depstat-url]: https://david-dm.org/bezoerb/gulp-php2html
[depstat-image]: https://david-dm.org/bezoerb/gulp-php2html.png
