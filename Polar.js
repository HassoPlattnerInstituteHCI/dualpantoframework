export default class Polar {
    constructor(a = 0, length = 0) {
        if(a.angle !== undefined && a.length !== undefined) {
            this.angle = a.angle;
            this.length = a.length;
        } else if(a.x !== undefined && a.y !== undefined) {
            this.angle = Math.atan2(a.y, a.x);
            this.length = a.length();
        } else {
            this.angle = a;
            this.length = length;
        }
    }

    add(polar) {
        this.angle += polar.angle;
        this.length += polar.length;
        return this;
    }

    sum(polar) {
        return new Polar(this.angle+polar.angle, this.length+polar.length);
    }

    subtract(polar) {
        this.angle -= polar.angle;
        this.length -= polar.length;
        return this;
    }

    difference(polar) {
        return new Polar(this.angle-polar.angle, this.length-polar.length);
    }
}
