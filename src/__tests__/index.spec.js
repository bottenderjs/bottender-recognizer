const delay = require('delay');
const warning = require('warning');

const { createHandler, combineRecognizers } = require('../');

jest.mock('warning');

function createContext() {
  return {
    state: {},
    event: {},
    setState(state) {
      this.state = {
        ...this.state,
        ...state,
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
