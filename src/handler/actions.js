const B = require('bottender-compose');

// or import actions from CMS

exports.sendHello = B.sendText('Hello');

exports.sendGan = B.sendText('Gan..');

exports.sendSorry = B.sendText('Sorry..');
