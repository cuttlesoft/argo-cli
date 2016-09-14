const slugify = require('slug');

const noRepoQuestions = [
  {
    type: 'input',
    name: 'name',
    message: 'Project name:',
  },
  {
    type: 'input',
    name: 'slug',
    message: 'Project slug:',
    default(answers) {
      return slugify(answers.name, { lower: true, replacement: '.' });
    },
  },
  {
    type: 'list',
    name: 'scm',
    message: 'Which SCM is this repository?',
    choices: ['git', 'hg'],
  },
  {
    type: 'list',
    name: 'repoHost',
    message: 'Where would you like to host the repo?',
    choices: ['github.com', 'bitbucket.org'],
    default() {
      return 'bitbucket.org';
    },
    when(answers) {
      return answers.scm === 'git';
    },
  },
];

const repoQuestions = [
  {
    type: 'input',
    name: 'name',
    message: 'Project name:',
  },
  {
    type: 'input',
    name: 'slug',
    message: 'Project slug:',
    default(answers) {
      return slugify(answers.name, { lower: true, replacement: '.' });
    },
  },
];

// {
//   type: 'list',
//   name: 'repo',
//   message: 'Choose the repository (or create a new one).',
//   choices: ['create new', 'frla.cms', 'jdms', 'jdms.filebatcher']
// },
// {
//   type: 'confirm',
//   name: 'docker',
//   message: 'Is this a Docker project?',
//   default: false
// },
// {
//   type: 'confirm',
//   name: 'ecr',
//   message: 'Create an ECR repo?',
//   default: false
// },
// {
//   type: 'confirm',
//   name: 'jenkins',
//   message: 'Create Jenkins jobs?',
//   default: false
// },
// {
//   type: 'checkbox',
//   name: 'template',
//   message: 'Which template(s) shall be used',
//   choices: ['template1', 'template2', 'template3'],
//   when: function (answers) {
//     return answers.jenkins == true;
//   }
// }

exports.noRepoQuestions = noRepoQuestions;
exports.repoQuestions = repoQuestions;
