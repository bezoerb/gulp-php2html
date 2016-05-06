'use strict';
var path = require('path');
var _ = require('lodash');
var php2html = require('php2html').default;
var File = require('vinyl');
var streamify = require('stream-array');
var through2 = require('through2');
var debug = require('debug')('php2html:gulp');
var PluginError = require('gulp-util').PluginError;
var replaceExtension = require('gulp-util').replaceExtension;

var php2htmlPlugin = function (options) {
    options = _.assign({
        processLinks: true,
        getData: {},
        verbose: false,
        haltOnError: true
    }, options || {});

    return through2.obj(function (file, enc, cb) {
        if (file.isNull() && !file.route) {
            return cb(null, file);
        }

        if (file.isStream()) {
            return this.emit('error', new PluginError('critical', 'Streaming not supported'));
        }

        var base = options.baseDir || options.docroot || file.cwd || process.cwd();
        var opts = _.assign(options, {baseDir: path.resolve(base)});

        php2html(file.route || file.path, opts, function (err, data) {
            // request failed
            if (err && options.haltOnError) {
                return cb(new PluginError('gulp-php2html', '(' + (file.route || path.basename(file.path)) + ') ' + (err.message || err)));
            }

            // 204 No Content
            if (!data && options.haltOnError) {
                return cb(new PluginError('gulp-php2html', '(' + (file.route || path.basename(file.path)) + ') 204 - No Content'));
            }

            // everything went right
            file.path = replaceExtension(file.path, '.html');
            file.contents = new Buffer(data || '');

            debug(path.basename(file.path), file.contents.toString('utf8').length, 'bytes');
            return cb(null, file);
        });
    });
};

php2htmlPlugin.routes = function (routes) {
    var vinyls = _.chain(routes)
        .reject(function (route) {
            return !_.isString(route) || !route;
        }).map(function (route) {
            var isDir = /\/$/.test(route);
            var uri = isDir ? route + 'index.php' : route;
            var file = new File({
                cwd: process.cwd(),
                path: path.join(process.cwd(), uri)
            });
            file.route = route;

            return file;
        }).value();

    return streamify(vinyls);
};

module.exports = php2htmlPlugin;
