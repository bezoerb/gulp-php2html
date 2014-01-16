var es = require("event-stream"),
    path = require('path'),
    http = require('http'),
    gutil = require('gulp-util'),
    request = require('request'),
    gateway = require('gateway'),
    win32 = process.platform === 'win32',
    server,middleware;

module.exports = function (options) {
	"use strict";

    options = options || {};

    var port = options.port || 8888;

    /**
     * Use server with gateway middleware to generate html for the given source
     * @param {string} uri
     * @param {function} callback
     */
    var compilePhp = function (uri, callback) {
        request('http://localhost:' + port + uri, callback).end();
    };



    /**
     * Compute URI for gateway relative to docroot
     * @param {string} docroot
     * @param {sting} file
     * @returns {string}
     */
    var computeUri = function(docroot,file) {
        var uri,
            filepath = file.path;


        // If file ends with a slash apend index file
        if (file.isDirectory()) {
            filepath = path.join(filepath,'index.php');
        }

        // absolutize
        filepath = path.resolve(filepath);


        if (win32) {
            // use the correct slashes for uri
            uri = filepath.replace(docroot,'').replace(/[\\]/g,'/');
        } else {
            uri = filepath.replace(docroot,'');
        }

        // ensure that we have an absolute url
        if (uri.substr(0,1) !== '/') {
            uri = '/'+uri;
        }

        return uri;
    };


    // see "Writing a plugin"
	// https://github.com/wearefractal/gulp/wiki/Writing-a-gulp-plugin
	function php2html(file, callback) {
        var docroot = path.resolve(options.docroot || file.cwd || process.cwd()),
            uri = computeUri(docroot,file);


        // create middleware
        middleware = gateway(docroot, {
            '.php': 'php-cgi'
        });

        // start server with php middleware
        server = server || http.createServer(function (req, res) {
            // Pass the request to gateway middleware
            middleware(req, res, function (err) {
                res.writeHead(204, err);
                res.end();
            });
        }).listen(port);


        // Create HTML
        compilePhp(uri, function (error, response, body) {
            if (error) {
                callback(new gutil.PluginError('gulp-php2html', error),null);
            } if (!body) {
                callback(new gutil.PluginError('gulp-php2html', 'empty body'),null);
            } else {
                file.path = gutil.replaceExtension(file.path, '.' + 'html');
                file.contents = new Buffer(body);
                callback(null,file);
            }
        });
	}

	return es.map(php2html);
};
