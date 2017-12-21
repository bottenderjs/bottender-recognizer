module.exports = (state, event) => {
  if (event.isText && /^Hi$/i.test(event.text)) {
    return {
      name: 'GREETING',
      payload: {
        // other args...
      },
    };
  }
};
