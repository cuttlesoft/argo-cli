'use strict';

var Task = require('../task').Task,
    repoQuestions = require('../questions/init').repoQuestions,
    noRepoQuestions = require('../questions/init').noRepoQuestions
    ;
var colors = require('colors'),
    fs = require('fs'),
    Git = require('nodegit'),
    Hg = require('hg'),
    http = require('http'),
    inquirer = require('inquirer'),
    lookup = require('look-up'),
    path = require('path'),
    Q = require('q'),
    request = require('superagent'),
    slugify = require('slug')
    ;

var serviceUrl = '127.0.0.1:5000';
var HgRepo = Hg.HGRepo;
// var HGCommandServer = hg.HGCommandServer;

console.log('...Argo fly a kite.');

function checkRepo() {
  var cwd = process.cwd();
  var hg = lookup('.hg', { cwd: cwd });
  var git = lookup('.git', { cwd: cwd });

  var repo = {};
  if (git) {
    repo.scm = 'git';
    repo.path = git;
  } else if (hg) {
    repo.scm = 'hg';
    repo.path = hg;
  }

  return repo;
}


function createRepo(repoPath, scm, slug, repoHost) {
  var deferred = Q.defer();

  repoHost = repoHost || 'bitbucket.org'; // maybe should be config'd
  if (scm == 'git') {
    var result = gitInit(repoPath, slug, repoHost);
  } else if (scm == 'hg') {
    var result = hgInit(repoPath, slug);
  }

  deferred.resolve(result);
  return deferred.promise;
}

function gitInit(repoPath, slug, repoHost) {
  var deferred = Q.defer();

  Git.Repository.init(repoPath, 0).then(function(repo) {
    // add origin remote
    // TODO: github support double check for structure
    var account = process.env.BITBUCKET_TEAM_NAME; // needs to be config'd
    var remote = 'git@' + repoHost + ':' + account + '/' + slug + '.git';

    Git.Remote.create(repo, 'origin', remote).then(function(remote) {
      deferred.resolve(remote);
    });
  });

  return deferred.promise;
}

function hgInit(repoPath, slug) {
  var deferred = Q.defer();

  if (!fs.existsSync(repoPath)) {
    fs.mkdirSync(repoPath);
  }

  // Initialize repo
  var hgRepo = new HgRepo();
  hgRepo.init(repoPath, function(err, result) {
    if (err) throw err;
    // add default path
    var account = process.env.BITBUCKET_TEAM_NAME; // needs to be config'd
    var remote = 'ssh://hg@bitbucket.org/' + account + '/' + slug;

    var hgrc = repoPath + '/.hg/hgrc';
    var hgrcDefault = '[paths]\ndefault = ' + remote + '\n';

    fs.writeFile(hgrc, hgrcDefault, {encoding: 'utf-8', flags: 'w'}, function(err) {
      if (err) throw err;
    });

    deferred.resolve(remote);
  });
  return deferred.promise;
}

function initialCommit(repoPath, scm) {
  if (scm == 'git') {
    Git.Repository.open(repoPath).then(function(repo) {
      var author, committer; // Signatures
      author = committer = Git.Signature.default(repo);

      var files = ['cuttle.project'];
      repo.createCommitOnHead(files, author, committer, 'Initial commit').then(function(oid) {
        // console.log(oid);
      });
    });

  } else if (scm == 'hg') {
    var hgRepo = new HgRepo(repoPath);

    var files = ['cuttle.project'];
    hgRepo.add(files, function(err, output) {
      if (err) throw err;

      var options = { '-m': 'Initial commit' };
      hgRepo.commit(options, function(err, output) {
        if (err) throw err;
      });
    });
  }
}

function projectExists(location) {
  var existence = fs.existsSync(location + '/cuttle.project');
  if (existence) console.log(('\nArgo project already exists in ' + location).red);
  return existence;
}

var ArgoTask = function() {};

ArgoTask.prototype = new Task();

ArgoTask.prototype.run = function run(argo, argv) {
  // start with cwd as project path
  var projectPath = process.cwd();

  var repo = checkRepo();
  var repoExists = (repo.scm && repo.path);

  if (repoExists) {
    // check for existing cuttle.project; quit if found
    if (projectExists(projectPath)) return;
    // let user know an existing repo was found
    console.log(('\nRepository found (' + repo.path + ')\n').cyan);

    // get repo info and set defaults for use in inquirer
  }

  var questions = repoExists ? repoQuestions : noRepoQuestions;
  inquirer.prompt(questions, repo).then(function (answers) {
    var project = {
      'scm': answers.scm || repo.scm,
      'name': answers.name,
      'slug': answers.slug
    };

    var repoHost = answers.repoHost;

    if (!repoExists) {
      projectPath += '/' + project.slug;
      // check for existing cuttle.project with slug now available; quit if found
      if (projectExists(projectPath)) return;
    }

    // have user confirm location is okay before proceeding
    var confirmLocation = [{
      type: 'confirm',
      name: 'locationOK',
      message: 'Argo project will be created in ' + projectPath + '\nIs this location OK?',
      default: true
    }];
    inquirer.prompt(confirmLocation).then(function (answers) {
      if (!answers.locationOK) return;

      request.post(serviceUrl + '/api/v1/projects/')
      .set('Content-Type', 'application/json')
      .send(project)
      .end(function(err, res) {
        // Internal Server Error - not unique
        if (err || !res.ok) throw err;

        project.uid = res.body.uid;
        project.mongoId = res.body.id;

        // create repo for selected scm if it doesn't exist
        if (repoExists) {
          argo.writeProjectFile(projectPath, JSON.stringify(project, null, 4), function(err, res) {
            if (err) throw err;
          });
        } else {
          console.log(('\nNo repository found in ' + process.cwd() + '; ' +
                       'initializing ' + project.scm + ' repository \'' + project.slug + '\'\n').cyan);

          createRepo(projectPath, project.scm, project.slug, repoHost).then(function(res) {
            argo.writeProjectFile(projectPath, JSON.stringify(project, null, 4), function(err, res) {
              if (err) throw err;
              // initial commit with cuttle.project file
              initialCommit(projectPath, project.scm);
            });
          });
        }

      });
    });
  });
};

exports.ArgoTask = ArgoTask;
