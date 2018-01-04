export default class Vector {
    constructor(x = 0, y = 0) {
        if(x.x !== undefined && x.y !== undefined) {
            this.x = x.x;
            this.y = x.y;
        } else if(x.angle !== undefined && x.length !== undefined) {
            this.x = Math.cos(x.angle)*x.length;
            this.y = Math.sin(x.angle)*x.length;
        } else {
            this.x = x;
            this.y = y;
        }
    }

    dot(vector) {
        return this.x*vector.x + this.y*vector.y;
    }

    scale(factor) {
        this.x *= factor;
        this.y *= factor;
        return this;
    }

    scaled(factor) {
        return new Vector(this.x*factor, this.y*factor);
    }

    add(vector) {
        this.x += vector.x;
        this.y += vector.y;
        return this;
    }

    sum(vector) {
        return new Vector(this.x+vector.x, this.y+vector.y);
    }

    subtract(vector) {
        this.x -= vector.x;
        this.y -= vector.y;
        return this;
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
