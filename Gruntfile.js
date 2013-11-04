module.exports = function(grunt) {

  'use strict';

  grunt.initConfig({
    jshint: {
      client: { files: { src: 'js/browser.js' }, options: { browser: true } },
      grunt:  { files: { src: 'Gruntfile.js' }, options: { node: true } },
      server: { files: { src: 'js/server.js' }, options: { node: true } },
      options: {
        jshintrc: '.jshintrc',
        reporter: 'node_modules/jshint-stylish/stylish.js'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');

  // By default, lint js files.
  grunt.registerTask('default', [ 'jshint' ]);

};