module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
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
        }
    });

    var tasks = [
        'mocha-test',
        'contrib-jshint',
        'run',
        'karma'
    ];

    for (var i = 0; i < tasks.length; i++) {
        grunt.loadNpmTasks(`grunt-${tasks[i]}`);
    }

    grunt.registerTask('default', ['mochaTest', 'karma']);
};
