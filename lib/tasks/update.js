'use strict';

// import from task prototype scaffolding
var Task = require('../task').Task;
var colors = require('colors'),
    fs = require('fs')
    // Q = require('q')
    ;

var ArgoTask = function() {};

// js is weird
ArgoTask.prototype = new Task();

// js is weird
ArgoTask.prototype.run = function run(argo, argv) {
  var projectPath = argo.projectPath();
  argo.readProjectFile(projectPath, function(err, data) {
    var projectData = JSON.parse(data);
    // var slug = projectData.slug;
    projectData.name = projectData.name;
    projectData.updated = new Date();
    projectData = JSON.stringify(projectData, null, 4);

    argo.writeProjectFile(projectPath, projectData, function(err) {
      if (err) throw err;
      console.log(projectData.green.bold);
    });
  });
};

exports.ArgoTask = ArgoTask;
