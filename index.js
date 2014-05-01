var es = require('event-stream'),
    path = require('path'),
    http = require('http'),
    Q = require('q'),
    _ = require('lodash'),
    gutil = require('gulp-util'),
    qs = require('qs'),
    request = require('request'),
    gateway = require('gateway'),
    win32 = process.platform === 'win32';

module.exports = function(options){
    'use strict';

    options = _.assign({
        port: 8888,
        processLinks: true,
        getData: {}
    },options || {});

    var port = options.port,
        host = '127.0.0.1',
        server,
        stream,
        files = [];

    /**
     * Queue file send over stream
     * @param file
     */
    function queue(file){
        if (file) {
            files.push(file);
        } else {
            stream.emit('error', new gutil.PluginError('gulp-php2html', 'got undefined file'));
        }
    }

    /**
     * get Docroot from
     *  a) options or
     *  b) filelist or
     *  c) process.cwd
     */
    function computeDocroot(){
        var dir =  options.docroot || files.reduce(function(prev, cur){
                return prev.cwd === cur.cwd ? cur : {cwd: undefined};
            }).cwd || process.cwd;

        return path.resolve(dir);
    }

    /**
     * Compute URI for gateway relative to docroot
     * @param {string} docroot
     * @param {sting} file
     * @returns {string}
     */
    var computeUri = function(docroot, file){
        var uri, filepath = file.path;


        // If file ends with a slash apend index file
        if (file.isDirectory()) {
            filepath = path.join(filepath, 'index.php');
        }

        // absolutize
        filepath = path.resolve(filepath);


        if (win32) {
            // use the correct slashes for uri
            uri = filepath.replace(docroot, '').replace(/[\\]/g, '/');
        } else {
            uri = filepath.replace(docroot, '');
        }

        // ensure that we have an absolute url
        if (uri.substr(0, 1) !== '/') {
            uri = '/' + uri;
        }

        return uri;
    };

    /**
     * Start server to do the compiling for us
     */
    function startServer(){
        var docroot = computeDocroot(),
            deferred = Q.defer();

        // create middleware
        var middleware = gateway(docroot, {
            '.php': 'php-cgi'
        });

        server = http.createServer(function(req, res){
            // Pass the request to gateway middleware
            middleware(req, res, function(err){
                res.writeHead(204, err);
                res.end();
            });
        }).listen(port, function(){
            deferred.resolve(docroot);
        });

        return deferred.promise;
    }


    /**
     * Call server on stream end
     */
    function php2html(){

        // ensure we got the stream
        if (!stream) {
            throw  new gutil.PluginError('gulp-php2html', 'lost stream!');
        }

        // check if we have files to compile
        if (!files.length) {
            stream.emit('error', new gutil.PluginError('gulp-php2html', 'missing files to convert'));
        }

        var promise = startServer();



        // make sequential requests
        files.forEach(function(file){
            promise = promise.then(function(docroot){
                var deferred = Q.defer(),
                    uri = computeUri(docroot, file),
                    url = 'http://' + host + ':' + port + uri;

                // $_GET data
                if (typeof options.getData !== 'undefined') {
                    url += '?' + qs.stringify(options.getData);
                }


                gutil.log('Processing ' + gutil.colors.green(file.path));

                request(url,function(error, response, body){

                    // request failed
                    if (error) {
                        stream.emit('error', new gutil.PluginError('gulp-php2html', error));
                    }

                    // 204 No Content
                    if (!body) {
                        stream.emit('error', new gutil.PluginError('gulp-php2html', '204 - No Content'));

                    // everything went right
                    } else {

                        // replace relative php links with corresponding html link
                        if (body && options.processLinks) {

                            _.forEach(body.match(/href=['"]([^'"]+\.php(?:\?[^'"]*)?)['"]/gm),function(link){
                                if (link.match(/:\/\//)) {
                                    return;
                                }
                                var hlink = link.replace(/(\w)\.php([^\w])/g,'$1.html$2');

                                body = body.replace(link,hlink);
                            });
                        }

                        file.path = gutil.replaceExtension(file.path, '.' + 'html');
                        file.contents = new Buffer(body);
                        stream.emit('data', file);
                    }

                    // finally resolve promise
                    deferred.resolve(docroot);
                }).end();

                return deferred.promise;
            });
        });

        // shut down server
        promise.then(function(){
            var deferred = Q.defer();

            server.close(function(){
                deferred.resolve();
            });

            return deferred.promise;

        // and finaly end the stream
        }).then(function(){
            stream.emit('end');
        }).done();
    }


    stream = es.through(queue, php2html);

    return stream;
};
