'use strict';

/**
 * @description Class for Class for defining Panto Vectors with x, y
 * coordinates and r as roation
 */
class Vector {
  /**
   * @description Create a Vector object.
   * @param {number} [x=0] - X coordinate.
   * @param {number} [y=0] - Y coordinate.
   * @param {number} r - Rotation in radians.
   */
  constructor(x = 0, y = 0, r) {
    this.x = x;
    this.y = y;
    this.r = r;
  }

  /**
   * @description Calculates and returns the dot product with another vector.
   * @param {Vector} vector - Vector to operate with.
   * @return {number} The calculated result.
   */
  dot(vector) {
    return this.x*vector.x + this.y*vector.y;
  }

  /**
   * @description Scales this Vector with a factor.
   * @param {number} factor - Factor to scale vector.
   * @return {Vector} The scaled Vector.
   */
  scale(factor) {
    this.x *= factor;
    this.y *= factor;
    return this;
  }

  /**
   * @description Creates a scaled vector.
   * @param {number} factor - Factor to scale vector.
   * @return {Vector} The new scaled Vector.
   */
  scaled(factor) {
    return new Vector(this.x*factor, this.y*factor);
  }

  /**
   * @description Adds a vector to this vector.
   * @param {Vector} vector - Vector to operate with.
   * @return {Vector} The summed up vector.
   */
  add(vector) {
    this.x += vector.x;
    this.y += vector.y;
    return this;
  }

  /**
   * @description Returns the sum of this vector and another vector.
   * @param {Vector} vector - Vector to operate with.
   * @return {Vector} The new summed up vector.
   */
  sum(vector) {
    return new Vector(this.x+vector.x, this.y+vector.y);
  }

  /**
   * @description Subtracts a vector from this vector.
   * @param {Vector} vector - Vector to operate with.
   * @return {Vector} The reduced vector.
   */
  subtract(vector) {
    this.x -= vector.x;
    this.y -= vector.y;
    return this;
  }

  /**
   * @description Returns the difference of this vector and another vector.
   * @param {Vector} vector - Vector to operate with.
   * @return {Vector} The difference vector.
   */
  difference(vector) {
    return new Vector(this.x-vector.x, this.y-vector.y);
  }

  /**
   * @description Calculates the length of the vector.
   * @return {number} - Length of vector.
   */
  length() {
    return Math.sqrt(this.dot(this));
  }

  /**
   * @description Calculates the polar angle of the vector.
   * Right-hand coordinate system:
   * Positive rotation => Counter Clock Wise
   * Positive X-Axis is 0.
   * @return {number} Polar angle of vector.
   */
  polarAngle() {
    return Math.atan2(this.y, this.x);
  }

  /**
   * @description Rotates the vector with the given angle.
   * Right-hand coordinate system:
   * Positive rotation => Counter Clock Wise
   * Positive X-Axis is 0.
   * @param {number} angle - Angle in radians.
   * @return {Vector} The rotated vector.
   */
  rotate(angle) {
    const rotationMatrix = [Math.cos(angle), (-1.0) * Math.sin(angle),
      Math.sin(angle), Math.cos(angle)];
    return this.product(rotationMatrix);
  }

  /**
   * @description Normalizes the vector.
   * @return {Vector} This normalized vector.
   */
  normalized() {
    return this.scaled(1.0/this.length());
  }

  /**
   * @description Creates a transformed vector by multiplication with a matrix.
   * @param {Array} matrix - Matrix to operate with.
   * @return {Vector} The transfromed vector.
   */
  product(matrix) {
    return new Vector(
        matrix[0]*this.x + matrix[1]*this.y,
        matrix[2]*this.x + matrix[3]*this.y
    );
  }
}

module.exports = Vector;
