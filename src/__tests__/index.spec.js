const { createHandler, combineRecognizers } = require('../');

it('exports public apis', () => {
  expect(createHandler).toBeDefined();
  expect(combineRecognizers).toBeDefined();
});
