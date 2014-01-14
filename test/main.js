/*global describe, it*/
"use strict";

var fs = require("fs"),
	es = require("event-stream"),
	should = require("should");
require("mocha");

var gutil = require("gulp-util"),
	php2html = require("../");

describe("gulp-php2html", function () {



	it("create valid html", function (done) {

		var srcFile = new gutil.File({
			path: "test/fixtures/index.php",
			cwd: "test/",
			base: "test/fixtures"
		});

		var stream = php2html("World");

		stream.on("error", function(err) {
			should.not.exist(err);
		});

		stream.on("data", function (newFile) {
            gutil.log(newFile);
            done();
		});

        stream.on('end',function(){
        })

		stream.write(srcFile);
		stream.end();
	});



	/*
	it("should produce expected file via stream", function (done) {

		var srcFile = new gutil.File({
			path: "test/fixtures/hello.txt",
			cwd: "test/",
			base: "test/fixtures",
			contents: fs.createReadStream("test/fixtures/hello.txt")
		});

		var stream = php2html("World");

		stream.on("error", function(err) {
			should.exist(err);
			done();
		});

		stream.on("data", function (newFile) {

			should.exist(newFile);
			should.exist(newFile.contents);

			newFile.contents.pipe(es.wait(function(err, data) {
				should.not.exist(err);
				data.should.equal(String(expectedFile.contents));
				done();
			}));
		});

		stream.write(srcFile);
		stream.end();
	});
	*/
});
