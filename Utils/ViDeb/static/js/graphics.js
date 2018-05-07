
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
        this.goalX = 0;
        this.goalY - 0;
        this.angle = 0;
        this.lastX = this.targetX;
        this.lastY = this.targetY;

        this.inverseKinematics(this.targetX, this.targetY);
    }
    handleJSON(json){
        this.config = json;
        this.pantograph = this.id == 0 ? config.pantos.upper : config.pantos.lower;
        console.log('json');
        console.log(this.pantograph);
        
    }
    fowardKinematics(_t1, _t2){
        let panto = this.pantograph;
        var t1 = _t1;
        var t2 = _t2;
        this.lastLeftAngle = t1;
        this.lastRightAngle = t2;
        var ml = s.circle(panto.left.linkage.baseX, panto.left.linkage.baseY, 5).attr({fill:"black"});
        var mr = s.circle(panto.right.linkage.baseX, panto.right.linkage.baseY, 5).attr({fill:"black"});
        var il = s.line(panto.left.linkage.baseX, panto.left.linkage.baseY,
                        panto.left.linkage.baseX+panto.left.linkage.innerLength * Math.cos(t1),
                        panto.left.linkage.baseY+panto.left.linkage.innerLength * Math.sin(t1)).attr(this.id==0?style.upperPantoAttr : style.lowerPantoAttr);
        var ir = s.line(panto.right.linkage.baseX, panto.right.linkage.baseY,
                        panto.right.linkage.baseX+panto.right.linkage.innerLength * Math.cos(t2),
                        panto.right.linkage.baseY+panto.right.linkage.innerLength * Math.sin(t2)).attr(this.id==0?style.upperPantoAttr : style.lowerPantoAttr);
        
        var a1 = panto.left.linkage.innerLength;
        var a2 = panto.left.linkage.outerLength;
        var a3 = panto.right.linkage.outerLength;
        var a4 = panto.right.linkage.innerLength;

        var P2 = new Vector(a1 * Math.cos(t1), a1 * Math.sin(t1));
        var P4 = new Vector(a4 * Math.cos(t2) + Math.abs(panto.left.linkage.baseX)+panto.right.linkage.baseX, a4 * Math.sin(t2));


        var P4_2 = P4.subtract(P2);
        var P42  = P4_2.length();
        var P2h = (a2*a2 - a3*a3 + P42*P42) / (2 * P42);
        var Ph =  P2.add(P4_2.scaled(P2h / P42));
        var P3h = Math.sqrt(a2*a2 - P2h*P2h);

        var P3 = new Vector(Ph.x - P3h/P42 * (P4.y - P2.y),Ph.y + P3h/P42 * (P4.x-P2.x));
        this.lastX = P3.x;
        this.lastY = P3.y;
        var ol = s.line(P2.x + panto.left.linkage.baseX, P2.y,
                        P3.x + panto.left.linkage.baseX, P3.y,).attr(this.id==0?style.upperPantoAttr : style.lowerPantoAttr);
        var or = s.line(P4.x + panto.left.linkage.baseX, P4.y,
            P3.x + panto.left.linkage.baseX, P3.y,).attr(this.id==0?style.upperPantoAttr : style.lowerPantoAttr);
        var ee = s.circle(P3.x + panto.left.linkage.baseX, P3.y, 5).attr({fill:this.id==0?"green":"blue"});
        var h  = s.line(P3.x+ panto.left.linkage.baseX, P3.y, P3.x + 10*Math.cos(this.angle)+ panto.left.linkage.baseX, P3.y + 10*Math.sin(this.angle)).attr({stroke:this.id==0?"green":"blue"});
        var tgt = s.circle(this.goalX + panto.left.linkage.baseX, this.goalY, 3).attr({fill:this.id==0?"green":"blue"});
        var g = s.group(il, ir, ol, or, ml, mr, ee, h, tgt);
        g.transform('T 150 50');
        var rect = s.rect(0,0,width,height).attr({fill:'rgba(0,0,0,0)'});
    }
    inverseKinematicsHelper(inverted, diff, factor, threshold=0.001) {
        diff *= factor;
        if(Math.abs(diff) < threshold)
        return;
        this.lastLeftAngle += diff*inverted;
        this.lastRightAngle += diff;
    }
    inverseKinematicsNumeric(ee_x, ee_y){
        // console.log(ee_x, ee_y);
        const iterations = 10;
        let target = new Vector(-ee_x, ee_y);
        let targetAngle = Math.clamp(target.polarAngle(), (Math.PI-opAngle)*0.5, (Math.PI+opAngle)*0.5),
            targetRadius = Math.clamp(target.length(), opMinDist, opMaxDist);
        for(let i=0; i < iterations; ++i){
            let actuationAngle = [this.lastLeftAngle, this.lastRightAngle];
            this.fowardKinematics(actuationAngle[0], actuationAngle[1]);
            let currentPos = new Vector(this.lastX, this.lastY),
                currentAngle = currentPos.polarAngle(),
                currentRadius = currentPos.length();
            this.inverseKinematicsHelper(+1, targetAngle-currentAngle, 0.5);
            this.inverseKinematicsHelper(-1, targetRadius-currentRadius, 0.002);
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
    UpperPanto.inverseKinematicsNumeric(UpperPanto.targetX,UpperPanto.targetY)
    LowerPanto.inverseKinematics(LowerPanto.targetX,LowerPanto.targetY)
}
