const recognizer = require('./recognizer');
const actions = require('./actions');

const USE_CHATBASE = !!process.env.CHATBASE_KEY;

let chatbase;

if (USE_CHATBASE) {
  chatbase = require('@google/chatbase')
    .setApiKey(process.env.CHATBASE_KEY) // Your Chatbase API Key
    .setPlatform('Facebook'); // The platform you are interacting with the user over
}

module.exports = async context => {
  const intent = await recognizer(context.state, context.event);

  // log intent to chatbase or other service here
  console.log(intent);
  if (USE_CHATBASE) {
    chatbase
      .setAsTypeUser()
      .newMessage()
      .setUserId(context.session.user.id)
      .setIntent(intent.name)
      .setMessage(context.event.text || context.event.payload || 'Unknown')
      .setAsHandled()
      .setTimestamp(Date.now().toString())
      .send()
      .catch(console.error);
  }

  switch (intent.name) {
    case 'GREETING':
      await actions.sendHello(context);
      break;
    case '心情平淡':
      await actions.sendGan(context);
      break;
    default:
      await actions.sendSorry(context);
  }
};
