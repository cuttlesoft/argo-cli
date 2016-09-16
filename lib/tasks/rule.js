
// import from task prototype scaffolding
const Task = require('../task').Task;
const questions = require('../questions/rule').questions;

const inquirer = require('inquirer');
const request = require('superagent');

const serviceUrl = '127.0.0.1:5000';
// trigger, conditions, actions separate?
// trigger-specific prompts for conditions?
// trigger -> conditions and actions -> action details?

function handleError(err) {
  // handle
  if (err) throw err;
}

const ArgoTask = function ArgoTask() {};

ArgoTask.prototype = new Task();

ArgoTask.prototype.add = function add(argo) {
  let rule;
  let projectId;
  const projectPath = argo.projectPath();

  function putResponse(err) {
    handleError(err);
  }

  function putNewRule(err, res) {
    handleError(err);

    const projectObj = res.body;

    const project = {};
    project.rules = projectObj.rules || [];
    project.rules.push(rule);
    // project = JSON.stringify(project); // (project, null, 4)

    request.put(`${serviceUrl}/api/v1/projects/${projectId}/`)
    .set('Content-Type', 'application/json')
    .send(project)
    .end(putResponse);
  }

  function getProjectData(err, data) {
    // Get project (mongo) id
    const projectData = JSON.parse(data);
    projectId = projectData.mongoId;

    // Get project to get rules; flask_mongorest update looks like it
    // replaces changed attributes, which is potentially a problem if
    // we send only the current rule to the project update endpoint...
    request.get(`${serviceUrl}/api/v1/projects/${projectId}/`)
    .end(putNewRule);
  }

  function createRule(answers) {
    // loop through conditions and actions?
    const conditions = [
      {
        condition_type: answers.conditionType,
        condition_value: answers.conditionValue,
      },
    ];
    const actions = [
      {
        action_type: answers.actionType,
        action_value: answers.actionValue,
      },
    ];
    rule = {
      trigger: answers.trigger,
      conditions,
      actions,
    };

    // Start PUT attempt
    // Get project path + read argo.project
    argo.readProjectFile(projectPath, getProjectData);
  }

  inquirer.prompt(questions).then(createRule);
};

ArgoTask.prototype.help = function help() {
  const msg = 'Did you know?\nYou can include a matched condition in a rule ' +
            'action by adding the condition name in curly braces (e.g., ' +
            '"http://url.com/{branch}" with a branch condition for master ' +
            'branch becomes "http://url.com/master" when executed).';
  process.stdout.write(msg.bold.blue);
};

ArgoTask.prototype.run = function run(argo, argv) {
  const args = argv._; // ?
  const cmd = args.pop();
  if (cmd === 'add') {
    this.add(argo, args);
  } else {
    this.help();
  }
};

exports.ArgoTask = ArgoTask;
