import Vector from './Vector.js';
import Polar from './Polar.js';

Number.prototype.clamp = function(min, max) {
    return Math.min(Math.max(this, min), max);
};

export default class Pantograph {
    constructor(base) {
        this.target = new Vector(0, 1);

        this.baseAngleL = -Math.PI*0.5-0.5;
        this.baseAngleR = -Math.PI*0.5+0.5;
        this.pointerAngle = -Math.PI*0.5;

        this.baseDist = 48*2;
        this.innerDist = 98*2;
        this.outerDist = 128*2;

        this.opMinDist = (this.innerDist+this.outerDist)*0.3;
        this.opMaxDist = (this.innerDist+this.outerDist)*0.95;
        this.opAngle = 2.2;

        this.base = base;
        this.baseL = new Vector(-this.baseDist*0.5, 0).add(this.base);
        this.baseR = new Vector(this.baseDist*0.5, 0).add(this.base);
    }

    forwardKinematics(baseAngleL, baseAngleR) {
        if(baseAngleL === undefined)
            baseAngleL = this.baseAngleL;
        if(baseAngleR === undefined)
            baseAngleR = this.baseAngleR;

        this.innerL = new Vector({'angle':baseAngleL, 'length':this.innerDist}).add(this.baseL);
        this.innerR = new Vector({'angle':baseAngleR, 'length':this.innerDist}).add(this.baseR);
        this.diagonal = this.innerR.difference(this.innerL);
        this.diagonalAngle = Math.acos(this.diagonal.length()*0.5/this.outerDist);
        this.innerAngleL = this.diagonal.polarAngle()-this.diagonalAngle;
        this.outer = new Vector({'angle':this.innerAngleL, 'length':this.outerDist}).add(this.innerL);
        this.innerAngleR = this.outer.difference(this.innerR).polarAngle();
    }

    inverseKinematics() {
        const targetPolar = new Polar(this.target);
        this.targetAngleL = this.baseAngleL;
        this.targetAngleR = this.baseAngleR;

        for(let i = 0; i < 10; ++i) {
            this.forwardKinematics(this.targetAngleL, this.targetAngleR);
            const currentPolar = new Polar(this.outer.difference(this.base)),
                  radiusDiff = targetPolar.length.clamp(this.opMinDist, this.opMaxDist)-currentPolar.length,
                  angleDiff = targetPolar.angle.clamp((-Math.PI-this.opAngle)*0.5, (-Math.PI+this.opAngle)*0.5)-currentPolar.angle;

            const radiusSpeed = Math.abs(radiusDiff)*0.002;
            if(radiusSpeed < 0.001) {} else
            if(radiusDiff < 0) {
                this.targetAngleL -= radiusSpeed;
                this.targetAngleR += radiusSpeed;
            } else {
                this.targetAngleL += radiusSpeed;
                this.targetAngleR -= radiusSpeed;
            }
            const angleSpeed = Math.abs(angleDiff)*0.5;
            if(angleSpeed < 0.001) {} else
            if(angleDiff < 0) {
                this.targetAngleL -= angleSpeed;
                this.targetAngleR -= angleSpeed;
            } else {
                this.targetAngleL += angleSpeed;
                this.targetAngleR += angleSpeed;
            }
        }
    }

    drawOpLimits(context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.beginPath();
        const samples = 30;
        for(var i = 0; i <= samples; ++i)
            new Vector({'angle':(-Math.PI*0.5+(i/samples-0.5)*this.opAngle), 'length':this.opMinDist}).add(this.base).draw(context);
        for(var i = 0; i <= samples; ++i)
            new Vector({'angle':(-Math.PI*0.5-(i/samples-0.5)*this.opAngle), 'length':this.opMaxDist}).add(this.base).draw(context);
        context.closePath();
        context.stroke();
    }

    draw(context) {
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.lineWidth = 10;
        context.beginPath();
        this.baseL.draw(context);
        this.innerL.draw(context);
        this.outer.draw(context);
        this.innerR.draw(context);
        this.baseR.draw(context);
        context.stroke();
        context.strokeStyle = 'blue';
        context.beginPath();
        this.outer.draw(context);
        new Vector({'angle':this.pointerAngle, 'length':30}).add(this.outer).draw(context);
        context.stroke();
        context.lineWidth = 1;
    }
}
