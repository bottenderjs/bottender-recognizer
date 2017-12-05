module.exports = async (state, event) => {
  // combineClassifers utils?
  // How to combine Regex and NLU
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
