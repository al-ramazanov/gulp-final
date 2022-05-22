const { src, dest, watch, parallel, series } = require('gulp');
const scss = require('gulp-sass')(require('sass'));
const concat = require('gulp-concat');
const browserSync = require('browser-sync').create();
const uglify = require('gulp-uglify-es').default;
const autoprefixer = require('gulp-autoprefixer');
const imagemin = require('gulp-imagemin');
const include = require('gulp-file-include');
const del = require('del');
const groupMedia = require('gulp-group-css-media-queries')
const fonter = require('gulp-fonter-unx')
const newer = require('gulp-newer')
const webp = require('gulp-webp')
const webpHtml = require('gulp-webp-html-nosvg')

function browsersync() {
    browserSync.init({
        server: {
            baseDir: 'dist/'
        }
    });
}

function html() {
    return src('app/**.html')
        .pipe(include({
            prefix: '@@',
        }))
        .pipe(webpHtml())
        .pipe(dest('dist'))
}

function cleanDist() {
    return del('dist')
}

function styles() {
    return src('app/scss/style.scss')
        .pipe(scss())
        .pipe(autoprefixer({
            overrideBrowserslist: ['last 10 version'],
            grid: true
        }))
        .pipe(groupMedia())
        .pipe(scss({ outputStyle: 'compressed' }))
        .pipe(concat('style.min.css'))
        .pipe(dest('dist/css'))
        .pipe(browserSync.stream())
}

function scripts() {
    return src([
        'app/**/**.js'
    ])
        .pipe(concat('script.min.js'))
        .pipe(uglify())
        .pipe(dest('dist/js'))
        .pipe(browserSync.stream())
}

function watching() {
    watch(['app/scss/**/*.scss'], styles)
    watch(['app/js/**/*.js', '!app/js/main.min.js'], scripts)
    watch(['app/images/**/*.*'], images)
    watch(['app/**/*.html'], html)
        .on('change', browserSync.reload,)
}

function media() {
    return src('app/css/style.css')
        .pipe(groupMedia())
}

function images() {
    return src('app/images/**/*')
        .pipe(newer('dist/images'))
        // .pipe(imagemin(
        //     [
        //         imagemin.gifsicle({ interlaced: true }),
        //         imagemin.mozjpeg({ quality: 90, progressive: true }),
        //         imagemin.optipng({ optimizationLevel: 4 }),
        //         imagemin.svgo({
        //             plugins: [
        //                 { removeViewBox: true },
        //                 { cleanupIDs: false }
        //             ]
        //         })
        //     ]
        // ))
        .pipe(dest('dist/images'))
        .pipe(webp())
        .pipe(dest('dist/images'))


}

function fonts() {
    return src('app/fonts/*.otf')
        .pipe(fonter({
            formats: ['woff']
        }))
        .pipe(dest('app/fonts'))

}

exports.watching = watching;
exports.html = html;
exports.cleanDist = cleanDist;
exports.styles = styles;
exports.scripts = scripts;
exports.media = media;
exports.browsersync = browsersync;
exports.images = images;
exports.fonts = fonts;


/* 
exports.build = series(cleanDist, images, build);
exports.default = parallel(styles, scripts, html, browsersync); 
*/

exports.default = parallel(series(cleanDist, html, styles, scripts, images, browsersync), watching);
