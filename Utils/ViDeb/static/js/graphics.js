
var s = Snap('#svg');

const height = s.node.clientHeight,
       width = s.node.clientWidth;
var config;
var opAngle, opMaxDist, opMinDist;
var UpperPanto;
var LowerPanto;
var style=
{
    "lineattr":{
        "fill": "#fc0",
        "stroke": "#777", 
        "strokeWidth":2
    },
    "lowerlineattr":{
        "fill": "#fc0",
        "stroke": "#555", 
        "strokeWidth":5
    },
    "upperPantoAttr":{
        "stroke":"#8A8",
        "strokeWidth":2
    },
    "lowerPantoAttr":{
        "stroke":"#88F",
        "strokeWidth":2
    }
};

var _style=
{
    "lower-line-attr":{
        "stroke":"#66F",
        "stroke-linecap":"round",
        "stroke-width": "5"
    },
    "lower-circle-attr":{
        "fill":"#66F"
    },
    "upper-line-attr":{
        "stroke":"#4A4",
        "stroke-linecap":"round",
        "stroke-width": "5"
    },
    "upper-circle-attr":{
        "fill":"#4A4"
    },
    "endeffector-angle-attr":{
        "stroke-width": "2",
        "stroke": "black"
    }
};
$.getJSON("js/LP_PCB.json", function(json){
    $.ajaxSetup({async:false});
    config = json;
    $.ajaxSetup({async:true});
    UpperPanto = new PantographGlyph(0, config.pantos.upper);
    LowerPanto = new PantographGlyph(1, config.pantos.lower);
    opAngle = config.opAngle; opMaxDist = config.opMaxDist; opMinDist = config.opMinDist;
});
(function(){Math.clamp=function(a,b,c){return Math.max(b,Math.min(c,a));}})();

class PantographGlyph{
    constructor(_id, config){
        this.id = _id;
        this.pantograph = config;
        this.isEndEffectorActive = false;
        this.targetX = -20;
        this.targetY = 70;
        this.handle = new Vector(0, 70);
        this.pointingAngle = 0.0;
        this.handleAngle = 0.0;
        this.lastX = this.targetX;
        this.lastY = this.targetY;
        this.inner = [,];
        this.innerAngle = [,];
        this.currentAngle = [Math.PI, 0.0];
        this.base  = [new Vector(this.pantograph.left.linkage.baseX, this.pantograph.left.linkage.baseY),
                      new Vector(this.pantograph.right.linkage.baseX, this.pantograph.right.linkage.baseY)];
        this.forwardKinematics();
        this.drawGlyph();
    }
    handleJSON(json){
        this.config = json;
        this.pantograph = this.id == 0 ? config.pantos.upper : config.pantos.lower;
    }

    forwardKinematics(){
        let panto = this.pantograph;
        this.inner[0] = this.base[0].add(new Vector().fromPolar(this.currentAngle[0], panto.left.linkage.innerLength ));
        this.inner[1] = this.base[1].add(new Vector().fromPolar(this.currentAngle[1], panto.right.linkage.innerLength));
        let diagonal = this.inner[1].subtract(this.inner[0]);
        this.innerAngle[0] = diagonal.polarAngle() + Math.acos(
                             (diagonal.dot(diagonal) + panto.left.linkage.outerLength*panto.left.linkage.outerLength - panto.right.linkage.outerLength*panto.right.linkage.outerLength) 
                             / (2 * diagonal.length() * panto.left.linkage.outerLength));
        this.handle = new Vector().fromPolar(this.innerAngle[0], panto.left.linkage.outerLength).add(this.inner[0]);
        this.innerAngle[1] = this.handle.subtract(this.inner[1]).polarAngle();
    }
    inverseKinematicsHelper(inverted, diff, factor, threshold=0.001) {
        diff *= factor;
        if(Math.abs(diff) < threshold)
            return;
        this.currentAngle[0] += diff*inverted;
        this.currentAngle[1] += diff;;
    }
    inverseKinematicsNumeric(ee_x, ee_y){
        // console.log(ee_x, ee_y);
        const iterations = 10;
        let target = new Vector(-ee_x, ee_y);
        let targetAngle = Math.clamp(target.polarAngle(), 0, 3.14),
            targetRadius = Math.clamp(target.length(), opMinDist, opMaxDist);
        for(let i=0; i < iterations; ++i){
            this.forwardKinematics();
            let currentPos = this.handle,
                currentAngle = currentPos.polarAngle(),
                currentRadius = currentPos.length();
            this.inverseKinematicsHelper(+1, targetAngle-currentAngle, 0.5);
            this.inverseKinematicsHelper(-1, targetRadius-currentRadius, 0.001);
        }
    }

    drawGlyph(){
        //lines
        const il = s.line(this.base[0].x, this.base[0].y, this.inner[0].x, this.inner[0].y).attr(this.id==0?style.upperPantoAttr : style.lowerPantoAttr);
        const ir = s.line(this.base[1].x, this.base[1].y, this.inner[1].x, this.inner[1].y).attr(this.id==0?style.upperPantoAttr : style.lowerPantoAttr);
        const ol = s.line(this.inner[0].x, this.inner[0].y, this.handle.x, this.handle.y).attr(this.id==0?style.upperPantoAttr : style.lowerPantoAttr);
        const or = s.line(this.inner[1].x, this.inner[1].y, this.handle.x, this.handle.y).attr(this.id==0?style.upperPantoAttr : style.lowerPantoAttr);
        const ee = s.circle(this.handle.x, this.handle.y, 5).attr({fill:this.id==0?"green":"blue"});
        const ml = s.circle(this.base[0].x, this.base[0].y, 5).attr({fill:"black"});
        const mr = s.circle(this.base[1].x, this.base[1].y, 5).attr({fill:"black"});
        const el = s.line(this.handle.x, this.handle.y, this.handle.x+10*Math.cos(this.pointingAngle), this.handle.y+10*Math.sin(this.pointingAngle)).attr({stroke:'black'});

        //group
        const g = s.group(il, ir, ol, or, ml, mr, ee, el);
        g.transform('T 150 50 S 1');

        //rectangle for clicking area
        const rect = s.rect(0,0,width,height).attr({fill:'rgba(0,0,0,0)'});
        const baseLeft = {
            "cx":this.base[0].x.toString(),
            "cy":this.base[0].y.toString(),
            "r":5,
        };
        const baseRight = {
            "cx":this.base[1].x.toString(),
            "cy":this.base[1].y.toString(),
            "r":5,
        };
        const innerPantoLeft = {
            "x1":this.base[0].x.toString(),
            "y1":this.base[0].y.toString(),
            "x2":this.inner[0].x.toString(),
            "y2":this.inner[0].y.toString()
        };

        const innerPantoRight = {
            "x1":this.base[1].x.toString(),
            "y1":this.base[1].y.toString(),
            "x2":this.inner[1].x.toString(),
            "y2":this.inner[1].y.toString()
        };
        
        const outerPantoLeft = {
            "x1":this.inner[0].x.toString(),
            "y1":this.inner[0].y.toString(),
            "x2":this.handle.x.toString(),
            "y2":this.handle.y.toString()
        };

        const outerPantoRight = {
            "x1":this.inner[1].x.toString(),
            "y1":this.inner[1].y.toString(),
            "x2":this.handle.x.toString(),
            "y2":this.handle.y.toString()
        };

        const endEffector = {
            "cx":this.handle.x.toString(),
            "cy":this.handle.y.toString(),
            "r":8
        }

        const endEffetorAngle = {
            "x1":this.handle.x.toString(),
            "y1":this.handle.y.toString(),
            "x2":this.handle.x+15*Math.cos(this.pointingAngle),
            "y2":this.handle.y+15*Math.sin(this.pointingAngle)    
        }

        const prefix = this.id==0?'upper-':'lower-';

        Object.assign(innerPantoLeft, _style[prefix+'line-attr']);
        Object.assign(innerPantoRight, _style[prefix+'line-attr']);
        Object.assign(outerPantoLeft, _style[prefix+'line-attr']);
        Object.assign(outerPantoRight, _style[prefix+'line-attr']);
        Object.assign(endEffector, _style[prefix+'circle-attr']);
        Object.assign(endEffetorAngle, _style['endeffector-angle-attr']);


        this.assignAttr(document.getElementById(prefix+'base-left'), baseLeft);
        this.assignAttr(document.getElementById(prefix+'base-right'), baseRight);
        this.assignAttr(document.getElementById(prefix+'inner-left'), innerPantoLeft);
        this.assignAttr(document.getElementById(prefix+'inner-right'), innerPantoRight);
        this.assignAttr(document.getElementById(prefix+'outer-left'), outerPantoLeft);
        this.assignAttr(document.getElementById(prefix+'outer-right'), outerPantoRight);
        this.assignAttr(document.getElementById(prefix+'endeffector'), endEffector);
        this.assignAttr(document.getElementById(prefix+'handle-angle'), endEffetorAngle);
        
    }

    assignAttr(svg, attr){
        for(const a in attr){
            svg.setAttribute(a, attr[a]);
        }
    }

    inverseKinematics(ee_x, ee_y){
        let t1, t2;
        let panto = this.pantograph;
        var a1 = panto.left.linkage.innerLength;
        var a2 = panto.left.linkage.outerLength;
        var a3 = panto.right.linkage.outerLength;
        var a4 = panto.right.linkage.innerLength;
        var a5 = panto.right.linkage.baseX - panto.left.linkage.baseX;
        var P1 = new Vector(panto.left.linkage.baseX, panto.left.linkage.baseY);
        var P5 = new Vector(panto.right.linkage.baseX, panto.right.linkage.baseY);
        var P3 = new Vector(ee_x, ee_y);

        const P13 = P1.subtract(P3).length();
        const P53 = P5.subtract(P3).length();
        
        const alpha_1 = Math.acos((a1*a1 - a2*a2 + P13*P13)/(2*a1*P13));
        const beta_1  = Math.atan2(P3.y, -P3.x-P1.x);
        const beta_5  = Math.acos((a4*a4 - a3*a3 + P53*P53)/(2*a4*P53));
        const alpha_5 = Math.atan2(P3.y, P3.x + a5);
        t1 = alpha_1 + beta_1;
        t2 = Math.PI - alpha_5 - beta_5;
        if(!isNaN(t1) && !isNaN(t2))
            this.fowardKinematics(t1, t2);
        else{
            this.fowardKinematics(this.lastLeftAngle, this.lastRightAngle);
        }
    }
}

function flushGlyph(){
    s.clear();
    LowerPanto.drawGlyph();
    UpperPanto.drawGlyph();
}
