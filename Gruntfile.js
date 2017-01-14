module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: {
            testPrep: ['.cache', 'build'],
            buildPrep: ['app/public/build', 'app/public/dist', 'app/public/fonts']
        },
        run: {
            server: {
                options: {
                    wait: true
                },
                args: ['server.js', '--use-strict']
            }
        },
        mochaTest: {
            test: {
                src: ['test/**/*.js']
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
                src: 'test',
                options: {
                    coverageFolder: 'build/reports/coverage/backend'
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
            js: {
                src: './app/public/app.module.js',
                dest: './app/public/build/dist.js'
            }
        },
        babel: {
            options: {
                presets: ['es2015'],
                compact: true
            },
            dist: {
                files: {
                    'app/public/build/dist.babel.js': 'app/public/build/dist.js'
                }
            }
        },
        uglify: {
            options: {
                banner: '/*! Grunt Uglify <%= grunt.template.today("yyyy-mm-dd") %> */ ',
            },
            build: {
                files: {
                    'app/public/dist/dist.min.js': ['app/public/build/dist.babel.js']
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
                dest: 'app/public/fonts/',
                expand: true
            }
        },
        watch: {
            js: {
                files: ['./app/public/**/!(dist.min).js'],
                tasks: ['build']
            },
            css: {
                files: ['./app/public/style/*.css'],
                tasks: ['cssmin']
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
                'app/public/style/base.css',
                `app/public/style/${css}.css`,
                'node_modules/bootstrap/dist/css/bootstrap.css'
            ],
            dest: `app/public/dist/${css}.min.css`
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

    grunt.registerTask('default', ['mochaTest', 'karma']);
    grunt.registerTask('testCoverage', ['clean:testPrep', 'mocha_istanbul', 'karma']);
    grunt.registerTask('uploadCoverage', ['lcovMerge', 'coveralls']);
    grunt.registerTask('build', ['clean:buildPrep', 'browserify', 'babel', 'uglify', 'cssmin', 'copy:fonts']);
};
