const { combineRecognizers } = require('../utils');

const regex = require('./regex');
const nlu = require('./nlu');

module.exports = combineRecognizers([regex, nlu]);
