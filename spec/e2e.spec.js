var fs = require('fs'),
    helpers = require('./helpers'),
    path = require('path'),
    Q = require('q'),
    shell = require('shelljs'),
    request = require('superagent')
    ;

var ArgoCli = require('../lib/cli');

var tmpDir = helpers.tmpDir('create_test');
var appName = 'TestArgo';
var appId = 'org.argo.testing';
var project = path.join(tmpDir, appName);
var minimist = require('minimist');
var minimistSpy;
var cwdSpy;
var requestSpy;

// still trying to understand all of this
describe('end-to-end', function() {
  beforeEach(function() {
      jasmine.getEnv().defaultTimeoutInterval = 150000;

      // attempt to mock and fake project directory
      cwdSpy = spyOn(process, 'cwd').andCallFake(function() {
        console.log(project);
        return project;
      });

      // structure for faking post request
      requestSpy = spyOn(request, 'post').andCallFake(function() {
        return {
          // end: 'Success!'
          end: function(cb) {
            //null for no error, and object to mirror how a response would look.
            cb(null, {body: data});
          }
        }
      });

      shell.rm('-rf', project);
      shell.mkdir('-p', tmpDir);
  });
  afterEach(function() {
      process.chdir(path.join(__dirname, '..'));  // Needed to rm the dir on Windows.
      shell.rm('-rf', tmpDir);
  });

  // ensure everything's working in config
  it('should be good', function() {
    expect(true).toEqual(true);
  });

  // it('should create a .git/ and cuttle.project if neither exists currently', function() {
  //   var args = [ '/usr/local/Cellar/node/5.4.0/bin/node',
  //       '/usr/local/bin/argo',
  //       'init' ]
  //
  //   console.log(cwdSpy.plan());
  //
  //   Q()
  //     .then(function() {
  //       return ArgoCli.run(args);
  //     }).then(function() {
  //       expect(cwdSpy).toHaveBeenCalledWith(project);
  //       // expect(requestSpy).toHaveBeenCalledWith();
  //       // expect(path.join(project, 'cuttle.project')).toExist();
  //     });
  // });
});
