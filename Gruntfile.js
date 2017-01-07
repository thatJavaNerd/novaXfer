module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: ['.cache', 'build'],
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
                'app/**/*.js',
                '!app/public/bower_components/**/*.js'
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
        coveralls: {
            default: {
                src: 'build/reports/coverage/**/lcov.info'
            }
        }
    });

    var tasks = [
        'contrib-jshint',
        'contrib-clean',
        'coveralls',
        'karma',
        'mocha-test',
        'mocha-istanbul',
        'run'
    ];

    for (var i = 0; i < tasks.length; i++) {
        grunt.loadNpmTasks(`grunt-${tasks[i]}`);
    }

    grunt.registerTask('default', ['mochaTest', 'karma']);
    grunt.registerTask('testCoverage', ['clean', 'mocha_istanbul', 'karma']);
};
