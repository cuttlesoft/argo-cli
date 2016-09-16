var ArgoCli = require('../lib/cli'),
    Q = require('q'),
    Task = require('../lib/task').Task,
    rewire = require('rewire'),
    inquirer = require('inquirer')
    ;

var fs = require('fs'),
    Hg = require('hg')
    ;

var init;
var consoleSpy;

describe('Cli', function() {

  beforeEach(function() {
    spyOn(ArgoCli, 'printAvailableTasks');
  });

  it('should have cli defined', function() {
    expect(ArgoCli).toBeDefined();
  });

  it('should have cli tasks defined', function() {
    expect(ArgoCli.Tasks).toBeDefined();
  });


  describe('#run', function() {

    beforeEach(function() {
      var fakeTask = function() {};
      fakeTask.prototype = new Task();
      fakeTask.prototype.run = function() {};

      spyOn(ArgoCli, 'lookupTask').andReturn(fakeTask);
    });

    xit('should get version when version flag passed', function() {
      spyOn(ArgoCli, 'version');
      ArgoCli.run([ '/usr/local/Cellar/node/5.4.0/bin/node',
          '/usr/local/bin/argo',
          '--version' ]);
      expect(ArgoCli.version).toHaveBeenCalled();
    });
  });


  describe('#commands', function() {
    var fakeTask;

    beforeEach(function() {
      fakeTask = function() {};
      fakeTask.prototype = new Task();
      fakeTask.prototype.run = function() {};

      spyOn(ArgoCli, 'lookupTask').andReturn(fakeTask);
      spyOn(fakeTask.prototype, 'run').andCallThrough();
    });

    it('should parse commands correctly', function() {
      ArgoCli.run([ '/usr/local/Cellar/node/5.4.0/bin/node',
          '/usr/local/bin/argo',
          'init' ]);

      var taskArgs = fakeTask.prototype.run.mostRecentCall.args;
      var taskArgv = taskArgs[1];
      expect(taskArgv._[0]).toBe('init');
    });

    it('should parse rule command options correctly', function() {
      ArgoCli.run([ '/usr/local/Cellar/node/5.4.0/bin/node',
          '/usr/local/bin/argo',
          'rule',
          'add' ]);

      var taskArgs = fakeTask.prototype.run.mostRecentCall.args;
      var taskArgv = taskArgs[1];
      // expect(ArgoCli.run).toHaveBeenCalledWith('init');
      expect(taskArgv._[0]).toBe('rule');
      expect(taskArgv._[1]).toBe('add');
    });
  });

  describe('#init', function() {
    beforeEach(function() {
      init = rewire('../lib/tasks/init.js');
      consoleSpy = spyOn(console, 'log').andCallThrough();
    });

    afterEach(function() {

    });

    it('should inform if argo.project exists', function() {
      projectExists = init.__get__('projectExists');
      spyOn(fs, 'existsSync').andReturn(true);

      projectExists('/fakePath');
      expect(consoleSpy).toHaveBeenCalledWith(('\nargo.project already exists in /fakePath').red);
    });

    // maybe more of an integration test???
    it('should stop if argo.project exists', function() {
      // var inqSpy = spyOn(inquirer, 'prompt').andReturn(true);
      // var processSpy = spyOn(process, 'cwd').andReturn('/fakePath');
    });

    describe('initialCommit', function() {
      beforeEach(function() {
        initialCommit = init.__get__('initialCommit')
      });
      it('should commit with hg', function() {
        // expect(hgCommitSpy).toHaveBeenCalled();
      });

      it('should commit with git', function() {
        Git = init.__get__('Git');
        var gitRepo = Git.Repository;
        var gitSpy = spyOn(gitRepo, 'open').andCallThrough();

        initialCommit('/fakePath', 'git');
        expect(gitSpy).toHaveBeenCalledWith('/fakePath');
      });
    });

    describe('checkRepo', function() {
      beforeEach(function() {
        checkRepo = init.__get__('checkRepo');
      });
      it('should return path if hg repo exists', function() {
        init.__set__('lookup', function(scm) {
            if (scm == '.hg') return '/fakePath/.hg/';
          });

        expect(checkRepo().scm).toEqual('hg');
        expect(checkRepo().path).toEqual('/fakePath/.hg/');
      });

      it('should return path if git repo exists', function() {
        init.__set__('lookup', function(scm) {
            if (scm == '.git') return '/fakePath/.git/';
          });

        expect(checkRepo().scm).toEqual('git');
        expect(checkRepo().path).toEqual('/fakePath/.git/');
      });

      it('should return empty {} if repo does NOT exist', function() {
        init.__set__('lookup', function(scm) {
            return undefined;
          });

        expect(checkRepo().scm).toBeUndefined();
        expect(checkRepo().path).toBeUndefined();
      });
    });
  });
});
