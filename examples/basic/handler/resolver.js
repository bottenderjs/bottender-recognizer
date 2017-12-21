const actions = require('./actions');

Object.entries(actions).forEach(([name, fn]) => {
  Object.defineProperty(fn, 'name', { value: name });
});

module.exports = (state, intent) => {
  switch (intent.name) {
    case 'GREETING':
      return actions.sendHello;
    default:
      return actions.sendSorry;
  }
};
