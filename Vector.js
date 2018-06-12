'use strict';

const {deprecated} = require('./lib/util');
deprecated("require('Vector.js')", "`const {Vector} = require('dualpantoframework');`");

// this file exists to be backward compatible
module.exports = require('./lib/geometry/vector');
