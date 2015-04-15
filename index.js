'use strict';
var es = require('event-stream');
var _ = require('lodash');
var async = require('async');
var php2html = require('php2html');
var gutil = require('gulp-util');
var path = require('path');
var File = require('vinyl');
var streamify = require('stream-array');

var php2htmlPlugin = function(options){

    options = _.assign({
        processLinks: true,
        getData: {},
        verbose: false
    },options || {});

    var stream,
        files = [];

    /**
     * Queue file or route send over stream
     * @param file
     */
    function queue(file) {
		if (options.verbose) {
			gutil.log('Queueing ' + gutil.colors.green(file.route || file.path));
		}
		// file may be just a route, no file
		if (!options.router && file.isNull()) {
			stream.emit('data', file);
		} else {
			files.push(file);
		}
    }

	/**
	 * get Docroot from
	 *  a) options or
	 *  b) filelist or
	 *  c) process.cwd
	 */
	function computeDocroot(){
		var dir =  options.baseDir || options.docroot || files.reduce(function(prev, cur){
				return prev.cwd === cur.cwd ? cur : {cwd: undefined};
			}).cwd || process.cwd();

		return path.resolve(dir);
	}

    /**
     * Call server on stream end
     */
    function convert(){
        // ensure we got the stream
        if (!stream) {
            throw  new gutil.PluginError('gulp-php2html', 'lost stream!');
        }

        // check if we have files to compile
        if (!files.length) {
            stream.emit('end');
            return;
        }

		options.baseDir = computeDocroot();

		async.each(files, function(file, callback) {
			if (!options.router && file.isNull()) {
				return callback();
			}

			if (file.isStream()) {
				callback('Streaming not supported');
				return this.emit('error', new gutil.PluginError('critical', 'Streaming not supported'));

			}

			if (options.verbose) {
				gutil.log('Processing ' + gutil.colors.green(file.path));
			}

			php2html(file.route || file.path, options, function(error, data){
				// request failed
				if (error) {
					stream.emit('error', new gutil.PluginError('gulp-php2html', error));
					return callback(error);
				}

				// 204 No Content
				if (!data) {
					stream.emit('error', new gutil.PluginError('gulp-php2html', '204 - No Content'));
					callback('204 - No Content');

				// everything went right
				} else {

					file.path = gutil.replaceExtension(file.path, '.' + 'html');
					file.contents = new Buffer(data);
					stream.emit('data', file);
					callback();
				}

			});
		}, function() {
			stream.emit('end');
		});
    }

    stream = es.through(queue, convert);

    return stream;
};


php2htmlPlugin.routes = function(routes) {
	return streamify(_.map(routes,function(route) {
		var file = new File({
			cwd: process.cwd(),
			path: path.join(process.cwd(), route)
		});

		file.route = route;

		return file;
	}));
};

module.exports = php2htmlPlugin;
