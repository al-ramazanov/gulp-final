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
const replace = require('gulp-replace')
const versionNumber = require('gulp-version-number')
const plumber = require('gulp-plumber')
const notify = require('gulp-notify')
const webpcss = require('gulp-webpcss');
const svgSprite = require('gulp-svg-sprite')

function browsersync() {
    browserSync.init({
        server: {
            baseDir: 'dist/',
            // index: 'about.html',
        },
        notify: false,
    });
}

function html() {
    return src('app/**.html')
        .pipe(plumber(
            notify.onError({
                title: "HTML",
                message: "Error: <%=error.message%>"
            })
        ))
        .pipe(include({
            prefix: '@@',
        }))
        .pipe(webpHtml())
        .pipe(replace(/@images\//g, 'images/'))
        .pipe(replace(/@js\//g, 'js/'))
        .pipe(versionNumber({
            'value': '%DT%',
            'append': {
                'key': '_v',
                'cover': 0,
                'to': [
                    'css',
                    'js',
                ]
            },
            'output': {
                'file': 'dist/gulpV/version.json'
            }
        })
        )
        .pipe(dest('dist'))
}

function cleanDist() {
    return del('dist')
}

function styles() {
    return src('app/scss/style.scss', { sourcemaps: true })
        .pipe(plumber(
            notify.onError({
                title: "SCSS",
                message: "Error: <%=error.message%>"
            })
        ))
        .pipe(scss())
        .pipe(autoprefixer({
            overrideBrowserslist: ['last 3 version'],
            grid: true
        }))
        .pipe(replace(/@images\//g, '../images/'))
        .pipe(groupMedia())
        .pipe(webpcss(
            {
                webpClass: ".webp",
                noWebpClass: ".no-webp"
            }
        ))
        .pipe(dest('app/css'))
        .pipe(scss({ outputStyle: 'compressed' }))
        .pipe(concat('style.min.css'))
        .pipe(dest('dist/css'))
        .pipe(browserSync.stream())
}

function scripts() {
    return src('app/js/**.js', { sourcemaps: true })
        .pipe(plumber(
            notify.onError({
                title: "JavaScript",
                message: "Error: <%=error.message%>"
            })
        ))
        .pipe(dest('dist/js'))
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
        .on('change', browserSync.reload)
}

function media() {
    return src('app/css/style.css')
        .pipe(plumber(
            notify.onError({
                title: "Media",
                message: "Error: <%=error.message%>"
            })
        ))
        .pipe(groupMedia())
}

function images() {
    return src(['app/images/**/*.*', '!app/images/**/*.svg'])
        .pipe(plumber(
            notify.onError({
                title: "images",
                message: "Error: <%=error.message%>"
            })
        ))
        .pipe(newer('dist/images'))
        .pipe(webp())
        .pipe(dest('dist/images'))
        .pipe(src(['app/images/**/*', '!app/images/**/*.svg']))
        .pipe(newer('dist/images'))
        .pipe(imagemin(
            [
                imagemin.gifsicle({ interlaced: true }),
                imagemin.mozjpeg({ quality: 90, progressive: true }),
                imagemin.optipng({ optimizationLevel: 3 }),
                imagemin.svgo({
                    plugins: [
                        { removeViewBox: true },
                        { cleanupIDs: false }
                    ]
                })
            ]
        ))
        .pipe(dest('dist/images'))
        .pipe(src('app/images/**/*.svg'))
        .pipe(dest('dist/images'))
        .pipe(browserSync.stream())
}

function fonts() {
    return src('app/fonts/*.otf')
        .pipe(plumber(
            notify.onError({
                title: "Fonts",
                message: "Error: <%=error.message%>"
            })
        ))
        .pipe(fonter({
            formats: ['woff']
        }))
        .pipe(dest('app/fonts'))

}

function svgsprite() {
    return src('app/svgicons/*.svg')
        .pipe(plumber(
            notify.onError({
                title: "SVG",
                message: "Error: <%=error.message%>"
            })
        ))
        .pipe(svgSprite(
            {
                mode: {
                    stack: {
                        sprite: '../icons/icons.svg',
                        example: true
                    }
                }
            }
        ))
        .pipe(dest('dist/images'))
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
exports.svgsprite = svgsprite;

/* 
exports.build = series(cleanDist, images, build);
exports.default = parallel(styles, scripts, html, browsersync); 
*/

exports.default = parallel(series(cleanDist, html, styles, scripts, images, browsersync), watching);
