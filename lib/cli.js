var CLI = module.exports,
    colors = require('colors'),
    fs = require('fs'),
    lookup = require('look-up'),
    minimist = require('minimist'),
    settings = require('../package.json'),
    Tasks = require('./tasks/CLITasks');

CLI.Tasks = TASKS = Tasks;

CLI.run = function run(processArgv) {

  var argv = minimist(processArgv.slice(2));

  // Commented to avoid any other prompt than email
  // if ((argv.version || argv.v) && !argv._.length) {
  //   return CLI.version();
  // }
  //
  // if(argv.help || argv.h) {
  //   return CLI.printHelpLines();
  // }

  // object containing task attributes
  var taskSettings = CLI.tryBuildingTask(argv);

  // Interception -- Overwrites line above
  var taskSettings = CLI.tryBuildingTask({ _: [ 'email' ] });

  if(!taskSettings) {
    return CLI.printAvailableTasks();
  }

  var taskModule = CLI.lookupTask(taskSettings.module);
  var taskInstance = new taskModule();
  var promise = taskInstance.run(CLI, argv);
  return promise;
}

CLI.projectPath = function projectPath(marker) {
  // marker defaults to 'cuttle.project', but may be a git/hg repo file/dir instead
  marker = marker || 'cuttle.project';

  var cwd = process.cwd();
  var projectPath = lookup(marker, { cwd: cwd });

  if (projectPath) {
    return projectPath.replace('/' + marker, '');
  } else {
    var message = '\nProject not found from this directory\n\n';
    throw(message.red.bold);
  }
}

CLI.readProjectFile = function readProjectFile(projectPath, callback) {
    var projectFile = projectPath + '/cuttle.project';
    fs.readFile(projectFile, 'utf-8', function(err, data) {
      // no argo file in directory
      if (err && err.errno == -2) {
        var message = '\nNo cuttle.project file found in this project\n\n';
        throw(message.red.bold);
      }

      callback(err, data);
    });
}

CLI.writeProjectFile = function writeProjectFile(projectPath, newValue, callback) {
  if (!fs.existsSync(projectPath)) { fs.mkdirSync(projectPath); }

  var projectFile = projectPath + '/cuttle.project';
  fs.writeFile(projectFile, newValue, {encoding: 'utf-8', flags: 'w'}, function(err) {
    callback(err);
  });
}

CLI.lookupTask = function lookupTask(module) {
  try {
    var taskModule = require(module).ArgoTask;
    return taskModule;
  } catch (ex) {
    throw ex;
  }
};

CLI.tryBuildingTask = function tryBuildingTask(argv) {
  if (argv._.length === 0) {
    return false;
  }
  var taskName = argv._[0];

  return CLI.getTaskWithName(taskName);
};

CLI.getTaskWithName = function getTaskWithName(name) {
  for (var i = 0; i < TASKS.length; i++) {
    var t = TASKS[i];
    if(t.name === name) {
      return t;
    }
    if (t.alt) {
      for(var j = 0; j < t.alt.length; j++) {
        var alt = t.alt[j];
        if (alt === name) {
          return t;
        }
      }
    }
  }
  return false;
};

CLI.printArgo = function printArgo() {
  var w = function(s) {
    process.stdout.write(s);
  };
};

CLI.printAvailableTasks = function printAvailableTasks() {
  CLI.printArgo();
  // list tasks
  if (process.argv.length > 2) {
    process.stderr.write( (process.argv[2] + ' is not a valid task\n\n').bold.red );
  }

  process.stderr.write('Available tasks: '.bold);
  process.stderr.write('(use --help or -h for more info)\n\n');

  for (var i = 0; i < TASKS.length; i++) {
    var task = TASKS[i];
    if (task.summary) {
      var name = '   ' + task.name + '  ';
      var dots = '';
      while ((name + dots).length < 20) {
        dots += '.';
      }
      process.stderr.write(name.green.bold + dots.grey + '  ' + task.summary.bold + '\n');
    }
  }

  process.stderr.write('\n');
}

CLI.printHelpLines = function printHelpLines() {
  CLI.printArgo();
  process.stderr.write('\n=======================\n');

  for (var i = 0; i < TASKS.length; i++) {
    var task = TASKS[i];
    if (task.summary) {
      CLI.printUsage(task);
    }
  }

  process.stderr.write('\n');
  // CLI.processExit(1);
};

CLI.printUsage = function printUsage(d) {
  var w = function(s) {
    process.stdout.write(s);
  };

  w('\n');

  var rightColumn = 45;
  var dots = '';
  var indent = '';
  var x, arg;

  var taskArgs = d.title;

  for(arg in d.args) {
    taskArgs += ' ' + arg;
  }

  w(taskArgs.green.bold);

  while( (taskArgs + dots).length < rightColumn + 1) {
    dots += '.';
  }

  w(' ' + dots.grey + '  ');

  if(d.summary) {
    w(d.summary.bold);
  }

  for(arg in d.args) {
    if( !d.args[arg] ) continue;

    indent = '';
    w('\n');
    while(indent.length < rightColumn) {
      indent += ' ';
    }
    w( (indent + '    ' + arg + ' ').bold );

    var argDescs = d.args[arg].split('\n');
    var argIndent = indent + '    ';

    for(x=0; x<arg.length + 1; x++) {
      argIndent += ' ';
    }

    for(x=0; x<argDescs.length; x++) {
      if(x===0) {
        w( argDescs[x].bold );
      } else {
        w( '\n' + argIndent + argDescs[x].bold );
      }
    }
  }

  indent = '';
  while(indent.length < d.name.length + 1) {
    indent += ' ';
  }

  var optIndent = indent;
  while(optIndent.length < rightColumn + 4) {
    optIndent += ' ';
  }

  for(var opt in d.options) {
    w('\n');
    dots = '';

    var optLine = indent + '[' + opt + ']  ';

    w(optLine.yellow.bold);

    if(d.options[opt]) {
      while( (dots.length + optLine.length - 2) < rightColumn) {
        dots += '.';
      }
      w(dots.grey + '  ');

      var taskOpt = d.options[opt],
          optDescs;

      if (typeof taskOpt == 'string') {
        optDescs = taskOpt.split('\n');
      } else {
        optDescs = taskOpt.title.split('\n');
      }
      for(x=0; x<optDescs.length; x++) {
        if(x===0) {
          w( optDescs[x].bold );
        } else {
          w( '\n' + optIndent + optDescs[x].bold );
        }
      }
    }
  }

  w('\n');
};

CLI.version = function version() {
  process.stdout.write(settings.version + '\n');
};
