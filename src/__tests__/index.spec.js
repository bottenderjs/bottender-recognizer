const delay = require('delay');

const { createHandler, combineRecognizers } = require('../');

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

    const context = {
      state: {},
      event: {},
    };

    const intent = await recognizers(context.state, context.event);

    expect(intent).toEqual({ name: 'intent' });
  });

  it('will get UNKNOWN name if return not truthy intent', async () => {
    const recognizers = combineRecognizers([
      () => Promise.resolve(null),
      () => Promise.resolve(null),
    ]);

    const context = {
      state: {},
      event: {},
    };

    const intent = await recognizers(context.state, context.event);

    expect(intent).toEqual({ name: 'UNKNOWN' });
  });

  it('will get UNKNOWN name if it runs too long', async () => {
    const recognizers = combineRecognizers(
      [() => delay(1000).then(() => 'intent')],
      { timeout: 100 }
    );

    const context = {
      state: {},
      event: {},
    };

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

    const context = {
      state: {},
      event: {},
    };

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
    const context = {
      state: {},
      event: {},
    };

    const handler = createHandler({ recognizer, resolver });

    const otherArg = {};

    await handler(context, otherArg);

    expect(targetHandler).toBeCalledWith(context, otherArg);
  });
});
