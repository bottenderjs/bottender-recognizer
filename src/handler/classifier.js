module.exports = async (state, event) => {
  // combineClassifers utils?
  // how to combine Regex and NLU
  if (event.isText && /^Hi$/i.test(event.text)) {
    return {
      name: 'GREETING',
      // other args?
    };
  }

  return {
    name: 'UNKNOWN',
  };
}
