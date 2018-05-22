'use strict';

/** Class for Class for defining Panto Vecotrs with x, y cords and r as roation
*/
class Vector {
    /**
    * Create a Vector object.
    * @param {number} [x=0] - x coordinate
    * @param {number} [y=0] - y coordinate
    * @param {number} r - rotation in radian
    */
    constructor(x = 0, y = 0, r) {
        this.x = x;
        this.y = y;
        this.r = r;
    }

    /**
    * Calculates and returns the dot product with another vector.
    * @param {Vector} vector - vector to operate with
    * @return {number} The calculated result
    */
    dot(vector) {
        return this.x*vector.x + this.y*vector.y;
    }

    /**
    * Scales this Vector with a factor.
    * @param {number} factor - factor to scale vector
    * @return {Vector} The scaled Vector
    */
    scale(factor) {  
        this.x *= factor;
        this.y *= factor;
        return this;
    }

    /**
    * Creates a scaled vector.
    * @param {number} factor - factor to scale vector
    * @return {Vector} The new scaled Vector
    */
    scaled(factor) {
        return new Vector(this.x*factor, this.y*factor);
    }

    /**
    * Adds a vector to this vector.
    * @param {Vector} vector - vector to operate with
    * @return {Vector} The summed up vector
    */
    add(vector) {
        this.x += vector.x;
        this.y += vector.y;
        return this;
    }

    /**
    * Returns the sum of this vector and another vector.
    * @param {Vector} vector - vector to operate with
    * @return {Vector} The new summed up vector
    */
    sum(vector) {
        return new Vector(this.x+vector.x, this.y+vector.y);
    }

    /**
    * Subtracts a vector from this vector.
    * @param {Vector} vector - vector to operate with
    * @return {Vector} The reduced vector
    */
    subtract(vector) {
        this.x -= vector.x;
        this.y -= vector.y;
        return this;
    }

    /**
    * Returns the difference of this vector and another vector.
    * @param {Vector} vector - vector to operate with
    * @return {Vector} The difference vector
    */
    difference(vector) {
        return new Vector(this.x-vector.x, this.y-vector.y);
    }

    /**
    * Calculates the length of the vector
    * @return {number} length of vector
    */
    length() {
        return Math.sqrt(this.dot(this));
    }

    /**
    * Calculates the polar angle of the vector
    * Right-hand coordinate system:
    * Positive rotation => Counter Clock Wise
    * Positive X-Axis is 0
    * @return {number} polar angle of vector
    */
    polarAngle() {
        return Math.atan2(this.y, this.x);
    }

    /**
    * Normalizes the vector
    * @return {Vector} this normalized vector
    */
    normalized() {
        return this.scaled(1.0/this.length());
    }
    
    /**
    * Creates a transformed vector by multiplication with a matrix
    * @param {Array} matrix - matrix to operate with
    * @return {Vector} The transfromed vector
    */
    product(matrix) {
        return new Vector(
            matrix[0]*this.x + matrix[1]*this.y,
            matrix[2]*this.x + matrix[3]*this.y
        );
    }

    draw(context) {
        context.lineTo(this.x, -this.y);
    }
}

module.exports = Vector;
