'use strict';
const path = require('path');
const _ = require('lodash');
const php2html = require('php2html');
const File = require('vinyl');
const streamify = require('stream-array');
const through2 = require('through2');
const debug = require('debug')('php2html:gulp');
const PluginError = require('plugin-error');
const replaceExtension = require('replace-ext');

const php2htmlPlugin = function (options) {
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

    const base = options.baseDir || options.docroot || file.cwd || process.cwd();
    const options_ = _.assign(options, {baseDir: path.resolve(base)});

    php2html(file.route || file.path, options_, (err, data) => {
      // Request failed
      if (err && options.haltOnError) {
        return cb(new PluginError('gulp-php2html', '(' + (file.route || path.basename(file.path)) + ') ' + (err.message || err)));
      }

      // 204 No Content
      if (!data && options.haltOnError) {
        return cb(new PluginError('gulp-php2html', '(' + (file.route || path.basename(file.path)) + ') 204 - No Content'));
      }

      // Everything went right
      file.path = replaceExtension(file.path, '.html');
      file.contents = Buffer.from(data || '');

      debug(path.basename(file.path), file.contents.toString('utf8').length, 'bytes');
      return cb(null, file);
    });
  });
};

php2htmlPlugin.routes = function (routes) {
  const vinyls = _.chain(routes)
    .reject(route => {
      return !_.isString(route) || !route;
    }).map(route => {
      const isDir = /\/$/.test(route);
      const uri = isDir ? route + 'index.php' : route;
      const file = new File({
        cwd: process.cwd(),
        path: path.join(process.cwd(), uri)
      });
      file.route = route;

      return file;
    }).value();

  return streamify(vinyls);
};

module.exports = php2htmlPlugin;
