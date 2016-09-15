// import from task prototype scaffolding
const Task = require('../task').Task;

const ArgoTask = function ArgoTask() {};

ArgoTask.prototype = new Task();

ArgoTask.prototype.run = function run(argo) {
  let projectData;
  const projectPath = argo.projectPath();

  function writeResponse(err) {
    if (err) throw err;
    process.stdout.write(projectData.green.bold);
  }

  function getProjectData(err, data) {
    projectData = JSON.parse(data);
    // var slug = projectData.slug;
    projectData.name = projectData.name;
    projectData.updated = new Date();
    projectData = JSON.stringify(projectData, null, 4);

    argo.writeProjectFile(projectPath, projectData, writeResponse);
  }

  argo.readProjectFile(projectPath, getProjectData);
};

exports.ArgoTask = ArgoTask;
