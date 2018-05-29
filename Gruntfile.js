module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
      pkg: grunt.file.readJSON('package.json'),
  
      //Put all files into a single file
      concat: {
        options: {
          process: function (src, filepath) {
            return '//####' + filepath + '\n' + src;
          }
        },
  
        execdblpig_mobile: {
          src: [
            'src/execdblpig/dashboard/*.js',
            'src/execdblpig/dataparser/*.js',
            'src/execdblpig/readers/offline/*.js',
            'src/execdblpig/openreport/offline/*.js',
            'src/execdb/dashboard/*.js',
            'src/execdb/dataparser/*.js',
            'src/execdb/readers/offline/*.js',
            'src/execdb/devbuttons/offline/*.js'
          ],
          dest: 'dist/execdblpig/shell.execdblpig.mobile.js'
        }
      },

      //Copy from dist to app folder
      copy : {
        "execdblpig": {
            files: [ {
              src: "dist/execdblpig/shell.execdblpig.mobile.js",
              dest: "app/execdblpmob/www/js/shell.execdblpig.mobile.min.js"
            }]
          }
      }
    });
  
    // Load the plugins
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');
  
    /**
     * UP/IG LAUNCHPAD TASKS
     * The PRD-version will minify the JS code in order to reduce
     * the network traffic;
     */
    grunt.registerTask('execdblpig', [
      'concat:execdblpig_mobile',
      'copy:execdblpig'
    ]);
  };
  