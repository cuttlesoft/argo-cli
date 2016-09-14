// Task to prompt user for email and POST to subscribe to Mailchimp list

'use strict';

var Task = require('../task').Task;

var inquirer = require('inquirer'),
    request = require('superagent')
    ;

var ArgoTask = function() {};

ArgoTask.prototype = new Task();

ArgoTask.prototype.run = function run(argo, argv) {

  var questions = [
    {
      type: 'input',
      name: 'email',
      message: 'Email:'
    }
  ];
  inquirer.prompt(questions).then(function (answers) {
    console.log(answers);
    // post answers
  });
}

exports.ArgoTask = ArgoTask;
