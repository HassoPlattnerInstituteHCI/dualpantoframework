'use strict';

const {deprecated} = require('./lib/util');
deprecated("require('Framework.js')", "`const {Broker} = require('dualpantoframework'); const broker = new Broker();`");

// export the dualpantoframework from the lib directory
module.exports = require('./lib/dualpantoframework');
