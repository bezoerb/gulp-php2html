var es = require("event-stream"),
    path = require('path'),
    http = require('http'),
    Q = require('q'),
    gutil = require('gulp-util'),
    request = require('request'),
    gateway = require('gateway'),
    win32 = process.platform === 'win32';

module.exports = function (options) {
	"use strict";

    options = options || {};

    var port = 8000,
        host = 'localhost';




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
        var defered_server = Q.defer(),
            docroot = path.resolve(options.docroot || file.cwd || process.cwd()),
            uri = computeUri(docroot,file),
            server,middleware;

        // create middleware
        middleware = gateway(docroot, {
            '.php': 'php-cgi'
        });

        // start server with php middleware
        server = (server || http.createServer(function (req, res) {
            // Pass the request to gateway middleware
            middleware(req, res, function (err) {
                res.writeHead(204, err);
                res.end();
            });
        })).listen(++port,function(){
            defered_server.resolve();
        });

        // Server is ready, start request
        defered_server.promise.then(
            function(){
                var data = Q.defer();

                // Use server with gateway middleware to generate html for the given source
                request('http://' + host + ':' + port + uri, function (error, response, body) {
                    if (error) {
                        data.reject(new gutil.PluginError('gulp-php2html', error));
                    } if (!body) {
                        data.reject(new gutil.PluginError('gulp-php2html', 'empty body'),null);
                    } else {
                        file.path = gutil.replaceExtension(file.path, '.' + 'html');
                        file.contents = new Buffer(body);
                        data.resolve(file);
                    }
                }).end();

                return data.promise;
            }
        // got data -> shut down server
        ).then(
            // success
            function(data){
                var shutdown = Q.defer();
                server.close(function(){
                    shutdown.resolve(data);
                });
                return shutdown.promise;

            },
            // error thrown
            function(error){
                var shutdown = Q.defer();
                server.close(function(){
                    shutdown.reject(error);
                });
                return shutdown.promise;
            }

        // all done, send callback
        ).then(
            // success
            function(data){
                callback(null,data);
            },
            // error
            function(error){
                callback(error,null);
            }
        );
	}

	return es.map(php2html);
};
