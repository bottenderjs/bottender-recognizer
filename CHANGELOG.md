# 0.3.0 / 2018-09-20 

* [new] support multi-platform bot

# 0.2.2 / 2018-07-25

* [new] add debug for chatbase
* [new] warn when pass func arg (#25)
* [new] set `UNKNOWN` intent as not handled

# 0.2.1 / 2018-06-29

* [fix] throw error when receiving LINE join group event.

# 0.2.0 / 2018-05-02

* [new] implement `derivedState` + `derivedParam`: [#15](https://github.com/Yoctol/bottender-recognizer/pull/15)

```js
const action = resolver(state, intent);
const { action, derivedState, derivedParam } = resolver(state, intent);
```

* `derivedState` will be used to `setState` before action be executed.
* `derivedParam` will be passed to action as second argument.

# 0.1.3 / 2018-04-25

* [fix] pass ...otherArgs to underlying handler

# 0.1.2 / 2018-04-09

* [new] use `action.displayName` as action name when possible

# 0.1.1 / 2018-01-10

* Fix bug usage in setting agent messages

# 0.1.0 / 2017-12-21

* First Release
