'use strict';

// import from task prototype scaffolding
var Task = require('../task').Task,
    questions = require('../questions/rule').questions
    ;
var colors = require('colors'),
    fs = require('fs'),
    inquirer = require('inquirer'),
    request = require('superagent'),
    slugify = require('slug')
    ;

var serviceUrl = '127.0.0.1:5000';
// trigger, conditions, actions separate?
// trigger-specific prompts for conditions?
// trigger -> conditions and actions -> action details?

var ArgoTask = function() {};

ArgoTask.prototype = new Task();

ArgoTask.prototype.add = function add(argo, argv) {
  inquirer.prompt(questions).then(function (answers) {

    // get project?

    // loop through conditions and actions?
    var conditions = [
      {
        'condition_type': answers.conditionType,
        'condition_value': answers.conditionValue
      }
    ];
    var actions = [
      {
        'action_type': answers.actionType,
        'action_value': answers.actionValue
      }
    ];
    var rule = {
      'trigger': answers.trigger,
      'conditions': conditions,
      'actions': actions
    };


    // Start PUT attempt
    // Get project path + read cuttle.project
    var projectId;
    var projectPath = argo.projectPath();
    argo.readProjectFile(projectPath, function(err, data) {
      // Get project (mongo) id
      var projectData = JSON.parse(data);
      projectId = projectData.mongoId;

      // Get project to get rules; flask_mongorest update looks like it
      // replaces changed attributes, which is potentially a problem if
      // we send only the current rule to the project update endpoint...
      request.get(serviceUrl + '/api/v1/projects/' + projectId + '/')
      .end(function(err, res) {
        if (err) throw err;

        var projectObj = res.body;

        var project = {};
        project.rules = projectObj.rules || [];
        project.rules.push(rule);
        // project = JSON.stringify(project); // (project, null, 4)

        request.put(serviceUrl + '/api/v1/projects/' + projectId + '/')
        .set('Content-Type', 'application/json')
        .send(project)
        .end(function(err, res) {
          if (err) throw err;
        });
      });
    });
  });
};

ArgoTask.prototype.help = function help() {
  var msg = 'Did you know?\nYou can include a matched condition in a rule ' +
            'action by adding the condition name in curly braces (e.g., ' +
            '"http://url.com/{branch}" with a branch condition for master ' +
            'branch becomes "http://url.com/master" when executed).';
  console.log(msg.bold.blue);
};

ArgoTask.prototype.run = function run(argo, argv) {
  var args = argv._; // ?
  var cmd = args.pop();
  if (cmd == 'add') {
    this.add(argo, args);
  } else {
    this.help();
  }
};

exports.ArgoTask = ArgoTask;
