const { Client } = require('ynlu');

const client = Client.connect(process.env.TOKEN);
const classifier = client.findClassifierById('20');

module.exports = async (state, event) => {
  if (event.isText) {
    // the second parameter is Boolean, represent exactly match or not
    const result = await classifier.predict(event.text, true);

    if (result && result.intents[0]) {
      const intent = result.intents[0];

      return {
        name: intent.name,
        payload: {
          score: intent.score,
          entities: result.entities,
          match: result.match,
        },
      };
    }
  }
};
