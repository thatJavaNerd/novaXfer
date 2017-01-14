module.exports = function(grunt) {
    let finalDist = 'app/server/public/';

    let build = 'app/client/build/'
    let buildStaging = build + 'staging/';
    let buildDist = build + 'dist/';
+
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: {
            testPrep: ['.cache', 'build'],
            buildPrep: [build, finalDist]
        },
        mochaTest: {
            test: {
                src: ['app/server/test/**/*.js']
            }
        },
        jshint: {
            all: [
                'Gruntfile.js',
                'app/**/*.js'
            ],
            options: {
                // ECMAScript version 6
                esversion: 6
            }
        },
        karma: {
            unit: {
                configFile: 'karma.conf.js',
                singleRun: true,
                browsers: ['Firefox']
            }
        },
        mocha_istanbul: {
            default: {
                src: 'app/server/test',
                options: {
                    coverageFolder: 'build/reports/coverage/server'
                }
            }
        },
        lcovMerge: {
            options: {
                outputFile: 'build/reports/coverage/lcov.merged.info'
            },
            src: 'build/reports/coverage/**/lcov.info'
        },
        coveralls: {
            default: {
                src: 'build/reports/coverage/lcov.merged.info'
            }
        },
        browserify: {
            // Enable source maps at the end of the file
            // options: {
            //     browserifyOptions: {
            //         debug: true
            //     }
            // },
            app: {
                src: 'app/client/app.module.js',
                dest: buildStaging + 'app.browserify.js'
            }
        },
        babel: {
            options: {
                presets: ['es2015'],
                compact: true
            },
            app: {
                files: {
                    [buildStaging + 'app.babel.js']: buildStaging + 'app.browserify.js'
                }
            }
        },
        uglify: {
            options: {
                banner: '/*! Grunt Uglify <%= grunt.template.today("yyyy-mm-dd") %> */ ',
            },
            app: {
                files: {
                    [buildStaging + 'app.min.js']: [buildStaging + 'app.babel.js']
                }
            }
        },
        cssmin: {
            options: {
                sourceMap: true
            },
            build: {
                files: [{
                    // Created dynamically
                }]
            }
        },
        copy: {
            fonts: {
                cwd: 'node_modules/bootstrap/dist/fonts/',
                src: '*',
                dest: buildDist + 'fonts',
                expand: true
            },
            rawAssets: {
                cwd: 'app/client/_assets/raw',
                src: '*',
                dest: buildDist + 'assets',
                expand: true
            },
            scripts: {
                cwd: buildStaging,
                src: 'app.min.js',
                dest: buildDist + 'scripts',
                expand: true
            },
            style: {
                cwd: buildDist + 'style',
                src: ['*.min.css', '*.min.css.map'],
                dest: finalDist + 'style',
                expand: true
            },
            dist: {
                cwd: buildDist,
                src: '**', // copy all files and subdirectories
                dest: finalDist,
                expand: true
            }
        },
        watch: {
            js: {
                files: ['app/client/*.js', 'app/client/!(build)/**/*.js'],
                tasks: ['browserify', 'babel', 'uglify', 'copy:scripts']
            },
            css: {
                files: ['./app/client/_assets/style/*.css'],
                tasks: ['cssmin', 'copy:style']
            }
        }
    });

    // Created a .min.css file for every CSS file in the style directory that
    // isn't base.css
    let cssminProp = 'cssmin.build.files';
    let files = [];
    ['scl', 'table'].forEach(css => {
        files.push({
            src: [
                'app/client/_assets/style/base.css',
                `app/client/_assets/style/${css}.css`,
                'node_modules/bootstrap/dist/css/bootstrap.css'
            ],
            dest: buildDist + `style/${css}.min.css`
        });
    });
    grunt.config(cssminProp, files);

    var tasks = [
        'babel',
        'browserify',
        'contrib-clean',
        'contrib-copy',
        'contrib-cssmin',
        'contrib-jshint',
        'contrib-uglify',
        'contrib-watch',
        'coveralls',
        'karma',
        'lcov-merge',
        'mocha-test',
        'mocha-istanbul',
        'run'
    ];

    for (var i = 0; i < tasks.length; i++) {
        grunt.loadNpmTasks(`grunt-${tasks[i]}`);
    }

    grunt.registerTask('default', ['test']);
    grunt.registerTask('test', ['mochaTest', 'karma']);
    grunt.registerTask('testCoverage', ['clean:testPrep', 'mocha_istanbul', 'karma']);
    grunt.registerTask('uploadCoverage', ['lcovMerge', 'coveralls']);
    grunt.registerTask('build', ['clean:buildPrep', 'browserify', 'babel', 'uglify', 'cssmin', 'copy']);
};
