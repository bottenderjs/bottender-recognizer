const classifier = require('./classifier');
const actions = require('./actions');

module.exports = async context => {
  const intent = await classifier(context.state, context.event);

  switch (intent.name) {
    case 'GREETING':
      await actions.sendHello(context);
      break;
    default:
      await actions.sendSorry(context);
  }
}
