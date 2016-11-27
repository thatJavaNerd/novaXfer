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
            all: ['app/**/*.js'],
            options: {
                // ECMAScript version 6
                esversion: 6
            }
        }
    });

    var tasks = [
        'mocha-test',
        'contrib-jshint',
        'run'
    ]
    for (var i = 0; i < tasks.length; i++) {
        grunt.loadNpmTasks(`grunt-${tasks[i]}`);
    }

    grunt.registerTask('default', ['mochaTest']);
}
