# bottender-recognizer

[![npm](https://img.shields.io/npm/v/bottender-recognizer.svg?style=flat-square)](https://www.npmjs.com/package/bottender-recognizer)
[![CircleCI](https://circleci.com/gh/Yoctol/bottender-recognizer.svg?style=shield)](https://circleci.com/gh/Yoctol/bottender-recognizer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Build bottender bots with intent recognizer and action resolver.

## Installation

```sh
npm install bottender-recognizer
```

## Definition

### Recognizer

```
(state, event) => intent | undefined
```

Example:

```js
async (state, intent) => ({
  name: 'INTENT_NAME',
  payload: {},
});
```

### Intent

* `name` - Must have.
* `payload` - Recommended.

Example:

```js
{
  name: "INTENT_NAME",
  payload: {}
}
```

### Resolver

```
(state, intent) => action
```

Example:

```js
(state, intent) => doSomething;
```

With `derivedState` and `derivedParam`:

```
(state, intent) => derivedState + derivedParam + action
```

Example:

```js
(state, intent) => ({
  action: doSomething,
  derivedState: {
    x: 1,
  },
  derivedParam: {
    y: 2,
  },
});
```

### Action

```
context => void
```

Example:

```js
async context => {
  // ...
};
```

With parameters:

```
context + param => void
```

Example:

```js
async (context, param) => {
  // ...
};
```

## API Reference

### `createHandler({ recognizer, resolver, chatbase, debug })`

It creates a bottender handler function.

```js
createHandler({
  recognizer,
  resolver,
  chatbase: {
    apiKey: process.env.CHATBASE_KEY,
    platform: 'Facebook',
  },
  debug: true,
});
```

### `combineRecognizers(recognizers)`

It turns an array of recognizers into a single recognizer that you can pass to `createHandler`.

```js
const regex = (state, event) => {
  if (event.isText && /^Hi$/i.test(event.text)) {
    return {
      name: 'GREETING',
      payload: {
        // other args...
      },
    };
  }
};

const nlu = async (state, event) => {
  //...
};

combineRecognizers([regex, nlu]);
```

## License

MIT © [Yoctol](https://github.com/Yoctol/bottender-recognizer)
