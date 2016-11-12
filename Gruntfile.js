module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
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

    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.registerTask('default', ['mochaTest']);
}
