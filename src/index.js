const delay = require('delay');
const warning = require('warning');
const _debug = require('debug');

const chatbaseDebug = _debug('bottender-recognizer:chatbase');

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

  return async (context, arg, ...otherArgs) => {
    const intent = await recognizer(context.state, context.event);

    // log intent to chatbase or other service here
    if (debug) {
      console.log('Intent: ', intent);
    }

    if (USE_CHATBASE) {
      if (intent.name !== 'UNKNOWN') {
        _chatbase
          .setAsTypeUser()
          .newMessage()
          .setUserId(
            (context.session.user && context.session.user.id) || 'Unknown'
          )
          .setIntent(intent.name)
          .setMessage(context.event.text || context.event.payload || 'Unknown')
          .setAsHandled()
          .setTimestamp(Date.now().toString())
          .send()
          .then(message => {
            chatbaseDebug(message.getCreateResponse());
            return message;
          })
          .catch(console.error);
      } else {
        _chatbase
          .setAsTypeUser()
          .newMessage()
          .setUserId(
            (context.session.user && context.session.user.id) || 'Unknown'
          )
          .setIntent('UNKNOWN')
          .setMessage(context.event.text || context.event.payload || 'Unknown')
          .setAsNotHandled()
          .setTimestamp(Date.now().toString())
          .send()
          .then(message => {
            chatbaseDebug(message.getCreateResponse());
            return message;
          })
          .catch(console.error);
      }
    }

    const result = resolver(context.state, intent);

    if (
      !result ||
      !(typeof result === 'object' || typeof result === 'function')
    ) {
      warning(false, 'resolver must return a function or an object.');
      return;
    }

    let action;
    let derivedState;
    let derivedParam;

    if (typeof result === 'object') {
      ({ action, derivedState, derivedParam } = result);
    } else {
      action = result;
    }

    if (debug) {
      console.log('Action: ', action.displayName || action.name);
    }

    if (USE_CHATBASE) {
      _chatbase
        .setAsTypeAgent()
        .newMessage()
        .setUserId(
          (context.session.user && context.session.user.id) || 'Unknown'
        )
        .setMessage(action.displayName || action.name || intent.name)
        .setTimestamp(Date.now().toString())
        .send()
        .then(message => {
          chatbaseDebug(message.getCreateResponse());
          return message;
        })
        .catch(console.error);
    }

    if (derivedState) {
      context.setState(derivedState);
    }

    if (typeof arg === 'function') {
      warning(
        false,
        'should not pass function type arg. It will be ignored by handler. You may accidentally pass middleware next function as arg.'
      );
      arg = undefined;
    }

    if (!derivedParam) {
      await action(context, arg, ...otherArgs);
      return;
    }
    if (arg && typeof arg !== 'object') {
      warning(
        false,
        'should not provide non-object type arg with derivedParam. derivedParam will not be applied.'
      );
      await action(context, arg, ...otherArgs);
    } else {
      const mergedArg = {
        ...arg,
        ...derivedParam,
      };
      await action(context, mergedArg, ...otherArgs);
    }
  };
};
