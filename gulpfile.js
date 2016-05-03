"use strict";

var gulp = require('gulp');
var gulpif = require('gulp-if');
var browserify = require('browserify');
var watchify = require('watchify');
var argv = require('yargs').argv;
var gutil = require('gulp-util');
var less = require('gulp-less');
var plumber = require('gulp-plumber');
var sourcemaps = require('gulp-sourcemaps');
var autoprefixer = require('gulp-autoprefixer');
var exorcist   = require('exorcist');
var source = require('vinyl-source-stream');


var isProduction = !!argv.production;

var paths = {
	src : {
		base   		: './',
		script 		: './scripts',
		lib    		: './scripts/lib',
		styles 		: './styles'
	},
	target : {
		base   		: './dist',
		script 		: './dist/scripts',
		lib    		: './dist/scripts/lib',
		styles 		: './dist/styles'
	}
};

gulp.task('less', function() {
	return gulp.src(paths.src.styles + '/less/**/*.less')
		.pipe(plumber())
		.pipe(gulp.dest(paths.target.styles))
		.pipe(sourcemaps.init())
		.pipe(less())
		.pipe(autoprefixer())
		.pipe(sourcemaps.write())
		.pipe(gulp.dest(paths.target.styles));
});

gulp.task('watch-less', ['less'], function() {
	return gulp.watch(paths.src.styles + '/**/*.less', ['less']);
});

gulp.task('browserify', function() {
	return processScripts(false, 'app.js', 'app-bundle.js');
});

gulp.task('watchify', ['browserify'], function() {
	return processScripts(true, 'app.js', 'app-bundle.js');
});

gulp.task('build', ['less', 'browserify']);

gulp.task('watch', ['build', 'watch-less', 'watchify']);

gulp.task('default', ['build']);


function processScripts(watch, mainScript, targetFilename) {
	var mapfile = path.join(paths.target.script, targetFilename + '.map');

	var bundler = new browserify(path.resolve(path.join(paths.src.script, mainScript)), {
		debug: true,
		basedir: __dirname,
		cache: {}, // required for watchify
		packageCache: {}, // required for watchify
		fullPaths: watch // required to be true only for watchify
	});

	var rebundle = function() {
		if (isProduction) {
			bundler
				.transform({
					global: true,
					ext: '.js'
				}, 'uglifyify')
		}

		return bundler.bundle()
			.pipe(gulpif(isProduction, exorcist(mapfile)))
			.pipe(source(targetFilename))
			.pipe(gulp.dest(paths.target.script));
	};

	if (watch)
		bundler = watchify(bundler);

	bundler
		.on('error', function(err) {
			gutil.log(gutil.colors.red(err));
			this.emit('end');
		});

	bundler
		.on('update', rebundle);

	return rebundle();
}
