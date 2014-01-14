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

    /**
     * Use server with gateway middleware to generate html for the given source
     * @param {string} uri
     * @param {function} callback
     */
    var compilePhp = function (uri, callback) {
        server.listen(8888);
        request('http://localhost:8888' + uri, function (error, response, body) {
            server.close();
            callback(body,error);
        }).end();
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


        // start server
        middleware = gateway(docroot, {
            '.php': 'php-cgi'
        });

        // start server with php middleware
        server = http.createServer(function (req, res) {
            // Pass the request to gateway middleware
            middleware(req, res, function (err) {
                res.writeHead(204, err);
                res.end();
            });
        });

        compilePhp(uri, function (response, err) {
            gutil.log(response,err);
            if (response) {
                file.path = gutil.replaceExtension(file.path, '.' + 'html');
                file.contents = new Buffer(response);
                callback(null,file);
            } else if (err) {
                callback(new Error(err),null);
            }

        });


       // return deferred.promise;
	}

	return es.map(php2html);
};
