'use strict';

const util = module.exports = {};

// convert a JavaScript object to readable JSON
util.getJSON = data => `${JSON.stringify(data, null, '    ')}\n`;
