var gulp         = require('gulp');
var sass         = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var babel        = require('gulp-babel');
var browserSync  = require('browser-sync');
var nodemon      = require('gulp-nodemon');
var reload       = browserSync.reload;
var eslint       = require('gulp-eslint');
var concat       = require('gulp-concat');
var uglify       = require('gulp-uglify');
var minifyCss    = require('gulp-minify-css');
var rename       = require('gulp-rename');

gulp.task('js', function() {
  return gulp.src(['client/vendor/*.js', 'client/*.js.es6'])
    .pipe(concat('client/dist/app.js'))
    .pipe(babel({ blacklist: ['useStrict'] }))
    .pipe(gulp.dest('.'));
});

gulp.task('scss', function () {
  return gulp.src('client/*.scss')
    .pipe(sass())
    .pipe(autoprefixer())
    .pipe(gulp.dest('client/dist/'));
});

gulp.task('js-dist', ['js'] ,function () {
  return gulp.src('client/dist/app.js')
    .pipe(uglify())
    .pipe(rename({ extname: '.min.js' }))
    .pipe(gulp.dest('client/dist/'));
});

gulp.task('css-dist', ['scss'] ,function () {
  return gulp.src('client/dist/app.css')
    .pipe(minifyCss())
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest('client/dist/'));
});

gulp.task('lint', function () {
  return gulp.src('client/*.js.es6')
    .pipe(eslint())
    .pipe(eslint.format());
});

gulp.task('server', function (cb) {
  var started = false;
  return nodemon({
    script: 'server.js'
  }).on('start', function () {
    if (!started) {
      cb();
      started = true;
    }
  }).on('restart', function () {
    setTimeout(function () {
      reload({ stream: false });
    }, 1000);
  });
});

gulp.task('dev', ['server'], function() {
  browserSync({
    proxy: 'http://localhost:8000',
    files: ['client/*.*'],
    browser: 'google chrome',
    port: 3000
  });
  gulp.watch('client/*.scss', ['scss']);
  gulp.watch('client/*.js.es6', ['js']);
});


gulp.task('dist', ['js-dist', 'css-dist']);