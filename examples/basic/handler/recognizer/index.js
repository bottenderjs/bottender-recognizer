const { combineRecognizers } = require('bottender-recognizer');

const regex = require('./regex');
const nlu = require('./nlu');

module.exports = combineRecognizers([regex, nlu]);
