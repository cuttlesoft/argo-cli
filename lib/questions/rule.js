
const ruleTriggers = {
  'repo:push': ['branch', 'tag'],
  'pullrequest:created': ['branch', 'actor'],
  // 'pullrequest:declined': ['branch', 'actor', 'author']
};

const questions = [
  {
    type: 'list',
    name: 'trigger',
    message: 'Rule trigger:',
    choices() {
      const triggers = [];
      // functional way of doing this? https://github.com/airbnb/javascript#iterators--nope
      ruleTriggers.forEach(trigger => triggers.push(trigger));
      return triggers;
    },
  },
  {
    type: 'list',
    name: 'conditionType',
    message: 'Rule condition:', // condition(s)
    choices(answers) {
      return ruleTriggers[answers.trigger];
    },
  },
  {
    type: 'input',
    name: 'conditionValue',
    message(answers) {
      const condition = answers.conditionType;
      return `${condition.charAt(0).toUpperCase()} + ${condition.slice(1)} + :`;
    },
  },
  {
    type: 'list',
    name: 'actionType',
    message: 'Rule action:', // action(s)
    choices: ['hook', 'http'],
  },
  // if hook: list of hook options from config
  //          then url endpoint input to append
  // if http: full url input
  {
    type: 'input',
    name: 'actionValue',
    message: 'URL:',
    when(answers) {
      return ['hook', 'http'].indexOf(answers.actionType) !== -1;
    },
  },
];

exports.questions = questions;
