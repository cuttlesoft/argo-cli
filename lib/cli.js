'use strict';

const CLI = module.exports;
const fs = require('fs');
const lookup = require('look-up');
const minimist = require('minimist');
const settings = require('../package.json');
const TASKS = require('./tasks/cliTasks');
require('colors');

function w(s) {
  process.stdout.write(s);
}

function wErr(s) {
  process.stderr.write(s);
}

CLI.Tasks = TASKS;

CLI.run = function run(processArgv) {
  const argv = minimist(processArgv.slice(2));

  // // Commented to avoid any other prompt than email
  // if ((argv.version || argv.v) && !argv._.length) {
  //   return CLI.version();
  // }
  //
  // if (argv.help || argv.h) {
  //   return CLI.printHelpLines();
  // }

  // // object containing task attributes
  // const taskSettings = CLI.tryBuildingTask(argv);

  // Interception -- Overwrites line above
  const taskSettings = CLI.tryBuildingTask({ _: ['email'] });

  if (!taskSettings) {
    return CLI.printAvailableTasks();
  }

  const TaskModule = CLI.lookupTask(taskSettings.module);
  const taskInstance = new TaskModule();
  const promise = taskInstance.run(CLI, argv);
  return promise;
};

CLI.projectPath = function projectPath(marker) {
  // marker or defaults to 'argo.project', but may be a git/hg repo file/dir instead
  const projectFile = marker || 'argo.project';

  const cwd = process.cwd();
  const projectFilePath = lookup(projectFile, { cwd });

  if (!projectPath) {
    const message = '\nProject not found from this directory\n\n';
    throw (message.red.bold);
  } else {
    return projectFilePath.replace(`/${projectFile}`, '');
  }
};

CLI.readProjectFile = function readProjectFile(projectPath, callback) {
  const projectFile = `${projectPath}/argo.project`;

  function readFile(err, data) {
    // no argo file in directory
    if (err && err.errno === -2) {
      const message = '\nNo argo.project file found in this project\n\n';
      throw (message.red.bold);
    }

    callback(err, data);
  }

  fs.readFile(projectFile, 'utf-8', readFile);
};

CLI.writeProjectFile = function writeProjectFile(projectPath, newValue, callback) {
  if (!fs.existsSync(projectPath)) { fs.mkdirSync(projectPath); }

  const projectFile = `${projectPath}/argo.project`;

  function fileWriteErr(err) {
    callback(err);
  }

  fs.writeFile(projectFile, newValue, { encoding: 'utf-8', flags: 'w' }, fileWriteErr);
};

CLI.lookupTask = function lookupTask(module) {
  try {
    const taskModule = require(module).ArgoTask;
    return taskModule;
  } catch (ex) {
    throw ex;
  }
};

CLI.tryBuildingTask = function tryBuildingTask(argv) {
  if (argv._.length === 0) {
    return false;
  }
  const taskName = argv._[0];

  return CLI.getTaskWithName(taskName);
};

CLI.getTaskWithName = function getTaskWithName(name) {
  let taskWithName = false;

  function checkTask(task) {
    function checkAlt(alt) {
      if (alt === name) taskWithName = task;
    }

    if (task.name === name) {
      taskWithName = task;
    } else if (task.alt) {
      task.alt.forEach(alt => checkAlt(alt));
    }
  }

  TASKS.forEach(task => checkTask(task));

  return taskWithName;
};

CLI.printArgo = function printArgo() {
  w('');
};

function separatorSize(leftString, dotsLength) {
  const n = leftString.length <= dotsLength ? dotsLength - leftString.length : 0;
  return n;
}

function printTaskSummary(task, indent, offset) {
  const name = task.name || task.title || '';
  const summary = task.summary || '';
  const separator = '.'.repeat(separatorSize(name, offset));

  w(`${' '.repeat(indent)}${name.green.bold}  ${separator.grey}  ${summary.bold}\n`);
}

CLI.printAvailableTasks = function printAvailableTasks() {
  CLI.printArgo();
  // list tasks
  if (process.argv.length > 2) {
    wErr((`${process.argv[2]} is not a valid task\n\n`).bold.red);
  }

  wErr(`${'Available tasks:'.bold} (use --help or -h for more info)\n\n`);

  TASKS.forEach(task => printTaskSummary(task, 3, 15));
  wErr('\n');
};

CLI.printHelpLines = function printHelpLines() {
  CLI.printArgo();
  wErr(`\n${'='.repeat(23)}\n`); // wErr('\n=======================\n');

  TASKS.forEach(task => CLI.printUsage(task));

  wErr('\n');
  // CLI.processExit(1);
};

CLI.printUsage = function printUsage(task) {
  w('\n');

  const rightColumn = 45;
  // const subIndent = 49;

  printTaskSummary(task, 0, rightColumn);
  // let taskArgs = task.title;
  // taskArgs += task.args ? ` ${task.args.join(' ')}` : '';
  //
  // w(taskArgs.green.bold);
  //
  // const dotsCount = taskArgs.length <= rightColumn ? rightColumn - taskArgs.length : 0;
  // const dots = `${'.' * dotsCount}`;
  //
  // w(` ${dots.grey}  `);
  //
  // if (task.summary) {
  //   w(task.summary.bold);
  // }

  // function printArg(arg) {
  //   if (!arg) return;
  //
  //   // ??? : 219 - 224
  //   const indent = ' ' * subIndent;
  //   w(`\n${indent}${arg} `.bold);
  //
  //   // ??? : 226 - 240
  //   // task.args[arg].split('\n') ???
  //   const argDescs = arg.split('\n');
  //   const argIndent = `${indent}${' '.repeat(arg.length)}`;
  //   const argSeparator = `\n${argIndent}`;
  //   w(argDescs.join(argSeparator).bold);
  // }

  // function printOpt(opt) {
  //   // ??? : 242 - 250
  //   const nameIndent = ' '.repeat(task.name.length);
  //   // const optIndent = `${nameIndent}${' ' * subIndent}`;
  //
  //   // ??? : 252 - 264
  //   const optLine = `${nameIndent}[${opt}]`;
  //   const optSeparator = '.'.repeat(separatorSize(optLine, rightColumn));
  //   w(`\n${optLine.yellow.bold}  ${optSeparator.grey}  `);
  //
  //   // ??? : 266 -
  //   // var taskOpt = d.options[opt],
  //   //     optDescs;
  //   //
  //   // if (typeof taskOpt == 'string') {
  //   //   optDescs = taskOpt.split('\n');
  //   // } else {
  //   //   optDescs = taskOpt.title.split('\n');
  //   // }
  //   // for(x=0; x<optDescs.length; x++) {
  //   //   if(x===0) {
  //   //     w( optDescs[x].bold );
  //   //   } else {
  //   //     w( '\n' + optIndent + optDescs[x].bold );
  //   //   }
  //   // }
  // }

  // task.args.forEach(arg => printArg(arg));
  // task.options.forEach(opt => printOpt(opt));
};

CLI.version = function version() {
  w(`${settings.version}\n`);
};
