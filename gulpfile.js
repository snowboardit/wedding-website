"use strict";

var gulp = require("gulp");
var sass = require("gulp-sass")(require("sass"));
var uglify = require("gulp-uglify");
var rename = require("gulp-rename");

// compile scss to css
const sassFiles = ["./sass/styles.scss", "./sass/normalize.scss"];
gulp.task("sass", function () {
  return gulp
    .src(sassFiles)
    .pipe(sass({ outputStyle: "compressed" }).on("error", sass.logError))
    .pipe(
      rename({
        suffix: ".min",
        extname: ".css",
      })
    )
    .pipe(gulp.dest("./css"));
});

// watch changes in scss files and run sass task
gulp.task("sass:watch", function () {
  return gulp.watch(sassFiles, gulp.series("sass"));
});

// minify js
const jsFiles = ["./js/scripts.js"];
gulp.task("minify-js", function () {
  return gulp
    .src(jsFiles)
    .pipe(uglify())
    .pipe(rename({ suffix: ".min", extname: ".js" }))
    .pipe(gulp.dest("./js"));
});

// minify service worker - must be located at the top level, hence a separate task
gulp.task("service-worker-js", function () {
  return gulp
    .src("./js/service-worker.js")
    .pipe(uglify())
    .pipe(rename({ suffix: ".min", extname: ".js" }))
    .pipe(gulp.dest("./"));
});

// default task
gulp.task("default", gulp.series("sass", "minify-js", "service-worker-js"));
