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
