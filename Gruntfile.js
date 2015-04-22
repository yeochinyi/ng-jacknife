(function() {
    'use strict';

    module.exports = function (grunt) {
        require('load-grunt-tasks')(grunt);
        grunt.initConfig({
            jshint: {
                all: ['Gruntfile.js', 'src/*.js', 'test/*.js']
            },
            karma: {
                unit: {
                    configFile: 'karma.conf.js'
                },
                'unit.min': {
                    configFile: 'karma.min.conf.js'
                },
                autotest: {
                    configFile: 'karma.conf.js',
                    autoWatch: true,
                    singleRun: false
                },
                travis: {
                    configFile: 'karma.conf.js',
                    reporters: 'dots',
                    browsers: ['PhantomJS']
                }
            },
            uglify: {
                all: {
                    files: {
                        'jacknife.min.js': ['src/*.js']
                    },
                    options: {
                        sourceMap: true
                    }
                }
            },
            bump: {
                options: {
                    files: ['package.json', 'bower.json'],
                    commitFiles: ['package.json', 'bower.json'],
                    tagName: '%VERSION%',
                    pushTo: 'origin'
                }
            },
            'npm-publish': {
                options: {
                    requires: ['jshint', 'karma:unit', 'bump'],
                    abortIfDirty: true
                }
            }
        });
        grunt.registerTask('release', ['jshint', 'karma:unit', 'uglify:all', 'karma:unit.min', 'bump', 'publish']);
    };
}());
