const recognizer = require('./recognizer');
const actions = require('./actions');
const { createHandler } = require('./utils');

Object.entries(actions).forEach(([name, fn]) => {
  Object.defineProperty(fn, 'name', { value: name });
});

module.exports = createHandler({
  recognizer,

  map: {
    GREETING: actions.sendHello,
    心情平淡: actions.sendGan,
    default: actions.sendSorry,
  },

  chatbase: {
    apiKey: process.env.CHATBASE_KEY,
    platform: 'Facebook',
  },

  debug: true,
});
