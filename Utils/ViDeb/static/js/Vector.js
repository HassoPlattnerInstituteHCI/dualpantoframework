'use strict';

class Vector {
    constructor(x = 0, y = 0, r) {
        this.x = x;
        this.y = y;
        this.r = r;
    }

    dot(vector) {
        return this.x*vector.x + this.y*vector.y;
    }

    scale(factor) {
        
        x *= factor;
        y *= factor;
        return new Vector(x,y);
    }

    scaled(factor) {
        return new Vector(this.x*factor, this.y*factor);
    }

    add(vector) {
        var x=this.x,y=this.y;
        x += vector.x;
        y += vector.y;
        return new Vector(x,y);
    }

    sum(vector) {
        return new Vector(this.x+vector.x, this.y+vector.y);
    }

    subtract(vector) {
        var x=this.x,y=this.y;
        x -= vector.x;
        y -= vector.y;
        return new Vector(x,y);
    }

    difference(vector) {
        return new Vector(this.x-vector.x, this.y-vector.y);
    }

    length() {
        return Math.sqrt(this.dot(this));
    }

    polarAngle() {
        return Math.atan2(this.y, this.x);
    }

    normalized() {
        return this.scaled(1.0/this.length());
    }

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

