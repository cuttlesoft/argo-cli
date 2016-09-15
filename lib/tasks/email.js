// Task to prompt user for email and POST to subscribe to Mailchimp list

const Task = require('../task').Task;

const inquirer = require('inquirer');
const request = require('superagent');

const serviceUrl = '127.0.0.1:5000';

function respond(err, res) {
  // Internal Server Error - not unique
  if (err || !res.ok) throw err;

  process.stdout.write(res.body.result);
}

function answer(answers) {
  // post answers
  request.post(`${serviceUrl} + /mailchimp/subscribe/`)
  .set('Content-Type', 'application/json')
  .send(answers)
  .end(respond);
}

const ArgoTask = function ArgoTask() {};

ArgoTask.prototype = new Task();

ArgoTask.prototype.run = function run() {
  const questions = [
    {
      type: 'input',
      name: 'email',
      message: 'Subscribe:',
    },
  ];
  const message = 'Thank you for your interest in Argo. It is not yet ready for production, but you can register your email here to be informed of any updates.\n';
  process.stdout.write(message);
  inquirer.prompt(questions).then(answer);
};

exports.ArgoTask = ArgoTask;
