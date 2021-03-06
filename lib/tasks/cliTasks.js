/* init commander component
 * To use add require('../cmds/init.js')(program) to your commander.js based
 * node executable before program.parse
 */

const TASKS = [
  {
    title: 'init',
    name: 'init',
    summary: 'Start a new argo project.',
    module: './tasks/init',
  },
  {
    title: 'update',
    name: 'update',
    summary: 'Update existing project.',
    module: './tasks/update',
  },
  {
    title: 'rule',
    name: 'rule',
    summary: 'Manage rules for a project.',
    module: './tasks/rule',
  },
  {
    title: 'email',
    name: 'email',
    summary: 'Add user to argo mailing list.',
    module: './tasks/email',
  },
];

module.exports = TASKS;
