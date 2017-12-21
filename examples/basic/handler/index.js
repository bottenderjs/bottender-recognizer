const { createHandler } = require('bottender-recognizer');

const recognizer = require('./recognizer');
const resolver = require('./resolver');

module.exports = createHandler({
  recognizer,
  resolver,
  chatbase: {
    apiKey: process.env.CHATBASE_KEY,
    platform: 'Facebook',
  },
  debug: true,
});
