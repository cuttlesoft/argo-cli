
const Task = require('../task').Task;
const repoQuestions = require('../questions/init').repoQuestions;
const noRepoQuestions = require('../questions/init').noRepoQuestions;

const fs = require('fs');
const Git = require('nodegit');
const Hg = require('hg');
const inquirer = require('inquirer');
const lookup = require('look-up');
const Q = require('q');
const request = require('superagent');

const serviceUrl = '127.0.0.1:5000';
const HgRepo = Hg.HGRepo;
// const HGCommandServer = hg.HGCommandServer;

process.stdout.write('...Argo fly a kite.');

function handleError(err) {
  // handle
  if (err) throw err;
}

function hgInit(repoPath, slug) {
  const deferred = Q.defer();
  const hgRepo = new HgRepo();

  function createHgRepo(err) {
    handleError(err);
    // add default path
    const account = process.env.BITBUCKET_TEAM_NAME; // needs to be config'd
    const remote = `ssh://hg@bitbucket.org/${account}/${slug}`;

    const hgrc = `${repoPath}/.hg/hgrc`;
    const hgrcDefault = `[paths]\ndefault = ${remote}\n`;

    fs.writeFile(hgrc, hgrcDefault, { encoding: 'utf-8', flags: 'w' }, handleError);

    deferred.resolve(remote);
  }

  if (!fs.existsSync(repoPath)) {
    fs.mkdirSync(repoPath);
  }

  // Initialize repo
  hgRepo.init(repoPath, createHgRepo);
  return deferred.promise;
}

function gitInit(repoPath, slug, repoHost) {
  const deferred = Q.defer();

  Git.Repository.init(repoPath, 0).then(function addRemote(repo) {
    // add origin remote
    // TODO: github support double check for structure
    const account = process.env.BITBUCKET_TEAM_NAME; // needs to be config'd
    const remote = 'git@' + repoHost + ':' + account + '/' + slug + '.git';

    Git.Remote.create(repo, 'origin', remote).then(function(remote) {
      deferred.resolve(remote);
    });
  });

  return deferred.promise;
}

function checkRepo() {
  const cwd = { cwd: process.cwd() };
  const hg = lookup('.hg', cwd);
  const git = lookup('.git', cwd);

  const repo = {};
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
  const deferred = Q.defer();
  let result;

  repoHost = repoHost || 'bitbucket.org'; // maybe should be config'd
  if (scm === 'git') {
    result = gitInit(repoPath, slug, repoHost);
  } else if (scm === 'hg') {
    result = hgInit(repoPath, slug);
  }

  deferred.resolve(result);
  return deferred.promise;
}

function initialCommit(repoPath, scm) {
  if (scm === 'git') {
    Git.Repository.open(repoPath).then(function(repo) {
      let committer; // Signatures
      const author = committer = Git.Signature.default(repo);

      const files = ['cuttle.project'];
      repo.createCommitOnHead(files, author, committer, 'Initial commit').then(function(oid) {
        // console.log(oid);
      });
    });
  } else if (scm === 'hg') {
    const hgRepo = new HgRepo(repoPath);

    const files = ['cuttle.project'];
    hgRepo.add(files, function(err, output) {
      if (err) throw err;

      const options = { '-m': 'Initial commit' };
      hgRepo.commit(options, function(err, output) {
        if (err) throw err;
      });
    });
  }
}

function projectExists(location) {
  const existence = fs.existsSync(`${location} /cuttle.project`);
  if (existence) process.stdout.write((`\nArgo project already exists in ${location}`).red);
  return existence;
}

const ArgoTask = function ArgoTask() {};

ArgoTask.prototype = new Task();

ArgoTask.prototype.run = function run(argo) {
  // start with cwd as project path
  let projectPath = process.cwd();

  const repo = checkRepo();
  const repoExists = (repo.scm && repo.path);

  if (repoExists) {
    // check for existing cuttle.project; quit if found
    if (projectExists(projectPath)) return;
    // let user know an existing repo was found
    process.stdout.write((`\nRepository found (${repo.path})\n`).cyan);

    // get repo info and set defaults for use in inquirer
  }

  const questions = repoExists ? repoQuestions : noRepoQuestions;
  inquirer.prompt(questions, repo).then(function (answers) {
    const project = {
      scm: answers.scm || repo.scm,
      name: answers.name,
      slug: answers.slug,
    };

    const repoHost = answers.repoHost;

    if (!repoExists) {
      projectPath += `/${project.slug}`;
      // check for existing cuttle.project with slug now available; quit if found
      if (projectExists(projectPath)) return;
    }

    // have user confirm location is okay before proceeding
    const confirmLocation = [{
      type: 'confirm',
      name: 'locationOK',
      message: `Argo project will be created in ${projectPath} \nIs this location OK?`,
      default: true,
    }];
    inquirer.prompt(confirmLocation).then(function (answers) {
      if (!answers.locationOK) return;

      request.post(`${serviceUrl}/api/v1/projects/`)
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
          process.stdout.write((`\nNo repository found in ${process.cwd()}; initializing ${project.scm} repository \' ${project.slug} + \'\n`).cyan);

          createRepo(projectPath, project.scm, project.slug, repoHost).then(function(res) {
            argo.writeProjectFile(projectPath, JSON.stringify(project, null, 4),
              function(err, res) {
                if (err) throw err;
                // initial commit with cuttle.project file
                initialCommit(projectPath, project.scm);
              }
            );
          });
        }
      });
    });
  });
};

exports.ArgoTask = ArgoTask;
