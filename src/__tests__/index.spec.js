const delay = require('delay');
const warning = require('warning');

const { createHandler, combineRecognizers } = require('../');

jest.mock('warning');
jest.mock('@google/chatbase', () => ({
  setApiKey: jest.fn().mockReturnThis(),
  setPlatform: jest.fn().mockReturnThis(),
  setAsTypeUser: jest.fn().mockReturnThis(),
  setAsTypeAgent: jest.fn().mockReturnThis(),
  newMessage: jest.fn(),
}));

function createContext({ state = {}, event = {}, session = {} } = {}) {
  return {
    state,
    event,
    session,
    setState(_state) {
      this.state = {
        ...this.state,
        ..._state,
      };
    },
  };
}

it('exports public apis', () => {
  expect(createHandler).toBeDefined();
  expect(combineRecognizers).toBeDefined();
});

describe('#combineRecognizers', () => {
  it('will get truthy intent', async () => {
    const recognizers = combineRecognizers([
      () => Promise.resolve(null),
      () => Promise.resolve({ name: 'intent' }),
    ]);

    const context = createContext();

    const intent = await recognizers(context.state, context.event);

    expect(intent).toEqual({ name: 'intent' });
  });

  it('will get UNKNOWN name if return not truthy intent', async () => {
    const recognizers = combineRecognizers([
      () => Promise.resolve(null),
      () => Promise.resolve(null),
    ]);

    const context = createContext();

    const intent = await recognizers(context.state, context.event);

    expect(intent).toEqual({ name: 'UNKNOWN' });
  });

  it('will get UNKNOWN name if it runs too long', async () => {
    const recognizers = combineRecognizers(
      [() => delay(1000).then(() => 'intent')],
      { timeout: 100 }
    );

    const context = createContext();

    const intent = recognizers(context.state, context.event);
    await Promise.resolve();

    jest.runTimersToTime(100);

    await expect(intent).resolves.toEqual({ name: 'UNKNOWN' });
  });

  it('will get intent if its running time is smaller than timeout', async () => {
    const recognizers = combineRecognizers(
      [() => delay(100).then(() => ({ name: 'intent' }))],
      { timeout: 500 }
    );

    const context = createContext();

    const intent = recognizers(context.state, context.event);
    await Promise.resolve();

    jest.runTimersToTime(100);

    await expect(intent).resolves.toEqual({ name: 'intent' });
  });
});

describe('#createHandler', () => {
  it('should pass other args to targetHandler', async () => {
    const targetHandler = jest.fn();
    const recognizer = () => Promise.resolve({ name: 'intent' });
    const resolver = () => targetHandler;
    const context = createContext();

    const handler = createHandler({ recognizer, resolver });

    const otherArg = {};

    await handler(context, otherArg);

    expect(targetHandler).toBeCalledWith(context, otherArg);
  });

  it('should warning when resolver resolve undefined', async () => {
    const recognizer = () => Promise.resolve({ name: 'intent' });
    const resolver = () => {};
    const context = createContext();

    const handler = createHandler({ recognizer, resolver });

    await handler(context);

    expect(warning).toBeCalled();
  });

  it('should support derivedState', async () => {
    const targetHandler = jest.fn();
    const recognizer = () => Promise.resolve({ name: 'intent' });
    const resolver = () => ({
      action: targetHandler,
      derivedState: {
        x: 1,
      },
    });
    const context = createContext();

    const handler = createHandler({ recognizer, resolver });

    await handler(context);

    expect(targetHandler.mock.calls[0][0].state).toEqual({
      x: 1,
    });
  });

  describe('derivedParam', () => {
    it('should warning when second arg is not an object', async () => {
      const targetHandler = jest.fn();
      const recognizer = () => Promise.resolve({ name: 'intent' });
      const resolver = () => ({
        action: targetHandler,
        derivedParam: {
          x: 1,
        },
      });
      const context = createContext();

      const handler = createHandler({ recognizer, resolver });

      await handler(context, 1);

      expect(targetHandler).toBeCalledWith(context, 1);
      expect(warning).toBeCalled();
    });

    it('should merge when second arg is an object', async () => {
      const targetHandler = jest.fn();
      const recognizer = () => Promise.resolve({ name: 'intent' });
      const resolver = () => ({
        action: targetHandler,
        derivedParam: {
          x: 1,
        },
      });
      const context = createContext();

      const handler = createHandler({ recognizer, resolver });

      await handler(context, { y: 2 });

      expect(targetHandler).toBeCalledWith(context, { x: 1, y: 2 });
    });

    it('should provide param when second arg is undefined', async () => {
      const targetHandler = jest.fn();
      const recognizer = () => Promise.resolve({ name: 'intent' });
      const resolver = () => ({
        action: targetHandler,
        derivedParam: {
          x: 1,
        },
      });
      const context = createContext();

      const handler = createHandler({ recognizer, resolver });

      await handler(context);

      expect(targetHandler).toBeCalledWith(context, { x: 1 });
    });
  });
});

describe('chatbase', () => {
  it('should send message to chatbase', async () => {
    const chatbase = require('@google/chatbase');

    const userMessage = {
      setUserId: jest.fn().mockReturnThis(),
      setIntent: jest.fn().mockReturnThis(),
      setMessage: jest.fn().mockReturnThis(),
      setAsHandled: jest.fn().mockReturnThis(),
      setTimestamp: jest.fn().mockReturnThis(),
      send: jest.fn().mockResolvedValue(),
    };
    const agentMessage = {
      setUserId: jest.fn().mockReturnThis(),
      setMessage: jest.fn().mockReturnThis(),
      setTimestamp: jest.fn().mockReturnThis(),
      send: jest.fn().mockResolvedValue(),
    };

    chatbase.newMessage
      .mockReturnValueOnce(userMessage)
      .mockReturnValueOnce(agentMessage);

    const targetHandler = jest.fn();
    targetHandler.displayName = 'foobar';

    const recognizer = () => Promise.resolve({ name: 'intent' });
    const resolver = () => ({
      action: targetHandler,
    });
    const context = createContext({
      session: {
        user: {
          id: '1234567890',
        },
      },
      event: {
        text: 'hi',
      },
    });

    const handler = createHandler({
      recognizer,
      resolver,
      chatbase: {
        apiKey: '<API_KEY>',
        platform: 'Messenger',
      },
    });

    await handler(context);

    expect(chatbase.setApiKey).toBeCalledWith('<API_KEY>');
    expect(chatbase.setPlatform).toBeCalledWith('Messenger');

    expect(userMessage.setUserId).toBeCalledWith('1234567890');
    expect(userMessage.setIntent).toBeCalledWith('intent');
    expect(userMessage.setMessage).toBeCalledWith('hi');
    expect(userMessage.setAsHandled).toBeCalled();
    expect(userMessage.setTimestamp).toBeCalledWith(expect.any(String));
    expect(userMessage.send).toBeCalled();

    expect(agentMessage.setUserId).toBeCalledWith('1234567890');
    expect(agentMessage.setMessage).toBeCalledWith('foobar');
    expect(agentMessage.setTimestamp).toBeCalledWith(expect.any(String));
    expect(agentMessage.send).toBeCalled();
  });

  it('should not throw when no session user', async () => {
    const chatbase = require('@google/chatbase');

    const userMessage = {
      setUserId: jest.fn().mockReturnThis(),
      setIntent: jest.fn().mockReturnThis(),
      setMessage: jest.fn().mockReturnThis(),
      setAsHandled: jest.fn().mockReturnThis(),
      setTimestamp: jest.fn().mockReturnThis(),
      send: jest.fn().mockResolvedValue(),
    };
    const agentMessage = {
      setUserId: jest.fn().mockReturnThis(),
      setMessage: jest.fn().mockReturnThis(),
      setTimestamp: jest.fn().mockReturnThis(),
      send: jest.fn().mockResolvedValue(),
    };

    chatbase.newMessage
      .mockReturnValueOnce(userMessage)
      .mockReturnValueOnce(agentMessage);

    const targetHandler = jest.fn();
    targetHandler.displayName = 'foobar';

    const recognizer = () => Promise.resolve({ name: 'intent' });
    const resolver = () => ({
      action: targetHandler,
    });
    const context = createContext({
      session: {},
      event: {
        text: 'hi',
      },
    });

    const handler = createHandler({
      recognizer,
      resolver,
      chatbase: {
        apiKey: '<API_KEY>',
        platform: 'Messenger',
      },
    });

    await handler(context);
  });
});
