const classifier = require('./classifier');
const actions = require('./actions');

module.exports = async context => {
  const intent = await classifier(context.state, context.event);

  // log intent to chatbase or other service here

  switch (intent.name) {
    case 'GREETING':
      await actions.sendHello(context);
      break;
    default:
      await actions.sendSorry(context);
  }
}
