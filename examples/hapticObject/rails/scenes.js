/* eslint-disable require-jsdoc */
const DualPantoFramework = require('../../../lib/dualpantoframework');
const {Vector, Components} = DualPantoFramework;
const {
  BoxCollider, Rail} = Components;

function scene1(device) {
  const handles = [0, 1];
  // render small maze (similar to doom level 1)
  const leftWallPart = device.addHapticObject(
      new Vector(-75, -50));
  leftWallPart.addComponent(
      new BoxCollider(new Vector(120, 10), handles));
  const leftMiddleWall = device.addHapticObject(
      new Vector(-25, -60));
  leftMiddleWall.addComponent(
      new BoxCollider(new Vector(10, 20), handles));
  const rightWallPart = device.addHapticObject(
      new Vector(75, -50));
  rightWallPart.addComponent(
      new BoxCollider(new Vector(120, 10), handles));
  const rightMiddleWall = device.addHapticObject(
      new Vector(25, -60));
  rightMiddleWall.addComponent(
      new BoxCollider(new Vector(10, 20), handles));
  const rail = device.addHapticObject(
      new Vector(10, -100));
  rail.addComponent(
      new Rail(new Vector(4, 40), handles));
}
module.exports = {
  scene1
};
