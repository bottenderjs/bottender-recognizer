const delay = require('delay');

exports.combineRecognizers = function combineRecognizers(
  recognizers,
  { timeout } = { timeout: 10000 }
) {
  return async function recognizer(state, event) {
    const resultPromise = new Promise((resolve, reject) => {
      Promise.all(
        recognizers.map(r =>
          Promise.resolve()
            .then(() => r(state, event))
            .then(result => {
              if (result) resolve(result);
            })
            .catch(console.error)
        )
      ).then(() => resolve());
    });

    const timeoutPromise = delay(timeout);

    const result = await Promise.race([resultPromise, timeoutPromise]);

    return result || { name: 'UNKNOWN' };
  };
};

exports.createHandler = function createHandler({
  recognizer,
  map,
  chatbase,
  debug,
}) {
  const USE_CHATBASE = chatbase && chatbase.apiKey && chatbase.platform && true;

  if (USE_CHATBASE) {
    chatbase = require('@google/chatbase')
      .setApiKey(chatbase.apiKey) // Your Chatbase API Key
      .setPlatform(chatbase.platform); // The platform you are interacting with the user over
  }

  return async context => {
    const intent = await recognizer(context.state, context.event);

    // log intent to chatbase or other service here
    if (debug) {
      console.log('Intent: ', intent);
    }

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

    const action = map[intent.name] || map.default;

    if (debug) {
      console.log('Action: ', action.name);
    }

    if (USE_CHATBASE) {
      chatbase
        .setAsTypeAgent()
        .setUserId(context.session.user.id)
        .setMessage(action.name || intent.name)
        .setTimestamp(Date.now().toString())
        .send()
        .catch(console.error);
    }

    await action(context);
  };
};
