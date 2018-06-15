'use strict';

const controller = module.exports = {};

controller.FreeController = require('./free');
controller.PositionController = require('./position');
controller.ForceController = require('./force');

// Interface for controllers. (for documentation only)

/**
 * Virtual interface for controllers. These are used by the {@link Handle} to control movement.
 * @class
 * @name Controller
 * @prop {Handle} handle - the handle that uses this controller
 * @param {Handle} handle - the handle that uses this controller
 * @private
 */

/**
 * The controller is no longer used and should stop all current activity.
 * @function
 * @memberof Controller#
 * @name end
 */

/**
 * The controller should update the motor power values.
 * @function
 * @memberof Controller#
 * @name update
 * @param {number} deltaTime - time since last update in microseconds
 */
