const delay = require('delay');

exports.combineRecognizers = function combineRecognizers(
  recognizers,
  { timeout } = { timeout: 10000 }
) {
  return async function recognizer(state, event) {
    const resultPromise = new Promise(resolve => {
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
  resolver,
  chatbase,
  debug,
}) {
  const USE_CHATBASE = chatbase && chatbase.apiKey && chatbase.platform && true;

  let _chatbase;

  if (USE_CHATBASE) {
    _chatbase = require('@google/chatbase')
      .setApiKey(chatbase.apiKey) // Your Chatbase API Key
      .setPlatform(chatbase.platform); // The platform you are interacting with the user over
  }

  return async (context, ...otherArgs) => {
    const intent = await recognizer(context.state, context.event);

    // log intent to chatbase or other service here
    if (debug) {
      console.log('Intent: ', intent);
    }

    if (USE_CHATBASE) {
      _chatbase
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

    const action = resolver(context.state, intent);

    if (debug) {
      console.log('Action: ', action.displayName || action.name);
    }

    if (USE_CHATBASE) {
      _chatbase
        .setAsTypeAgent()
        .newMessage()
        .setUserId(context.session.user.id)
        .setMessage(action.displayName || action.name || intent.name)
        .setTimestamp(Date.now().toString())
        .send()
        .catch(console.error);
    }

    await action(context, ...otherArgs);
  };
};
