// Task to prompt user for email and POST to subscribe to Mailchimp list

'use strict';

var Task = require('../task').Task;

var inquirer = require('inquirer'),
    request = require('superagent')
    ;

var serviceUrl = '127.0.0.1:5000';

var ArgoTask = function() {};

ArgoTask.prototype = new Task();

ArgoTask.prototype.run = function run(argo, argv) {

  var questions = [
    {
      type: 'input',
      name: 'email',
      message: 'Subscribe:'
    }
  ];
  var message = "Thank you for your interest in Argo. It is not yet ready for production, but you can register your email here to be informed of any updates."
  console.log(message);
  inquirer.prompt(questions).then(function (answers) {
    // post answers
    request.post(serviceUrl + '/mailchimp/subscribe/')
    .set('Content-Type', 'application/json')
    .send(answers)
    .end(function(err, res) {
      // Internal Server Error - not unique
      if (err || !res.ok) throw err;

      console.log('Thank you for registering. We will be sure to update you on all things Argo.')

    });
  });
}

exports.ArgoTask = ArgoTask;
